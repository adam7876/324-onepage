import { GAME_CONFIG } from './game-config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { RewardType } from './game-config';

// 生成唯一的優惠券代碼
export function generateCouponCode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `GAME${timestamp}${random}`;
}

// 生成隨機驗證碼
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成遊戲Token
export function generateGameToken(): string {
  return Math.random().toString(36).substr(2, 32);
}

// 根據機率抽獎 - 簡化為50%獲獎機率
export function drawReward(): RewardType {
  const random = Math.random();
  
  // 50%機率獲得獎品
  if (random < 0.5) {
    return GAME_CONFIG.reward;
  } else {
    // 沒中獎
    return {
      type: 'none' as const,
      value: 0,
      description: '謝謝參與'
    };
  }
}

// 驗證email格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 檢查是否為今天
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// 獲取今天開始的時間戳
export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// 獲取今天結束的時間戳
export function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

// 獲取獎品配置
export async function getRewardConfig(): Promise<RewardType> {
  try {
    const docRef = doc(db, 'gameConfig', 'reward');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as RewardType;
    }
    
    // 如果資料庫中沒有配置，返回預設配置
    return GAME_CONFIG.reward;
  } catch (error) {
    console.error('獲取獎品配置失敗:', error);
    // 出錯時返回預設配置
    return GAME_CONFIG.reward;
  }
}
