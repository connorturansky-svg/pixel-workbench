"""Standards disclosure, persistence and in-place editing regressions."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "automation"))
from smoke import serve
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run(base):
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1050})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(base)

        def navigate():
            page.locator('nav [data-action="page:standards"]').click()

        def library():
            return page.evaluate("JSON.parse(localStorage.getItem('pixel-workbench-library-v1'))")

        def section(key):
            return page.locator(f'[data-standard-disclosure="{key}"]')

        def edit(key, value):
            field = page.locator(f'[data-install-field="{key}"]')
            field.fill(str(value))
            assert "Not saved yet" in field.locator(
                "xpath=ancestor::*[contains(@class,'standard-card') or contains(@class,'definition-card')][1]"
            ).locator(".standard-save-status").inner_text()
            return page.evaluate("""key => {
              const field = [...document.querySelectorAll('[data-install-field]')]
                .find(el => el.dataset.installField === key);
              const content = document.querySelector('#content');
              const start = performance.now();
              field.dispatchEvent(new Event('change', {bubbles:true}));
              return {ms:performance.now()-start, preserved:field.isConnected &&
                content === document.querySelector('#content'), focused:document.activeElement === field};
            }""", key)

        navigate()
        assert page.locator(".standards-section").count() == 3
        assert page.locator(".standards-section[open]").count() == 0
        section("sizes").locator("summary").focus()
        page.keyboard.press("Enter")
        assert section("sizes").get_attribute("open") is not None
        size = library()["boxSizes"][0]
        sample = edit(f'boxsize:{size["id"]}:name', "Updated enclosure")
        assert sample["preserved"] and sample["focused"], sample
        assert sample["ms"] < 200, sample
        assert library()["boxSizes"][0]["name"] == "Updated enclosure"
        assert "Saved on this device" in section("sizes").inner_text()
        assert section("sizes").locator("h3").first.inner_text() == "Updated enclosure"
        section("sizes").locator('[data-install="new-box-size"]').click()
        assert section("sizes").get_attribute("open") is not None
        assert len(library()["boxSizes"]) == 4

        width_key = f'boxsize:{size["id"]}:widthCm'
        width = page.locator(f'[data-install-field="{width_key}"]')
        before = library()
        edit(width_key, -1)
        assert library() == before
        assert "Not saved -" in section("sizes").inner_text()
        edit(width_key, 31)
        assert library()["boxSizes"][0]["widthCm"] == 31

        section("cables").locator("summary").click()
        cable = library()["cables"][0]
        edit(f'cable:{cable["id"]}:name', "Revised cable")
        assert library()["cables"][0]["version"] == cable["version"] + 1
        assert "Revised cable" in section("cables").locator("h3").first.inner_text()

        section("hardware").locator(":scope > summary").click()
        definition = library()["components"][0]
        card = section("def:" + definition["id"])
        card.locator("summary").click()
        edit(f'def:{definition["id"]}:name', "Revised hardware")
        assert card.get_attribute("open") is not None
        assert "Revised hardware" in card.locator("summary").inner_text()
        edit(f'def:{definition["id"]}:category', "Regression category")
        assert page.locator('[data-catalog-category="definitions"] option').filter(
            has_text="Regression category"
        ).count() == 1
        search = page.locator('[data-catalog-search="definitions"]')
        search.fill("Revised hardware")
        assert card.is_visible()
        search.fill("")
        card.locator('[data-install^="add-port:"]').click()
        assert card.get_attribute("open") is not None

        page.locator('nav [data-action="page:bom"]').click()
        navigate()
        assert section("hardware").get_attribute("open") is not None
        assert card.get_attribute("open") is not None
        persisted = library()
        page.reload()
        navigate()
        assert page.locator(".standards-section[open]").count() == 0
        assert library() == persisted

        section("sizes").locator("summary").click()
        page.evaluate("""() => {
          window.originalSetItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function(key, value) {
            if (key === 'pixel-workbench-library-v1') throw new Error('Simulated full storage');
            return window.originalSetItem.call(this, key, value);
          };
        }""")
        edit(f'boxsize:{size["id"]}:name', "Must not persist")
        assert library() == persisted
        assert page.locator("#toast").inner_text().startswith("Library update not saved:")
        assert page.locator(f'[data-install-field="boxsize:{size["id"]}:name"]').input_value() == "Updated enclosure"
        page.evaluate("() => { Storage.prototype.setItem = window.originalSetItem; }")

        page.locator('[data-action="open-demo"]').click()
        navigate()
        if section("sizes").get_attribute("open") is None:
            section("sizes").locator("summary").click()
        demo_size_key = page.locator('[data-install-field^="boxsize:"]').first.get_attribute("data-install-field")
        edit(demo_size_key, "Demo only")
        assert "Updated in demo - not saved" in section("sizes").inner_text()
        assert library() == persisted
        page.locator('[data-action="exit-demo"]').click()
        navigate()

        for width in (1440, 390):
            page.set_viewport_size({"width": width, "height": 950})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
        assert not errors, errors
        print(json.dumps({"edit": sample, "checks": "disclosures, focus, persistence, validation, failure, demo, mobile"}))
        browser.close()


if __name__ == "__main__":
    server = serve(str(ROOT / "dist"))
    try:
        run(f"http://127.0.0.1:{server.server_address[1]}/")
    finally:
        server.shutdown()
        server.server_close()
