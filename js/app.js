import { firebaseConfig } from "./firebase-config.js";

(() => {
  "use strict";

  const STORAGE_KEY = "ourhome-data-v1";
  const SHARED_KEYS = ["shopping", "improvements", "counters", "points", "gousto"];

  const PROFILES = {
    jennie: {
      name: "Jennie",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#efd9c8"/>
        <path d="M0,100 C0,78 20,66 50,66 C80,66 100,78 100,100 Z" fill="#d98a8a"/>
        <path d="M42,68 L42,80 C42,86 58,86 58,80 L58,68 Z" fill="#e3ab86"/>
        <ellipse cx="21" cy="62" rx="5" ry="7" fill="#e3ab86"/>
        <ellipse cx="79" cy="62" rx="5" ry="7" fill="#e3ab86"/>
        <path d="M50,24 C66,24 76,38 76,56 C76,74 64,84 50,84 C36,84 24,74 24,56 C24,38 34,24 50,24 Z" fill="#e3ab86"/>
        <ellipse cx="38" cy="58" rx="3.6" ry="4.6" fill="#4a2f22"/>
        <ellipse cx="62" cy="58" rx="3.6" ry="4.6" fill="#4a2f22"/>
        <path d="M40,70 Q50,77 60,70" stroke="#a15c46" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="65" r="4.5" fill="#f0a68c" opacity="0.45"/>
        <circle cx="70" cy="65" r="4.5" fill="#f0a68c" opacity="0.45"/>
        <path d="M12,54 Q12,14 50,14 Q88,14 88,54 L88,98 L74,98 Q74,48 65,42 Q57,48 50,48 Q43,48 35,42 Q26,48 26,98 L12,98 Z" fill="#1f1a19"/>
      </svg>`,
    },
    will: {
      name: "Will",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#fbe2c4"/>
        <path d="M0,100 C0,78 20,66 50,66 C80,66 100,78 100,100 Z" fill="#5b7fa6"/>
        <path d="M42,68 L42,79 C42,85 58,85 58,79 L58,68 Z" fill="#f0c294"/>
        <ellipse cx="21" cy="62" rx="5" ry="7" fill="#f0c294"/>
        <ellipse cx="79" cy="62" rx="5" ry="7" fill="#f0c294"/>
        <path d="M50,24 C65,24 75,37 75,55 C75,73 63,84 50,84 C37,84 25,73 25,55 C25,37 35,24 50,24 Z" fill="#f0c294"/>
        <ellipse cx="38.5" cy="58" rx="3.4" ry="4.4" fill="#3f7cc9"/>
        <ellipse cx="61.5" cy="58" rx="3.4" ry="4.4" fill="#3f7cc9"/>
        <path d="M40,70 Q50,77 60,70" stroke="#c17a4f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <circle cx="31" cy="65" r="4.2" fill="#f0a68c" opacity="0.4"/>
        <circle cx="69" cy="65" r="4.2" fill="#f0a68c" opacity="0.4"/>
        <path d="M14,50 Q14,10 50,10 Q86,10 86,50 Q86,38 70,32 Q60,41 50,37 Q40,41 30,32 Q14,38 14,50 Z" fill="#5a3a24"/>
      </svg>`,
    },
  };
  const PROFILE_IDS = Object.keys(PROFILES);

  const COUNTERS = [
    { id: "binRecycling", group: "bins", icon: "♻️", label: "Recycling" },
    { id: "binGeneral", group: "bins", icon: "🗑️", label: "General" },
    { id: "laundryWhites", group: "laundry", icon: "🧺", label: "Whites" },
    { id: "laundryColours", group: "laundry", icon: "🧦", label: "Colours" },
  ];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysSince(dateStr) {
    const then = new Date(dateStr + "T00:00:00");
    const now = new Date(todayStr() + "T00:00:00");
    const diff = Math.round((now - then) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function mondayOf(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay(); // 0 = Sun ... 6 = Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d.toISOString().slice(0, 10);
  }

  function loadData() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      raw = null;
    }
    const data = raw && typeof raw === "object" ? raw : {};
    if (!Array.isArray(data.shopping)) data.shopping = [];
    if (!Array.isArray(data.improvements)) data.improvements = [];
    if (!data.counters || typeof data.counters !== "object") data.counters = {};
    for (const c of COUNTERS) {
      if (!data.counters[c.id] || !data.counters[c.id].lastEmptied) {
        data.counters[c.id] = { lastEmptied: todayStr() };
      }
    }
    if (!data.points || typeof data.points !== "object") data.points = {};
    for (const id of PROFILE_IDS) {
      if (typeof data.points[id] !== "number") data.points[id] = 0;
    }
    if (!PROFILE_IDS.includes(data.currentUser)) data.currentUser = null;
    const currentMonday = mondayOf(todayStr());
    if (!data.gousto || typeof data.gousto !== "object" || data.gousto.weekStart !== currentMonday) {
      data.gousto = { weekStart: currentMonday, status: "pending" };
    }
    return data;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    pushToFirestore();
  }

  const state = loadData();

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Cross-device sync (Firestore) ----------
  // The household's shared data (shopping list, counters, points, improvements,
  // Gousto status) syncs through a single Firestore document so both of you see
  // the same state. `currentUser` (who's using this device) stays local on
  // purpose. If firebase-config.js hasn't been filled in, the app just runs
  // local-only — see README.md.
  const syncStatusEl = document.getElementById("sync-status");
  let db = null;
  let firestoreApi = null; // { doc, setDoc, onSnapshot }
  let firestoreReady = false;
  let applyingRemote = false;
  let pushTimer = null;

  function setSyncStatus(text, cls) {
    if (!syncStatusEl) return;
    syncStatusEl.textContent = text;
    syncStatusEl.className = `sync-status ${cls || ""}`.trim();
  }

  function isFirebaseConfigured() {
    return Boolean(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_"));
  }

  function getSharedState() {
    const out = {};
    for (const key of SHARED_KEYS) out[key] = state[key];
    return out;
  }

  function applyRemoteState(data) {
    applyingRemote = true;
    for (const key of SHARED_KEYS) {
      if (data[key] !== undefined) state[key] = data[key];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    applyingRemote = false;
  }

  function pushToFirestore() {
    if (!firestoreReady || applyingRemote) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const { doc, setDoc } = firestoreApi;
      setDoc(doc(db, "households", "main"), getSharedState(), { merge: true }).catch((err) => {
        console.error("Failed to sync to Firestore:", err);
        setSyncStatus("⚠️ Sync error", "status-error");
      });
    }, 250);
  }

  // Firebase is loaded dynamically (not a static import) so that if the CDN is
  // unreachable — offline, blocked network, or Firebase just isn't configured
  // yet — the rest of the app still loads and works fully offline/local-only.
  async function initFirebaseSync() {
    if (!isFirebaseConfigured()) {
      setSyncStatus("📴 Local only", "");
      return;
    }
    setSyncStatus("🔄 Connecting…", "");
    try {
      const [{ initializeApp }, { getFirestore, doc, setDoc, onSnapshot }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"),
      ]);
      firestoreApi = { doc, setDoc, onSnapshot };

      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      firestoreReady = true;
      const ref = doc(db, "households", "main");
      onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            applyRemoteState(snap.data());
          } else {
            setDoc(ref, getSharedState());
          }
          setSyncStatus("☁️ Synced", "status-synced");
        },
        (err) => {
          console.error("Firestore sync error:", err);
          setSyncStatus("⚠️ Sync error", "status-error");
        }
      );
    } catch (err) {
      console.error("Failed to initialize Firebase (running local-only):", err);
      setSyncStatus("📴 Local only", "");
    }
  }

  // ---------- Profiles & points ----------
  const profileBarEl = document.getElementById("profile-bar");
  const whoSheetBackdrop = document.getElementById("who-sheet-backdrop");
  const whoGridEl = document.getElementById("who-grid");

  function renderProfileBar() {
    profileBarEl.innerHTML = "";
    for (const id of PROFILE_IDS) {
      const profile = PROFILES[id];
      const card = document.createElement("button");
      card.type = "button";
      card.className = `profile-card${state.currentUser === id ? " active" : ""}`;
      card.dataset.profileId = id;

      const avatarWrap = document.createElement("div");
      avatarWrap.className = "profile-avatar-wrap";
      const avatar = document.createElement("div");
      avatar.className = "profile-avatar";
      avatar.innerHTML = profile.svg;
      avatarWrap.appendChild(avatar);

      const name = document.createElement("span");
      name.className = "profile-name";
      name.textContent = profile.name;

      const points = document.createElement("span");
      points.className = "profile-points";
      points.innerHTML = `<strong>${state.points[id]}</strong> pt${state.points[id] === 1 ? "" : "s"}`;

      card.append(avatarWrap, name, points);
      card.addEventListener("click", () => {
        state.currentUser = id;
        saveData();
        renderProfileBar();
      });

      profileBarEl.appendChild(card);
    }
  }

  function renderWhoSheet() {
    whoGridEl.innerHTML = "";
    for (const id of PROFILE_IDS) {
      const profile = PROFILES[id];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "who-card";

      const avatar = document.createElement("div");
      avatar.className = "profile-avatar";
      avatar.innerHTML = profile.svg;

      const name = document.createElement("span");
      name.textContent = profile.name;

      card.append(avatar, name);
      card.addEventListener("click", () => {
        state.currentUser = id;
        saveData();
        renderProfileBar();
        whoSheetBackdrop.hidden = true;
      });

      whoGridEl.appendChild(card);
    }
  }

  function awardPoint(userId) {
    if (!PROFILE_IDS.includes(userId)) return;
    state.points[userId] += 1;
    saveData();
    renderProfileBar();

    const card = profileBarEl.querySelector(`[data-profile-id="${userId}"]`);
    if (!card) return;
    const avatarWrap = card.querySelector(".profile-avatar-wrap");
    const avatar = card.querySelector(".profile-avatar");

    const popup = document.createElement("span");
    popup.className = "point-popup";
    popup.textContent = "+1";
    avatarWrap.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());

    avatar.classList.remove("dancing");
    // eslint-disable-next-line no-unused-expressions
    void avatar.offsetWidth; // restart animation
    avatar.classList.add("dancing");
    avatar.addEventListener("animationend", () => avatar.classList.remove("dancing"), { once: true });
  }

  renderProfileBar();
  if (!state.currentUser) {
    renderWhoSheet();
    whoSheetBackdrop.hidden = false;
  }

  // ---------- Gousto tracker ----------
  const goustoCard = document.getElementById("gousto-card");
  const goustoStatusEl = document.getElementById("gousto-status");
  const goustoActionsEl = document.getElementById("gousto-actions");
  const goustoOrderedBtn = document.getElementById("gousto-ordered-btn");
  const goustoSkipBtn = document.getElementById("gousto-skip-btn");
  const goustoUndoBtn = document.getElementById("gousto-undo-btn");

  function refreshGoustoWeek() {
    const currentMonday = mondayOf(todayStr());
    if (state.gousto.weekStart !== currentMonday) {
      state.gousto = { weekStart: currentMonday, status: "pending" };
      saveData();
    }
  }

  function isGoustoUrgent() {
    const dow = new Date().getDay(); // 0 Sun, 5 Fri, 6 Sat
    return dow === 5 || dow === 6 || dow === 0;
  }

  function renderGousto() {
    refreshGoustoWeek();
    const { status } = state.gousto;
    const urgent = status === "pending" && isGoustoUrgent();

    goustoCard.className = `card gousto-card${
      status === "ordered" ? " status-ordered" : status === "skipped" ? " status-skipped" : urgent ? " status-urgent" : ""
    }`;

    if (status === "ordered") {
      goustoStatusEl.textContent = "✅ Ordered for this week — nice one.";
    } else if (status === "skipped") {
      goustoStatusEl.textContent = "⏭️ Skipped this week — no delivery needed.";
    } else if (urgent) {
      goustoStatusEl.textContent = "⚠️ Not ordered yet — order today, or it'll be too late for this week!";
    } else {
      goustoStatusEl.textContent = "Order by Saturday, or skip if you don't need a box this week.";
    }

    goustoActionsEl.hidden = status !== "pending";
    goustoUndoBtn.hidden = status === "pending";
  }

  goustoOrderedBtn.addEventListener("click", () => {
    state.gousto.status = "ordered";
    saveData();
    renderGousto();
  });

  goustoSkipBtn.addEventListener("click", () => {
    state.gousto.status = "skipped";
    saveData();
    renderGousto();
  });

  goustoUndoBtn.addEventListener("click", () => {
    state.gousto.status = "pending";
    saveData();
    renderGousto();
  });

  // Re-check hourly in case the tab is left open across a day boundary (Friday/Monday rollover)
  setInterval(renderGousto, 60 * 60 * 1000);

  // ---------- Tabs ----------
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  // ---------- Shopping list ----------
  const shoppingForm = document.getElementById("shopping-form");
  const shoppingInput = document.getElementById("shopping-input");
  const shoppingListEl = document.getElementById("shopping-list");
  const shoppingEmptyEl = document.getElementById("shopping-empty");

  function renderShopping() {
    shoppingListEl.innerHTML = "";
    const items = state.shopping;
    shoppingEmptyEl.hidden = items.length > 0;

    // Unchecked first, then checked, each preserving add order
    const sorted = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));

    for (const item of sorted) {
      const li = document.createElement("li");
      li.className = item.checked ? "checked" : "";

      const check = document.createElement("button");
      check.className = "check";
      check.type = "button";
      check.textContent = "✓";
      check.setAttribute("aria-label", item.checked ? "Put back on list" : "Tick off");
      check.addEventListener("click", () => {
        item.checked = !item.checked;
        saveData();
        renderShopping();
      });

      const label = document.createElement("span");
      label.className = "item-label";
      label.textContent = item.text;
      label.addEventListener("click", () => {
        item.checked = !item.checked;
        saveData();
        renderShopping();
      });

      const remove = document.createElement("button");
      remove.className = "remove-btn";
      remove.type = "button";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", "Remove item");
      remove.addEventListener("click", () => {
        state.shopping = state.shopping.filter((i) => i.id !== item.id);
        saveData();
        renderShopping();
      });

      li.append(check, label, remove);
      shoppingListEl.appendChild(li);
    }
  }

  shoppingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = shoppingInput.value.trim();
    if (!text) return;
    state.shopping.push({ id: uid(), text, checked: false });
    saveData();
    shoppingInput.value = "";
    renderShopping();
  });

  // ---------- Counters (bins & laundry) ----------
  const binsGrid = document.getElementById("bins-grid");
  const laundryGrid = document.getElementById("laundry-grid");

  function levelFor(count) {
    if (count >= 7) return "level-danger";
    if (count >= 5) return "level-warn";
    return "";
  }

  function renderCounters() {
    binsGrid.innerHTML = "";
    laundryGrid.innerHTML = "";

    for (const c of COUNTERS) {
      const count = daysSince(state.counters[c.id].lastEmptied);
      const tile = document.createElement("div");
      tile.className = `counter-tile ${levelFor(count)}`.trim();
      tile.innerHTML = `
        <span class="tile-icon">${c.icon}</span>
        <span class="tile-label">${c.label}</span>
        <div class="tile-count">${count}</div>
        <span class="tile-sub">day${count === 1 ? "" : "s"} since empty</span>
      `;
      tile.addEventListener("click", () => openBinSheet(c));
      (c.group === "bins" ? binsGrid : laundryGrid).appendChild(tile);
    }
  }

  const sheetBackdrop = document.getElementById("bin-sheet-backdrop");
  const sheetTitle = document.getElementById("bin-sheet-title");
  const sheetSub = document.getElementById("bin-sheet-sub");
  const sheetEmptyBtn = document.getElementById("bin-sheet-empty");
  const sheetCancelBtn = document.getElementById("bin-sheet-cancel");
  let activeCounterId = null;

  function openBinSheet(c) {
    activeCounterId = c.id;
    const count = daysSince(state.counters[c.id].lastEmptied);
    sheetTitle.textContent = `${c.icon} ${c.label}`;
    sheetSub.textContent = `${count} day${count === 1 ? "" : "s"} since it was last emptied.`;
    sheetBackdrop.hidden = false;
  }

  function closeBinSheet() {
    sheetBackdrop.hidden = true;
    activeCounterId = null;
  }

  sheetEmptyBtn.addEventListener("click", () => {
    if (activeCounterId) {
      state.counters[activeCounterId].lastEmptied = todayStr();
      saveData();
      renderCounters();
      if (state.currentUser) awardPoint(state.currentUser);
    }
    closeBinSheet();
  });

  sheetCancelBtn.addEventListener("click", closeBinSheet);
  sheetBackdrop.addEventListener("click", (e) => {
    if (e.target === sheetBackdrop) closeBinSheet();
  });

  // ---------- Home Improvement ----------
  const improvementForm = document.getElementById("improvement-form");
  const improvementTitleInput = document.getElementById("improvement-title");
  const improvementNotesInput = document.getElementById("improvement-notes");
  const improvementListEl = document.getElementById("improvement-list");
  const improvementEmptyEl = document.getElementById("improvement-empty");

  function renderImprovements() {
    improvementListEl.innerHTML = "";
    const items = state.improvements;
    improvementEmptyEl.hidden = items.length > 0;

    // Active items first (newest first), completed items after (most recently completed first)
    const active = items.filter((i) => !i.completed).sort((a, b) => b.createdAt - a.createdAt);
    const done = items.filter((i) => i.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    for (const item of [...active, ...done]) {
      improvementListEl.appendChild(renderImprovementItem(item));
    }
  }

  function renderImprovementItem(item) {
    const wrap = document.createElement("div");
    wrap.className = `improvement-item${item.completed ? " completed" : ""}`;

    const head = document.createElement("div");
    head.className = "improvement-item-head";
    const title = document.createElement("p");
    title.className = "improvement-item-title";
    title.textContent = item.title;
    head.appendChild(title);
    wrap.appendChild(head);

    const notes = document.createElement("textarea");
    notes.rows = 2;
    notes.placeholder = "Notes on progress…";
    notes.value = item.notes || "";
    notes.addEventListener("change", () => {
      item.notes = notes.value;
      saveData();
    });
    wrap.appendChild(notes);

    const progressRow = document.createElement("div");
    progressRow.className = "progress-row";
    const track = document.createElement("div");
    track.className = "progress-bar-track";
    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = `${item.progress}%`;
    track.appendChild(fill);
    const label = document.createElement("span");
    label.className = "progress-label";
    label.textContent = `${item.progress}%`;
    progressRow.append(track, label);
    wrap.appendChild(progressRow);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "5";
    slider.value = item.progress;
    slider.className = "progress-slider";
    slider.disabled = item.completed;
    slider.addEventListener("input", () => {
      item.progress = Number(slider.value);
      fill.style.width = `${item.progress}%`;
      label.textContent = `${item.progress}%`;
    });
    slider.addEventListener("change", () => {
      saveData();
    });
    wrap.appendChild(slider);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = `complete-btn${item.completed ? " is-completed" : ""}`;
    completeBtn.textContent = item.completed ? "Mark as not done" : "Mark as complete";
    completeBtn.addEventListener("click", () => {
      item.completed = !item.completed;
      if (item.completed) {
        item.progress = 100;
        item.completedAt = Date.now();
      } else {
        item.completedAt = null;
      }
      saveData();
      renderImprovements();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      state.improvements = state.improvements.filter((i) => i.id !== item.id);
      saveData();
      renderImprovements();
    });

    actions.append(completeBtn, deleteBtn);
    wrap.appendChild(actions);

    if (item.completed && item.completedAt) {
      const dateEl = document.createElement("p");
      dateEl.className = "completed-date";
      dateEl.textContent = `Completed ${new Date(item.completedAt).toLocaleDateString()}`;
      wrap.appendChild(dateEl);
    }

    return wrap;
  }

  improvementForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = improvementTitleInput.value.trim();
    if (!title) return;
    state.improvements.push({
      id: uid(),
      title,
      notes: improvementNotesInput.value.trim(),
      progress: 0,
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
    });
    saveData();
    improvementTitleInput.value = "";
    improvementNotesInput.value = "";
    renderImprovements();
  });

  // ---------- Init ----------
  function renderAll() {
    renderProfileBar();
    renderShopping();
    renderCounters();
    renderImprovements();
    renderGousto();
  }

  renderShopping();
  renderCounters();
  renderImprovements();
  renderGousto();
  initFirebaseSync();
})();
