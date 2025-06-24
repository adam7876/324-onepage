import { getFirestore } from "firebase/firestore";
import { app } from "./firebaseConfig";

// 初始化 Firestore
export const db = getFirestore(app);

// 確保 Firebase 完全初始化的 Promise
export const firebaseReady = new Promise<void>((resolve) => {
  // 在客戶端環境中檢查 Firebase 是否準備就緒
  if (typeof window !== 'undefined') {
    const checkReady = () => {
      if (db) {
        console.log("Firebase Firestore 已準備就緒");
        resolve();
      } else {
        setTimeout(checkReady, 50);
      }
    };
    checkReady();
  } else {
    // 服務器端直接 resolve
    resolve();
  }
}); 