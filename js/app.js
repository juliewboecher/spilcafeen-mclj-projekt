"use strict";

// Global variabel til alle spil
let allSpil = [];

// #0: Listen for page load - og start app ved at kalde funktionen initApp
window.addEventListener("load", initApp);

// #1: Initialize the app
function initApp() {
  console.log("initApp: app.js is running 🎉");
  getSpil();
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
