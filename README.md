# KES2 Holidays 🌍

A simple classroom web app for Year 9 pupils to reveal deterministic "around the world" lesson destinations.

## What it does

- Supports **New Customer** (lesson 1) and **Returning Customer** flows.
- Generates deterministic 5-stop itineraries from an original travel code.
- Uses non-obvious lesson tokens for progression codes.
- Shows a 7-second loading experience before revealing destinations.
- Adds trip complications from `lifeevents.txt` with fallback defaults.
- Shows full trip history up to the current lesson.
- Provides a copy button for next lesson travel code.
- Includes a discreet teacher/staff lookup panel for full itinerary view.

## Files

- `index.html` – page structure and UI sections.
- `styles.css` – visual styling.
- `app.js` – app logic and seeded itinerary generation.
- `lifeevents.txt` – editable complication list.
- `lifeevents.text` – duplicate compatibility file.

## Run locally

Because the app fetches `lifeevents.txt`, run with a local web server:

```bash
python3 -m http.server 8000
```

Then open:

- <http://localhost:8000>

## Teacher tools

- Open **Staff tools**.
- Enter teacher password and original code (`KES2-XXXXXX`).
- View the full 5-lesson itinerary.

## Notes

- Reveal button is hidden after one reveal per visit.
- Pupil data is stored in browser `localStorage` on that device.
