#!/usr/bin/env python3
"""
Image optimisation only. No design changes, no markup restructuring.

Every image on this site was being served at its full master resolution, no
matter how small it appears on screen. The blender ring, for example, draws each
render at 56px wide and focuses it at most 640px, while downloading a 3840px
PNG. This script writes correctly sized copies next to the originals.

Originals are never modified in place except where a file is only ever used at
one small size (the favicon, the menu backdrop); in those cases the master is
moved to assets/_originals/ first so nothing is lost.

Usage:  python3 tools/optimize-images.py
"""

import os
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINALS = os.path.join(ROOT, "assets", "_originals")

EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif", ".JPG", ".JPEG", ".PNG")


def human(n):
    return f"{n / 1048576:.1f} MB" if n >= 1048576 else f"{n / 1024:.0f} KB"


def load(path):
    im = Image.open(path)
    im.load()
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, (0, 0, 0))
        flat.paste(im, mask=im.split()[-1])
        return flat
    return im.convert("RGB")


def fit(im, longest):
    w, h = im.size
    if max(w, h) <= longest:
        return im
    scale = longest / max(w, h)
    return im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def to_webp(src, dest, longest, quality):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im = fit(load(src), longest)
    im.save(dest, "WEBP", quality=quality, method=6)
    return os.path.getsize(src), os.path.getsize(dest)


def mirror_tree(src_dir, dest_dir, longest, quality, label):
    """Write a .webp copy of every image, preserving the folder structure."""
    # A poster often exists as both a .png master and a .jpg export. Both map to
    # the same .webp name, so pick the higher-resolution source deterministically
    # rather than letting directory order decide.
    best = {}
    for dirpath, _dirs, files in os.walk(src_dir):
        for f in sorted(files):
            if not f.endswith(EXT):
                continue
            path = os.path.join(dirpath, f)
            rel = os.path.relpath(path, src_dir)
            out = os.path.join(dest_dir, os.path.splitext(rel)[0] + ".webp")
            try:
                with Image.open(path) as probe:
                    px = probe.size[0] * probe.size[1]
            except Exception:  # noqa: BLE001
                px = 0
            if out not in best or px > best[out][0]:
                best[out] = (px, path)
    jobs = [(path, out) for out, (_px, path) in sorted(best.items())]

    before = after = 0
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        for b, a in pool.map(lambda j: to_webp(j[0], j[1], longest, quality), jobs):
            before += b
            after += a
    print(f"  {label:<26} {len(jobs):3d} files   {human(before):>9} -> {human(after):>9}"
          f"   ({before / after:.0f}x smaller)")
    return before, after


def replace_in_place(path, longest, quality, fmt):
    """Shrink a file that is only ever shown small, keeping master + filename."""
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        print(f"  ! missing {path}")
        return 0, 0
    keep = os.path.join(ORIGINALS, path)
    os.makedirs(os.path.dirname(keep), exist_ok=True)
    if not os.path.exists(keep):
        shutil.copy2(full, keep)

    before = os.path.getsize(full)
    im = fit(load(keep), longest)
    if fmt == "PNG":
        im.save(full, "PNG", optimize=True)
    else:
        im.save(full, "JPEG", quality=quality, optimize=True, progressive=True)
    after = os.path.getsize(full)
    print(f"  {path:<40} {human(before):>9} -> {human(after):>9}"
          f"   ({before / after:.0f}x smaller)")
    return before, after


def main():
    total_before = total_after = 0
    print("\nGalleries — webp copies written alongside the masters")

    # Ring tiles draw at 56px; the focused view is capped at 640px by the CSS.
    b, a = mirror_tree(os.path.join(ROOT, "assets/images/blender"),
                       os.path.join(ROOT, "assets/images/blender-web"),
                       1200, 80, "blender renders")
    total_before += b; total_after += a

    # Slides are 45vw on desktop, 75vw on mobile.
    b, a = mirror_tree(os.path.join(ROOT, "inspirations"),
                       os.path.join(ROOT, "inspirations-web"),
                       900, 80, "inspirations")
    total_before += b; total_after += a

    # Posters sit at ~30vw in the slider, up to 896px in the preview.
    b, a = mirror_tree(os.path.join(ROOT, "assets/images/films"),
                       os.path.join(ROOT, "assets/images/films-web"),
                       900, 82, "film posters")
    total_before += b; total_after += a

    # Two intro cards, each drawn ~446px wide.
    b, a = to_webp(os.path.join(ROOT, "animation_1/img/code_and_oscar.png"),
                   os.path.join(ROOT, "animation_1/img/code_and_oscar.webp"), 900, 85)
    print(f"  {'animation_1 card':<26}   1 files   {human(b):>9} -> {human(a):>9}"
          f"   ({b / a:.0f}x smaller)")
    total_before += b; total_after += a

    print("\nShrunk in place — masters copied to assets/_originals/ first")
    # Favicon: never rendered above 64px anywhere.
    b, a = replace_in_place("assets/branding/jklogo2.png", 256, 0, "PNG")
    total_before += b; total_after += a
    # Full-bleed menu backdrop; 1920 is plenty and it is behind a blend mode.
    b, a = replace_in_place("navigation_menu/img/menu.jpg", 1920, 80, "JPEG")
    total_before += b; total_after += a

    print(f"\n  {'TOTAL':<40} {human(total_before):>9} -> {human(total_after):>9}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
