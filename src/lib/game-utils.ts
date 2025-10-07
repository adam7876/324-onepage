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

// 將獎勵型別與數值格式化為易讀描述
export function formatRewardDescription(
  type: 'coupon' | 'discount' | 'freeShipping',
  value: number
): string {
  if (type === 'coupon') return `回饋金 ${value} 元`;
  if (type === 'freeShipping') return `${value} 張免運券`;
  return `${value}折優惠`;
}

// 驗證email格式（基本檢查，真實性由 email 發送驗證）
export function isValidEmail(email: string): boolean {
  // 基本格式檢查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // 只檢查明顯不合理的格式
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // 拒絕明顯假的測試域名
  const obviousFakeDomains = [
    'test.com', 'temp.com', 'fake.com', 'example.com', 
    'localhost', 'test.test', 'fake.fake'
  ];

  if (obviousFakeDomains.includes(domain)) {
    return false;
  }

  // 拒絕太短的域名（可能打錯）
  if (domain.length < 4) {
    return false;
  }

  return true;
}

// 檢查是否為常見 email 提供商
export function isCommonEmailProvider(email: string): boolean {
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'live.com', 'msn.com', 'aol.com',
    'protonmail.com', 'tutanota.com', 'me.com',
    'ymail.com', 'rocketmail.com', 'mail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return commonProviders.includes(domain || '');
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
      const data = docSnap.data() as RewardType;
      console.log('🎮 遊戲組件從 Firestore 載入獎品配置:', data);
      return data;
    }
    
    console.log('🎮 遊戲組件：Firestore 中沒有獎品配置，使用預設值');
    // 如果資料庫中沒有配置，返回預設配置
    return GAME_CONFIG.reward;
  } catch (error) {
    console.error('🎮 遊戲組件獲取獎品配置失敗:', error);
    // 出錯時返回預設配置
    return GAME_CONFIG.reward;
  }
}
