/**
 * Firebase Configuration and Initialization
 * Handles Firebase setup and provides global access to Firebase services
 */

// Import Firebase from CDN
const firebase = window.firebase

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZ6EzZLpBIUlTjFm7ZUBfMMkmslIOeMFg",
  authDomain: "social-media-8c5ba.firebaseapp.com",
  databaseURL: "https://social-media-8c5ba-default-rtdb.firebaseio.com",
  projectId: "social-media-8c5ba",
  storageBucket: "social-media-8c5ba.appspot.com",
  messagingSenderId: "25174929156",
  appId: "1:25174929156:web:edd2093c4b96f710262a51",
  measurementId: "G-SMRP4X0HPM",
}

// Initialize Firebase using the global firebase object from CDN
firebase.initializeApp(firebaseConfig)

// Create global references for easy access
window.firebaseAuth = firebase.auth()
window.firebaseDatabase = firebase.database()
window.firebaseStorage = firebase.storage()

console.log("Firebase initialized successfully")
