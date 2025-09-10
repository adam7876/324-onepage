import { GAME_CONFIG } from './game-config';
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

// 根據機率抽獎
export function drawReward(): RewardType {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const reward of GAME_CONFIG.rewards) {
    cumulativeProbability += reward.probability;
    if (random <= cumulativeProbability) {
      return reward;
    }
  }

  // 後備選項（理論上不會觸及）
  return GAME_CONFIG.rewards[GAME_CONFIG.rewards.length - 1];
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
