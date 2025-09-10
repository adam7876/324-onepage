import { Timestamp } from 'firebase/firestore';

// 遊戲記錄類型
export interface GameRecord {
  id: string;
  email: string;
  gameType: string;
  result: 'win' | 'lose';
  reward?: {
    type: 'coupon';
    name: string;
    value: number;
    code: string;
  };
  playedAt: Timestamp;
  ipAddress?: string;
}

// Email驗證記錄
export interface EmailVerification {
  id: string;
  email: string;
  code: string;
  used: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// 遊戲Token
export interface GameToken {
  id: string;
  token: string;
  email: string;
  gameType: string;
  used: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// 遊戲結果
export interface GameResult {
  success: boolean;
  result: 'win' | 'lose';
  reward?: {
    type: 'coupon';
    name: string;
    value: number;
    code: string;
  };
  message: string;
}

// API響應類型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
