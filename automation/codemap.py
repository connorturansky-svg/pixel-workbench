"""Print a compact map of dist/: each module's purpose and its top-level functions/constants with line numbers.

The builder puts this in the Copilot prompt so the agent can jump straight to the right file and lines
instead of searching (searches and file reads are what cost the most AI credits).
Usage: python automation/codemap.py [dist-folder]
"""
import os
import re
import sys

PURPOSE = {
    "app.js": "app shell: state, render() with the sidebar `pages` array and every page's content, events",
    "model.mjs": "pixel/power maths: controllers, ports, PSUs, injection, cable and fuse calculations",
    "layout-model.mjs": "room layout geometry helpers",
    "room.js": "room layout view: canvas, drag, zoom/pan, cable routes and pivots",
    "wiring-model.mjs": "wiring graph data model",
    "wiring-graph.mjs": "wiring graph view",
    "installation-model.mjs": "installation/controller-box model: hardware library, components, boxes, BOM",
    "installation-ui.mjs": "installation and controller-box pages, hardware library forms",
    "installation-room.mjs": "installation room view",
    "demo-project.mjs": "demo project data",
    "suggest.mjs": "Suggest a feature page: GitHub connect, submit, request list, stages, costs, daily limit",
    "info.mjs": "info (i) dialog: How to use, What's new, Architecture diagram, Shortcuts",
    "version.mjs": "APP_VERSION, CHANGELOG, HOW_TO_USE, ABOUT, SHORTCUTS, ARCHITECTURE_NOTES",
}
DEF = re.compile(r"^(?:export\s+)?(?:async\s+)?(?:function\*?\s+([\w$]+)|(?:const|let|var|class)\s+([\w$]+))")


def entries(path):
    out = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f, 1):
            m = DEF.match(line)
            if m:
                out.append(f"{m.group(1) or m.group(2)}:{i}")
    return out


def codemap(dist):
    lines = []
    for name in sorted(os.listdir(dist)):
        if not re.search(r"\.(m?js|css|html)$", name):
            continue
        path = os.path.join(dist, name)
        with open(path, encoding="utf-8", errors="replace") as f:
            count = sum(1 for _ in f)
        head = f"dist/{name} ({count} lines)"
        if name in PURPOSE:
            head += f" - {PURPOSE[name]}"
        lines.append(head)
        if name.endswith("js"):
            defs = entries(path)
            if defs:
                lines.append("  " + ", ".join(defs))
    return "\n".join(lines)


if __name__ == "__main__":
    print(codemap(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "dist")))
