"use strict";

let allSpil = [];

window.addEventListener("load", initApp);

function initApp() {
  console.log("initApp: app.js is running 🎉");
  getSpil();

  const maybe = (sel, evt, fn) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener(evt, fn);
  };

  maybe("#search-input", "input", filterSpil);
  maybe("#genre-select", "change", filterSpil);
  maybe("#sort-select", "change", filterSpil);
  maybe("#playtime-from", "input", filterSpil);
  maybe("#playtime-to", "input", filterSpil);
  maybe("#players-from", "input", filterSpil);
  maybe("#players-to", "input", filterSpil);
  maybe("#clear-filters", "click", clearAllFilters);
}

console.log("app.js loaded");
window.addEventListener("DOMContentLoaded", () => console.log("DOM ready"));

async function getSpil() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/cederdorff/race/master/data/games.json"
    );
    if (!response.ok) throw new Error("Network response was not ok");
    allSpil = await response.json();
    console.log("📁 Spil loaded:", allSpil.length);
    populateGenreDropdown();
    displaySpil(allSpil);
  } catch (err) {
    console.error("Fejl ved hentning af spil:", err);
  }
}

// Filtreringsfunktion
function filterSpil() {
  const q =
    document.querySelector("#search-input")?.value.trim().toLowerCase() || "";
  const genre = document.querySelector("#genre-select")?.value || "all";
  const sort = document.querySelector("#sort-select")?.value || "none";
  const playFrom = Number(document.querySelector("#playtime-from")?.value || 0);
  const playTo = Number(
    document.querySelector("#playtime-to")?.value || Infinity
  );
  const playersFrom = Number(
    document.querySelector("#players-from")?.value || 0
  );
  const playersTo = Number(
    document.querySelector("#players-to")?.value || Infinity
  );

  let filtered = allSpil.filter((spil) => {
    if (q) {
      const title = (spil.title || spil.name || "").toLowerCase();
      const desc = (spil.description || "").toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }
    if (genre !== "all") {
      if (!Array.isArray(spil.genre) || !spil.genre.includes(genre))
        return false;
    }
    const playtime = Number(spil.playtime) || 0;
    if (playtime < playFrom || playtime > playTo) return false;
    const players = Number(spil.players) || 0;
    if (players < playersFrom || players > playersTo) return false;
    return true;
  });

  if (sort === "title") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sort === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  displaySpil(filtered);
}

// Vis liste af spil (bruges af filterSpil og getSpil)
function displaySpil(spilArray) {
  const spilList = document.querySelector("#spil-list");
  if (!spilList) {
    console.warn("#spil-list ikke fundet i DOM");
    return;
  }
  spilList.innerHTML = "";

  if (!spilArray || spilArray.length === 0) {
    spilList.innerHTML =
      '<p class="no-results">Ingen spil matchede dine filtre 😢</p>';
    return;
  }

  for (const spil of spilArray) {
    renderSpilCard(spil, spilList);
  }
}

// Render et enkelt spil-kort
function renderSpilCard(spil, container) {
  const cardHTML = `
    <article class="spil-card">
      <img src="${spil.image || ""}" alt="Poster of ${
    spil.title || ""
  }" class="spil-poster" />
      <div class="spil-info">
        <h3>${
          spil.title || spil.name || "Untitled"
        } <span class="spil-rating"><strong></strong>(${spil.rating || "N/A"})</span></h3>
        <p class="spil-location"><strong>Lokation:</strong> ${
          spil.location || "-"
        }</p>
        <p class="spil-shelf"><strong>Hylde:</strong> ${spil.shelf || "-"}</p>
        <p class="spil-genre"><strong>Genre:</strong> ${
          Array.isArray(spil.genre) ? spil.genre.join(", ") : spil.genre || "-"
        }</p>
        <p class="spil-playtime"><strong>Spilletid:</strong> ${
          spil.playtime || "-"
        }</p>
        <p class="spil-players"><strong>Antal spillere:</strong> ${
          spil.players || "-"
        }</p>
        <p class="description"><strong>Beskrivelse:</strong></p>
        <p class="description">${spil.description || ""}</p>
        <button class="details-btn">Læs mere</button>
      </div>
    </article>
  `;
  container.insertAdjacentHTML("beforeend", cardHTML);

  const newCard = container.lastElementChild;
  if (newCard) {
    newCard.addEventListener("click", () => {
      console.log(`Klik på: "${spil.title || spil.name || "Untitled"}"`);
      if (typeof showSpilModal === "function") showSpilModal(spil);
    });
  }
}
//GENRE DROPDOWN.....
// Udfyld genre-dropdown (én implementation)

function populateGenreDropdown() {
  const genreSelect = document.querySelector("#genre-select");
  if (!genreSelect) return;
  const genres = new Set();
  for (const spil of allSpil) {
    if (Array.isArray(spil.genre)) {
      for (const g of spil.genre) genres.add(g);
    } else if (spil.genre) {
      genres.add(spil.genre);
    }
  }
  genreSelect.innerHTML = '<option value="all">Alle genrer</option>';
  const sorted = Array.from(genres).sort();
  for (const g of sorted) {
    genreSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${g}">${g}</option>`
    );
  }
  console.log("🎭 Genres loaded:", sorted.length);
}


// Ryd alle filtre
function clearAllFilters() {
  const els = [
    "#search-input",
    "#genre-select",
    "#sort-select",
    "#playtime-from",
    "#playtime-to",
    "#players-from",
    "#players-to",
  ];
  for (const sel of els) {
    const el = document.querySelector(sel);
    if (!el) continue;
    if (el.tagName === "SELECT" || el.type === "text")
      el.value = sel === "#genre-select" ? "all" : "";
    else if (el.type === "number") el.value = "";
  }
  displaySpil(allSpil);
}

// #6: Vis movie i modal dialog
function showSpilModal(spil) {
  console.log("🎭 Åbner modal for:", spil.title);

  // Byg HTML struktur dynamisk
  const dialogContent = document.querySelector("#dialog-content");
  dialogContent.innerHTML = `
    <img src="${spil.image}" alt="Poster af ${spil.title}" class="spil-poster">
    <div class="dialog-details">
      <h2>${spil.title} <span class="spil-rating">(${spil.rating})</span></h2>
      <p class="movie-genre">${spil.genre.join(", ")}</p>
      <p class="spil-rating">⭐ ${spil.rating}</p>
     
      <p class="spil-description">${spil.description}</p>
    </div>
  `;

  // Åbn modalen
  document.querySelector("#spil-dialog").showModal();
}
