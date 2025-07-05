window.firebaseService = {
  getProverbs: async function () {
    try {
      const db = window.firebase.firestore();
      const proverbsCollection = await db.collection("meranaw_proverb").get();

      if (proverbsCollection.empty) {
        console.log("No proverbs found");
        return [];
      }
      return proverbsCollection.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          meranaw: data.meranaw_proverb || "", // Changed from 'text' to 'meranaw'
          literal_meaning: data.literal_translation_meranaw || "", // Changed from 'literalMeaning' to 'literal_meaning'
          english_translation: data.english_translation || "",
          interpretation: data.interpretation || "", // Changed from 'translation' to 'english_translation'
          theme: data.theme || "general",
        };
      });
    } catch (error) {
      console.error("Error getting proverbs:", error);
      throw error;
    }
  },

  // Add a real-time listener function
  listenForProverbChanges: function (callback) {
    const db = window.firebase.firestore();
    return db.collection("meranaw_proverbs").onSnapshot(
      (snapshot) => {
        const proverbs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(proverbs); // Call the provided callback with updated data
      },
      (error) => {
        console.error("Error listening for proverb changes:", error);
      }
    );
  },

  // Get proverbs filtered by theme
  getProverbsByTheme: async function (themeKey) {
    try {
      const db = window.firebase.firestore();

      // Updated theme mapping to match actual database values
      const themeMapping = {
        leadership: "Leadership",
        conflict_resolution: "Conflict Resolution",
        argumentation: "Argumentation",
        death_sermon: "Death Sermon",
        courtship_marriage: "Courtship/Marriage",
        moral_teaching: "Moral Teaching and Self\n-Reflection",
        enthronement_genealogy: "Enthronement/Genealogy",
      };

      const themeName = themeMapping[themeKey] || themeKey;
      console.log(`Searching for proverbs with theme: ${themeName}`);

      // Fetch all proverbs and filter manually with improved filtering
      const allProverbsSnapshot = await db.collection("meranaw_proverb").get();
      const matchingDocs = allProverbsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        if (!data.theme) return false;
        // Check if theme contains the search term (either exactly or as part of compound theme)
        return (
          data.theme === themeName ||
          data.theme.includes(themeName) ||
          (themeName === "Moral Teaching and Self -Reflection" &&
            data.theme.startsWith("Moral Teaching and Self\n-Reflection")) ||
          (themeName === "Enthronement/Genealogy" &&
            data.theme.startsWith("Enthronement/Genealogy"))
        );
      });

      return matchingDocs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          meranaw: data.meranaw_proverb || "", // Changed from 'text' to 'meranaw'
          literal_meaning: data.literal_translation_meranaw || "", // Changed from 'literalMeaning' to 'literal_meaning'
          english_translation: data.english_translation || "",
          interpretation: data.interpretation || "", // Changed from 'translation' to 'english_translation'
          theme: data.theme || "general",
        };
      });
    } catch (error) {
      console.error(`Error getting proverbs by theme (${themeKey}):`, error);
      throw error;
    }
  },

  searchProverbsFromAPI: async function (query) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Search API failed");
      }
      const result = await response.json();

      return result.data.map((item) => ({
        id: item.id || null,
        meranaw: item.meranaw_proverb || "",
        literal_meaning: "", // not available from API
        english_translation: item.english_translation || "",
        interpretation: item.augmented_interpretation || "",
        theme: item.Theme || "general",
        search_type: item.search_type,
        search_score: item.search_score,
      }));
    } catch (error) {
      console.error("Error searching proverbs from API:", error);
      return [];
    }
  },

  addContribution: async function (proverbData) {
    try {
      const db = window.firebase.firestore(); // Get Firestore instance
      await db.collection("contributions").add(proverbData); // Add data to 'proverbs' collection
      console.log("Document successfully written!");
      return true;
    } catch (error) {
      console.error("Error writing document: ", error);
      return false;
    }
  },

  // Helper method to format proverb results - ensuring consistency
  _formatProverbResults: function (querySnapshot) {
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        meranaw: data.meranaw_proverb || "", // Changed from 'text' to 'meranaw'
        literal_meaning: data.literal_translation_meranaw || "", // Changed from 'literalMeaning' to 'literal_meaning'
        english_translation: data.english_translation || "", // Changed from 'translation' to 'english_translation'
        theme: data.theme || "general",
      };
    });
  },
};

// Additional initialization for the Firebase service
document.addEventListener("DOMContentLoaded", function () {
  // Check for Firebase availability and initialize service
  const checkFirebaseInterval = setInterval(() => {
    if (window.firebase && window.firebase.firestore) {
      console.log("Firebase service initialized");
      clearInterval(checkFirebaseInterval);
    }
  }, 200);

  // Give up after 10 seconds
  setTimeout(() => {
    clearInterval(checkFirebaseInterval);
    if (!window.firebaseService) {
      console.error("Firebase service did not initialize within 10 seconds.");
    }
  }, 10000); // 10 seconds timeout
});

async function onSearch(query) {
  if (!query.trim()) return;

  const results = await window.firebaseService.searchProverbsFromAPI(query);
  displayThemeProverbs(results, `Search: "${query}"`);
}

function handleSearch() {
  const query = document.getElementById("searchInput").value;
  onSearch(query);
}

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
});
