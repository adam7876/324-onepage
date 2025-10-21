/**
 * 應用程式配置管理
 * 統一管理所有配置設定
 */

export interface AppConfig {
  siteUrl: string;
  environment: 'development' | 'production';
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

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

class ConfigManager {
  private appConfig: AppConfig;
  private firebaseConfig: FirebaseConfig;
  private linePayConfig: LinePayConfig;

  constructor() {
    this.appConfig = this.loadAppConfig();
    this.firebaseConfig = this.loadFirebaseConfig();
    this.linePayConfig = this.loadLinePayConfig();
  }

  private loadAppConfig(): AppConfig {
    return {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
      debug: process.env.NODE_ENV === 'development',
      logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info'
    };
  }

  private loadFirebaseConfig(): FirebaseConfig {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
    };
  }

  private loadLinePayConfig(): LinePayConfig {
    return {
      channelId: process.env.LINE_PAY_CHANNEL_ID || '',
      channelSecret: process.env.LINE_PAY_CHANNEL_SECRET || '',
      merchantId: process.env.LINE_PAY_MERCHANT_ID || '',
      apiUrl: process.env.LINE_PAY_API_URL || 'https://api-pay.line.me',
      returnUrl: `${this.appConfig.siteUrl}/api/payment/linepay/return`,
      cancelUrl: `${this.appConfig.siteUrl}/api/payment/linepay/cancel`,
      confirmUrl: `${this.appConfig.siteUrl}/api/payment/linepay/confirm`,
      timeout: 30000,
      maxRetries: 3
    };
  }

  getAppConfig(): AppConfig {
    return { ...this.appConfig };
  }

  getFirebaseConfig(): FirebaseConfig {
    return { ...this.firebaseConfig };
  }

  getLinePayConfig(): LinePayConfig {
    return { ...this.linePayConfig };
  }

  isDevelopment(): boolean {
    return this.appConfig.environment === 'development';
  }

  isProduction(): boolean {
    return this.appConfig.environment === 'production';
  }

  shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.appConfig.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }
}

// 單例模式
export const configManager = new ConfigManager();
