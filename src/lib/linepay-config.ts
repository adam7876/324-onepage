// LINE Pay 配置與安全設定
export const LINE_PAY_CONFIG = {
  // 環境變數（生產環境）
  channelId: process.env.LINE_PAY_CHANNEL_ID || '1656251071',
  channelSecret: process.env.LINE_PAY_CHANNEL_SECRET || '',
  merchantId: process.env.LINE_PAY_MERCHANT_ID || 'KHHCR.41318699.QR',
  
  // API 端點
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api-pay.line.me' 
    : 'https://sandbox-api-pay.line.me',
  
  // 回傳網址
  returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/linepay/return`,
  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/linepay/cancel`,
  confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/linepay/confirm`,
  
  // 安全設定
  timeout: 30000, // 30秒超時
  maxRetries: 3,
};

// 安全驗證函數
export function validateLinePayConfig() {
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
  return amount === expectedAmount && amount > 0 && amount <= 1000000; // 最大100萬
}

// 訂單編號驗證
export function validateOrderNumber(orderNumber: string): boolean {
  return /^\d{8}\d{3}$/.test(orderNumber); // YYYYMMDD + 3位序號
}
