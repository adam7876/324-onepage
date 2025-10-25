/**
 * 統一類型定義
 * 集中管理所有應用程式的類型定義
 */

import { Timestamp } from 'firebase/firestore';

// ==================== 基礎類型 ====================

/**
 * 通用回應介面
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分頁參數
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分頁回應
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== 商品相關 ====================

/**
 * 商品介面
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  category?: string;
  status: 'active' | 'inactive' | 'draft';
  stock?: number;
  externalOrderUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 商品表單資料
 */
export interface ProductFormData {
  name: string;
  price: number;
  description?: string;
  images?: string[];
  category?: string;
  status: 'active' | 'inactive' | 'draft';
  stock?: number;
  externalOrderUrl?: string;
}

// ==================== 購物車相關 ====================

/**
 * 購物車商品項目
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  size?: string;
  color?: string;
  quantity: number;
}

/**
 * 購物車上下文
 */
export interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (idx: number, quantity: number) => void;
  removeItem: (idx: number) => void;
  clearCart: () => void;
}

// ==================== 訂單相關 ====================

/**
 * 7-11 店到店物流資訊
 */
export interface LogisticsInfo {
  storeId: string;        // 門市代號
  storeName: string;      // 門市名稱
  storeAddress: string;    // 門市地址
  storePhone?: string;    // 門市電話
  logisticsNo?: string;   // 物流編號
  logisticsStatus?: 'pending' | 'shipped' | 'delivered' | 'returned'; // 物流狀態
  shippedAt?: Timestamp;  // 出貨時間
  deliveredAt?: Timestamp; // 送達時間
}

/**
 * 訂單介面
 */
export interface Order {
  id?: string;
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerNotes?: string;
  items: CartItem[];
  total: number;
  amountExpected: number;
  shipping: string;
  payment: string;
  status: string;
  paymentStatus: '未請款' | '已請款' | '已付款' | '付款失敗' | '已退款';
  tradeNo?: string;
  createdAt: Timestamp;
  // 7-11 店到店物流資訊
  logisticsInfo?: LogisticsInfo;
}

/**
 * 訂單表單資料
 */
export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  shipping: string;
  payment: string;
  // 7-11 店到店物流資訊
  logisticsInfo?: LogisticsInfo;
}

// ==================== 會員相關 ====================

/**
 * 會員介面
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'vip' | 'suspended';
  joinDate: string;
  gameHistory: {
    lastPlayed: string | null;
    totalPlays: number;
  };
  updatedAt: string;
  importedAt?: string;
  addedAt?: string;
}

/**
 * 會員驗證結果
 */
export interface MemberValidationResult {
  valid: boolean;
  member?: Member;
  error?: string;
}

// ==================== 遊戲相關 ====================

/**
 * 遊戲記錄
 */
export interface GameRecord {
  id: string;
  email: string;
  gameType: string;
  result: 'win' | 'lose' | 'draw';
  reward?: {
    type: 'coupon' | 'freeShipping' | 'discount';
    name: string;
    value: number;
    code: string;
  };
  playedAt: Timestamp;
  ipAddress?: string;
}

/**
 * 遊戲結果
 */
export interface GameResult {
  success: boolean;
  result: 'win' | 'lose' | 'draw';
  message: string;
  reward?: {
    type: string;
    name: string;
    value: number;
    code?: string;
  };
}

/**
 * Email 驗證記錄
 */
export interface EmailVerification {
  id: string;
  email: string;
  code: string;
  expiresAt: Timestamp;
  used: boolean;
  createdAt: Timestamp;
}

/**
 * 輪盤遊戲配置
 */
export interface WheelGameConfig {
  segments: Array<{
    label: string;
    value: string;
    color: string;
    probability: number;
  }>;
  onComplete: (result: string) => void;
  rewardConfig: {
    [key: string]: {
      name: string;
      description: string;
      value: number;
    };
  };
}

// ==================== 付款相關 ====================

/**
 * LINE Pay 回應
 */
export interface LinePayResponse {
  returnCode: string;
  returnMessage: string;
  info?: {
    paymentUrl?: {
      web: string;
      app: string;
    };
    transactionId?: number;
    paymentAccessToken?: string;
  };
}

/**
 * 付款請求結果
 */
export interface PaymentRequestResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: number;
  error?: string;
}

// ==================== 認證相關 ====================

/**
 * API 認證結果
 */
export interface ApiAuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  isAdmin?: boolean;
}

/**
 * 使用者認證狀態
 */
export interface AuthState {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  isAdmin: boolean;
  loading: boolean;
}

// ==================== 配置相關 ====================

/**
 * 應用程式配置
 */
export interface AppConfig {
  siteUrl: string;
  environment: 'development' | 'production';
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Firebase 配置
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * LINE Pay 配置
 */
export interface LinePayConfig {
  channelId: string;
  channelSecret: string;
  merchantId: string;
  apiUrl: string;
  returnUrl: string;
  cancelUrl: string;
  confirmUrl: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Email 配置
 */
export interface EmailConfig {
  provider: 'console' | 'smtp' | 'sendgrid' | 'resend';
  settings: {
    apiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

/**
 * API 配置
 */
export interface ApiConfig {
  adminApiKey: string;
  linePayApiKey: string;
  timeout: number;
  maxRetries: number;
}

/**
 * 遊戲配置
 */
export interface GameConfig {
  maxAttempts: number;
  timeout: number;
  verificationCodeLength: number;
  codeExpiryMinutes: number;
}

// ==================== 服務層介面 ====================

/**
 * 購物車服務介面
 */
export interface CartService {
  getCart(): CartItem[];
  addToCart(item: Omit<CartItem, 'quantity'>): void;
  updateQuantity(id: string, quantity: number): void;
  removeItem(id: string): void;
  clearCart(): void;
  getTotal(): number;
  logCartAction(action: string, data: unknown): void;
}

/**
 * 訂單服務介面
 */
export interface OrderService {
  createOrder(orderData: Partial<Order>): Promise<string>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;
  batchDeleteOrders(orderIds: string[]): Promise<void>;
  generateOrderNumber(): Promise<string>;
  processOrderData(formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    shipping: string;
    payment: string;
    customerNotes: string;
  }, cart: CartItem[]): Order;
}

/**
 * 遊戲服務介面
 */
export interface GameService {
  generateRandomChoice(): 'rock' | 'paper' | 'scissors';
  determineWinner(player: 'rock' | 'paper' | 'scissors', computer: 'rock' | 'paper' | 'scissors'): 'win' | 'lose' | 'draw';
  rollDice(): number;
  getDiceEmoji(value: number): string;
  drawReward(): { type: string; description: string; value: number };
}

/**
 * 付款服務介面
 */
export interface PaymentService {
  createLinePayRequest(orderData: OrderFormData, items: CartItem[]): Promise<PaymentRequestResult>;
  confirmLinePayPayment(transactionId: number, amount: number): Promise<LinePayResponse>;
  cancelLinePayPayment(transactionId: number): Promise<boolean>;
  validateAmount(transactionId: number, expectedAmount: number): Promise<boolean>;
  validateOrderNumber(orderNumber: string): Promise<boolean>;
  logPaymentAction(action: string, data: unknown): void;
}

// ==================== 表單相關 ====================

/**
 * 表單驗證錯誤
 */
export interface FormValidationError {
  field: string;
  message: string;
}

/**
 * 表單狀態
 */
export interface FormState<T> {
  data: T;
  errors: FormValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// ==================== 工具類型 ====================

/**
 * 可選屬性
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必需屬性
 */
export type RequiredFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 深度部分
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必需
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
