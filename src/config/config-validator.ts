/**
 * 配置驗證工具
 * 確保所有必要的配置都已正確設定
 */

import { configManager } from './app.config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  /**
   * 驗證所有配置
   */
  static validateAll(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證應用程式配置
    const appValidation = this.validateAppConfig();
    errors.push(...appValidation.errors);
    warnings.push(...appValidation.warnings);

    // 驗證 Firebase 配置
    const firebaseValidation = this.validateFirebaseConfig();
    errors.push(...firebaseValidation.errors);
    warnings.push(...firebaseValidation.warnings);

    // 驗證 LINE Pay 配置
    const linePayValidation = this.validateLinePayConfig();
    errors.push(...linePayValidation.errors);
    warnings.push(...linePayValidation.warnings);

    // 驗證 Email 配置
    const emailValidation = this.validateEmailConfig();
    errors.push(...emailValidation.errors);
    warnings.push(...emailValidation.warnings);

    // 驗證 API 配置
    const apiValidation = this.validateApiConfig();
    errors.push(...apiValidation.errors);
    warnings.push(...apiValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 驗證應用程式配置
   */
  private static validateAppConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const appConfig = configManager.getAppConfig();

    if (!appConfig.siteUrl || appConfig.siteUrl === 'http://localhost:3000') {
      warnings.push('使用預設的本地開發 URL，生產環境請設定 NEXT_PUBLIC_SITE_URL');
    }

    if (appConfig.environment === 'production' && appConfig.debug) {
      warnings.push('生產環境啟用了除錯模式，建議關閉');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 驗證 Firebase 配置
   */
  private static validateFirebaseConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const firebaseConfig = configManager.getFirebaseConfig();

    if (!firebaseConfig.apiKey) {
      errors.push('Firebase API Key 未設定 (NEXT_PUBLIC_FIREBASE_API_KEY)');
    }

    if (!firebaseConfig.projectId) {
      errors.push('Firebase Project ID 未設定 (NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
    }

    if (!firebaseConfig.authDomain) {
      errors.push('Firebase Auth Domain 未設定 (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)');
    }

    if (!firebaseConfig.appId) {
      errors.push('Firebase App ID 未設定 (NEXT_PUBLIC_FIREBASE_APP_ID)');
    }

    if (!firebaseConfig.measurementId) {
      warnings.push('Firebase Measurement ID 未設定，Analytics 功能將無法使用');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 驗證 LINE Pay 配置
   */
  private static validateLinePayConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const linePayConfig = configManager.getLinePayConfig();

    if (!linePayConfig.channelId) {
      errors.push('LINE Pay Channel ID 未設定 (LINE_PAY_CHANNEL_ID)');
    }

    if (!linePayConfig.channelSecret) {
      errors.push('LINE Pay Channel Secret 未設定 (LINE_PAY_CHANNEL_SECRET)');
    }

    if (!linePayConfig.merchantId) {
      errors.push('LINE Pay Merchant ID 未設定 (LINE_PAY_MERCHANT_ID)');
    }

    if (linePayConfig.apiUrl.includes('localhost') || linePayConfig.apiUrl.includes('127.0.0.1')) {
      warnings.push('LINE Pay API URL 使用本地地址，生產環境請使用正式 API');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 驗證 Email 配置
   */
  private static validateEmailConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const emailConfig = configManager.getEmailConfig();

    if (emailConfig.provider === 'console') {
      warnings.push('Email 服務使用 console 模式，生產環境請設定實際的 Email 服務');
    }

    if (emailConfig.provider !== 'console' && !emailConfig.settings.apiKey) {
      errors.push(`Email 服務設定為 ${emailConfig.provider} 但未提供 API Key`);
    }

    if (emailConfig.provider === 'smtp') {
      if (!emailConfig.settings.smtpHost) {
        errors.push('SMTP 服務未設定主機地址');
      }
      if (!emailConfig.settings.smtpUser) {
        errors.push('SMTP 服務未設定使用者名稱');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 驗證 API 配置
   */
  private static validateApiConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const apiConfig = configManager.getApiConfig();

    if (!apiConfig.adminApiKey) {
      errors.push('Admin API Key 未設定 (ADMIN_API_KEY)');
    }

    if (!apiConfig.linePayApiKey) {
      warnings.push('LINE Pay API Key 未設定，LINE Pay 功能可能受限');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 取得配置摘要
   */
  static getConfigSummary(): Record<string, unknown> {
    const config = configManager.getAllConfig();
    
    // 隱藏敏感資訊
    const sanitizedConfig = {
      app: config.app,
      firebase: {
        ...config.firebase,
        apiKey: config.firebase.apiKey ? `${config.firebase.apiKey.substring(0, 8)}...` : '未設定'
      },
      linePay: {
        ...config.linePay,
        channelSecret: config.linePay.channelSecret ? `${config.linePay.channelSecret.substring(0, 8)}...` : '未設定'
      },
      email: {
        ...config.email,
        settings: {
          ...config.email.settings,
          apiKey: config.email.settings.apiKey ? `${config.email.settings.apiKey.substring(0, 8)}...` : '未設定',
          smtpPass: config.email.settings.smtpPass ? '***' : '未設定'
        }
      },
      api: {
        ...config.api,
        adminApiKey: config.api.adminApiKey ? `${config.api.adminApiKey.substring(0, 8)}...` : '未設定',
        linePayApiKey: config.api.linePayApiKey ? `${config.api.linePayApiKey.substring(0, 8)}...` : '未設定'
      },
      game: config.game
    };

    return sanitizedConfig;
  }
}

// 便捷函數
export const validateConfig = () => ConfigValidator.validateAll();
export const getConfigSummary = () => ConfigValidator.getConfigSummary();
