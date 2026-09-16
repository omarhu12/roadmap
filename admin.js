(() => {
  const DRAFT_KEY = "trailhead-admin-draft-v1";

  const titleEl = document.getElementById("roadmap-title");
  const waypointsEl = document.getElementById("waypoints");
  const dialEls = {
    dialFill: document.getElementById("dial-fill"),
    dialPct: document.getElementById("dial-pct"),
    dialFrac: document.getElementById("dial-frac"),
    trailLineFill: document.getElementById("trail-line-fill"),
  };
  const tplWaypoint = document.getElementById("tpl-waypoint");
  const tplItem = document.getElementById("tpl-item");

  let state = null;

  function persist(s) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn("Could not save draft", e);
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
      persist,
      emptyMessage: `<h2>The map is blank</h2><p>Add your first waypoint to begin charting the journey.</p>`,
    });
  }

  async function init() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        state = JSON.parse(draft);
        draw();
        return;
      } catch (e) {
        console.warn("Corrupt draft, ignoring", e);
      }
    }
    state = await loadCommitted();
    persist(state);
    draw();
  }

  async function loadCommitted() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no data.json");
      return await res.json();
    } catch (e) {
      console.warn("Could not fetch data.json (expected if opened via file://) — using starter content.", e);
      return seedData();
    }
  }

  titleEl.addEventListener("blur", () => {
    state.title = titleEl.textContent.trim() || "Untitled Expedition";
    persist(state);
  });
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
  });

  document.getElementById("add-section-btn").addEventListener("click", () => {
    const section = makeSection("");
    state.sections.push(section);
    persist(state);
    draw();
    requestAnimationFrame(() => {
      const el = waypointsEl.querySelector(`.waypoint[data-id="${section.id}"] .waypoint-title`);
      if (el) el.focus();
    });
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.sections)) throw new Error("bad shape");
        state = parsed;
        persist(state);
        draw();
      } catch (err) {
        alert("That file doesn't look like a valid roadmap data.json.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("reload-btn").addEventListener("click", async () => {
    if (!confirm("Discard your unsaved draft and reload the committed data.json?")) return;
    state = await loadCommitted();
    persist(state);
    draw();
  });

  init();
})();
