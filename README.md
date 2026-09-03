# Our Home

A simple shared household app for Jennie & Will. No build step, no dependencies — just open `index.html` in a browser.

## Tabs

**Home**
- Shared shopping list — tick items off, tap again to put them back on the list, or remove them.
- Bins (Recycling, General) and Laundry (Whites, Colours) counters that count the days since each was last emptied. Green under 5 days, yellow at 5–6, red at 7+. Tap a tile to empty it and reset the counter to 0.

**Home Improvement**
- Add house projects with notes.
- Track progress with a slider/progress bar per project.
- Mark a project complete (records the completion date) or un-mark it.

## Running it

Open `index.html` directly in a browser, or serve the folder statically, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Data storage

Data is stored in the browser's `localStorage`, so it stays on whichever device/browser you use it in — it does not sync between Jennie's and Will's devices automatically. If you want the list to sync across both of your phones, this app would need a small backend (e.g. Firebase) added later.
