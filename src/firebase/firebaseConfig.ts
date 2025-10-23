// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics"; // Next.js SSR 環境不建議直接啟用
import { getFirebaseConfig } from "../config/app.config";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// const analytics = getAnalytics(app); // 若需啟用 analytics，請於 client 端動態載入 