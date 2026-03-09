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
