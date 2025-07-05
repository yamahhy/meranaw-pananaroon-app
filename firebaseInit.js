// firebaseInit.js
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing app...");

  // Firebase configuration (replace with your actual config)
  const firebaseConfig = {
    apiKey: "AIzaSyDNlQTyljEdqIsjO3f02aZzRNLCa2inq2w",
    authDomain: "meranaw-pananaroon.firebaseapp.com",
    databaseURL:
      "https://meranaw-pananaroon-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "meranaw-pananaroon",
    storageBucket: "meranaw-pananaroon.firebasestorage.app",
    messagingSenderId: "275452854496",
    appId: "1:275452854496:web:819619c149b950fdfc9085",
    measurementId: "G-J5XSKKGYKX",
  };

  // Function to load a script dynamically
  function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
    };
    document.head.appendChild(script);
  }

  let firebaseAppInitialized = false;
  let firestoreLoaded = false;

  function initializeFirebase() {
    if (firebaseAppInitialized && firestoreLoaded) {
      try {
        if (!firebase.apps.length) {
          // Prevent re-initialization
          firebase.initializeApp(firebaseConfig);
        }
        const db = firebase.firestore();

        // Make Firebase and Firestore available globally
        window.firebase = firebase;
        window.firestore = db;

        console.log("Firebase initialized successfully");
        // No need to load firebaseService.js here, it's loaded in index.html
        // And no need to call initApp() here, script.js will handle it.
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    } else {
      console.log("Firebase app or firestore not yet loaded...");
    }
  }

  // Load Firebase App SDK
  loadScript(
    "https://www.gstatic.com/firebasejs/11.7.3/firebase-app-compat.js",
    () => {
      console.log("firebase-app-compat.js loaded");
      firebaseAppInitialized = true;
      initializeFirebase();
    }
  );

  // Load Firebase Firestore SDK
  loadScript(
    "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore-compat.js",
    () => {
      console.log("firebase-firestore-compat.js loaded");
      firestoreLoaded = true;
      initializeFirebase();
    }
  );
});
