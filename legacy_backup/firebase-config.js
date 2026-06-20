import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDcYunTxwTobxjyeRaGgzdVeXkrvPn2VWs",
  authDomain: "sistema-gestion-2ef08.firebaseapp.com",
  projectId: "sistema-gestion-2ef08",
  storageBucket: "sistema-gestion-2ef08.firebasestorage.app",
  messagingSenderId: "943012431138",
  appId: "1:943012431138:web:a6d4db37b4049511d2517b",
  measurementId: "G-SWBE3YYNZ0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };