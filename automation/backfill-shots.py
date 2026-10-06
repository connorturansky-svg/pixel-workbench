"""One-off, resumable backfill of the `screenshots` branch for every released v* tag.

For each tag without a successful folder: export dist/ at that tag (git archive from a private bare cache, so no
work tree is touched), run the current automation/smoke.py --shots against it and publish through the builder's
publish_shots(). Failures are recorded in the branch index and the run continues. Re-running skips finished tags.

Usage: python automation/backfill-shots.py [--retry-failed] [--only vX.Y.Z ...] [--dry-run]
Runs as J-Turansky only; the token is never printed.
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("builder", os.path.join(HERE, "builder.py"))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

CACHE = os.path.join(b.DATA_DIR, "shots-source.git")
# the private cache is bare; git may be configured with safe.bareRepository=explicit
os.environ.update(GIT_CONFIG_COUNT="1", GIT_CONFIG_KEY_0="safe.bareRepository", GIT_CONFIG_VALUE_0="all")


def release_tags():
    out = b.git("ls-remote", "--tags", "origin", "refs/tags/v*", cwd=b.OWNER_DIR)
    tags = {m.group(1) for line in out.splitlines() if (m := re.search(r"refs/tags/(v\d+\.\d+\.\d+)(?:\^\{\})?$", line))}
    return sorted(tags, key=lambda t: tuple(int(x) for x in t[1:].split(".")))


def refresh_cache():
    url = f"https://github.com/{b.REPO}.git"
    if not os.path.isdir(CACHE):
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        b.git("clone", "--quiet", "--bare", url, CACHE, cwd=b.OWNER_DIR)
    b.git("fetch", "--quiet", "--force", "--tags", "origin", cwd=CACHE)


def capture(tag, work):
    """Export dist/ at the tag and run the current smoke test with --shots; returns (folder, commit, meta)."""
    dist = os.path.join(work, "dist")
    os.makedirs(dist)
    commit = b.git("rev-parse", tag + "^{commit}", cwd=CACHE)
    tar = os.path.join(work, "dist.tar")
    subprocess.run(["git", "archive", "--format=tar", "-o", tar, commit, "dist"], cwd=CACHE, check=True,
                   creationflags=b.NO_WINDOW)
    shutil.unpack_archive(tar, work)
    os.remove(tar)
    date = b.git("log", "-1", "--format=%cd", "--date=format:%d/%m/%Y", commit, cwd=CACHE)
    with open(os.path.join(dist, "version.mjs"), encoding="utf-8") as f:
        text = f.read()
    line = b.changelog_line(text)
    issue = re.search(r"#(\d+)", line)
    shots = os.path.join(work, "shots")
    r = subprocess.run([sys.executable, os.path.join(HERE, "smoke.py"), dist, "--shots", shots],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600,
                       creationflags=b.NO_WINDOW)
    meta = dict(date=date, commit=commit, issue=int(issue.group(1)) if issue else None, changelog=line)
    if r.returncode and not (os.path.isdir(shots) and any(f.endswith(".png") for f in os.listdir(shots))):
        meta["error"] = "smoke test failed before any screenshot: " + (r.stdout + r.stderr).strip()[-300:]
    return shots, meta


def main():
    args = sys.argv[1:]
    only = [a for a in args if re.fullmatch(r"v\d+\.\d+\.\d+", a)]
    b.DRY = "--dry-run" in args
    b.TOKEN = b.run(["gh", "auth", "token", "-u", b.PUSH_USER], cwd=b.OWNER_DIR, timeout=30).stdout.strip()
    done = b.published_versions()
    refresh_cache()
    todo = [t for t in release_tags() if (not only or t in only)
            and (t not in done or (done[t].get("status") != "ok" and "--retry-failed" in args))]
    print(f"{len(done)} versions already on the {b.SHOTS_BRANCH} branch; {len(todo)} to do", flush=True)
    failed = []
    for tag in todo:
        work = tempfile.mkdtemp(prefix="pw-shots-")
        try:
            if b.DRY:
                print(f"[dry-run] would capture and publish {tag}")
                continue
            folder, meta = capture(tag, work)
            result = b.publish_shots(tag, folder, meta)
            print(f"{tag}: {result}" + (f" ({meta['error']})" if meta.get("error") else ""), flush=True)
            if result == "failed" or meta.get("error"):
                failed.append(tag)
        except Exception as e:  # noqa: BLE001
            failed.append(tag)
            print(f"{tag}: failed: {b.scrub(str(e))[:200]}", flush=True)
            try:
                b.publish_shots(tag, os.path.join(work, "none"), {"error": b.scrub(str(e))[:200]})
            except Exception:  # noqa: BLE001
                pass
        finally:
            shutil.rmtree(work, ignore_errors=True)
    print("failed tags: " + (", ".join(failed) if failed else "none"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
