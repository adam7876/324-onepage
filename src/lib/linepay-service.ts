import crypto from 'crypto';
import { LINE_PAY_CONFIG, validateAmount, validateOrderNumber } from './linepay-config';

// LINE Pay 請求介面（已移除，使用直接物件）

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
  // LINE Pay 簽名格式：HMAC-SHA256(channelSecret + requestBody + nonce)
  const message = LINE_PAY_CONFIG.channelSecret + body + nonce;
  // 暫時移除詳細日誌以避免部署超時
  // console.log('LINE Pay signature debug:', {
  //   channelSecret: LINE_PAY_CONFIG.channelSecret.substring(0, 8) + '...',
  //   bodyLength: body.length,
  //   nonce,
  //   messageLength: message.length,
  //   messagePreview: message.substring(0, 50) + '...',
  // });
  
  // 使用正確的編碼方式
  const signature = crypto.createHmac('sha256', LINE_PAY_CONFIG.channelSecret)
    .update(message)
    .digest('base64');
  
  // console.log('Generated signature:', signature);
  return signature;
}

// 安全請求標頭
export function generateLinePayHeaders(body: string): Record<string, string> {
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = generateLinePaySignature(body, nonce);
  
  const headers = {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': LINE_PAY_CONFIG.channelId,
    'X-LINE-Authorization': signature,
    'X-LINE-Authorization-Nonce': nonce,
  };
  
  // 暫時移除詳細日誌以避免部署超時
  // console.log('LINE Pay headers:', {
  //   'Content-Type': headers['Content-Type'],
  //   'X-LINE-ChannelId': headers['X-LINE-ChannelId'],
  //   'X-LINE-Authorization': signature.substring(0, 20) + '...',
  //   'X-LINE-Authorization-Nonce': nonce,
  // });
  
  return headers;
}

// 建立 LINE Pay 付款請求
export async function createLinePayRequest(orderData: {
  orderNumber: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  customerName: string;
}): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  // 暫時移除詳細日誌以避免部署超時
  // console.log('🚀 LINE Pay request started:', {
  //   orderNumber: orderData.orderNumber,
  //   amount: orderData.amount,
  //   itemsCount: orderData.items.length,
  //   customerName: orderData.customerName,
  // });

  try {
    // 安全驗證
    console.log('🔍 Validating order number...');
    if (!validateOrderNumber(orderData.orderNumber)) {
      console.error('❌ Invalid order number format:', orderData.orderNumber);
      throw new Error('Invalid order number format');
    }
    
    console.log('🔍 Validating amount...');
    if (!validateAmount(orderData.amount, orderData.amount)) {
      console.error('❌ Invalid amount:', orderData.amount);
      throw new Error('Invalid amount');
    }
    
    console.log('✅ Validation passed');

    // 建立請求資料
    const requestData = {
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

    console.log('LINE Pay request data structure:', JSON.stringify(requestData, null, 2));

    const body = JSON.stringify(requestData);
    const headers = generateLinePayHeaders(body);

    // 發送請求到 LINE Pay API
    console.log('📤 Sending request to LINE Pay API...');
    console.log('LINE Pay request data:', {
      url: `${LINE_PAY_CONFIG.apiUrl}/v3/payments/request`,
      headers,
      body: requestData,
    });

    const response = await fetch(`${LINE_PAY_CONFIG.apiUrl}/v3/payments/request`, {
      method: 'POST',
      headers,
      body,
    });

    console.log('📥 LINE Pay response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    const result: LinePayResponse = await response.json();
    console.log('📋 LINE Pay response data:', result);

    if (result.returnCode === '0000' && result.info?.paymentUrl) {
      console.log('✅ LINE Pay request successful:', {
        returnCode: result.returnCode,
        paymentUrl: result.info.paymentUrl.web,
      });
      return {
        success: true,
        paymentUrl: result.info.paymentUrl.web,
      };
    } else {
      console.error('❌ LINE Pay request failed:', {
        returnCode: result.returnCode,
        returnMessage: result.returnMessage,
      });
      return {
        success: false,
        error: result.returnMessage || 'LINE Pay request failed',
      };
    }
  } catch (error) {
    console.error('💥 LINE Pay request error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 確認 LINE Pay 付款
export async function confirmLinePayPayment(
  transactionId: string,
  amount: number
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
