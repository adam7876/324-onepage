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
  measurementId?: string;
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

export interface ApiConfig {
  adminApiKey: string;
  linePayApiKey: string;
  timeout: number;
  maxRetries: number;
}

export interface GameConfig {
  maxAttempts: number;
  timeout: number;
  verificationCodeLength: number;
  codeExpiryMinutes: number;
}

class ConfigManager {
  private appConfig: AppConfig;
  private firebaseConfig: FirebaseConfig;
  private linePayConfig: LinePayConfig;
  private emailConfig: EmailConfig;
  private apiConfig: ApiConfig;
  private gameConfig: GameConfig;

  constructor() {
    this.appConfig = this.loadAppConfig();
    this.firebaseConfig = this.loadFirebaseConfig();
    this.linePayConfig = this.loadLinePayConfig();
    this.emailConfig = this.loadEmailConfig();
    this.apiConfig = this.loadApiConfig();
    this.gameConfig = this.loadGameConfig();
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
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }

  private loadLinePayConfig(): LinePayConfig {
    return {
      channelId: process.env.LINE_PAY_CHANNEL_ID || '1656251071',
      channelSecret: process.env.LINE_PAY_CHANNEL_SECRET || '',
      merchantId: process.env.LINE_PAY_MERCHANT_ID || 'KHHCR.41318699.QR',
      apiUrl: process.env.LINE_PAY_API_URL || 'http://198.13.49.191:3000',
      returnUrl: `${this.appConfig.siteUrl}/api/payment/linepay/return`,
      cancelUrl: `${this.appConfig.siteUrl}/api/payment/linepay/cancel`,
      confirmUrl: `${this.appConfig.siteUrl}/api/payment/linepay/confirm`,
      timeout: 30000,
      maxRetries: 3
    };
  }

  private loadEmailConfig(): EmailConfig {
    return {
      provider: (process.env.EMAIL_PROVIDER as 'console' | 'smtp' | 'sendgrid' | 'resend') || 'console',
      settings: {
        apiKey: process.env.EMAIL_API_KEY,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        fromName: process.env.FROM_NAME || '324遊樂園🎠'
      }
    };
  }

  private loadApiConfig(): ApiConfig {
    return {
      adminApiKey: process.env.ADMIN_API_KEY || '',
      linePayApiKey: process.env.LINE_PAY_API_KEY || '',
      timeout: 30000,
      maxRetries: 3
    };
  }

  private loadGameConfig(): GameConfig {
    return {
      maxAttempts: parseInt(process.env.GAME_MAX_ATTEMPTS || '3'),
      timeout: parseInt(process.env.GAME_TIMEOUT || '300000'), // 5分鐘
      verificationCodeLength: parseInt(process.env.VERIFICATION_CODE_LENGTH || '6'),
      codeExpiryMinutes: parseInt(process.env.CODE_EXPIRY_MINUTES || '10')
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

  getEmailConfig(): EmailConfig {
    return { ...this.emailConfig };
  }

  getApiConfig(): ApiConfig {
    return { ...this.apiConfig };
  }

  getGameConfig(): GameConfig {
    return { ...this.gameConfig };
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

  // 配置驗證
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 驗證必要配置
    if (!this.firebaseConfig.apiKey) {
      errors.push('Firebase API Key 未設定');
    }
    if (!this.firebaseConfig.projectId) {
      errors.push('Firebase Project ID 未設定');
    }
    if (!this.linePayConfig.channelId) {
      errors.push('LINE Pay Channel ID 未設定');
    }
    if (!this.linePayConfig.channelSecret) {
      errors.push('LINE Pay Channel Secret 未設定');
    }
    if (!this.apiConfig.adminApiKey) {
      errors.push('Admin API Key 未設定');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 取得所有配置（用於除錯）
  getAllConfig() {
    return {
      app: this.getAppConfig(),
      firebase: this.getFirebaseConfig(),
      linePay: this.getLinePayConfig(),
      email: this.getEmailConfig(),
      api: this.getApiConfig(),
      game: this.getGameConfig()
    };
  }
}

// 單例模式
export const configManager = new ConfigManager();

// 便捷的配置存取函數
export const getConfig = () => configManager;
export const getAppConfig = () => configManager.getAppConfig();
export const getFirebaseConfig = () => configManager.getFirebaseConfig();
export const getLinePayConfig = () => configManager.getLinePayConfig();
export const getEmailConfig = () => configManager.getEmailConfig();
export const getApiConfig = () => configManager.getApiConfig();
export const getGameConfig = () => configManager.getGameConfig();
