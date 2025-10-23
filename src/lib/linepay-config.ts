// LINE Pay 配置與安全設定
import { getLinePayConfig } from "../config/app.config";

export const LINE_PAY_CONFIG = getLinePayConfig();

// 安全驗證函數
export function validateLinePayConfig() {
  // 暫時移除詳細日誌以避免部署超時
  // console.log('Validating LINE Pay config:', {
  //   channelId: LINE_PAY_CONFIG.channelId,
  //   merchantId: LINE_PAY_CONFIG.merchantId,
  //   hasChannelSecret: !!LINE_PAY_CONFIG.channelSecret,
  //   channelSecretLength: LINE_PAY_CONFIG.channelSecret.length,
  //   channelSecretStart: LINE_PAY_CONFIG.channelSecret.substring(0, 8),
  //   apiUrl: LINE_PAY_CONFIG.apiUrl,
  // });

  if (!LINE_PAY_CONFIG.channelSecret) {
    throw new Error('LINE_PAY_CHANNEL_SECRET is required');
  }
  if (!LINE_PAY_CONFIG.channelId) {
    throw new Error('LINE_PAY_CHANNEL_ID is required');
  }
  if (!LINE_PAY_CONFIG.merchantId) {
    throw new Error('LINE_PAY_MERCHANT_ID is required');
  }
}

// 金額驗證（防止竄改）
export function validateAmount(amount: number, expectedAmount: number): boolean {
  // LINE Pay 最低交易金額通常是 NT$ 1，但建議至少 NT$ 10
  return amount === expectedAmount && amount >= 10 && amount <= 1000000; // 最低10元，最大100萬
}

// 訂單編號驗證
export function validateOrderNumber(orderNumber: string): boolean {
  return /^\d{8}\d{3}$/.test(orderNumber); // YYYYMMDD + 3位序號
}
