import crypto from 'crypto';
import { LINE_PAY_CONFIG, validateAmount, validateOrderNumber } from './linepay-config';

// LINE Pay 請求介面
interface LinePayRequest {
  amount: number;
  currency: string;
  orderId: string;
  packages: Array<{
    id: string;
    amount: number;
    name: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }>;
  redirectUrls: {
    confirmUrl: string;
    cancelUrl: string;
  };
}

// LINE Pay 回應介面
interface LinePayResponse {
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

// 安全簽名生成
export function generateLinePaySignature(body: string, nonce: string): string {
  const message = LINE_PAY_CONFIG.channelSecret + body + nonce;
  return crypto.createHmac('sha256', LINE_PAY_CONFIG.channelSecret).update(message).digest('base64');
}

// 安全請求標頭
export function generateLinePayHeaders(body: string): Record<string, string> {
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = generateLinePaySignature(body, nonce);
  
  return {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': LINE_PAY_CONFIG.channelId,
    'X-LINE-Authorization': signature,
    'X-LINE-Authorization-Nonce': nonce,
  };
}

// 建立 LINE Pay 付款請求
export async function createLinePayRequest(orderData: {
  orderNumber: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  customerName: string;
}): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  try {
    // 安全驗證
    if (!validateOrderNumber(orderData.orderNumber)) {
      throw new Error('Invalid order number format');
    }
    
    if (!validateAmount(orderData.amount, orderData.amount)) {
      throw new Error('Invalid amount');
    }

    // 建立請求資料
    const requestData: LinePayRequest = {
      amount: orderData.amount,
      currency: 'TWD',
      orderId: orderData.orderNumber,
      packages: [{
        id: `package_${orderData.orderNumber}`,
        amount: orderData.amount,
        name: '324.SAMiSA 商品',
        products: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }],
      redirectUrls: {
        confirmUrl: LINE_PAY_CONFIG.confirmUrl,
        cancelUrl: LINE_PAY_CONFIG.cancelUrl,
      },
    };

    const body = JSON.stringify(requestData);
    const headers = generateLinePayHeaders(body);

    // 發送請求到 LINE Pay API
    const response = await fetch(`${LINE_PAY_CONFIG.apiUrl}/v3/payments/request`, {
      method: 'POST',
      headers,
      body,
    });

    const result: LinePayResponse = await response.json();

    if (result.returnCode === '0000' && result.info?.paymentUrl) {
      return {
        success: true,
        paymentUrl: result.info.paymentUrl.web,
      };
    } else {
      return {
        success: false,
        error: result.returnMessage || 'LINE Pay request failed',
      };
    }
  } catch (error) {
    console.error('LINE Pay request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 確認 LINE Pay 付款
export async function confirmLinePayPayment(
  transactionId: string,
  amount: number,
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 安全驗證
    if (!validateAmount(amount, amount)) {
      throw new Error('Invalid amount');
    }

    const requestData = {
      amount,
      currency: 'TWD',
    };

    const body = JSON.stringify(requestData);
    const headers = generateLinePayHeaders(body);

    const response = await fetch(
      `${LINE_PAY_CONFIG.apiUrl}/v3/payments/${transactionId}/confirm`,
      {
        method: 'POST',
        headers,
        body,
      }
    );

    const result: LinePayResponse = await response.json();

    if (result.returnCode === '0000') {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.returnMessage || 'LINE Pay confirmation failed',
      };
    }
  } catch (error) {
    console.error('LINE Pay confirmation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
