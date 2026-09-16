/* Shared rendering + utilities for both the admin editor and the student view.
   Any button/field not present in a page's <template> markup is simply skipped
   (that's how the two pages differ in capability, not via a mode flag here). */

const DIAL_CIRC = 314.16;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeItem(title, type, url, done) {
  return { id: uid(), title: title || "", type: type || "task", url: url || "", done: !!done };
}

function makeSection(title) {
  return { id: uid(), title: title || "", items: [] };
}

function seedData() {
  return {
    title: "My Learning Roadmap",
    sections: [
      {
        id: uid(),
        title: "Foundations",
        items: [
          makeItem("Learn HTML & CSS basics", "task", "", false),
          makeItem("CS50: Introduction to Computer Science", "course", "https://cs50.harvard.edu/x/", false),
          makeItem("Pick an editor & set up git", "task", "", false),
        ],
      },
      {
        id: uid(),
        title: "Core Skills",
        items: [
          makeItem("JavaScript fundamentals", "task", "", false),
          makeItem("The Odin Project — Full Stack path", "course", "https://www.theodinproject.com/", false),
        ],
      },
      {
        id: uid(),
        title: "Build & Ship",
        items: [
          makeItem("Build a portfolio project", "task", "", false),
          makeItem("Deploy it publicly", "task", "", false),
        ],
      },
    ],
  };
}

function computeCounts(state) {
  let total = 0, done = 0;
  for (const s of state.sections) {
    for (const it of s.items) {
      total++;
      if (it.done) done++;
    }
  }
  return { total, done };
}

function updateOverallProgress(state, els) {
  const { total, done } = computeCounts(state);
  const pct = total ? Math.round((done / total) * 100) : 0;
  if (els.dialFill) els.dialFill.style.strokeDashoffset = DIAL_CIRC - (DIAL_CIRC * pct) / 100;
  if (els.dialPct) els.dialPct.textContent = pct + "%";
  if (els.dialFrac) els.dialFrac.textContent = `${done} / ${total}`;
  if (els.trailLineFill) els.trailLineFill.style.height = pct + "%";
}

function updateWaypointProgress(waypointEl, section) {
  if (!waypointEl) return;
  const bar = waypointEl.querySelector(".mini-bar-fill");
  const frac = waypointEl.querySelector(".mini-frac");
  const total = section.items.length;
  const done = section.items.filter((x) => x.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  if (bar) bar.style.width = pct + "%";
  if (frac) frac.textContent = `${done}/${total}`;
  waypointEl.classList.toggle("complete", total > 0 && done === total);
}

function placeCaretEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Renders the full waypoint list. `hooks.persist(state)` is called after any
 * mutation; `hooks.onItemToggle(item, section)` after a checkbox flips (in
 * addition to persist), so the student page can save just its progress map.
 */
function renderWaypoints({ state, waypointsEl, tplWaypoint, tplItem, dialEls, persist, onItemToggle, emptyMessage }) {
  waypointsEl.innerHTML = "";

  if (state.sections.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = emptyMessage || `<h2>The map is blank</h2><p>Nothing here yet.</p>`;
    waypointsEl.appendChild(empty);
  }

  state.sections.forEach((section, idx) => {
    const node = tplWaypoint.content.cloneNode(true);
    const waypointEl = node.querySelector(".waypoint");
    waypointEl.dataset.id = section.id;
    waypointEl.style.animationDelay = idx * 0.05 + "s";

    node.querySelector(".node-index").textContent = idx + 1;

    const titleField = node.querySelector(".waypoint-title");
    titleField.textContent = section.title;
    if (titleField.isContentEditable) {
      titleField.addEventListener("blur", () => {
        section.title = titleField.textContent.trim();
        persist(state);
      });
      titleField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); titleField.blur(); }
      });
    }

    node.querySelector(".del-waypoint")?.addEventListener("click", () => {
      if (section.items.length && !confirm(`Remove "${section.title || "this waypoint"}" and all its items?`)) return;
      state.sections = state.sections.filter((s) => s.id !== section.id);
      persist(state);
      renderWaypoints({ state, waypointsEl, tplWaypoint, tplItem, dialEls, persist, onItemToggle, emptyMessage });
      updateOverallProgress(state, dialEls);
    });

    const list = node.querySelector(".item-list");
    section.items.forEach((it) => list.appendChild(renderItem(section, it, tplItem, { state, waypointsEl, tplWaypoint, tplItem, dialEls, persist, onItemToggle, emptyMessage })));

    node.querySelector(".add-item-btn")?.addEventListener("click", () => {
      const it = makeItem("", "task", "", false);
      section.items.push(it);
      persist(state);
      renderWaypoints({ state, waypointsEl, tplWaypoint, tplItem, dialEls, persist, onItemToggle, emptyMessage });
      requestAnimationFrame(() => {
        const el = waypointsEl.querySelector(`.waypoint[data-id="${section.id}"] .item[data-id="${it.id}"] .item-title`);
        if (el) { el.focus(); placeCaretEnd(el); }
      });
    });

    updateWaypointProgress(waypointEl, section);
    waypointsEl.appendChild(node);
  });

  updateOverallProgress(state, dialEls);
}

function renderItem(section, it, tplItem, ctx) {
  const node = tplItem.content.cloneNode(true);
  const li = node.querySelector(".item");
  li.dataset.id = it.id;
  if (it.done) li.classList.add("done");

  const checkbox = node.querySelector(".item-checkbox");
  checkbox.checked = it.done;
  checkbox.addEventListener("change", () => {
    it.done = checkbox.checked;
    li.classList.toggle("done", it.done);
    ctx.persist(ctx.state);
    if (ctx.onItemToggle) ctx.onItemToggle(it, section);
    const waypointEl = li.closest(".waypoint");
    updateWaypointProgress(waypointEl, section);
    updateOverallProgress(ctx.state, ctx.dialEls);
  });

  const tag = node.querySelector(".item-type-tag");
  tag.textContent = it.type === "course" ? "course" : "task";
  tag.classList.toggle("course", it.type === "course");

  const titleField = node.querySelector(".item-title");
  titleField.textContent = it.title;
  if (titleField.isContentEditable) {
    titleField.addEventListener("blur", () => {
      it.title = titleField.textContent.trim();
      ctx.persist(ctx.state);
    });
    titleField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); titleField.blur(); }
    });
  }

  const link = node.querySelector(".item-link");
  if (link && it.url) {
    link.href = it.url;
    link.classList.add("has-link");
  }

  node.querySelector(".toggle-type-btn")?.addEventListener("click", () => {
    it.type = it.type === "course" ? "task" : "course";
    ctx.persist(ctx.state);
    tag.textContent = it.type;
    tag.classList.toggle("course", it.type === "course");
  });

  node.querySelector(".edit-link-btn")?.addEventListener("click", () => {
    const next = prompt("Link URL (leave blank to remove):", it.url || "");
    if (next === null) return;
    it.url = next.trim();
    ctx.persist(ctx.state);
    if (it.url) {
      link.href = it.url;
      link.classList.add("has-link");
    } else {
      link.removeAttribute("href");
      link.classList.remove("has-link");
    }
  });

  node.querySelector(".del-item-btn")?.addEventListener("click", () => {
    section.items = section.items.filter((x) => x.id !== it.id);
    ctx.persist(ctx.state);
    renderWaypoints(ctx);
  });

  return node;
}
