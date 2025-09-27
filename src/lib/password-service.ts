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
    console.log('開始獲取密碼設定...');
    const docRef = doc(db, 'gameSettings', 'password');
    console.log('文檔引用:', docRef.path);
    
    const docSnap = await getDoc(docRef);
    console.log('文檔存在:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('文檔數據:', data);
      return {
        password: data.password,
        lastUpdated: data.lastUpdated.toDate(),
      };
    } else {
      console.log('文檔不存在，創建默認配置');
      // 如果不存在，創建預設設定
      await setPasswordConfig(DEFAULT_PASSWORD_CONFIG);
      return DEFAULT_PASSWORD_CONFIG;
    }
  } catch (error) {
    console.error('獲取密碼設定失敗:', error);
    console.error('錯誤詳情:', error);
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
    console.log('開始更新密碼:', newPassword);
    const docRef = doc(db, 'gameSettings', 'password');
    
    // 先檢查文檔是否存在
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // 文檔存在，使用 updateDoc
      await updateDoc(docRef, {
        password: newPassword,
        lastUpdated: new Date(),
      });
      console.log('密碼更新成功 (updateDoc)');
    } else {
      // 文檔不存在，使用 setDoc
      await setDoc(docRef, {
        password: newPassword,
        lastUpdated: new Date(),
      });
      console.log('密碼更新成功 (setDoc)');
    }
  } catch (error) {
    console.error('更新密碼失敗:', error);
    console.error('錯誤詳情:', error);
    throw error;
  }
}

/**
 * 驗證密碼
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    console.log('開始驗證密碼:', inputPassword);
    const config = await getPasswordConfig();
    console.log('從資料庫獲取的密碼:', config.password);
    const isValid = config.password === inputPassword;
    console.log('密碼驗證結果:', isValid);
    return isValid;
  } catch (error) {
    console.error('驗證密碼失敗:', error);
    return false;
  }
}
