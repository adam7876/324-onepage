/**
 * 個別遊戲開關服務
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// 遊戲開關狀態介面
export interface GameSwitchConfig {
  wheel: boolean;      // 幸運轉盤
  rockPaperScissors: boolean;  // 猜拳遊戲
  dice: boolean;       // 骰子遊戲
  lastUpdated: Date;
}

// 預設遊戲開關設定
const DEFAULT_GAME_SWITCH: GameSwitchConfig = {
  wheel: false,        // 幸運轉盤預設關閉
  rockPaperScissors: true,   // 猜拳遊戲預設開啟
  dice: true,          // 骰子遊戲預設開啟
  lastUpdated: new Date(),
};

/**
 * 獲取遊戲開關設定
 */
export async function getGameSwitchConfig(): Promise<GameSwitchConfig> {
  try {
    const docRef = doc(db, 'gameSettings', 'gameSwitch');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        wheel: data.wheel,
        rockPaperScissors: data.rockPaperScissors,
        dice: data.dice,
        lastUpdated: data.lastUpdated.toDate(),
      };
    } else {
      // 如果不存在，創建預設設定
      await setGameSwitchConfig(DEFAULT_GAME_SWITCH);
      return DEFAULT_GAME_SWITCH;
    }
  } catch (error) {
    console.error('獲取遊戲開關設定失敗:', error);
    return DEFAULT_GAME_SWITCH;
  }
}

/**
 * 設定遊戲開關
 */
export async function setGameSwitchConfig(config: GameSwitchConfig): Promise<void> {
  try {
    const docRef = doc(db, 'gameSettings', 'gameSwitch');
    await setDoc(docRef, {
      wheel: config.wheel,
      rockPaperScissors: config.rockPaperScissors,
      dice: config.dice,
      lastUpdated: config.lastUpdated,
    });
  } catch (error) {
    console.error('設定遊戲開關失敗:', error);
    throw error;
  }
}

/**
 * 更新單個遊戲開關
 */
export async function updateGameSwitch(gameType: keyof Omit<GameSwitchConfig, 'lastUpdated'>, isOpen: boolean): Promise<void> {
  try {
    const currentConfig = await getGameSwitchConfig();
    const newConfig = {
      ...currentConfig,
      [gameType]: isOpen,
      lastUpdated: new Date(),
    };
    await setGameSwitchConfig(newConfig);
  } catch (error) {
    console.error('更新遊戲開關失敗:', error);
    throw error;
  }
}

/**
 * 檢查遊戲是否開啟
 */
export async function isGameOpen(gameType: keyof Omit<GameSwitchConfig, 'lastUpdated'>): Promise<boolean> {
  try {
    const config = await getGameSwitchConfig();
    return config[gameType];
  } catch (error) {
    console.error('檢查遊戲開關失敗:', error);
    return false;
  }
}
