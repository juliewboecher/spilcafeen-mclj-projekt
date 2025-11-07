"use strict";

// Global variabel til alle spil
let allSpil = [];

// #0: Listen for page load - og start app ved at kalde funktionen initApp
window.addEventListener("load", initApp);

// #1: Initialize the app
function initApp() {
  console.log("initApp: app.js is running 🎉");
  getSpil();

  // Event listeners for alle filtre
  document.querySelector("#search-input").addEventListener("input", filterSpil);
  document
    .querySelector("#genre-select")
    .addEventListener("change", filterSpil);
  document.querySelector("#sort-select").addEventListener("change", filterSpil);
  document
    .querySelector("#playtime-from")
    .addEventListener("input", filterSpil);
  document.querySelector("#playtime-to").addEventListener("input", filterSpil);
  document.querySelector("#players-from").addEventListener("input", filterSpil);
  document.querySelector("#players-to").addEventListener("input", filterSpil);

  document
    .querySelector("#clear-filters")
    .addEventListener("click", clearAllFilters);
}

console.log("app.js loaded");
window.addEventListener("DOMContentLoaded", () => console.log("DOM ready"));

// Fetch spil fra JSON file
async function getSpil() {
  const response = await fetch(
    "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json"
  );
  allSpil = await response.json(); // Gem data i global variabel
  console.log("📁 Spil loaded:", allSpil.length);
  populateGenreDropdown(); // Udfyld dropdown med genrer fra data
  displaySpil(allSpil); // Vis alle spil ved start
}

// #3: Display all Spil
function displaySpil(Spil) {
  const SpilList = document.querySelector("#spil-list");
  spilList.innerHTML = "";

  if (spil.length === 0) {
    spilList.innerHTML =
      '<p class="no-results">Ingen spil matchede dine filtre 😢</p>';
    return;
  }

  for (const spil of spil) {
    displaySpil(spil);
  }
}

// #5: Udfyld genre-dropdown med alle unikke genrer fra data
function populateGenreDropdown() {
  const genreSelect = document.querySelector("#genre-select");
  const genres = new Set();

  // Samle alle unikke genrer fra alle spil
  for (const spil of allSpil) {
    for (const genre of spil.genre) {
      genres.add(genre);
    }
  }

  // #4: Render a single movie card and add event listeners
  function displaySpil(spil) {
    const spilList = document.querySelector("#spil-list");

    //..SPIL CARD (STANDART FORMAT)..
    const spilHTML = `
    <article class="spil-card">
      <img src="${spil.image}" 
           alt="Poster of ${spil.title}" 
           class="spil-poster" />
      <div class="spil-info">
        <h3>${spil.title} <span class="spil-rating">(${spil.rating})</span></h3>

        <p class="spil-location"><strong>Lokation:</strong>${spil.location}</p>
        <p class="spil-shelf"><strong>Hylde:</strong>⭐ ${spil.shelf}</p>
        <p class="spil-genre"><strong>Genre:</strong> ${spil.genre}</p>
        <p class="spil-playtime"><strong>Spilletid:</strong> ${spil.playtime}</p>
        <p class="spil-players"></p><strong>Antal spillere:</strong> ${spil.players}</p>
        <p class=description><strong>Beskrivelse:</strong></p>
        <p class="description">${spil.description}</p>

        <button class="details-btn">Læs mere</button>
      </div>
    </article>
  `;
    spilList.insertAdjacentHTML("beforeend", movieHTML);

    // Tilføj click event til den nye card
    const newCard = spilList.lastElementChild;
    newCard.addEventListener("click", function () {
      console.log(`🎬 Klik på: "${spil.title}"`);
      showSpilModal(spil);
    });
  }

  // Fjern gamle options undtagen 'Alle genrer'
  genreSelect.innerHTML = '<option value="all">Alle genrer</option>';

  // Sortér genres alfabetisk og tilføj dem som options
  const sortedGenres = Array.from(genres).sort();
  for (const genre of sortedGenres) {
    genreSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${genre}">${genre}</option>`
    );
  }

  console.log("🎭 Genres loaded:", sortedGenres.length, "unique genres");
}

// Filtreringsfunktion — kaldet fra dine event listeners
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
    // søg i titel og beskrivelse
    if (q) {
      const title = (spil.title || spil.name || "").toLowerCase();
      const desc = (spil.description || "").toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }

    // genre-filter (spil.genre forventes at være array)
    if (genre !== "all") {
      if (!Array.isArray(spil.genre) || !spil.genre.includes(genre))
        return false;
    }

    // playtime-filter
    const playtime = Number(spil.playtime) || 0;
    if (playtime < playFrom || playtime > playTo) return false;

    // players-filter
    const players = Number(spil.players) || 0;
    if (players < playersFrom || players > playersTo) return false;

    return true;
  });

  // sortering
  if (sort === "title") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sort === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  displaySpil(filtered);
}

// Viser liste af spil — acceptér array
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
        } <span class="spil-rating">(${spil.rating || "N/A"})</span></h3>
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

// Udfyld genre-dropdown (lukket korrekt)
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
