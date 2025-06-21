// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Next.js SSR 環境不建議直接啟用

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBdvXhGQiyFaH7buX4ILyo-tVjPrbtMXQg",
  authDomain: "one-page-bec86.firebaseapp.com",
  projectId: "one-page-bec86",
  storageBucket: "one-page-bec86.firebasestorage.app",
  messagingSenderId: "954851339318",
  appId: "1:954851339318:web:d6f5fd1ced342120e83c97",
  measurementId: "G-4JSW7ELRC2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // 若需啟用 analytics，請於 client 端動態載入 