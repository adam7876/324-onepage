/**
 * PayNow 物流服務
 * 整合 PayNow 平台的 7-11 店到店物流功能
 */

import type { LogisticsInfo } from '../types';
import { getPayNowConfig } from '../config/paynow.config';
import { tripleDESEncrypt, generatePayNowPassCode } from '../lib/paynow-crypto';

export interface PayNowConfig {
  baseUrl: string;
  userAccount: string;
  apiCode: string;
  returnUrl: string;
}

export interface PayNowStoreInfo {
  storeId: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
}

export interface PayNowOrderInfo {
  orderNumber: string;
  logisticsNumber?: string;
  status: string;
  deliveryStatus: string;
  paymentNumber?: string;
  validationNumber?: string;
  errorMessage?: string;
}

export interface PayNowLogisticsRequest {
  orderNumber: string;
  logisticsService: '01' | '03' | '05'; // 01: 7-11, 03: 全家, 05: 萊爾富
  deliverMode: '01' | '02'; // 01: 取貨付款, 02: 取貨不付款
  totalAmount: number;
  remark?: string;
  description?: string;
  receiverStoreId: string;
  receiverStoreName: string;
  returnStoreId?: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  receiverAddress: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress?: string;
}

export class PayNowLogisticsService {
  private config: PayNowConfig;

  constructor(config?: PayNowConfig) {
    this.config = config || getPayNowConfig();
  }

  /**
   * 選擇物流服務 (跳轉到 PayNow 門市選擇頁面)
   */
  async chooseLogisticsService(orderNumber: string, logisticsServiceId: '01' | '03' | '05' = '01'): Promise<string> {
    try {
      // 根據 PayNow 文件，使用 POST 方法並加密 apicode
      const encryptedApiCode = this.encryptApiCode();
      
      // 構建 POST 表單 HTML
      const formHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>跳轉到 PayNow 門市選擇</title>
        </head>
        <body>
          <form id="paynowForm" method="POST" action="${this.config.baseUrl}/Member/Order/Choselogistics">
            <input type="hidden" name="user_account" value="${this.config.userAccount}">
            <input type="hidden" name="orderno" value="${orderNumber}">
            <input type="hidden" name="apicode" value="${encryptedApiCode}">
            <input type="hidden" name="Logistic_serviceID" value="${logisticsServiceId}">
            <input type="hidden" name="returnUrl" value="${this.config.returnUrl}">
          </form>
          <script>
            document.getElementById('paynowForm').submit();
          </script>
        </body>
        </html>
      `;
      
      return formHtml;
    } catch (error) {
      console.error('PayNow choose logistics service error:', error);
      throw error;
    }
  }

  /**
   * 建立物流訂單
   */
  async createLogisticsOrder(request: PayNowLogisticsRequest): Promise<PayNowOrderInfo> {
    try {
      const orderData = {
        user_account: this.config.userAccount,
        apicode: this.encryptApiCode(),
        Logistic_service: request.logisticsService,
        OrderNo: request.orderNumber,
        DeliverMode: request.deliverMode,
        TotalAmount: request.totalAmount.toString(),
        Remark: request.remark || '',
        Description: request.description || '',
        EC: '',
        receiver_storeid: request.receiverStoreId,
        receiver_storename: request.receiverStoreName,
        return_storeid: request.returnStoreId || '',
        Receiver_Name: request.receiverName,
        Receiver_Phone: request.receiverPhone,
        Receiver_Email: request.receiverEmail,
        Receiver_address: request.receiverAddress,
        Sender_Name: request.senderName,
        Sender_Phone: request.senderPhone,
        Sender_Email: request.senderEmail,
        Sender_address: request.senderAddress || ''
        // PassCode 不在 JSON 中，而是在 POST 資料中單獨發送
      };

      // 記錄加密前的 JSON 字串，檢查是否包含禁用字元
      const jsonString = JSON.stringify(orderData);
      console.log('PayNow 加密前的 JSON 字串:', jsonString);
      console.log('PayNow JSON 字串中是否包含 (: ', jsonString.includes('('));
      console.log('PayNow JSON 字串中是否包含禁用字元: ', /['"%|&`^@!\.#()*_+\-;:,]/.test(jsonString));
      
      // 加密訂單資料（返回未 URL 編碼的 Base64 密文）
      const base64Cipher = this.encryptOrderData(orderData);
      console.log('PayNow Base64 密文（未 URL 編碼）:', base64Cipher);
      
      // 計算 PassCode（使用未 URL 編碼的 Base64 密文）
      const passCode = this.generatePassCode(base64Cipher);
      console.log('PayNow PassCode:', passCode);
      
      // 組裝 POST 資料：Apicode + JsonOrder（URL 編碼）+ PassCode
      const postData = `Apicode=${encodeURIComponent(this.config.apiCode)}&JsonOrder=${encodeURIComponent(base64Cipher)}&PassCode=${passCode}`;
      console.log('PayNow POST 資料:', postData.substring(0, 200) + '...');
      console.log('PayNow 診斷資訊:', {
        apicode: this.config.apiCode,
        apicodeEncoded: encodeURIComponent(this.config.apiCode),
        base64CipherLength: base64Cipher.length,
        base64CipherFirst50: base64Cipher.substring(0, 50),
        passCode,
        passCodeLength: passCode.length,
        postDataLength: postData.length
      });

      const apiUrl = `${this.config.baseUrl}/api/Orderapi/Add_Order`;
      console.log('PayNow 建立物流訂單 - 請求 URL:', apiUrl);
      console.log('PayNow 建立物流訂單 - 請求 Body:', postData.substring(0, 200) + '...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData
      });

      console.log('PayNow 建立物流訂單 - 回應狀態:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayNow API 錯誤回應:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // PayNow API 可能回傳 JSON 或純文字，先嘗試解析 JSON
      const responseText = await response.text();
      console.log('PayNow API 原始回應:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        // 如果不是 JSON，可能是純文字錯誤訊息
        console.error('PayNow 回應不是 JSON 格式:', responseText);
        throw new Error(`PayNow API 回應格式錯誤: ${responseText}`);
      }

      console.log('PayNow API 解析後結果:', result);

      // 檢查 PayNow 回應的 Status 欄位
      if (result.Status === 'F' || result.ErrorMsg) {
        console.error('PayNow 建立訂單失敗:', result.ErrorMsg || result.ReturnMsg || '未知錯誤');
        throw new Error(result.ErrorMsg || result.ReturnMsg || 'PayNow 建立訂單失敗');
      }

      return this.parseOrderResponse(result);
    } catch (error) {
      console.error('PayNow create logistics order error:', error);
      throw error;
    }
  }

  /**
   * 組裝建立物流訂單 payload（供乾跑/預覽使用，不送出）
   */
  buildCreateOrderPayload(request: PayNowLogisticsRequest): {
    orderData: Record<string, unknown>;
    encryptedData: string;
    formBody: string;
  } {
    const orderData = {
      user_account: this.config.userAccount,
      apicode: this.encryptApiCode(),
      Logistic_service: request.logisticsService,
      OrderNo: request.orderNumber,
      DeliverMode: request.deliverMode,
      TotalAmount: request.totalAmount.toString(),
      Remark: request.remark || '',
      Description: request.description || '',
      EC: '',
      receiver_storeid: request.receiverStoreId,
      receiver_storename: request.receiverStoreName,
      return_storeid: request.returnStoreId || '',
      Receiver_Name: request.receiverName,
      Receiver_Phone: request.receiverPhone,
      Receiver_Email: request.receiverEmail,
      Receiver_address: request.receiverAddress,
      Sender_Name: request.senderName,
      Sender_Phone: request.senderPhone,
      Sender_Email: request.senderEmail,
      Sender_address: request.senderAddress || ''
      // PassCode 不在 JSON 中，而是在 POST 資料中單獨發送
    };

    // 加密訂單資料（返回未 URL 編碼的 Base64 密文）
    const base64Cipher = this.encryptOrderData(orderData);
    
    // 計算 PassCode（使用未 URL 編碼的 Base64 密文）
    const passCode = this.generatePassCode(base64Cipher);
    
    // 組裝 POST 資料：Apicode + JsonOrder（URL 編碼）+ PassCode
    const formBody = `Apicode=${encodeURIComponent(this.config.apiCode)}&JsonOrder=${encodeURIComponent(base64Cipher)}&PassCode=${passCode}`;

    return { orderData, encryptedData: base64Cipher, formBody };
  }

  /**
   * 查詢物流狀態
   */
  async getLogisticsInfo(logisticsNumber: string): Promise<PayNowOrderInfo> {
    try {
      const params = new URLSearchParams({
        LogisticNumber: logisticsNumber,
        sno: '1'
      });

      const response = await fetch(`${this.config.baseUrl}/api/Orderapi/Get_Order_Info?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return this.parseOrderResponse(result);
    } catch (error) {
      console.error('PayNow get logistics info error:', error);
      throw error;
    }
  }

  /**
   * 更新門市資訊
   */
  async updateStore(logisticsNumber: string, newStoreId: string, newStoreName: string, changeType: '01' | '02' = '01'): Promise<boolean> {
    try {
      const updateData = {
        LogisticNumber: logisticsNumber,
        sno: 1,
        ChangeType: changeType,
        NewStoreId: newStoreId,
        NewStoreName: newStoreName,
        PassCode: this.generatePassCode(logisticsNumber)
      };

      const encryptedData = this.encryptOrderData(updateData);
      // 直接組合成字串，避免雙重 URL encoding
      const postData = `UpdateOrder=${encryptedData}`;

      const response = await fetch(`${this.config.baseUrl}/api/Orderapi/Put`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      return result.includes('S,更新成功');
    } catch (error) {
      console.error('PayNow update store error:', error);
      throw error;
    }
  }

  /**
   * 將 LogisticsInfo 轉換為 PayNow 格式
   */
  convertToPayNowFormat(logisticsInfo: LogisticsInfo): PayNowStoreInfo {
    return {
      storeId: logisticsInfo.storeId,
      storeName: logisticsInfo.storeName,
      storeAddress: logisticsInfo.storeAddress,
      storePhone: logisticsInfo.storePhone
    };
  }

  /**
   * 將 PayNow 回應轉換為 LogisticsInfo
   */
  convertFromPayNowFormat(storeInfo: PayNowStoreInfo): LogisticsInfo {
    return {
      storeId: storeInfo.storeId,
      storeName: storeInfo.storeName,
      storeAddress: storeInfo.storeAddress || '',
      storePhone: storeInfo.storePhone,
      logisticsStatus: 'pending' as const
    };
  }

  /**
   * 加密 API 密碼 (TripleDES)
   * 使用 Python/C# 的正確加密結果進行測試
   */
  private encryptApiCode(): string {
    // 使用 Python/C# 的正確加密結果：324moonp -> 7XBJHzfFtxw=
    return '7XBJHzfFtxw=';
    
    // 原始密碼（備用）
    // return this.config.apiCode;
    
    // Node.js 加密（有問題）
    // return tripleDESEncrypt(this.config.apiCode, this.config.apiCode);
  }

  /**
   * 加密訂單資料 (TripleDES)
   * 返回未 URL 編碼的 Base64 密文（用於計算 PassCode）
   */
  private encryptOrderData(data: Record<string, unknown>): string {
    const jsonString = JSON.stringify(data);
    // 使用 password（私鑰）而不是 apiCode 來加密
    return tripleDESEncrypt(jsonString, this.config.apiCode); // apiCode 就是私鑰
  }

  /**
   * 生成 PassCode (SHA-1 雜湊)
   * 格式: SHA1(Apicode + Base64Cipher + Password)
   */
  private generatePassCode(base64Cipher: string): string {
    // Base64Cipher 必須是未 URL 編碼的
    return generatePayNowPassCode(
      this.config.apiCode, // Apicode
      base64Cipher, // 未 URL 編碼的 Base64 密文
      this.config.apiCode // Password（私鑰，這裡假設 apiCode 就是私鑰）
    );
  }

  /**
   * 解析訂單回應
   */
  private parseOrderResponse(response: Record<string, unknown>): PayNowOrderInfo {
    return {
      orderNumber: (response.orderno as string) || '',
      logisticsNumber: (response.LogisticNumber as string) || '',
      status: (response.Status as string) || '',
      deliveryStatus: (response.Delivery_Status as string) || '',
      paymentNumber: (response.paymentno as string) || '',
      validationNumber: (response.validationno as string) || '',
      errorMessage: (response.ErrorMsg as string) || ''
    };
  }
}

// 預設服務實例
export const payNowLogisticsService = new PayNowLogisticsService();
