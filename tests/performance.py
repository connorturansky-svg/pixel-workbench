"""Measured real Chromium editing latency; reported timings include Playwright dispatch and two frames."""
import argparse
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "automation"))
from smoke import serve
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def run(base, wired, profile_path=None, enforce=True):
    rows = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for large in (False, True):
            command = ["node", "tests/fixtures.mjs", "--large-json" if large else "--json"]
            if wired and large:
                command.append("--wired")
            fixture = json.loads(subprocess.check_output(command, cwd=ROOT))
            context = browser.new_context(viewport={"width": 1440, "height": 1050})
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(base)
            page.evaluate("""f=>{
              localStorage.setItem('pixel-workbench-v1',JSON.stringify(f.project));
              localStorage.setItem('pixel-workbench-library-v1',JSON.stringify(f.library));
            }""", fixture)
            page.reload()
            page.locator("#room-canvas").wait_for()
            page.evaluate("""()=>{
              window.__longTasks=[];
              new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>e.duration)))
                .observe({type:'longtask',buffered:false});
            }""")
            node = page.locator('[data-room-node="box:' + ("large-0-four" if large else "four") + '"]')
            node.focus()
            page.keyboard.press("Enter")
            page.locator('[data-room="fit-selected"]').click()
            page.wait_for_timeout(200)
            counts = {
                "boxes": len(fixture["project"]["installation"]["boxes"]),
                "components": sum(len(b["components"]) for b in fixture["project"]["installation"]["boxes"]),
                "links": len(fixture["project"]["installation"]["connections"]),
            }
            def measure(name, action, target, prepare=None):
                timings = []
                tasks = []
                for _ in range(5):
                    if prepare:
                        prepare()
                    page.evaluate("()=>{window.__longTasks=[];window.__start=performance.now()}")
                    action()
                    sample = page.evaluate("""()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(
                      ()=>resolve({ms:performance.now()-window.__start,tasks:window.__longTasks}))))""")
                    timings.append(round(sample["ms"], 1))
                    tasks.extend(sample["tasks"])
                p95 = sorted(timings)[-1]
                rows.append({"fixture": "large-wired" if large and wired else "large" if large else "reference",
                             **counts, "action": name, "samples_ms": timings, "max_ms": p95,
                             "long_tasks_ms": [round(t, 1) for t in tasks],
                             "target_ms": target, "pass": p95 <= target})
                if enforce:
                    assert p95 <= target, rows[-1]
            measure("zoom", lambda: page.locator('[data-room="zoom-out"]').click(), 350)
            def pan():
                area = page.locator(".room-scroll").bounding_box()
                x, y = area["x"] + 30, area["y"] + 80
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x + 60, y + 20, steps=4)
                page.mouse.up()
            measure("pan", pan, 350)
            page.locator('[data-room="fit-selected"]').click()
            page.evaluate("()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))")
            def move():
                key = "box:" + ("large-0-four" if large else "four")
                before = page.evaluate("key=>JSON.parse(localStorage.getItem('pixel-workbench-v1')).scene.placements[key].x", key)
                node = page.locator(f'[data-room-node="{key}"]')
                r = node.locator(".room-box-shell").bounding_box()
                x, y = r["x"] + r["width"]/2, r["y"] + r["height"]/2
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x + 60, y + 10, steps=4)
                page.mouse.up()
                after = page.evaluate("key=>JSON.parse(localStorage.getItem('pixel-workbench-v1')).scene.placements[key].x", key)
                assert after > before, "The benchmark must actually move the selected enclosure"
            cdp = context.new_cdp_session(page) if profile_path else None
            if cdp:
                cdp.send("Profiler.enable")
                cdp.send("Profiler.start")
            try:
                measure("drag-with-routing", move, 500)
            finally:
                if cdp:
                    profile = cdp.send("Profiler.stop")["profile"]
                    names = {n["id"]: n["callFrame"]["functionName"] for n in profile["nodes"]}
                    counts = Counter(names.get(sample, "?") for sample in profile.get("samples", []))
                    print("CPU samples:", counts.most_common(15), file=sys.stderr)
                    Path(profile_path + ("-large" if large else "-reference") + ".json").write_text(json.dumps(profile), encoding="utf-8")
            rotation = 0
            def prepare_inspector():
                nonlocal rotation
                section = page.locator(".room-inspector-section").first
                if section.get_attribute("open") is None:
                    section.locator("summary").click()
                rotation = float(page.locator('[data-room-field="item.rotation"]').input_value())
            def inspect():
                field = page.locator('[data-room-field="item.rotation"]')
                field.fill(str((rotation + 15) % 360))
                field.press("Tab")
            measure("inspector-rotation", inspect, 500, prepare_inspector)
            assert not errors, errors
            context.close()
        version = browser.version
        browser.close()
    return {"browser": "Chromium " + version, "viewport": [1440, 1050],
            "device": "Windows local execution host; automated headless browser",
            "measurement": "Five real UI actions; time includes dispatch and two animation frames. Max of five is conservative observed p95, not a population estimate.",
            "results": rows}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(ROOT / "dist"))
    parser.add_argument("--wired", action="store_true")
    parser.add_argument("--output")
    parser.add_argument("--profile")
    parser.add_argument("--record-only", action="store_true",
                        help="Record failures when measuring a historical baseline; normal mode enforces targets.")
    args = parser.parse_args()
    server = serve(args.source)
    try:
        results = run(f"http://127.0.0.1:{server.server_port}/", args.wired, args.profile, not args.record_only)
        content = json.dumps(results, indent=2)
        print(content)
        if args.output:
            Path(args.output).write_text(content, encoding="utf-8")
    finally:
        server.shutdown()
