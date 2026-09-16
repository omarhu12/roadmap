(() => {
  const PROGRESS_KEY = "trailhead-student-progress-v1";

  const titleEl = document.getElementById("roadmap-title");
  const waypointsEl = document.getElementById("waypoints");
  const noteBanner = document.getElementById("note-banner");
  const dialEls = {
    dialFill: document.getElementById("dial-fill"),
    dialPct: document.getElementById("dial-pct"),
    dialFrac: document.getElementById("dial-frac"),
    trailLineFill: document.getElementById("trail-line-fill"),
  };
  const tplWaypoint = document.getElementById("tpl-waypoint");
  const tplItem = document.getElementById("tpl-item");

  let state = null;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress() {
    const map = {};
    for (const s of state.sections) {
      for (const it of s.items) map[it.id] = it.done;
    }
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn("Could not save progress", e);
    }
  }

  // Progress is per-student and lives only in this browser; the fetched
  // content's own "done" values are ignored so the curator can't
  // accidentally mark things complete for everyone.
  function applyLocalProgress() {
    const map = loadProgress();
    for (const s of state.sections) {
      for (const it of s.items) it.done = !!map[it.id];
    }
  }

  function draw() {
    titleEl.textContent = state.title || "Untitled Expedition";
    renderWaypoints({
      state,
      waypointsEl,
      tplWaypoint,
      tplItem,
      dialEls,
      persist: () => {},
      onItemToggle: saveProgress,
      emptyMessage: `<h2>Nothing on the map yet</h2><p>Check back once the roadmap has been published.</p>`,
    });
  }

  async function init() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no data.json");
      state = await res.json();
    } catch (e) {
      console.warn("Could not fetch data.json — showing example content.", e);
      state = seedData();
      if (noteBanner) {
        noteBanner.hidden = false;
        noteBanner.textContent = "Couldn't load data.json (this happens when opening the file directly) — showing example content instead.";
      }
    }
    applyLocalProgress();
    draw();
  }

  document.getElementById("reset-progress-btn").addEventListener("click", () => {
    if (!confirm("Clear all your checkmarks on this roadmap? This can't be undone.")) return;
    try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {}
    applyLocalProgress();
    draw();
  });

  init();
})();
