/**
 * 密碼管理服務
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// 密碼設定介面
export interface PasswordConfig {
  password: string;
  lastUpdated: Date;
}

// 預設密碼設定
const DEFAULT_PASSWORD_CONFIG: PasswordConfig = {
  password: '324game2024',
  lastUpdated: new Date(),
};

/**
 * 獲取密碼設定
 */
export async function getPasswordConfig(): Promise<PasswordConfig> {
  try {
    const docRef = doc(db, 'gameSettings', 'password');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        password: data.password,
        lastUpdated: data.lastUpdated.toDate(),
      };
    } else {
      // 如果不存在，創建預設設定
      await setPasswordConfig(DEFAULT_PASSWORD_CONFIG);
      return DEFAULT_PASSWORD_CONFIG;
    }
  } catch (error) {
    console.error('獲取密碼設定失敗:', error);
    return DEFAULT_PASSWORD_CONFIG;
  }
}

/**
 * 設定密碼
 */
export async function setPasswordConfig(config: PasswordConfig): Promise<void> {
  try {
    const docRef = doc(db, 'gameSettings', 'password');
    await setDoc(docRef, {
      password: config.password,
      lastUpdated: config.lastUpdated,
    });
  } catch (error) {
    console.error('設定密碼失敗:', error);
    throw error;
  }
}

/**
 * 更新密碼
 */
export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const docRef = doc(db, 'gameSettings', 'password');
    await updateDoc(docRef, {
      password: newPassword,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('更新密碼失敗:', error);
    throw error;
  }
}

/**
 * 驗證密碼
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    const config = await getPasswordConfig();
    return config.password === inputPassword;
  } catch (error) {
    console.error('驗證密碼失敗:', error);
    return false;
  }
}
