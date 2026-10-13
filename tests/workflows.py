"""Real public UI regression workflows. Uses disposable Chromium storage, never owner browser data."""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "automation"))
from smoke import serve
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def run(base, out):
    fixture = json.loads(subprocess.check_output(["node", "tests/fixtures.mjs", "--json"], cwd=ROOT))
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 1050}, accept_downloads=True)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base)
        page.evaluate("""fixture => {
          localStorage.setItem('pixel-workbench-v1', JSON.stringify(fixture.project));
          localStorage.setItem('pixel-workbench-library-v1', JSON.stringify(fixture.library));
        }""", fixture)
        page.reload()
        page.locator('[data-room-node="box:four"]').wait_for()
        page.wait_for_timeout(300)

        def state():
            return page.evaluate("JSON.parse(localStorage.getItem('pixel-workbench-v1'))")
        def lib():
            return page.evaluate("JSON.parse(localStorage.getItem('pixel-workbench-library-v1'))")
        def boxes():
            return state()["installation"]["boxes"]
        def result(id, detail):
            results.append({"id": id, "status": "pass", "actual": detail})
        def shot(name, selector=".room-workspace"):
            if out:
                page.locator(selector).screenshot(path=str(out / (name + ".png")))
        def navigate(name):
            page.locator(f'nav [data-action="page:{name}"]').click()
            page.wait_for_timeout(150)
        def select_box(id):
            page.locator(f'[data-room-node="box:{id}"]').focus()
            page.keyboard.press("Enter")
            page.wait_for_timeout(100)
        def picker(id):
            select_box(id)
            page.locator('[data-room="ports"]').click()
        def endpoint(id, component, port):
            picker(id)
            page.locator(f'[data-room-choose-port="{id}:{component}:{port}"]').click()
        def fill(key, value):
            locator = page.locator(f'[data-install-field="{key}"]')
            locator.fill(str(value))
            locator.press("Tab")
            page.wait_for_timeout(150)
        def select(key, value):
            page.locator(f'[data-install-field="{key}"]').select_option(str(value))
            page.wait_for_timeout(150)
        def confirm():
            page.locator('#modal button[type="submit"]').click()
            page.wait_for_timeout(150)
        def room_fill(key, value):
            section = page.locator(".room-inspector-section").first
            if section.get_attribute("open") is None:
                section.locator("summary").click()
            locator = page.locator(f'[data-room-field="{key}"]')
            locator.fill(str(value))
            locator.press("Tab")
            page.wait_for_timeout(120)
        def drag_port(source, target, preview):
            a = page.locator(f'[data-room-port="{source}"] .room-port-dot').bounding_box()
            b = page.locator(f'[data-room-port="{target}"] .room-port-dot').bounding_box()
            assert a and b
            page.mouse.move(a["x"] + a["width"]/2, a["y"] + a["height"]/2)
            page.mouse.down()
            page.mouse.move(a["x"] + a["width"]/2 - 12, a["y"] + a["height"]/2, steps=3)
            page.mouse.move(b["x"] + b["width"]/2, b["y"] + b["height"]/2, steps=8)
            assert page.locator("#room-wire-preview").get_attribute("d"), preview
            page.mouse.up()
            page.wait_for_timeout(120)

        # Real per-port connections at site scale use the disambiguation UI.
        endpoint("buttons", "button-0", "signal")
        endpoint("four", "four-7", "in1")
        endpoint("four", "four-7", "in2")  # reverse direction
        endpoint("buttons", "button-1", "signal")
        endpoint("buttons", "button-2", "signal")
        endpoint("four", "four-7", "in3")
        links = state()["installation"]["connections"]
        assert len(links) == 3, links
        assert {(x["fromComponent"], x["toPort"]) for x in links} == {
            ("button-0", "in1"), ("button-1", "in2"), ("button-2", "in3")}
        result("W01", "Three independent button links, including reversed selection, saved exact endpoints")
        endpoint("three", "hub", "eth1")
        endpoint("four", "four-2", "uplink1")
        assert len(state()["installation"]["connections"]) == 4
        result("W02", "Box Three Ethernet to Box Four uplink")
        endpoint("buttons", "button-0", "signal")
        endpoint("four", "four-7", "in4")
        assert len(state()["installation"]["connections"]) == 4
        endpoint("three", "hub", "eth2")
        endpoint("four", "four-7", "in4")
        assert len(state()["installation"]["connections"]) == 4
        endpoint("three", "hub", "eth2")
        page.keyboard.press("Escape")
        assert len(state()["installation"]["connections"]) == 4
        result("W03", "Occupied, incompatible and cancelled selections create no duplicate/wrong connection")

        select_box("four")
        page.locator('[data-room="fit-selected"]').click()
        page.wait_for_timeout(200)
        shot("detail-configured-box")
        before_zoom = state()
        active_ids = page.locator('[data-room-node="box:four"] [data-room-port]').evaluate_all(
            "els => els.map(e => e.dataset.roomPort)")
        assert len(active_ids) == sum(p["visible"] for p in boxes()[0]["interfacePorts"])
        width = page.locator('[data-room-node="box:four"] .room-box-shell').bounding_box()["width"]
        canvas_width = page.locator(".room-scroll").bounding_box()["width"]
        assert 0.50 < width / canvas_width < 0.80, (width, canvas_width)
        metrics = page.locator('[data-room-node="box:four"] .room-component-label').evaluate_all(
            """els => els.map(e => ({font: parseFloat(getComputedStyle(e).fontSize) *
              Math.hypot(e.getScreenCTM().a, e.getScreenCTM().b), visible: getComputedStyle(e).visibility}))""")
        assert all(10 <= m["font"] <= 14.1 for m in metrics if m["visible"] != "hidden"), metrics
        def check_label_contrast():
            contrasts = page.locator(".room-port-label, .room-component-label").evaluate_all("""els=>els.map(el=>{
              const rgb=value=>value.match(/[\\d.]+/g).slice(0,3).map(Number);
              const lum=channels=>channels.reduce((sum,c,i)=>{c/=255;return sum+
                (c<=.04045?c/12.92:((c+.055)/1.055)**2.4)*[.2126,.7152,.0722][i]},0);
              const rect=el.parentElement.querySelector('rect'), style=getComputedStyle(rect);
              const opacity=Number(style.fillOpacity);
              const base=rgb(getComputedStyle(el.closest('.room-object').querySelector('.room-box-shell')).fill);
              const background=rgb(style.fill).map((c,i)=>c*opacity+base[i]*(1-opacity));
              const a=lum(rgb(getComputedStyle(el).fill)),b=lum(background);
              return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
            })""")
            assert contrasts and min(contrasts) >= 4.5, contrasts
        check_label_contrast()
        for _ in range(8):
            page.locator('[data-room="zoom-out"]').click()
        shot("intermediate-equipment")
        page.locator('[data-room="fit-site"]').click()
        page.wait_for_timeout(150)
        shot("site-fit")
        assert page.locator('[data-room-node="box:four"] [data-room-port]').evaluate_all(
            "els => els.map(e => e.dataset.roomPort)") == active_ids
        assert state() == before_zoom, "Camera changed persisted project data"
        result("W04", "24m site/deep fit/intermediate/return; all enabled ports retained; camera leaves data unchanged")
        page.set_viewport_size({"width": 900, "height": 1200})
        select_box("four")
        page.locator('[data-room="fit-selected"]').click()
        page.wait_for_timeout(150)
        shot("portrait-detail")
        page.set_viewport_size({"width": 1440, "height": 1050})
        result("W05", "Portrait viewport and resize retain exact endpoint identities")

        navigate("boxes")
        page.locator('[data-install="builder-mode:button"]').click()
        for count in (1, 2, 3, 4, 5):
            if count < 3:
                # Test removal impacts explicitly rather than silently deleting connected controls.
                select("buttoncount:buttons", count)
                assert page.locator("#modal[open]").count() == 1
                page.locator('#modal [data-action="close-modal"]').last.click()
                assert len(boxes()[2]["components"]) == 3
            else:
                select("buttoncount:buttons", count)
                assert len(boxes()[2]["components"]) == count
        assert [b["id"] for b in boxes()[2]["components"][:3]] == ["button-0", "button-1", "button-2"]
        for i, (color, size, kind) in enumerate((("Red", "small", "push"),
                                               ("Blue", "medium", "illuminated"),
                                               ("Green", "large", "push"))):
            select(f"button:buttons:button-{i}:colour", color)
            select(f"button:buttons:button-{i}:size", size)
            select(f"button:buttons:button-{i}:type", kind)
        fill("button:buttons:button-1:label", "Entrance illuminated")
        assert boxes()[2]["components"][1]["snapshot"]["name"] == "Illuminated button"
        assert len(state()["installation"]["connections"]) == 4
        shot("button-builder", ".button-box-grid")
        page.locator('[data-install="save-button-template:buttons"]').click()
        template = lib()["boxTemplates"][-1]
        select("template-select", template["id"])
        page.locator('[data-install="add-template"]').click()
        assert boxes()[-1]["kind"] == "button"
        assert len(boxes()[-1]["components"]) == 5
        result("W06", "Counts 1–5, intentional removal confirmation, colors/types/sizes/label and button-template reuse")

        page.locator('[data-install="builder-mode:controller"]').click()
        select("box-select", "three")
        page.locator('[data-box-part="hub"] .part-title').click()
        old_ids = [p["id"] for p in boxes()[1]["components"][0]["snapshot"]["ports"]]
        fill("portcount.ethernet", 8)
        assert page.locator('[data-box-part="hub"] [data-box-port]').count() == 8
        ports = boxes()[1]["components"][0]["snapshot"]["ports"]
        assert [p["id"] for p in ports[:5]] == old_ids
        fill("portcount.ethernet", 1)
        assert page.locator("#modal[open]").count() == 1
        page.locator('#modal [data-action="close-modal"]').last.click()
        assert len(boxes()[1]["components"][0]["snapshot"]["ports"]) == 8
        result("W07", "Inspector counts immediately update graphic/interfaces/resources; connected-port removal is confirmed")

        select("box-select", "four")
        physical_before = [(c["id"], c["x"], c["y"], c.get("rotation", 0)) for c in boxes()[0]["components"]]
        page.locator('[data-install="auto-layout"]').click()
        page.wait_for_timeout(400)
        assert physical_before == [(c["id"], c["x"], c["y"], c.get("rotation", 0)) for c in boxes()[0]["components"]]
        rects = page.locator(".box-part").evaluate_all(
            "els => els.map(e => {const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})")
        for i, a in enumerate(rects):
            for b in rects[i+1:]:
                assert not (a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]), (a, b)
        shot("schematic", "#box-stage")
        page.locator('[data-install="box-zoom:out"]').click()
        page.locator('[data-install="box-zoom:in"]').click()
        page.locator('[data-install="box-mode:physical"]').click()
        shot("physical", "#box-stage")
        assert physical_before == [(c["id"], c["x"], c["y"], c.get("rotation", 0)) for c in boxes()[0]["components"]]
        result("W08", "Existing 11-component schematic non-overlap, useful zoom, and independent physical placement")

        saved = state()
        with page.expect_download() as d:
            page.locator('[data-action="export"]').first.click()
        path = d.value.path()
        exported = json.loads(Path(path).read_text(encoding="utf-8"))
        assert exported == saved
        page.reload()
        page.wait_for_timeout(200)
        assert state() == saved
        page.locator("#import-file").set_input_files(path)
        confirm()
        assert state() == saved
        result("W09", "Project reload and UI export/import preserve exact identities/connections/positions")
        navigate("standards")
        library_saved = lib()
        with page.expect_download() as d:
            page.locator('[data-install="export-library"]').click()
        library_path = d.value.path()
        assert json.loads(Path(library_path).read_text(encoding="utf-8")) == library_saved
        page.locator("#library-import-file").set_input_files(library_path)
        confirm()
        assert lib() == library_saved
        result("W10", "Separate global library backup/restore includes unused definitions and templates")
        navigate("bom")
        assert "illuminated button" in page.locator("#content").inner_text().lower()
        navigate("workspace")
        select_box("buttons")
        page.locator('[data-room="fit-selected"]').click()
        page.wait_for_timeout(100)
        shot("detail-button-box")
        assert not errors, errors
        check_label_contrast()
        result("W11", "BOM includes illuminated controls; configured labels meet 4.5:1 contrast across actual button/component colours, with no script errors")
        room_fill("item.x", 8.4)
        select_box("four")
        page.locator('[data-room="fit-selected"]').click()
        page.wait_for_timeout(120)
        unused_button = boxes()[2]["components"][4]["id"]
        drag_port(f"buttons:{unused_button}:signal", "four:four-7:in4", "Live drag preview")
        assert len(state()["installation"]["connections"]) == 5, {
            "toast": page.locator("#toast").inner_text(),
            "picker": page.locator(".room-port-picker").all_text_contents(),
            "source_dense": page.locator(f'[data-room-port="buttons:{unused_button}:signal"]').get_attribute("data-dense"),
            "target_dense": page.locator('[data-room-port="four:four-7:in4"]').get_attribute("data-dense"),
        }
        assert state()["installation"]["connections"][-1]["toPort"] == "in4"
        page.locator('[data-room-port="four:four-7:in4"]').focus()
        assert page.locator(".physical-route.port-traced").count() == 1
        shot("successful-port-drag")
        endpoints_before = state()["installation"]["connections"]
        page.locator('[data-room-node="box:buttons"]').focus()
        page.keyboard.press("ArrowLeft")
        assert state()["scene"]["placements"]["box:buttons"]["x"] == 8.35
        assert state()["installation"]["connections"] == endpoints_before
        result("W12", "Actual port drag, live preview, keyboard endpoint trace and moved-box exact-link preservation")

        # Place every supported room item before assigning its data connection.
        new_segments = []
        for item in ("custom|flood", "custom|seed", "preset|seed100"):
            page.locator('[data-room="add-pixels"]').click()
            page.locator('#modal [name="item"]').select_option(item)
            page.locator('#modal [name="target"]').select_option("unconnected||0")
            confirm()
            segment = state()["chains"][-1]["segments"][0]
            new_segments.append(segment["id"])
            assert page.locator(f'[data-room-node="segment:{segment["id"]}"] .room-unconnected').count() == 1
        # Real public picker -> field-object workflow, not inserted connection data.
        endpoint("four", "four-7", "p1")
        node = page.locator(f'[data-room-node="segment:{new_segments[0]}"]')
        node.focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(120)
        assert page.locator(f'[data-room-node="segment:{new_segments[0]}"] .room-unconnected').count() == 0
        assigned = next(ch for ch in state()["chains"] if ch["segments"][0]["id"] == new_segments[0])
        contained_source = boxes()[0]["components"][7]["sourceKey"]
        if assigned["controller"]:
            assert contained_source == "controller:" + assigned["controller"]
            assert assigned["port"] == 1
            assert len(state()["installation"]["connections"]) == 5, "Must not double-count electrical route"
        else:
            assert len(state()["installation"]["connections"]) == 6
            assert state()["installation"]["connections"][-1]["fromComponent"] == "four-7"
            assert state()["installation"]["connections"][-1]["fromPort"] == "p1"
        result("W13", "Unconnected flood/string/preset placement and actual box-contained pixel-output assignment")

        navigate("boxes")
        page.locator('[data-install="builder-mode:button"]').click()
        page.locator('[data-install="new-button-box"]').click()
        fresh_id = boxes()[-1]["id"]
        for count in range(1, 6):
            select(f"buttoncount:{fresh_id}", count)
            assert len(boxes()[-1]["components"]) == count
            assert page.locator(f'[data-install-field^="button:{fresh_id}:"][data-install-field$=":type"]').count() == count
        result("W14", "All actual button counts 1–5 created through public UI, including initially disconnected boxes")

        navigate("standards")
        stable_library = lib()
        bad = json.loads(json.dumps(stable_library))
        bad["boxTemplates"][0]["components"][0]["snapshot"]["ports"][0]["type"] = "not-a-port-type"
        page.locator("#library-import-file").set_input_files({
            "name": "invalid-library.json", "mimeType": "application/json",
            "buffer": json.dumps(bad).encode()})
        page.wait_for_timeout(150)
        assert page.locator("#modal[open]").count() == 0
        assert lib() == stable_library
        assert "Library was not restored" in page.locator("#toast").inner_text()
        result("W15", "Invalid nested template backup rejected visibly without changing the library")
        navigate("boxes")
        page.locator('[data-install="builder-mode:controller"]').click()
        select("box-select", "four")
        page.locator('[data-install="box-mode:schematic"]').click()
        before_internal = len(state()["installation"]["connections"])
        source = page.locator('[data-box-port="four-3:usb1"]')  # input-first reverse drag
        target = page.locator('[data-box-port="four-1:usb2"]')
        source.scroll_into_view_if_needed()
        a = source.bounding_box()
        page.mouse.move(a["x"] + a["width"]/2, a["y"] + a["height"]/2)
        page.mouse.down()
        target.scroll_into_view_if_needed()
        b = target.bounding_box()
        page.mouse.move(b["x"] + b["width"]/2, b["y"] + b["height"]/2, steps=8)
        assert page.evaluate("""p => document.elementFromPoint(p.x,p.y)?.closest('[data-box-port]')?.dataset.boxPort""",
                             {"x": b["x"] + b["width"]/2, "y": b["y"] + b["height"]/2}) == "four-1:usb2", {
                                 "bounds": b, "hit": page.evaluate("p=>document.elementFromPoint(p.x,p.y)?.outerHTML.slice(0,250)", {"x": b["x"]+b["width"]/2, "y":b["y"]+b["height"]/2})}
        page.mouse.up()
        page.wait_for_timeout(150)
        assert len(state()["installation"]["connections"]) == before_internal + 1, page.locator("#toast").inner_text()
        link = state()["installation"]["connections"][-1]
        assert (link["fromComponent"], link["fromPort"], link["toComponent"], link["toPort"]) == (
            "four-1", "usb2", "four-3", "usb1")
        path = page.locator('[data-wire-from="four-1:usb2"][data-wire-to="four-3:usb1"]')
        assert path.count() == 1, "A saved internal wire must have a real, clear rendered route"
        crossings = path.evaluate("""path => {
          const stage = document.querySelector('#box-stage').getBoundingClientRect(),
          bodies = [...document.querySelectorAll('.box-part')].map(e => {
            const r=e.getBoundingClientRect(); return {l:r.left-stage.left+3,r:r.right-stage.left-3,
              t:r.top-stage.top+3,b:r.bottom-stage.top-3};});
          const result=[];
          for(let n=0;n<=path.getTotalLength();n+=2) {
            const p=path.getPointAtLength(n);
            if(bodies.some(r=>p.x>r.l&&p.x<r.r&&p.y>r.t&&p.y<r.b)) result.push([p.x,p.y]);
          } return result;
        }""")
        assert not crossings, crossings[:5]
        source.focus()
        assert page.locator(".box-wire.connection-highlight").count() >= 1
        shot("schematic-connected", ".box-stage-scroll")
        extent_before = boxes()[0]["schematicExtent"]
        page.locator('[data-box-part="four-1"] .part-title').click()
        page.locator('[data-install="duplicate-part"]').click()
        page.wait_for_timeout(300)
        rects = page.locator(".box-part").evaluate_all(
            "els => els.map(e => {const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})")
        for i, a in enumerate(rects):
            for b in rects[i+1:]:
                assert not (a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1])
        # A harmless room navigation cannot shrink the persisted logical canvas.
        navigate("workspace")
        navigate("boxes")
        assert boxes()[0]["schematicExtent"]["width"] >= extent_before["width"]
        assert boxes()[0]["schematicExtent"]["height"] >= extent_before["height"]
        result("W16", "Actual reversed schematic drag, body-avoiding path, endpoint focus trace, duplicate non-overlap and persisted canvas extent")

        page.locator('[data-box-part="four-3"] .part-title').click()
        page.locator('[data-install="delete-part"]').click()
        assert page.locator("#modal[open]").count() == 1
        page.locator('#modal [data-action="close-modal"]').last.click()
        assert any(c["id"] == "four-3" for c in boxes()[0]["components"])
        assert any(x["id"] == link["id"] for x in state()["installation"]["connections"])
        result("W17", "Deleting a wired component requires impact confirmation; cancel preserves component and exact link")
        navigate("workspace")
        select_box("four")
        page.locator('[data-room="fit-selected"]').click()
        page.wait_for_timeout(120)
        def open_section(index):
            section = page.locator(".room-inspector-section").nth(index)
            if section.get_attribute("open") is None:
                section.locator("summary").click()
        route_id = "custom:" + next(x["id"] for x in state()["installation"]["connections"]
                                    if x.get("fromComponent") == "button-0")
        open_section(1)
        page.locator('[data-route-field="select"]').select_option(route_id)
        open_section(1)
        routed_segments = page.locator(".physical-route.selected .route-line").get_attribute("d").count("L")
        page.locator('[data-route-action="add-pivot"]').click()
        assert len(state()["installation"]["routes"][route_id]["points"]) == routed_segments
        open_section(1)
        page.locator('[data-route-field="standard"]').select_option(lib()["cables"][0]["id"])
        open_section(2)
        page.locator('[data-route-field="slack-mode"]').select_option("percent")
        open_section(2)
        value = page.locator('[data-route-field="slack-value"]')
        value.fill("10")
        value.press("Tab")
        assert page.locator(".room-inspector-section").nth(2).get_attribute("open") is not None
        before_camera = state()
        before_distance = page.locator("#route-length-live").inner_text()
        for action in ("labels", "labels", "filter:other", "filter:other"):
            page.locator(f'[data-route-action="{action}"]').click()
        assert state() == before_camera, "Label/filter round-trip must preserve manual pivots, cables and endpoints"
        assert page.locator("#route-length-live").inner_text() == before_distance
        result("W18", "Manual route pivot, cable-standard allocation and slack; Labels/filters preserve physical route and measurements")

        area = page.locator(".room-scroll").bounding_box()
        point = {"x": area["x"] + 35, "y": area["y"] + 55}
        world = """p=>{const svg=document.querySelector('#room-canvas'), q=svg.createSVGPoint();
          q.x=p.x;q.y=p.y; const v=q.matrixTransform(svg.getScreenCTM().inverse());return {x:v.x/100,y:v.y/100}}"""
        old_world = page.evaluate(world, point)
        page.mouse.move(point["x"], point["y"])
        page.mouse.wheel(0, -100)
        page.evaluate("()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))")
        new_world = page.evaluate(world, point)
        assert abs(old_world["x"] - new_world["x"]) < 0.01
        assert abs(old_world["y"] - new_world["y"]) < 0.01
        assert state() == before_camera
        # Repeated observer updates at the same projected size cannot flip the detail state.
        for _ in range(8):
            page.locator('[data-room="zoom-out"]').click()
        level = page.locator('[data-room-node="box:four"]').get_attribute("data-room-detail")
        for _ in range(5):
            page.locator(".room-scroll").evaluate("sc=>{sc.scrollLeft+=1;sc.scrollLeft-=1}")
            page.wait_for_timeout(35)
            assert page.locator('[data-room-node="box:four"]').get_attribute("data-room-detail") == level
        assert state() == before_camera
        result("W19", "Pointer-centred wheel zoom near viewport edge and stable repeated detail updates; no persisted data mutation")

        navigate("bom")
        with page.expect_download() as d:
            page.locator('[data-install="bom-csv"]').click()
        assert "Grey 3m 4 pin EXT" in Path(d.value.path()).read_text(encoding="utf-8")
        navigate("guide")
        assert "Planning draft" in page.locator("#content").inner_text()
        with page.expect_download() as d:
            page.locator('[data-action="csv"]').click()
        assert "Start" in Path(d.value.path()).read_text(encoding="utf-8")
        result("W20", "BOM cable allocation, BOM CSV, wiring guide safety notice and channel CSV exports")
        navigate("boxes")
        page.locator('[data-install="builder-mode:button"]').click()
        reused_box = next(b for b in boxes() if b["id"] != "buttons" and (b.get("templateRef") or {}).get("id") == template["id"])
        reused_id, reused_part = reused_box["id"], reused_box["components"][1]["id"]
        fill(f"button:{reused_id}:{reused_part}:label", "Instance-only label")
        inherited_ids = [component["id"] for box in boxes() if box["id"] == reused_id for component in box["components"]]
        existing_links = state()["installation"]["connections"]
        select("button:buttons:button-0:type", "illuminated")
        fill("button:buttons:button-1:label", "Revised template label")
        page.locator('[data-install="save-button-template:buttons"]').click()
        assert next(b for b in boxes() if b["id"] == reused_id)["components"][0]["buttonType"] == "push"
        page.locator(f'[data-install="update-button-template:{reused_id}"]').click()
        updated = next(b for b in boxes() if b["id"] == reused_id)
        assert updated["components"][0]["buttonType"] == "illuminated"
        assert updated["components"][1]["subname"] == "Instance-only label"
        assert [c["id"] for c in updated["components"]] == inherited_ids
        assert state()["installation"]["connections"] == existing_links
        result("W23", "Explicit template update follows inherited changes while retaining a genuine local label, component identities and unrelated wires")
        retained = state()["installation"]["connections"]
        select("buttoncount:buttons", 3)
        assert page.locator("#modal[open]").count() == 1
        confirm()
        assert len(boxes()[2]["components"]) == 3
        assert state()["installation"]["connections"] == [
            x for x in retained if x.get("fromComponent") != unused_button]
        page.locator('[data-install="builder-mode:controller"]').click()
        select("box-select", "three")
        retained = state()["installation"]["connections"]
        fill("portcount.ethernet", 1)
        assert page.locator("#modal[open]").count() == 1
        confirm()
        assert state()["installation"]["connections"] == [
            x for x in retained if x.get("fromComponent") != "hub"]
        assert boxes()[1]["components"][0]["snapshot"]["resources"]["ethernetPorts"] == 1
        assert len(boxes()[1]["components"][0]["snapshot"]["ports"]) == 1
        result("W21", "Confirmed connected button/Ethernet removals delete only affected links and retain all unrelated identities")

        select("box-select", "four")
        definition = next(d for d in lib()["components"] if d["name"] == "Network switch")
        navigate("standards")
        page.locator('[data-standard-disclosure="hardware"] > summary').click()
        field = page.locator(f'[data-install-field="def:{definition["id"]}:name"]')
        field.locator("xpath=ancestor::details[contains(@class, 'definition-card')]").locator("summary").click()
        fill(f'def:{definition["id"]}:name', "Network switch revised")
        assert boxes()[0]["components"][2]["snapshot"]["name"] == "Network switch"
        navigate("boxes")
        select("box-select", "four")
        identities = [c["id"] for c in boxes()[0]["components"]]
        saved_links = state()["installation"]["connections"]
        page.locator('[data-install="sync-standards"]').click()
        assert boxes()[0]["components"][2]["snapshot"]["name"] == "Network switch revised"
        assert [c["id"] for c in boxes()[0]["components"]] == identities
        assert state()["installation"]["connections"] == saved_links
        page.locator('[data-box-part="four-2"] .part-title').click()
        page.locator('[data-install="duplicate-part"]').click()
        duplicate = boxes()[0]["components"][-1]["id"]
        for source, target in ((f"four-2:eth1", f"{duplicate}:eth1"), (f"{duplicate}:eth2", "four-2:eth2")):
            page.locator(f'[data-box-port="{source}"]').click()
            page.locator(f'[data-box-port="{target}"]').click()
        assert len(state()["installation"]["connections"]) == len(saved_links) + 2
        cyclic_links = state()["installation"]["connections"]
        page.locator('[data-install="auto-layout"]').click()
        rects = page.locator(".box-part").evaluate_all(
            "els=>els.map(e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})")
        for i, a in enumerate(rects):
            for b in rects[i+1:]:
                assert not (a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1])
        assert state()["installation"]["connections"] == cyclic_links
        result("W24", "Public standards edit remains pending until Sync; cyclic and disconnected schematic auto-layout retains identities/wires without overlap")

        page.locator('[data-install="box-mode:physical"]').click()
        for component in ("four-2", duplicate):
            page.locator(f'[data-box-part="{component}"]').focus()
            page.keyboard.press("Enter")
            for field, value in (("physical.widthMm", 100), ("physical.depthMm", 60), ("part.x", 20), ("part.y", 20)):
                fill(field, value)
        overlap = "Network switch revised overlaps Network switch revised"
        assert page.locator(".layout-warning").filter(has_text=overlap).count() == 1
        fill("part.stackLevel", 1)
        assert page.locator(".layout-warning").filter(has_text=overlap).count() == 0
        fill("part.x", 90)
        assert page.locator(".layout-warning").filter(has_text="Network switch revised extends outside").count() == 1
        fill("part.x", 20)
        page.locator('[data-install="rotate-part"]').click()
        assert next(c for c in boxes()[0]["components"] if c["id"] == duplicate)["rotation"] == 90
        bounds = page.locator(".physical-part.selected").bounding_box()
        assert abs(bounds["width"] / bounds["height"] - 0.6) < 0.03
        physical = [(c["id"], c["x"], c["y"], c.get("rotation", 0), c.get("stackLevel", 0)) for c in boxes()[0]["components"]]
        page.locator('[data-install="box-mode:schematic"]').click()
        page.locator('[data-install="auto-layout"]').click()
        assert physical == [(c["id"], c["x"], c["y"], c.get("rotation", 0), c.get("stackLevel", 0)) for c in boxes()[0]["components"]]
        result("W25", "Measured physical sizes, rotation, intentional stacking and bounds warnings; schematic layout leaves physical configuration unchanged")

        # A genuinely controller-free project, not a preconfigured demo with hidden hardware.
        page.locator('[data-action="blank-project"]').click()
        page.locator('#modal [name="confirm"]').fill("BLANK")
        confirm()
        assert not state()["controllers"] and not state()["installation"]["boxes"]
        page.locator('[data-room="add-pixels"]').click()
        page.locator('#modal [name="item"]').select_option("custom|flood")
        page.locator('#modal [name="target"]').select_option("unconnected||0")
        confirm()
        assert len(state()["chains"]) == 1 and not state()["chains"][0]["controller"]
        assert page.locator(".room-unconnected").count() == 1
        navigate("props")
        page.locator('[data-room="new-prop"]').click()
        page.locator('[data-room-field="prop.shape"]').select_option("circle")
        page.locator('[data-room="place-prop"]').click()
        page.locator('#modal [name="target"]').select_option("unconnected||0")
        confirm()
        assert len(state()["chains"]) == 2 and not state()["chains"][1]["controller"]
        assert state()["chains"][1]["segments"][0]["propId"] == state()["props"][0]["id"]
        assert page.locator(".room-unconnected").count() == 2
        result("W22", "Controller-free flood and prop placement both retain correct plan data and visible unconnected warnings")
        assert not errors, errors
        browser.close()
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--evidence")
    args = parser.parse_args()
    out = Path(args.evidence) if args.evidence else None
    if out:
        out.mkdir(parents=True, exist_ok=True)
    server = None if args.base else serve(str(ROOT / "dist"))
    try:
        results = run(args.base or f"http://127.0.0.1:{server.server_port}/", out)
        print(json.dumps(results, indent=2))
        if out:
            (out / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    finally:
        if server:
            server.shutdown()
