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

// 驗證email格式和真實性
export function isValidEmail(email: string): boolean {
  // 基本格式檢查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // 檢查是否為常見的垃圾 email 模式
  const suspiciousPatterns = [
    /^[a-z0-9]{20,}@/i,  // 超長隨機字符
    /^[0-9]{10,}@/,      // 純數字超長
    /test.*test/i,       // 包含 test...test
    /temp.*temp/i,       // 包含 temp...temp
    /fake.*fake/i,       // 包含 fake...fake
    /spam.*spam/i,       // 包含 spam...spam
    /^(qwe|asd|zxc|123|abc)/i, // 常見鍵盤序列開頭
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  // 檢查域名是否合理
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // 拒絕明顯假的域名
  const fakeDomainPatterns = [
    /^[a-z]{1,3}\.com$/,     // 太短的域名如 ab.com
    /test\.com$/,            // test.com
    /temp\.com$/,            // temp.com
    /fake\.com$/,            // fake.com
    /example\.com$/,         // example.com
    /localhost$/,            // localhost
  ];

  for (const pattern of fakeDomainPatterns) {
    if (pattern.test(domain)) {
      return false;
    }
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
