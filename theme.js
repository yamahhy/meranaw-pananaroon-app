// Main script file for Meranaw Pananaroon // theme.ts
import { Proverb, Theme, themes, ThemeKey } from "../data";
import {
  getAllApprovedProverbs,
  getProverbsByTheme,
  getProverbById,
  contributeProverb,
  searchProverbs,
  populateInitialData,
  sampleProverbs,
  signInUser,
  signOutUser,
  getCurrentUser,
  registerUser,
  getPendingProverbs,
  approveProverb,
  rejectProverb,
} from "./firebase";

// Global state
interface AppState {
  currentTheme: ThemeKey | null;
  currentProverbs: Proverb[];
  loadingProverbs: boolean;
  selectedProverb: Proverb | null;
  searchResults: Proverb[];
  isInitialized: boolean;
  currentUser: any;
  isAdmin: boolean;
}

const state: AppState = {
  currentTheme: null,
  currentProverbs: [],
  loadingProverbs: false,
  selectedProverb: null,
  searchResults: [],
  isInitialized: false,
  currentUser: null,
  isAdmin: false,
};

// DOM Elements
const selectors = {
  // Existing selectors
  menuToggle: document.getElementById("menuToggle") as HTMLButtonElement,
  sidebar: document.getElementById("sidebar") as HTMLDivElement,
  closeSidebar: document.getElementById("closeSidebar") as HTMLButtonElement,
  filterBtn: document.getElementById("filterBtn") as HTMLButtonElement,
  filterDropdown: document.getElementById("filterDropdown") as HTMLDivElement,
  dashboardView: document.getElementById("dashboardView") as HTMLDivElement,
  proverbListView: document.getElementById("proverbListView") as HTMLDivElement,
  backToDashboard: document.getElementById(
    "backToDashboard"
  ) as HTMLButtonElement,
  themeBoxes: document.querySelectorAll(
    ".theme-box"
  ) as NodeListOf<HTMLDivElement>,
  themeTitle: document.getElementById("themeTitle") as HTMLHeadingElement,
  proverbModal: document.getElementById("proverbModal") as HTMLDivElement,
  closeProverbModal: document.getElementById(
    "closeProverbModal"
  ) as HTMLButtonElement,
  proverbId: document.getElementById("proverbId") as HTMLSpanElement,
  proverbText: document.getElementById("proverbText") as HTMLParagraphElement,
  literalMeaning: document.getElementById(
    "literalMeaning"
  ) as HTMLParagraphElement,
  englishTranslation: document.getElementById(
    "englishTranslation"
  ) as HTMLParagraphElement,
  interpretBtn: document.getElementById("interpretBtn") as HTMLButtonElement,
  interpretationContainer: document.getElementById(
    "interpretationContainer"
  ) as HTMLDivElement,
  interpretationText: document.getElementById(
    "interpretationText"
  ) as HTMLParagraphElement,
  contributeBtn: document.getElementById("contributeBtn") as HTMLButtonElement,
  contributeModal: document.getElementById("contributeModal") as HTMLDivElement,
  closeContributeModal: document.getElementById(
    "closeContributeModal"
  ) as HTMLButtonElement,
  contributeForm: document.getElementById("contributeForm") as HTMLFormElement,
  notification: document.getElementById("notification") as HTMLDivElement,
  searchInput: document.querySelector('input[type="text"]') as HTMLInputElement,
  searchButton: document.querySelector(
    'input[type="text"] + button'
  ) as HTMLButtonElement,
  proverbListContainer: document.querySelector(
    "#proverbListView .space-y-4"
  ) as HTMLDivElement,

  // New selectors for auth and admin features
  loginBtn: document.getElementById("loginBtn") as HTMLButtonElement,
  loginModal: document.getElementById("loginModal") as HTMLDivElement,
  closeLoginModal: document.getElementById(
    "closeLoginModal"
  ) as HTMLButtonElement,
  loginForm: document.getElementById("loginForm") as HTMLFormElement,
  registerLink: document.getElementById("registerLink") as HTMLAnchorElement,
  registerModal: document.getElementById("registerModal") as HTMLDivElement,
  closeRegisterModal: document.getElementById(
    "closeRegisterModal"
  ) as HTMLButtonElement,
  registerForm: document.getElementById("registerForm") as HTMLFormElement,
  logoutBtn: document.getElementById("logoutBtn") as HTMLButtonElement,
  userDisplayName: document.getElementById(
    "userDisplayName"
  ) as HTMLSpanElement,
  adminSection: document.getElementById("adminSection") as HTMLDivElement,
  pendingSubmissionsBtn: document.getElementById(
    "pendingSubmissionsBtn"
  ) as HTMLButtonElement,
  adminView: document.getElementById("adminView") as HTMLDivElement,
  pendingProverbsContainer: document.getElementById(
    "pendingProverbsContainer"
  ) as HTMLDivElement,
  featuredProverbsContainer: document.getElementById(
    "featuredProverbsContainer"
  ) as HTMLDivElement,
};

// Event listeners
function setupEventListeners() {
  // All existing event listeners
  // Toggle sidebar
  selectors.menuToggle.addEventListener("click", () => {
    selectors.sidebar.classList.toggle("translate-x-full");
    selectors.sidebar.classList.toggle("translate-x-0");
  });

  selectors.closeSidebar.addEventListener("click", () => {
    selectors.sidebar.classList.add("translate-x-full");
    selectors.sidebar.classList.remove("translate-x-0");
  });

  // Toggle filter dropdown
  selectors.filterBtn.addEventListener("click", () => {
    selectors.filterDropdown.classList.toggle("hidden");
  });

  // Close filter dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (
      !selectors.filterBtn.contains(target) &&
      !selectors.filterDropdown.contains(target)
    ) {
      selectors.filterDropdown.classList.add("hidden");
    }
  });

  // Theme box click - show proverb list
  selectors.themeBoxes.forEach((box) => {
    box.addEventListener("click", async function () {
      const theme = this.getAttribute("data-theme") as ThemeKey;
      if (!theme) return;

      state.currentTheme = theme;
      selectors.themeTitle.textContent = themes[theme].title;

      // Show loading state
      state.loadingProverbs = true;
      selectors.proverbListContainer.innerHTML = `
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      `;

      selectors.dashboardView.classList.add("hidden");
      selectors.proverbListView.classList.remove("hidden");

      try {
        // Fetch proverbs for this theme
        const proverbs = await getProverbsByTheme(theme);
        state.currentProverbs = proverbs;
        renderProverbList(proverbs);
      } catch (error) {
        console.error("Error fetching proverbs:", error);
        selectors.proverbListContainer.innerHTML = `
          <div class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
            Error loading proverbs. Please try again later.
          </div>
        `;
      } finally {
        state.loadingProverbs = false;
      }
    });
  });

  // Back to dashboard
  selectors.backToDashboard.addEventListener("click", () => {
    selectors.proverbListView.classList.add("hidden");
    selectors.dashboardView.classList.remove("hidden");
    state.currentTheme = null;
  });

  // Close proverb modal
  selectors.closeProverbModal.addEventListener("click", () => {
    selectors.proverbModal.classList.add("hidden");
    // Reset interpretation container
    selectors.interpretationContainer.classList.add("hidden");
    state.selectedProverb = null;
  });

  // Interpret button click
  selectors.interpretBtn.addEventListener("click", () => {
    if (state.selectedProverb?.interpretation) {
      selectors.interpretationText.textContent =
        state.selectedProverb.interpretation;
      selectors.interpretationContainer.classList.remove("hidden");
    } else {
      // Display a message if there's no interpretation
      selectors.interpretationText.textContent =
        "No interpretation available for this proverb yet. You can contribute one through the 'Contribute' feature.";
      selectors.interpretationContainer.classList.remove("hidden");
    }
  });

  // Contribute button click
  selectors.contributeBtn.addEventListener("click", () => {
    selectors.contributeModal.classList.remove("hidden");
    selectors.sidebar.classList.add("translate-x-full");
    selectors.sidebar.classList.remove("translate-x-0");
  });

  // Close contribute modal
  selectors.closeContributeModal.addEventListener("click", () => {
    selectors.contributeModal.classList.add("hidden");
  });

  // Contribute form submission
  selectors.contributeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(selectors.contributeForm);
    const proverb: Omit<Proverb, "id" | "status" | "dateAdded"> = {
      text: formData.get("proverb") as string,
      literalMeaning: formData.get("literalMeaning") as string,
      englishTranslation: formData.get("englishTranslation") as string,
      theme: formData.get("theme") as ThemeKey,
      source: formData.get("source") as string,
    };

    try {
      await contributeProverb(proverb);
      // Reset form
      selectors.contributeForm.reset();
      selectors.contributeModal.classList.add("hidden");
      selectors.notification.classList.remove("hidden");

      // Hide notification after 5 seconds
      setTimeout(() => {
        selectors.notification.classList.add("hidden");
      }, 5000);
    } catch (error) {
      console.error("Error submitting contribution:", error);
      alert(
        "There was an error submitting your contribution. Please try again."
      );
    }
  });

  // Search functionality
  selectors.searchButton.addEventListener("click", handleSearch);
  selectors.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === selectors.proverbModal) {
      selectors.proverbModal.classList.add("hidden");
      selectors.interpretationContainer.classList.add("hidden");
      state.selectedProverb = null;
    }
    if (e.target === selectors.contributeModal) {
      selectors.contributeModal.classList.add("hidden");
    }
  });

  // New event listeners for auth and admin features
  if (selectors.loginBtn) {
    selectors.loginBtn.addEventListener("click", () => {
      selectors.loginModal.classList.remove("hidden");
    });
  }

  if (selectors.closeLoginModal) {
    selectors.closeLoginModal.addEventListener("click", () => {
      selectors.loginModal.classList.add("hidden");
    });
  }

  if (selectors.loginForm) {
    selectors.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(selectors.loginForm);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const user = await signInUser(email, password);
        state.currentUser = user;

        // Check if user is admin (this would be determined by your user roles in Firestore)
        checkAdminStatus(user);

        updateAuthUI();
        selectors.loginModal.classList.add("hidden");
        selectors.loginForm.reset();

        // Show welcome notification
        showNotification(`Welcome back, ${user.displayName || user.email}`);
      } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check your credentials and try again.");
      }
    });
  }

  if (selectors.registerLink) {
    selectors.registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      selectors.loginModal.classList.add("hidden");
      selectors.registerModal.classList.remove("hidden");
    });
  }

  if (selectors.closeRegisterModal) {
    selectors.closeRegisterModal.addEventListener("click", () => {
      selectors.registerModal.classList.add("hidden");
    });
  }

  if (selectors.registerForm) {
    selectors.registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(selectors.registerForm);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const user = await registerUser(email, password);
        state.currentUser = user;

        updateAuthUI();
        selectors.registerModal.classList.add("hidden");
        selectors.registerForm.reset();

        showNotification(
          "Registration successful! Welcome to Meranaw Pananaroon."
        );
      } catch (error) {
        console.error("Registration error:", error);
        alert("Registration failed. Please try again.");
      }
    });
  }

  if (selectors.logoutBtn) {
    selectors.logoutBtn.addEventListener("click", async () => {
      try {
        await signOutUser();
        state.currentUser = null;
        state.isAdmin = false;

        updateAuthUI();

        // If on admin page, redirect to dashboard
        if (!selectors.adminView.classList.contains("hidden")) {
          selectors.adminView.classList.add("hidden");
          selectors.dashboardView.classList.remove("hidden");
        }

        showNotification("You have successfully logged out.");
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  }

  if (selectors.pendingSubmissionsBtn) {
    selectors.pendingSubmissionsBtn.addEventListener("click", async () => {
      if (!state.isAdmin) return;

      try {
        // Hide other views
        selectors.dashboardView.classList.add("hidden");
        selectors.proverbListView.classList.add("hidden");
        selectors.adminView.classList.remove("hidden");

        // Show loading state
        selectors.pendingProverbsContainer.innerHTML = `
          <div class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        `;

        // Fetch pending proverbs
        const pendingProverbs = await getPendingProverbs();

        // Render pending proverbs
        renderPendingProverbs(pendingProverbs);
      } catch (error) {
        console.error("Error fetching pending proverbs:", error);
        selectors.pendingProverbsContainer.innerHTML = `
          <div class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
            Error loading pending submissions. Please try again later.
          </div>
        `;
      }
    });
  }
}

// Handle search
async function handleSearch() {
  const searchTerm = selectors.searchInput.value.trim();
  if (!searchTerm) return;

  try {
    // Show loading state
    selectors.dashboardView.classList.add("hidden");
    selectors.proverbListView.classList.remove("hidden");
    selectors.themeTitle.textContent = `Search Results for "${searchTerm}"`;
    selectors.proverbListContainer.innerHTML = `
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    `;

    const results = await searchProverbs(searchTerm);
    state.searchResults = results;

    if (results.length > 0) {
      renderProverbList(results);
    } else {
      selectors.proverbListContainer.innerHTML = `
        <div class="p-6 border border-gray-200 rounded text-center">
          <p class="text-gray-600 mb-2">No results found for "${searchTerm}"</p>
          <p class="text-sm text-gray-500">Try using different keywords or browse proverbs by theme.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error searching proverbs:", error);
    selectors.proverbListContainer.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
        Error searching proverbs. Please try again later.
      </div>
    `;
  }
}

// Render proverb list
function renderProverbList(proverbs: Proverb[]) {
  selectors.proverbListContainer.innerHTML = "";

  if (proverbs.length === 0) {
    selectors.proverbListContainer.innerHTML = `
      <div class="p-6 border border-gray-200 rounded text-center">
        <p class="text-gray-600">No proverbs available for this theme yet.</p>
      </div>
    `;
    return;
  }

  proverbs.forEach((proverb) => {
    const proverbElement = document.createElement("div");
    proverbElement.className =
      "proverb-item p-4 border border-gray-200 rounded cursor-pointer";
    proverbElement.dataset.id = proverb.id;

    proverbElement.innerHTML = `
      <div class="flex justify-between">
        <h3 class="text-lg font-medium text-primary">${proverb.text}</h3>
        <span class="text-xs text-gray-500">${proverb.id}</span>
      </div>
      <p class="text-gray-600 italic">${proverb.englishTranslation}</p>
    `;

    proverbElement.addEventListener("click", () => showProverbDetail(proverb));
    selectors.proverbListContainer.appendChild(proverbElement);
  });
}

// Show proverb detail
function showProverbDetail(proverb: Proverb) {
  state.selectedProverb = proverb;

  selectors.proverbId.textContent = proverb.id;
  selectors.proverbText.textContent = proverb.text;
  selectors.literalMeaning.textContent = proverb.literalMeaning;
  selectors.englishTranslation.textContent = proverb.englishTranslation;

  // Reset interpretation container
  selectors.interpretationContainer.classList.add("hidden");

  selectors.proverbModal.classList.remove("hidden");
}

// New functions for authentication and admin features
async function checkAuthState() {
  try {
    const user = await getCurrentUser();
    state.currentUser = user;

    if (user) {
      // Check if the user is an admin
      await checkAdminStatus(user);
    }

    updateAuthUI();
  } catch (error) {
    console.error("Error checking auth state:", error);
  }
}

async function checkAdminStatus(user: any) {
  // In a real app, you would check a Firestore collection to see if this user has admin role
  // For demo, we'll just check if the email matches a specific pattern
  if (user && user.email) {
    // This is just a placeholder - replace with your actual admin checking logic
    state.isAdmin = user.email.includes("admin");

    // Show/hide admin UI elements
    if (selectors.adminSection) {
      selectors.adminSection.classList.toggle("hidden", !state.isAdmin);
    }
  }
}

function updateAuthUI() {
  if (state.currentUser) {
    // User is logged in
    if (selectors.loginBtn) selectors.loginBtn.classList.add("hidden");
    if (selectors.logoutBtn) selectors.logoutBtn.classList.remove("hidden");
    if (selectors.userDisplayName) {
      selectors.userDisplayName.textContent =
        state.currentUser.displayName || state.currentUser.email;
      selectors.userDisplayName.parentElement?.classList.remove("hidden");
    }

    // Show admin section if user is admin
    if (selectors.adminSection) {
      selectors.adminSection.classList.toggle("hidden", !state.isAdmin);
    }
  } else {
    // User is logged out
    if (selectors.loginBtn) selectors.loginBtn.classList.remove("hidden");
    if (selectors.logoutBtn) selectors.logoutBtn.classList.add("hidden");
    if (selectors.userDisplayName && selectors.userDisplayName.parentElement) {
      selectors.userDisplayName.parentElement.classList.add("hidden");
    }

    // Hide admin section
    if (selectors.adminSection) {
      selectors.adminSection.classList.add("hidden");
    }
  }
}

function renderPendingProverbs(proverbs: Proverb[]) {
  selectors.pendingProverbsContainer.innerHTML = "";

  if (proverbs.length === 0) {
    selectors.pendingProverbsContainer.innerHTML = `
      <div class="p-6 border border-gray-200 rounded text-center">
        <p class="text-gray-600">No pending submissions at this time.</p>
      </div>
    `;
    return;
  }

  proverbs.forEach((proverb) => {
    const proverbElement = document.createElement("div");
    proverbElement.className = "p-4 border border-gray-200 rounded mb-4";

    proverbElement.innerHTML = `
      <div class="flex justify-between mb-2">
        <span class="text-xs text-gray-500">ID: ${proverb.id}</span>
        <span class="text-xs text-orange-500 px-2 py-1 bg-orange-50 rounded-full">Pending</span>
      </div>
      <h3 class="text-lg font-medium text-primary mb-1">${proverb.text}</h3>
      <p class="text-gray-700 mb-1"><span class="font-medium">Literal Meaning:</span> ${
        proverb.literalMeaning
      }</p>
      <p class="text-gray-700 mb-1"><span class="font-medium">English Translation:</span> ${
        proverb.englishTranslation
      }</p>
      <p class="text-gray-700 mb-3"><span class="font-medium">Theme:</span> ${
        themes[proverb.theme].title
      }</p>
      
      <div class="flex space-x-2 mt-2">
        <button class="approve-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded" data-id="${
          proverb.id
        }">
          Approve
        </button>
        <button class="reject-btn bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded" data-id="${
          proverb.id
        }">
          Reject
        </button>
      </div>
    `;

    selectors.pendingProverbsContainer.appendChild(proverbElement);

    // Add event listeners to approve/reject buttons
    const approveBtn = proverbElement.querySelector(".approve-btn");
    const rejectBtn = proverbElement.querySelector(".reject-btn");

    approveBtn?.addEventListener("click", async () => {
      try {
        await approveProverb(proverb.id);
        proverbElement.remove();
        showNotification("Proverb approved successfully");

        // Refresh the pending list if it's now empty
        const remainingItems =
          selectors.pendingProverbsContainer.querySelectorAll("[data-id]");
        if (remainingItems.length === 0) {
          renderPendingProverbs([]);
        }
      } catch (error) {
        console.error("Error approving proverb:", error);
        alert("Failed to approve proverb. Please try again.");
      }
    });

    rejectBtn?.addEventListener("click", async () => {
      try {
        await rejectProverb(proverb.id);
        proverbElement.remove();
        showNotification("Proverb rejected");

        // Refresh the pending list if it's now empty
        const remainingItems =
          selectors.pendingProverbsContainer.querySelectorAll("[data-id]");
        if (remainingItems.length === 0) {
          renderPendingProverbs([]);
        }
      } catch (error) {
        console.error("Error rejecting proverb:", error);
        alert("Failed to reject proverb. Please try again.");
      }
    });
  });
}

// Utility function for showing notifications
function showNotification(message: string) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg transform transition-transform duration-300 ease-in-out z-50";
  notification.innerHTML = message;

  document.body.appendChild(notification);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.add("translate-y-full", "opacity-0");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 5000);
}

// Featured proverbs for the dashboard
async function loadFeaturedProverbs() {
  try {
    // In a real app, you'd have a specific endpoint for featured proverbs
    // For now, we'll just get some random ones
    const allProverbs = await getAllApprovedProverbs();
    const featuredProverbs = allProverbs
      .sort(() => 0.5 - Math.random()) // Random shuffle
      .slice(0, 3); // Take first 3

    if (selectors.featuredProverbsContainer) {
      selectors.featuredProverbsContainer.innerHTML = "";

      featuredProverbs.forEach((proverb) => {
        const proverbElement = document.createElement("div");
        proverbElement.className =
          "p-4 border border-gray-200 rounded mb-4 bg-white";

        proverbElement.innerHTML = `
          <h3 class="text-lg font-medium text-primary mb-2">${proverb.text}</h3>
          <p class="text-gray-600 italic mb-3">${proverb.englishTranslation}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">${proverb.id}</span>
            <span class="text-xs px-2 py-1 rounded-full" 
              style="background-color: ${
                themes[proverb.theme].bgColor
              }; color: ${themes[proverb.theme].color}">
              ${themes[proverb.theme].title}
            </span>
          </div>
        `;

        proverbElement.addEventListener("click", () =>
          showProverbDetail(proverb)
        );
        selectors.featuredProverbsContainer.appendChild(proverbElement);
      });
    }
  } catch (error) {
    console.error("Error loading featured proverbs:", error);
    if (selectors.featuredProverbsContainer) {
      selectors.featuredProverbsContainer.innerHTML = `
        <div class="p-4 text-gray-500 text-center">
          Could not load featured proverbs at this time.
        </div>
      `;
    }
  }
}

// Initialize the application
async function initializeApp() {
  // Setup event listeners
  setupEventListeners();

  // Style theme boxes
  selectors.themeBoxes.forEach((box) => {
    const themeKey = box.dataset.theme as ThemeKey;
    if (themes[themeKey]) {
      box.style.borderColor = themes[themeKey].color;
      box.style.color = themes[themeKey].color;
      box.style.backgroundColor = themes[themeKey].bgColor;
    }
  });

  // Initialize Firebase data if needed (for development)
  // Uncomment this section only for initial setup, then comment it out again
  /*
  try {
    if (!state.isInitialized) {
      await populateInitialData(sampleProverbs);
      state.isInitialized = true;
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
  */

  // Check authentication state
  await checkAuthState();

  // Load featured proverbs
  await loadFeaturedProverbs();

  console.log("Meranaw Pananaroon application initialized");
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Handle custom checkboxes styling
document.querySelectorAll(".custom-checkbox").forEach((checkbox) => {
  const input = checkbox.querySelector("input");
  const checkmark = checkbox.querySelector(".checkmark");

  if (!checkmark) {
    const mark = document.createElement("span");
    mark.className = "checkmark";
    checkbox.appendChild(mark);
  }
});
