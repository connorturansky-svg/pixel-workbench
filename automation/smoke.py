"""Release smoke test: serve a dist/ folder, load the app in headless Chromium and visit every page and info tab.

Usage: python automation/smoke.py [dist-folder] [--shots DIR]
Exits 0 when nothing failed; otherwise prints every problem and exits 1.
"""
import functools
import http.server
import os
import re
import sys
import threading

from playwright.sync_api import sync_playwright


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(folder):
    handler = functools.partial(Quiet, directory=folder)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    args = list(sys.argv[1:])
    shots = None
    if "--shots" in args:
        i = args.index("--shots")
        shots = args[i + 1]
        del args[i:i + 2]
        os.makedirs(shots, exist_ok=True)
    folder = os.path.abspath(args[0] if args else os.path.join(os.path.dirname(__file__), "..", "dist"))
    with open(os.path.join(folder, "version.mjs"), encoding="utf-8") as f:
        version = re.search(r"APP_VERSION\s*=\s*'([^']+)'", f.read()).group(1)
    httpd = serve(folder)
    base = f"http://127.0.0.1:{httpd.server_address[1]}/"
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 950})
        page.on("pageerror", lambda e: problems.append(f"script error: {e}"))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text
                and problems.append(f"console error: {m.text}"))
        page.on("response", lambda r: r.url.startswith(base) and r.status >= 400
                and problems.append(f"HTTP {r.status} for {r.url[len(base) - 1:]}"))
        page.goto(base + "?test=1", wait_until="load")
        page.wait_for_timeout(800)
        if not page.query_selector("aside.sidebar nav"):
            problems.append("the app did not render (no sidebar navigation)")
        badge = (page.text_content(".brand-version") or "").strip()
        if badge != "v" + version:
            problems.append(f"version badge shows {badge!r}, expected 'v{version}'")
        navs = page.eval_on_selector_all("nav [data-action^='page:']", "els=>els.map(e=>e.dataset.action)")
        if len(navs) < 5:
            problems.append(f"only {len(navs)} navigation pages found")
        for action in navs:
            page.click(f"nav [data-action='{action}']")
            page.wait_for_timeout(250)
            if not (page.inner_text("#content") or "").strip():
                problems.append(f"page {action} rendered no content")
            if shots:
                page.screenshot(path=os.path.join(shots, action.replace(":", "-") + ".png"))
        page.click("nav [data-action='page:workspace']")
        for mode in ("view:visual", "view:room"):
            if page.query_selector(f"[data-action='{mode}']"):
                page.click(f"[data-action='{mode}']")
                page.wait_for_timeout(250)
        page.click(".info-btn")
        tabs = page.eval_on_selector_all("#info-dialog [data-info-tab]", "els=>els.map(e=>e.dataset.infoTab)")
        if len(tabs) < 3:
            problems.append("the info dialog is missing its tabs")
        for t in tabs:
            page.click(f"#info-dialog [data-info-tab='{t}']")
            if not (page.inner_text("#info-dialog .info-body") or "").strip():
                problems.append(f"info tab {t} is empty")
        if "new" in tabs:
            page.click("#info-dialog [data-info-tab='new']")
            if f"v{version}" not in page.inner_text("#info-dialog .info-body"):
                problems.append(f"What's new has no entry for v{version}")
        page.keyboard.press("Escape")
        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.on("pageerror", lambda e: problems.append(f"script error (mobile): {e}"))
        mobile.goto(base + "?test=1", wait_until="load")
        mobile.wait_for_timeout(800)
        if shots:
            mobile.screenshot(path=os.path.join(shots, "mobile.png"))
        browser.close()
    httpd.shutdown()
    if problems:
        print("SMOKE FAILED")
        for pr in dict.fromkeys(problems):
            print(" -", pr)
        return 1
    print(f"SMOKE OK: v{version}, {len(navs)} pages, {len(tabs)} info tabs, no script errors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
