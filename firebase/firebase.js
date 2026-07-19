import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8Wxs0lr-UvK6oz-P8CX4BDGMOTavxmQE",
    authDomain: "camp-fornos.firebaseapp.com",
    projectId: "camp-fornos",
    storageBucket: "camp-fornos.firebasestorage.app",
    messagingSenderId: "156080341112",
    appId: "1:156080341112:web:97b1d97f8bfc2be620ad8d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
