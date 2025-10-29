/**
 * PayNow 配置
 * 管理 PayNow 相關的設定和環境變數
 */

export interface PayNowConfig {
  baseUrl: string;
  userAccount: string;
  apiCode: string;
  returnUrl: string;
  testMode: boolean;
}

export const getPayNowConfig = (): PayNowConfig => {
  return {
    baseUrl: process.env.PAYNOW_BASE_URL || 'https://logistic.paynow.com.tw',
    userAccount: process.env.PAYNOW_USER_ACCOUNT || 'S225319286',
    apiCode: process.env.PAYNOW_API_CODE || '324moonp',
    returnUrl: process.env.PAYNOW_RETURN_URL || 'https://324-onepage.vercel.app/api/paynow/callback',
    testMode: process.env.NODE_ENV === 'development' || process.env.PAYNOW_TEST_MODE === 'true'
  };
};

export const validatePayNowConfig = (config: PayNowConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('PayNow base URL is required');
  }

  if (!config.userAccount) {
    errors.push('PayNow user account is required');
  }

  if (!config.apiCode) {
    errors.push('PayNow API code is required');
  }

  if (!config.returnUrl) {
    errors.push('PayNow return URL is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
