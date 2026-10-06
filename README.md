# Pixel Workbench: screenshots per version

Every release is captured by the builder's release smoke test (`automation/smoke.py --shots`): every page, every info tab and a mobile view. This branch is never deployed by Pages. Newest first.

## [v0.61.0](v0.61.0/)



**Screenshots failed:** gh api -X failed: Post "https://api.github.com/repos/connorturansky-svg/pixel-workbench/git/blobs": read tcp 192.168.0.199:60374->20.26.156.210:443: wsarecv: An existing connection was forcibly closed

## [v0.6.0](v0.6.0/)

02/10/2026 · [commit 38cf66b](https://github.com/connorturansky-svg/pixel-workbench/commit/38cf66b0d2a49f779111c9f7a49af52e0170fa80)

> Info / Help moves from the sidebar into a single i button (top bar) that opens a fixed-size dialog with How to use, What’s new, Architecture and Shortcuts tabs.

**Screenshots failed:** smoke test failed before any screenshot: ython312\Lib\site-packages\playwright\_impl\_connection.py", line 559, in wrap_api_call
    raise rewrite_error(error, f"{parsed_st['apiName']}: {error}") from None
playwright._impl._errors.TimeoutError: Page.text_content: Timeout 30000ms exceeded.
Call log:
  - waiting for locator(".brand-version")

