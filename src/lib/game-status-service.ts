import { db } from '../firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface GameStatus {
  isOpen: boolean;
  maintenanceMessage: string;
  maintenanceTitle: string;
  maintenanceHint: string;
  lastUpdated: Date;
}

// 預設遊戲狀態
const DEFAULT_GAME_STATUS: GameStatus = {
  isOpen: true,
  maintenanceMessage: '今日為遊樂園休息日，請明天再來！',
  maintenanceTitle: '🎠 遊樂園休息日 🎠',
  maintenanceHint: '💡 提示：請明天再來遊玩，每天都有新的機會！',
  lastUpdated: new Date(),
};

// 獲取遊戲狀態
export async function getGameStatus(): Promise<GameStatus> {
  try {
    const gameStatusDoc = await getDoc(doc(db, 'gameConfig', 'status'));
    
    if (gameStatusDoc.exists()) {
      const data = gameStatusDoc.data();
      return {
        isOpen: data.isOpen ?? DEFAULT_GAME_STATUS.isOpen,
        maintenanceMessage: data.maintenanceMessage ?? DEFAULT_GAME_STATUS.maintenanceMessage,
        maintenanceTitle: data.maintenanceTitle ?? DEFAULT_GAME_STATUS.maintenanceTitle,
        maintenanceHint: data.maintenanceHint ?? DEFAULT_GAME_STATUS.maintenanceHint,
        lastUpdated: data.lastUpdated?.toDate() ?? new Date(),
      };
    }
    
    // 如果沒有配置，創建預設配置
    await setGameStatus(DEFAULT_GAME_STATUS);
    return DEFAULT_GAME_STATUS;
  } catch (error) {
    console.error('獲取遊戲狀態失敗:', error);
    return DEFAULT_GAME_STATUS;
  }
}

// 設定遊戲狀態
export async function setGameStatus(status: Partial<GameStatus>): Promise<void> {
  try {
    const gameStatusData = {
      ...status,
      lastUpdated: new Date(),
    };
    
    await setDoc(doc(db, 'gameConfig', 'status'), gameStatusData, { merge: true });
    console.log('遊戲狀態已更新:', gameStatusData);
  } catch (error) {
    console.error('設定遊戲狀態失敗:', error);
    throw error;
  }
}

// 切換遊戲開關
export async function toggleGameStatus(): Promise<GameStatus> {
  try {
    const currentStatus = await getGameStatus();
    const newStatus = {
      ...currentStatus,
      isOpen: !currentStatus.isOpen,
      lastUpdated: new Date(),
    };
    
    await setGameStatus(newStatus);
    return newStatus;
  } catch (error) {
    console.error('切換遊戲狀態失敗:', error);
    throw error;
  }
}
