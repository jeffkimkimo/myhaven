#!/usr/bin/env python3
"""
Generates the Instagram film pages from one template.

Eight pages were identical apart from a title and a reel id. They now come from
tools/film-page.template.html plus the table below, so adding a film is one line
here instead of a copied HTML file.

Only these eight are generated. death-of-cinema, derry, goal, journal,
robofriend and script are genuinely different pages and are left untouched.

NOTE: three of these pages (boiling-point, college-day, mask) shipped without
the "Open on Instagram" link the other five have. `open_link` below preserves
that exactly as-is. Set it to True to make them consistent — that is a content
change, so it is your call, not the script's.

Usage:
  python3 tools/build-film-pages.py           write the pages
  python3 tools/build-film-pages.py --check   report drift without writing
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OPEN_LINK = ('    <p><a href="https://www.instagram.com/reel/{reel}/'
             '?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==" '
             'target="_blank" rel="noopener">Open on Instagram</a></p>\n')

# stem: (title, reel id, has "Open on Instagram" link today)
FILMS = {
    "anxiety":        ("Anxiety",           "DR5bDg7Ds-_", True),
    "boiling-point":  ("The Boiling Point", "DORn9JKiffB", False),
    "college-day":    ("A College Day",     "DPNDeBiDSd1", False),
    "i-quit":         ("I Quit",            "DUeJlKSic4Z", True),
    "mask":           ("The Mask",          "DRdfkm2jQ8j", False),
    "missed":         ("Missed",            "DSJvU0NDegx", True),
    "new-chapter":    ("The New Chapter",   "DNqpMWUJ0zY", True),
    "the-snow-storm": ("The Snow Storm",    "DT6aiGkDdj2", True),
}


def render(title, reel, open_link):
    tpl = open(os.path.join(ROOT, "tools", "film-page.template.html")).read()
    out = tpl.replace("{{TITLE}}", title).replace("{{REEL}}", reel)
    if not open_link:
        out = "".join(l for l in out.splitlines(keepends=True)
                      if "Open on Instagram" not in l)
    return out


def normalise(s):
    """Compare rendered meaning, ignoring a BOM and an equivalent entity."""
    return s.lstrip("﻿").replace("&#8592;", "←")


def main():
    check = "--check" in sys.argv
    drift = 0
    for stem, (title, reel, link) in FILMS.items():
        path = os.path.join(ROOT, "pages", f"{stem}.html")
        out = render(title, reel, link)
        current = open(path).read() if os.path.exists(path) else ""
        same = normalise(current) == normalise(out)
        if check:
            print(f"  {stem + '.html':<24} {'same' if same else 'DIFFERS'}")
            drift += 0 if same else 1
        else:
            open(path, "w").write(out)
            print(f"  wrote pages/{stem}.html")
    if check:
        print("\n" + ("no drift — the template reproduces every page as rendered"
                      if not drift else f"{drift} file(s) differ"))
        return 1 if drift else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
