"use strict";

/*
  Samlet og rettet js:
  - Én bindUI
  - Delegated handler for .clear-filter
  - Debug-logs
*/

let allSpil = [];

// Normaliser tekst til sammenligning/value
function norm(s) {
  return s === undefined || s === null ? "" : String(s).trim().toLowerCase();
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  console.log("initApp: starter");
  bindUI();
  getSpil();
}

function bindUI() {
  const on = (sel, evt, fn) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener(evt, fn);
  };

  on("#search-input", "input", filterSpil);
  on("#genre-select", "change", filterSpil);
  on("#players-select", "change", filterSpil);
  on("#playtime-select", "change", filterSpil);
  on("#location-select", "change", filterSpil);
  on("#difficulty-select", "change", filterSpil);
  on("#age", "change", filterSpil);
  on("#clear-filters", "click", clearAllFilters);

  // Toggle knap til at vise/skjule filtre
  const toggleBtn = document.querySelector("#toggle-filters");
  const panel = document.querySelector("#filters-panel");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("open");
      panel.classList.toggle("collapsed", !isOpen);
      panel.setAttribute("aria-hidden", String(!isOpen));
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.textContent = isOpen ? "Skjul filtre ▴" : "Vis filtre ▾";
      if (isOpen) {
        const first = panel.querySelector("select, input");
        if (first) first.focus();
      }
    });
  }

  // Delegated handler for individual clear buttons (virker selvom knapper indsættes senere)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".clear-filter");
    if (!btn) return;
    const targetSel = btn.dataset.target;
    if (!targetSel) return;
    const target = document.querySelector(targetSel);
    if (!target) return;
    if (target.tagName === "SELECT") {
      target.value = "all";
      target.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (target.tagName === "INPUT") {
      target.value = "";
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
    filterSpil();
  });
}

// Hent data
async function getSpil() {
  try {
    const url = "https://raw.githubusercontent.com/cederdorff/race/master/data/games.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Hentning fejlede: " + res.status);
    allSpil = await res.json();
    console.log("📁 Spil hentet:", allSpil.length);
    if (allSpil.length) console.log("Eksempel:", allSpil[0]);

    // Populate selects baseret på JSON
    populateGenreSelect();
    populatePlayersSelect();
    populatePlaytimeSelect();
    populateLocationSelect();
    populateDifficultySelect();
    populateAgeSelect();

    // Vis alt ved start
    displaySpil(allSpil);
  } catch (err) {
    console.error("Fejl i getSpil:", err);
  }
}

/* ---------- Populate helpers ---------- */

function populateGenreSelect() {
  const sel = document.querySelector("#genre-select");
  if (!sel) return;
  const map = new Map();
  for (const s of allSpil) {
    const raw = s.genre ?? s.genres ?? s.category ?? s.categories;
    if (!raw) continue;
    if (Array.isArray(raw)) {
      for (const item of raw) pushGenreVal(map, item);
    } else pushGenreVal(map, raw);
  }
  const entries = Array.from(map.entries()).sort((a, b) =>
    a[1].localeCompare(b[1], undefined, { sensitivity: "base" })
  );
  sel.innerHTML = `<option value="all">Alle genrer</option>` + entries.map(([k, v]) => `<option value="${escapeHtml(k)}">${escapeHtml(v)}</option>`).join("");
  console.log("🎭 Genres:", entries.map(e => e[1]));
}
function pushGenreVal(map, val) {
  if (val === null || val === undefined) return;
  if (typeof val === "object") val = val.name ?? val.title ?? val.value ?? JSON.stringify(val);
  const label = String(val).trim();
  if (!label) return;
  const key = norm(label);
  if (!map.has(key)) map.set(key, label);
}

function populatePlayersSelect() {
  const sel = document.querySelector("#players-select");
  if (!sel) return;
  const set = new Set();
  for (const s of allSpil) {
    if (s.players) {
      if (typeof s.players === "string" && s.players.includes("-")) {
        const [min] = s.players.split("-").map(n => Number(n));
        if (!isNaN(min)) set.add(String(min));
      } else {
        const n = Number(s.players);
        if (!isNaN(n) && n > 0) set.add(String(n));
      }
    } else {
      const n = Number(s.minPlayers ?? s.min_player ?? 0);
      if (!isNaN(n) && n > 0) set.add(String(n));
    }
  }
  const nums = Array.from(set).map(Number).filter(n => !isNaN(n)).sort((a,b)=>a-b);
  const options = nums.length ? nums.map(String) : ["1","2","3","4"];
  sel.innerHTML = `<option value="all">Antal spillere</option>` + options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("") + `<option value="5+">5+</option>`;
}

function populatePlaytimeSelect() {
  const sel = document.querySelector("#playtime-select");
  if (!sel) return;
  const bins = [
    ["all","Spilletid"],
    ["0-15","<15 min"],
    ["15-30","15-30 min"],
    ["30-60","30-60 min"],
    ["60+","60+ min"]
  ];
  sel.innerHTML = bins.map(b => `<option value="${b[0]}">${b[1]}</option>`).join("");
}

function populateLocationSelect() {
  const sel = document.querySelector("#location-select");
  if (!sel) return;
  const map = new Map();
  for (const s of allSpil) {
    const raw = s.location ?? s.store ?? s.place;
    if (!raw) continue;
    const label = String(raw).trim();
    if (!label) continue;
    const key = norm(label);
    if (!map.has(key)) map.set(key, label);
  }
  sel.innerHTML = `<option value="all">Alle lokationer</option>` + Array.from(map.entries()).sort((a,b)=>a[1].localeCompare(b[1])).map(([k,l])=>`<option value="${escapeHtml(k)}">${escapeHtml(l)}</option>`).join("");
}

function populateDifficultySelect() {
  const sel = document.querySelector("#difficulty-select");
  if (!sel) return;
  const map = new Map();
  for (const s of allSpil) {
    const raw = s.difficulty ?? s.level ?? s.difficulty_level;
    if (!raw) continue;
    const label = String(raw).trim();
    const key = norm(label);
    if (!map.has(key)) map.set(key, label);
  }
  sel.innerHTML = `<option value="all">Sværhedsgrad</option>` + Array.from(map.entries()).sort((a,b)=>a[1].localeCompare(b[1])).map(([k,l])=>`<option value="${escapeHtml(k)}">${escapeHtml(l)}</option>`).join("");
}

function populateAgeSelect() {
  const sel = document.querySelector("#age");
  if (!sel) return;
  const set = new Set();
  for (const s of allSpil) {
    const a = Number(s.min_age ?? s.age ?? 0);
    if (a > 0) set.add(a);
  }
  const sorted = Array.from(set).sort((a,b)=>a-b);
  sel.innerHTML = '<option value="all">Alder</option>' + (sorted.length ? sorted.map(a=>`<option value="${a}">${a}+</option>`).join("") : ['<option value="6">6+</option>','<option value="8">8+</option>','<option value="10">10+</option>'].join(''));
}

/* ---------- Filtrering ---------- */

function matchesRangeOption(value, option) {
  if (option === "all") return true;
  if (option.endsWith("+")) {
    const min = Number(option.replace("+",""));
    return value >= min;
  }
  if (option.includes("-")) {
    const [min, max] = option.split("-").map(n => Number(n));
    return value >= min && value <= max;
  }
  return value === Number(option);
}

function filterSpil() {
  const q = document.querySelector("#search-input")?.value.trim().toLowerCase() || "";
  const genreValue = document.querySelector("#genre-select")?.value || "all";
  const playersValue = document.querySelector("#players-select")?.value || "all";
  const playtimeValue = document.querySelector("#playtime-select")?.value || "all";
  const locationValue = document.querySelector("#location-select")?.value || "all";
  const difficultyValue = document.querySelector("#difficulty-select")?.value || "all";
  const ageValue = document.querySelector("#age")?.value || "all";

  const result = allSpil.filter(s => {
    if (q) {
      const title = (s.title || s.name || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }

    if (genreValue !== "all") {
      const raw = s.genre ?? s.genres ?? s.category ?? s.categories;
      let gList = [];
      if (Array.isArray(raw)) {
        gList = raw.map(g => (typeof g === "object" ? norm(g.name ?? g.title ?? g.value) : norm(g)));
      } else if (typeof raw === "string") gList = [norm(raw)];
      else if (raw && typeof raw === "object") gList = [norm(raw.name ?? raw.title ?? raw.value)];
      if (!gList.includes(genreValue)) return false;
    }

    if (playersValue !== "all") {
      let p = Number(s.players);
      if (isNaN(p)) {
        if (s.minPlayers) p = Number(s.minPlayers);
        else if (typeof s.players === "string" && s.players.includes("-")) p = Number(s.players.split("-")[0]);
        else p = 0;
      }
      if (!matchesRangeOption(p, playersValue)) return false;
    }

    if (playtimeValue !== "all") {
      const t = Number(s.playtime) || Number(s.duration) || 0;
      if (!matchesRangeOption(t, playtimeValue)) return false;
    }

    if (locationValue !== "all") {
      const loc = norm(s.location ?? s.store ?? s.place ?? "");
      if (loc !== locationValue) return false;
    }

    if (difficultyValue !== "all") {
      const diff = norm(s.difficulty ?? s.level ?? "");
      if (diff !== difficultyValue) return false;
    }

    if (ageValue !== "all") {
      const ageNum = Number(s.min_age ?? s.age ?? 0);
      if (isNaN(ageNum) || ageNum < Number(ageValue)) return false;
    }

    return true;
  });

  displaySpil(result);
}

/* ---------- Render / UI ---------- */

function displaySpil(list) {
  const container = document.querySelector("#spil-list");
  if (!container) return;
  container.innerHTML = "";
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="no-results">Ingen spil matchede dine filtre 😢</p>';
    return;
  }
  for (const s of list) renderSpilCard(s, container);
}

function renderSpilCard(spil, container) {
  const image = spil.image || spil.image_url || "";
  const title = spil.title || spil.name || "Untitled";
  const rating = spil.rating ?? "N/A";
  const playtime = spil.playtime ?? spil.duration ?? "-";
  const players = spil.players ?? spil.minPlayers ?? "-";
  const genreLabel = Array.isArray(spil.genre) ? spil.genre.join(", ") : (spil.genre ? String(spil.genre) : "-");
  const desc = spil.description || "";

  const html = `
    <article class="spil-card" tabindex="0">
      <img src="${escapeHtml(image)}" class="spil-poster" alt="Poster ${escapeHtml(title)}">
      <div class="spil-info">
        <h3>${escapeHtml(title)} <span class="spil-rating">(${escapeHtml(rating)})</span></h3>
        <p><strong>Genre:</strong> ${escapeHtml(genreLabel)}</p>
        <p><strong>Spilletid:</strong> ${escapeHtml(playtime)}</p>
        <p><strong>Spillere:</strong> ${escapeHtml(players)}</p>
        <p class="description">${escapeHtml(desc)}</p>
        <button class="details-btn" type="button">Læs mere</button>
      </div>
    </article>
  `;
  container.insertAdjacentHTML("beforeend", html);
  const el = container.lastElementChild;
  if (el) el.addEventListener("click", () => showSpilModal(spil));
}

function showSpilModal(spil) {
  const dialog = document.querySelector("#spil-dialog");
  const content = document.querySelector("#dialog-content");
  if (!dialog || !content) return;
  const imageHtml = spil.image ? `<img src="${escapeHtml(spil.image)}" class="spil-poster">` : "";
  const genreText = Array.isArray(spil.genre) ? spil.genre.join(", ") : (spil.genre ? String(spil.genre) : "-");
  content.innerHTML = `
    ${imageHtml}
    <div class="dialog-details">
      <h2>${escapeHtml(spil.title ?? spil.name ?? "Untitled")}</h2>
      <p><strong>Genre:</strong> ${escapeHtml(genreText)}</p>
      <p>${escapeHtml(spil.description ?? "")}</p>
    </div>
  `;
  const closeBtn = dialog.querySelector("#close-dialog");
  if (closeBtn) {
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    dialog.querySelector("#close-dialog").addEventListener("click", ()=>dialog.close(), { once: true });
  }
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

/* ---------- Utilities ---------- */

function clearAllFilters() {
  const els = ["#search-input","#genre-select","#players-select","#playtime-select","#location-select","#difficulty-select","#age"];
  for (const sel of els) {
    const el = document.querySelector(sel);
    if (!el) continue;
    if (el.tagName === "SELECT") el.value = "all";
    else if (el.type === "text") el.value = "";
  }
  filterSpil(allSpil);
}