(() => {
  "use strict";

  const STORAGE_KEY = "ourhome-data-v1";

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
    return data;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  const state = loadData();

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
