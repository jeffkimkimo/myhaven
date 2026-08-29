# myhaven
Portfolio website project.

## Folder Structure

```
myhaven/
├── assets/
│   ├── branding/        # Logos and brand graphics
│   ├── docs/            # Resume and downloadable docs
│   ├── icons/           # Shared icon assets
│   ├── images/
│       ├── misc/        # Misc standalone images
│       ├── blender/     # Blender render gallery images (1-39)
│       ├── films/       # Film poster/still images
│       └── portraits/   # Personal portraits
│   └── videos/          # Video assets
├── about_me/
├── animation_1/
├── code_slider/
├── film_slider/
├── inspirations/
├── inspirations_sliders/
├── intro_hero/
├── navigation_menu/
├── pages/              # Standalone content pages (films/code/resume/etc.)
├── picture_display/
├── text_about/
├── webshadergl/
├── portfolio.html
└── vercel.json
```

## Conventions

- Keep reusable media in `assets/` instead of project root.
- Keep feature-specific code inside its own folder (`about_me/`, `animation_1/`, etc.).
- Use relative links that match this structure.

## Maintenance scripts

Two scripts, both optional — the site is plain static files and runs without them.

**`tools/optimize-images.py`** — writes correctly sized `.webp` copies next to
the image masters. Run it after adding images:

```sh
python3 tools/optimize-images.py
```

Masters live in `assets/images/`, `inspirations/` and `assets/_originals/` and
are never deleted. The site serves the copies in the `*-web/` folders.

Two sizes are produced for the galleries. `*-web/` holds the full-size copy and
`*-web/thumb/` holds a small one. The blender ring and the inspiration wheel
draw their images at 54-81px, so they load the small copy; the full-size one is
fetched only when a render is focused or a slide scrolls into view.
`.vercelignore` keeps the masters in the repo but out of the deploy.

**`tools/build-film-pages.py`** — the eight Instagram film pages come from
`tools/film-page.template.html` plus a table in the script. Add a film by adding
one line, then:

```sh
python3 tools/build-film-pages.py           # write the pages
python3 tools/build-film-pages.py --check   # report drift, write nothing
```

Only those eight are generated. `death-of-cinema`, `derry`, `goal`, `journal`,
`robofriend` and `script` are genuinely different pages and are edited by hand.
