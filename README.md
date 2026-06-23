eFootball League Creator

A small static website to create an eFootball league: add teams, generate a round-robin schedule, record match results, and manage cups/awards.

Usage

1. Open `index.html` in a browser (or run a static server from the `/workspace/efootball` folder).

2. Add teams using the Teams form.

3. Add cups/awards in the Cups section (you can assign winners later).

4. Click "Start League" to generate a round-robin schedule.

5. Enter results for each match and click Save — standings update automatically.

6. Assign cup winners using the dropdowns in the Cups list.

Local server (optional)

Run a simple static server (Python):

```bash
# from the workspace/efootball folder
python -m http.server 8000
# then open http://localhost:8000/index.html
```

Notes

- Data is stored in browser localStorage.
- This is a minimal demo; I can add features (playoff cups, import/export, CSV, better UX) if you want.
