"""Configured-box baseline, using an isolated browser context, never the user's storage."""
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "automation"))
from smoke import serve
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
fixture = json.loads(subprocess.check_output(["node", "tests/fixtures.mjs", "--json"], cwd=root))
server = serve(str(root / "dist"))
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.add_init_script("localStorage.setItem('pixel-workbench-v1', " +
                         json.dumps(json.dumps(fixture["project"])) + ");" +
                         "localStorage.setItem('pixel-workbench-library-v1', " +
                         json.dumps(json.dumps(fixture["library"])) + ");")
    page.goto(f"http://127.0.0.1:{server.server_port}/")
    page.wait_for_timeout(500)
    page.locator('[data-room-node="box:four"]').focus()
    page.keyboard.press("Enter")
    page.locator('[data-room="fit-selected"]').click()
    page.wait_for_timeout(500)
    page.screenshot(path=str(out / "baseline-detail.png"))
    page.locator('[data-room="fit-site"]').click()
    page.wait_for_timeout(200)
    page.screenshot(path=str(out / "baseline-site.png"))
    page.locator('nav [data-action="page:boxes"]').click()
    page.wait_for_timeout(800)
    page.screenshot(path=str(out / "baseline-schematic.png"))
    print(json.dumps({"activePorts": sum(p["visible"] for p in fixture["project"]["installation"]["boxes"][0]["interfacePorts"]),
                      "components": len(fixture["project"]["installation"]["boxes"][0]["components"]),
                      "stored": json.loads(page.evaluate("localStorage.getItem('pixel-workbench-v1')"))}))
    browser.close()
server.shutdown()
