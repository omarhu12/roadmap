# Trailhead — Learning Roadmap

A two-page static site: you curate the roadmap, students track their own progress against it.

- **[index.html](index.html)** — the student view. Loads `data.json`, shows the trail of waypoints, and lets a student check off tasks/courses. Their checkmarks are saved only in their own browser (`localStorage`), so different students tracking the same published roadmap each see their own progress.
- **[admin.html](admin.html)** — the editor. Add/rename/delete waypoints and items, attach links, mark something as a task or a course. Your edits are saved as a draft in your browser as you go.

## Publishing changes

Content only updates for students once it's committed:

1. Open `admin.html`, make your edits.
2. Click **Export data.json** — downloads the updated file.
3. Replace `data.json` in this repo with the downloaded one, then commit & push.
4. GitHub Pages redeploys automatically; `index.html` picks up the new content on next load.

Item IDs in `data.json` are stable across edits, so a student's existing checkmarks survive as long as you don't delete and recreate the same item.

## Hosting on GitHub Pages

Push this repo to GitHub, then enable Pages (Settings → Pages → Deploy from branch → `main` / root). No build step — it's plain HTML/CSS/JS.

## Local preview

Opening `index.html` directly (`file://`) will show example content instead of `data.json`, because browsers block local `fetch()` of another file over `file://`. To preview it properly, run a static server from this folder, e.g.:

```bash
python -m http.server 5173
```

then visit `http://localhost:5173`.
