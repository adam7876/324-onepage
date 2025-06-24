import { getFirestore } from "firebase/firestore";
import { app } from "./firebaseConfig";

// 初始化 Firestore
export const db = getFirestore(app); 