const API_BASE = "https://meranaw-pananaroon-app.onrender.com";

// ============================================
// GLOBAL VARIABLES AND DOM ELEMENTS
// ============================================

// Data variables
let allProverbs = [];
let filteredProverbs = [];
let activeFilters = new Set();

// DOM elements
const sidebar = document.getElementById("sidebar");
const proverbModal = document.getElementById("proverbModal");
const interpretationContainer = document.getElementById(
  "interpretationContainer"
);
const contributionModal = document.getElementById("contributionModal");
const contributionForm = document.getElementById("contributeForm");
const notification = document.getElementById("notification");
const notificationMessage = document.querySelector("#notification div p");
const menuToggle = document.getElementById("menuToggle");
const closeSidebarBtn = document.getElementById("closeSidebar");
const closeProverbModalBtn = document.getElementById("closeProverbModal");
const closeContributionBtn = document.getElementById("closeContribution");
const filterBtn = document.getElementById("filterBtn");
const filterDropdown = document.getElementById("filterDropdown");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const dashboardView = document.getElementById("dashboardView");
const proverbListView = document.getElementById("proverbListView");
const backToDashboardBtn = document.getElementById("backToDashboard");
const themeTitle = document.getElementById("themeTitle");
const proverbListContainer = proverbListView?.querySelector(".space-y-4");
const contributeBtn = document.getElementById("contributeBtn");
const interpretBtn = document.getElementById("interpretBtn");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchResultsView = document.getElementById("searchResultsView");
const searchResults = document.getElementById("searchResults");
const noResults = document.getElementById("noResults");
const backFromSearch = document.getElementById("backFromSearch");
const clearSearch = document.getElementById("clearSearch");
const proverbId = document.getElementById("proverbId");

// Theme configuration
const themes = {
  leadership: {
    title: "Leadership",
    class: "leadership-box",
    color: "rgb(111, 25, 38)",
    bgColor: "rgba(111, 25, 38, 0.05)",
  },
  conflict_resolution: {
    title: "Conflict Resolution",
    class: "conflict-resolution-box",
    color: "#9b7f00",
    bgColor: "rgba(229, 193, 33, 0.05)",
  },
  argumentation: {
    title: "Argumentation",
    class: "argumentation-box",
    color: "rgb(148, 32, 49)",
    bgColor: "rgba(148, 32, 49, 0.05)",
  },
  death_sermon: {
    title: "Death Sermon",
    class: "death-sermon-box",
    color: "#9b7f00",
    bgColor: "rgba(229, 193, 33, 0.05)",
  },
  enthronement_genealogy: {
    title: "Enthronement & Genealogy",
    class: "enthronement-genealogy-box",
    color: "rgb(111, 25, 38)",
    bgColor: "rgba(111, 25, 38, 0.05)",
  },
  courtship_marriage: {
    title: "Courtship & Marriage",
    class: "courtship-marriage-box",
    color: "#9b7f00",
    bgColor: "rgba(229, 193, 33, 0.05)",
  },
  moral_teaching: {
    title: "Moral Teaching & Self-Reflection",
    class: "moral-teaching-box",
    color: "rgb(148, 32, 49)",
    bgColor: "rgba(148, 32, 49, 0.05)",
  },
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

async function waitForFirebase() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 50;
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.firebase && window.firebase.firestore) {
        clearInterval(interval);
        resolve();
      }
      if (++attempts > maxAttempts) {
        clearInterval(interval);
        reject("Firebase failed to load in time");
      }
    }, 200);
  });
}

async function initApp() {
  try {
    await waitForFirebase();

    if (!window.firebaseService || !window.firebaseService.getProverbs) {
      console.error("Firebase service not available after wait");
      setTimeout(initApp, 500);
      return;
    }

    window.firebaseService.listenForProverbChanges((updatedProverbs) => {
      allProverbs = updatedProverbs;
      displayDashboard(); // this populates the dashboardView
      showDashboard(); // this makes the dashboard visible!
      console.log("Proverbs updated in real-time!");
    });

    // Initialize filters
    if (activeFilters.size === 0) {
      activeFilters = new Set(Object.keys(themes));
    }

    setupEventListeners();

    // ⬇️ Add this line here to force visibility on page load
    showDashboard();
  } catch (err) {
    console.error("Failed to initialize Firebase-dependent app logic:", err);
    showNotification("Failed to load Firebase. Please refresh.");
    setTimeout(initApp, 1000);
  }
}

// ============================================
// SEARCHBAR VISIBILITY FUNCTIONS
// ============================================

function showSearchbar() {
  const searchContainer =
    document.querySelector(".search-container") ||
    document.querySelector('[class*="search"]') ||
    searchInput?.parentElement;

  if (searchContainer) {
    searchContainer.classList.remove("hidden");
  }

  // Also show individual search elements if they exist
  if (searchInput) searchInput.parentElement?.classList.remove("hidden");
  if (searchButton) searchButton.classList.remove("hidden");
}

function hideSearchbar() {
  const searchContainer =
    document.querySelector(".search-container") ||
    document.querySelector('[class*="search"]') ||
    searchInput?.parentElement;

  if (searchContainer) {
    searchContainer.classList.add("hidden");
  }

  // Also hide individual search elements if they exist
  if (searchInput) searchInput.parentElement?.classList.add("hidden");
  if (searchButton) searchButton.classList.add("hidden");
}

// ============================================
// VIEW MANAGEMENT
// ============================================

function showDashboard() {
  // Hide all views first
  hideAllViews();

  // Show dashboard and all its sections
  const dashboardSections = [
    "heroSection",
    "categoryTitle",
    "dashboardView",
    "featuredProverbs",
    "ethicalSummarySection",
    "communityContribution",
    "footerSection",
  ];

  dashboardSections.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove("hidden");
    }
  });

  // Update title
  if (themeTitle) {
    themeTitle.textContent = "Meranaw Proverbs";
  }

  // Clear search
  if (searchInput) {
    searchInput.value = "";
  }

  // Show searchbar on dashboard
  showSearchbar();

  // Generate theme boxes
  displayDashboard();
}

function showProverbListView(title = "Proverbs") {
  // Hide all views first
  hideAllViews();

  // Show only proverb list view
  if (proverbListView) {
    proverbListView.classList.remove("hidden");
  }

  // Update title
  if (themeTitle) {
    themeTitle.textContent = title;
  }

  // Hide searchbar when viewing proverb list
  hideSearchbar();
}

function showSearchView() {
  // Hide all views first
  hideAllViews();

  // Show search view
  if (searchResultsView) {
    searchResultsView.classList.remove("hidden");
  }

  // Show searchbar in search view
  showSearchbar();
}

function showSection(sectionName) {
  // Handle special case for contribution button
  if (sectionName === "contributeBtn") {
    showContributionModal();
    return;
  }

  // Hide all views first
  hideAllViews();

  // Show specific section
  const section = document.getElementById(sectionName);
  if (section) {
    section.classList.remove("hidden");
  }

  // Update nav highlighting
  updateNavHighlight(sectionName);

  // Close sidebar
  closeSidebar();

  // Hide searchbar when viewing sidebar sections
  hideSearchbar();
}

function hideAllViews() {
  const allSections = [
    "heroSection",
    "categoryTitle",
    "dashboardView",
    "featuredProverbs",
    "ethicalSummarySection",
    "communityContribution",
    "footerSection",
    "proverbListView",
    "searchResultsView",
    "about",
    "ethicalprinciples",
    "sourcesection",
    "engageSection",
  ];

  allSections.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add("hidden");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavHighlight(activeSection) {
  // Reset all nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("text-primary", "font-medium");
    link.classList.add("text-gray-700");
  });

  // Highlight active link
  let activeLinkId = "";
  switch (activeSection) {
    case "about":
      activeLinkId = "aboutLink";
      break;
    case "dashboardView":
      activeLinkId = "homeLink";
      break;
    case "ethicalprinciples":
      activeLinkId = "ethicsLink";
      break;
    case "sourcesection":
      activeLinkId = "sourcesLink";
      break;
    default:
      activeLinkId = "homeLink";
      break;
  }

  const activeLink = document.getElementById(activeLinkId);
  if (activeLink) {
    activeLink.classList.remove("text-gray-700");
    activeLink.classList.add("text-primary", "font-medium");
  }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
  // Navigation
  const homeLink = document.getElementById("homeLink");
  const aboutLink = document.getElementById("aboutLink");
  const ethicsLink = document.getElementById("ethicsLink");
  const sourcesLink = document.getElementById("sourcesLink");

  if (homeLink) {
    homeLink.addEventListener("click", function (event) {
      event.preventDefault();
      showDashboard();
    });
  }

  if (aboutLink) {
    aboutLink.addEventListener("click", function (event) {
      event.preventDefault();
      showSection("about");
    });
  }

  if (ethicsLink) {
    ethicsLink.addEventListener("click", function (event) {
      event.preventDefault();
      showSection("ethicalprinciples");
    });
  }

  if (sourcesLink) {
    sourcesLink.addEventListener("click", function (event) {
      event.preventDefault();
      showSection("sourcesection");
    });
  }

  // Sidebar controls
  if (menuToggle) menuToggle.addEventListener("click", toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);

  // Modal controls
  if (closeProverbModalBtn)
    closeProverbModalBtn.addEventListener("click", closeProverbModal);
  if (closeContributionBtn)
    closeContributionBtn.addEventListener("click", closeContribution);

  // Filter controls
  if (filterBtn) filterBtn.addEventListener("click", toggleFilterDropdown);
  if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", applyFilters);

  // Back to dashboard controls
  if (backToDashboardBtn)
    backToDashboardBtn.addEventListener("click", showDashboard);
  if (backFromSearch) backFromSearch.addEventListener("click", showDashboard);

  // Contribution
  if (contributeBtn) {
    contributeBtn.addEventListener("click", function () {
      showContributionModal();
    });
  }

  if (contributionForm) {
    contributionForm.addEventListener("submit", handleContributionSubmit);
  }

  // Search
  if (searchButton) searchButton.addEventListener("click", performSearch);
  if (clearSearch) clearSearch.addEventListener("click", showDashboard);

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") performSearch();
    });
  }

  // Interpretation
  if (interpretBtn)
    interpretBtn.addEventListener("click", generateInterpretation);

  // Theme box clicks (delegated)
  if (dashboardView) {
    dashboardView.addEventListener("click", async function (event) {
      const themeBox = event.target.closest(".theme-box");
      if (themeBox) {
        const theme = themeBox.dataset.theme;
        if (theme) {
          try {
            showNotification(`Loading proverbs for ${themes[theme].title}...`);
            const proverbs = await window.firebaseService.getProverbsByTheme(
              theme
            );
            allProverbs = proverbs;
            displayProverbs(proverbs, themes[theme].title);
            showProverbListView(themes[theme].title);
            showNotification(
              `Displaying ${proverbs.length} proverbs for ${themes[theme].title}.`
            );
          } catch (error) {
            console.error("Error fetching themed proverbs:", error);
            showNotification("Failed to load themed proverbs.");
          }
        }
      }
    });
  }
}

// Make showSection globally available for onclick handlers
window.showSection = showSection;

// ============================================
// SIDEBAR FUNCTIONS
// ============================================

function toggleSidebar() {
  if (sidebar) {
    sidebar.classList.toggle("translate-x-full");
    sidebar.classList.toggle("translate-x-0");
    sidebar.classList.toggle("open");
  }
}

function closeSidebar() {
  if (sidebar) {
    sidebar.classList.add("translate-x-full");
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.remove("open");
  }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function closeProverbModal() {
  if (proverbModal) {
    proverbModal.classList.add("hidden");
    proverbModal.style.display = "none";
  }
  if (interpretationContainer) {
    interpretationContainer.classList.add("hidden");
  }
  const interpretationTextElement =
    document.getElementById("interpretationText");
  if (interpretationTextElement) {
    interpretationTextElement.textContent = "";
  }
}

function showContributionModal() {
  if (contributionModal) {
    contributionModal.classList.remove("hidden");
    closeSidebar();
  }
}

function closeContribution() {
  if (contributionModal) {
    contributionModal.classList.add("hidden");
  }
  if (contributionForm) {
    contributionForm.reset();
  }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function displayDashboard() {
  if (!dashboardView) return;

  dashboardView.innerHTML = "";

  Object.keys(themes).forEach((key) => {
    const theme = themes[key];
    const box = document.createElement("div");
    box.className = `theme-box ${theme.class} rounded p-6 flex items-center justify-center cursor-pointer`;
    box.dataset.theme = key;
    box.innerHTML = `<h2 class="text-xl font-semibold">${theme.title}</h2>`;
    dashboardView.appendChild(box);
  });
}

function displayProverbs(proverbs, title) {
  if (!proverbListContainer) return;

  proverbListContainer.innerHTML = "";

  if (proverbs.length === 0) {
    proverbListContainer.innerHTML =
      '<p class="text-gray-500 text-center">No proverbs found.</p>';
    return;
  }

  proverbs.forEach((proverb) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded-lg shadow-md p-6 cursor-pointer";
    div.innerHTML = `
      <h3 class="text-lg font-semibold text-primary mb-2">${proverb.meranaw}</h3>
      <p class="text-gray-700 italic">${proverb.literal_meaning}</p>
    `;
    div.addEventListener("click", () => {
      showProverbDetails(proverb.id);
    });
    proverbListContainer.appendChild(div);
  });
}

function showProverbDetails(proverbId) {
  console.log("Clicked proverb ID:", proverbId);

  const proverb = allProverbs.find((p) => p.id === proverbId);

  if (!proverb) {
    console.warn("Proverb not found for ID:", proverbId);
    return;
  }

  // Populate modal
  const elements = {
    proverbId: document.getElementById("proverbId"),
    proverbText: document.getElementById("proverbText"),
    literalMeaning: document.getElementById("literalMeaning"),
    englishTranslation: document.getElementById("englishTranslation"),
  };

  if (elements.proverbId) elements.proverbId.textContent = proverb.id;
  if (elements.proverbText) elements.proverbText.textContent = proverb.meranaw;
  if (elements.literalMeaning)
    elements.literalMeaning.textContent = proverb.literal_meaning;
  if (elements.englishTranslation)
    elements.englishTranslation.textContent = proverb.english_translation;

  // Hide and clear interpretation
  if (interpretationContainer) interpretationContainer.classList.add("hidden");
  const interpretationText = document.getElementById("interpretationText");
  if (interpretationText) interpretationText.textContent = "";

  // Show modal
  if (proverbModal) {
    proverbModal.classList.remove("hidden");
    proverbModal.style.display = "block";
  }
}

// ============================================
// FILTER FUNCTIONS
// ============================================

function toggleFilterDropdown() {
  if (filterDropdown) {
    filterDropdown.classList.toggle("hidden");
  }
}

function applyFilters() {
  const checkboxes = document.querySelectorAll(
    '#filterDropdown input[type="checkbox"]:checked'
  );
  activeFilters.clear();
  checkboxes.forEach((cb) => activeFilters.add(cb.value));

  console.log("Active Filters:", Array.from(activeFilters));

  const currentlyFiltered = allProverbs.filter((proverb) =>
    activeFilters.has(proverb.theme)
  );
  displayProverbs(currentlyFiltered, "Filtered Results");
  showProverbListView("Filtered Results");
  toggleFilterDropdown();
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

function highlightText(text, query) {
  if (!query) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  showSearchView();

  try {
    const response = await fetch(
      `${API_BASE}/api/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) throw new Error("Search request failed.");

    const jsonData = await response.json();
    const proverbs = jsonData.data || jsonData;

    if (proverbs.length > 0) {
      searchResults.innerHTML = proverbs
        .map(
          (proverb) => `
        <div class="proverb-item p-4 border border-gray-200 rounded cursor-pointer" data-id="${
          proverb.id
        }">
          <div class="flex justify-between">
            <h3 class="text-lg font-medium text-primary">${highlightText(
              proverb.meranaw || proverb.meranaw_proverb || "",
              query
            )}</h3>
            <span class="text-xs text-gray-500">${
              proverb.search_type || ""
            }</span>
          </div>
          <p class="text-gray-600 italic">
            <strong>English Translation:</strong> ${highlightText(
              proverb.english_translation || "",
              query
            )}
          </p>
          <p class="text-sm text-blue-600 mt-1">Theme: ${highlightText(
            proverb.Theme || "",
            query
          )}</p>
        </div>
      `
        )
        .join("");

      // Add click handlers
      searchResults.querySelectorAll(".proverb-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-id");
          const proverb = proverbs.find((p) => p.id === id);
          if (proverb) {
            showProverbDetails(id);
          }
        });
      });

      searchResults.classList.remove("hidden");
      noResults.classList.add("hidden");
    } else {
      searchResults.classList.add("hidden");
      noResults.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error fetching search results:", error);
    searchResults.innerHTML =
      '<p class="text-red-500">Something went wrong. Please try again.</p>';
  }
}

// ============================================
// CONTRIBUTION FUNCTIONS
// ============================================

async function handleContributionSubmit(event) {
  event.preventDefault();
  const formData = new FormData(contributionForm);
  const newProverb = {
    meranaw: formData.get("proverb"),
    literal_translation: formData.get("literal_meaning"),
    english_translation: formData.get("english_translation"),
    theme: formData.get("theme"),
  };

  try {
    const success = await window.firebaseService.addContribution(newProverb);
    if (success) {
      showNotification("Contribution added successfully!");
      contributionForm.reset();
      closeContribution();
      allProverbs = await window.firebaseService.getProverbs();
      displayDashboard();
    } else {
      showNotification("Failed to add contribution.");
    }
  } catch (error) {
    console.error("Error submitting contribution:", error);
    showNotification("Error submitting contribution.");
  }
}

// ============================================
// INTERPRETATION FUNCTIONS
// ============================================

async function generateInterpretation() {
  const elements = {
    proverbText: document.getElementById("proverbText"),
    literalMeaning: document.getElementById("literalMeaning"),
    englishTranslation: document.getElementById("englishTranslation"),
    interpretationOutput: document.getElementById("interpretationText"),
    container: document.getElementById("interpretationContainer"),
  };

  // Validate elements
  if (
    !elements.proverbText ||
    !elements.literalMeaning ||
    !elements.englishTranslation ||
    !elements.interpretationOutput ||
    !elements.container
  ) {
    console.error(
      "One or more required elements for interpretation are missing in the DOM."
    );
    showNotification("Error: Necessary proverb details elements not found.");
    return;
  }

  const proverbText = elements.proverbText.textContent.trim();
  const literalMeaning = elements.literalMeaning.textContent.trim();
  const englishTranslation = elements.englishTranslation.textContent.trim();

  elements.interpretationOutput.textContent = "Generating interpretation...";
  elements.container.classList.remove("hidden");

  try {
    const response = await fetch(
      "${API_BASE}/api/meranaw-interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [proverbText, englishTranslation, literalMeaning],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    const generatedInterpretation =
      result.data?.[0] || "Failed to generate interpretation.";

    elements.interpretationOutput.textContent = generatedInterpretation;
  } catch (error) {
    console.error("Error generating interpretation:", error);
    elements.interpretationOutput.textContent =
      "An error occurred. Please try again.";
  }
}

// ============================================
// AUDIO FUNCTIONS
// ============================================

async function playAudio(text, lang) {
  const playButton = document.getElementById("playButton");
  if (playButton) {
    playButton.disabled = true;
    playButton.textContent = "Loading...";
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/speak_proverb?text=${encodeURIComponent(
        text
      )}&lang=${lang}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error playing audio: ${errorData.detail || response.statusText}`);
      return;
    }

    const data = await response.json();
    const base64Audio = data.audio_data_base64;
    const audioFormat = data.format || "audio/flac";

    if (!base64Audio) {
      alert("No audio data received.");
      return;
    }

    // Convert base64 to binary
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: audioFormat });

    // Play audio
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error("Failed to fetch or play audio:", error);
    alert("Could not play audio. Please try again.");
  } finally {
    if (playButton) {
      playButton.disabled = false;
      playButton.textContent = "🔊 Play Proverb";
    }
  }
}

function speakProverb() {
  const text = document.getElementById("proverbText").textContent.trim();
  const lang = "mrw";

  if (!text) {
    alert("No proverb found to speak.");
    return;
  }

  playAudio(text, lang);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message) {
  if (notification && notificationMessage) {
    notificationMessage.textContent = message;
    notification.classList.remove("hidden");
    notification.classList.remove("slideOut");
    notification.classList.add("notification");

    setTimeout(() => {
      notification.classList.add("slideOut");
      notification.classList.remove("notification");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 300);
    }, 5000);
  }
}
