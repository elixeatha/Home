(() => {
  "use strict";

  const STORAGE_KEY = "ourhome-data-v1";

  const PROFILES = {
    jennie: {
      name: "Jennie",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="34" fill="#241f1f"/>
        <circle cx="50" cy="58" r="28" fill="#f6cba3"/>
        <path d="M22,48 Q22,26 50,26 Q78,26 78,48 L78,44 Q78,30 50,30 Q22,30 22,44 Z" fill="#241f1f"/>
        <path d="M20,44 Q17,68 25,88 L34,88 Q28,66 30,45 Z" fill="#241f1f"/>
        <path d="M80,44 Q83,68 75,88 L66,88 Q72,66 70,45 Z" fill="#241f1f"/>
        <ellipse cx="40" cy="59" rx="4" ry="5" fill="#5b3a29"/>
        <ellipse cx="60" cy="59" rx="4" ry="5" fill="#5b3a29"/>
        <path d="M42,73 Q50,79 58,73" stroke="#8a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="32" cy="67" r="5" fill="#f2a58c" opacity="0.5"/>
        <circle cx="68" cy="67" r="5" fill="#f2a58c" opacity="0.5"/>
      </svg>`,
    },
    will: {
      name: "Will",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="58" r="28" fill="#fbe0c2"/>
        <path d="M20,52 Q17,23 50,21 Q83,23 80,52 Q78,33 66,29 Q58,36 50,29 Q42,36 34,29 Q22,33 20,52 Z" fill="#6b4226"/>
        <ellipse cx="40" cy="59" rx="4" ry="5" fill="#3f7cc9"/>
        <ellipse cx="60" cy="59" rx="4" ry="5" fill="#3f7cc9"/>
        <path d="M42,73 Q50,79 58,73" stroke="#c17a4f" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="32" cy="67" r="5" fill="#f2a58c" opacity="0.4"/>
        <circle cx="68" cy="67" r="5" fill="#f2a58c" opacity="0.4"/>
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
    return data;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  const state = loadData();

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
  renderShopping();
  renderCounters();
  renderImprovements();
})();
