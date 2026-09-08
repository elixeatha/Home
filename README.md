# Our Home

A shared household app for Jennie & Will. No build step, no npm dependencies — just static HTML/CSS/JS.

## Tabs

**Home**
- Gousto tracker — mark the week's box as "Ordered" or "Skip this week". Turns red from Friday if still undecided, and resets automatically every Monday.
- Shared shopping list — tick items off, tap again to put them back on the list, or remove them.
- Bins (Recycling, General) and Laundry (Whites, Colours) counters that count the days since each was last emptied. Green under 5 days, yellow at 5–6, red at 7+. Tap a tile to empty it and reset the counter to 0 — doing so also awards the active profile a point (see below).

**Home Improvement**
- Add house projects with notes.
- Track progress with a slider/progress bar per project.
- Mark a project complete (records the completion date) or un-mark it.

**Profiles**
- On first visit, pick Jennie or Will. A profile bar up top shows both avatars and point totals — tap the other one anytime to switch who's "active" on this device.
- Emptying a bin/laundry counter awards the active profile a point, with a little dance animation.

## Running it locally

Open `index.html` directly in a browser, or serve the folder statically, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Hosting on GitHub Pages

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch", pick this branch and `/ (root)`, then **Save**.
4. GitHub gives you a URL like `https://<username>.github.io/<repo>/` within a minute or two — that's the app, shareable with both your phones (add it to your home screen for an app-like feel).

## Cross-device syncing (shared data)

By default each device only sees its own data (stored in the browser's `localStorage`), because a static GitHub Pages site has no server of its own to hold shared state. To make the shopping list, bins, points, Gousto status etc. actually sync between your phones, this app connects to a **Firebase Realtime Database**.

This is already wired up in `js/firebase-config.js`, pointing at:

```
https://home-53bfe-default-rtdb.europe-west1.firebasedatabase.app
```

The one thing left to do is set the database's **security rules** — by default Firebase denies all read/write access, so nothing syncs until you open this up. In the [Firebase console](https://console.firebase.google.com) for this project, go to **Build → Realtime Database → Rules**, and set:

```json
{
  "rules": {
    "households": {
      "main": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Then **Publish**. Reload the app on both phones — the little badge next to the "Our Home" title will show "☁️ Synced" once it's connected, and changes on one device will show up on the other within a second or two.

**Security note:** these rules keep things simple for a 2-person app with no login — anyone who discovers your database URL could read or write your household data. That's a reasonable trade-off for a shopping list and bin counters, but don't put anything sensitive in this app. If you want it locked down properly later, that needs adding Firebase Authentication and rules scoped to signed-in users — happy to set that up if you want it.

If `js/firebase-config.js` is ever missing its `databaseURL`, or the CDN can't be reached (offline, blocked network), the badge shows "📴 Local only" and the app works exactly as before, just per-device — nothing breaks.

## Data storage

- Shared data (shopping list, bin/laundry counters, points, Home Improvement projects, Gousto status) syncs via the Realtime Database once its rules are published, and is cached in `localStorage` so the app still works offline.
- Which profile is "active" on a given device is stored locally only (not shared) — Jennie's phone and Will's phone can each have their own person selected.
