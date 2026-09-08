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

By default each device only sees its own data (stored in the browser's `localStorage`), because a static GitHub Pages site has no server of its own to hold shared state. To make the shopping list, bins, points, Gousto status etc. actually sync between your phones, this app can optionally connect to a free **Firebase Firestore** database. It's a ~3 minute, no-code setup:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a free project (any name, e.g. "our-home").
2. In the project, go to **Build → Firestore Database → Create database**. Choose a region close to you and start in **test mode** (we'll tighten the rules in step 5).
3. Go to **Project settings** (gear icon) → scroll to "Your apps" → click the `</>` (web) icon → register an app (any nickname, no need for Firebase Hosting). Firebase will show you a `firebaseConfig` object with your keys.
4. Open `js/firebase-config.js` in this repo and paste your values in, replacing the placeholders:
   ```js
   export const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
   Commit and push — Firebase web config values are safe to have in a public repo; they identify your project but don't grant access by themselves (that's what the security rules below are for).
5. Back in Firestore, go to the **Rules** tab and replace the default rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /households/main {
         allow read, write: if true;
       }
     }
   }
   ```
   **Security note:** this keeps things simple for a 2-person app with no login — anyone who discovers your Firebase project ID could read or write your household data. That's a reasonable trade-off for a shopping list and bin counters, but don't put anything sensitive in this app. If you want it locked down properly later, that needs adding Firebase Authentication and rules scoped to signed-in users — happy to set that up if you want it.

Once both of those are in place, reload the app on both phones — the little badge next to the "Our Home" title will show "☁️ Synced" once it's connected, and changes on one device will show up on the other within a second or two. Until you do this setup, the badge shows "📴 Local only" and the app works exactly as before, just per-device.

## Data storage

- Shared data (shopping list, bin/laundry counters, points, Home Improvement projects, Gousto status) syncs via Firestore once configured, and is cached in `localStorage` so the app still works offline.
- Which profile is "active" on a given device is stored locally only (not shared) — Jennie's phone and Will's phone can each have their own person selected.
