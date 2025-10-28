/**
 * PayNow 物流服務
 * 整合 PayNow 平台的 7-11 店到店物流功能
 */

import type { LogisticsInfo } from '../types';
import { getPayNowConfig } from '../config/paynow.config';
import { tripleDESEncrypt, generatePayNowPassCode, urlEncode } from '../lib/paynow-crypto';

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
      // 根據 PayNow 文件，直接構建跳轉 URL，不進行 API 調用
      const params = new URLSearchParams({
        user_account: this.config.userAccount,
        orderno: orderNumber,
        apicode: this.encryptApiCode(),
        Logistic_serviceID: logisticsServiceId,
        returnUrl: this.config.returnUrl
      });

      // 直接返回跳轉 URL
      const redirectUrl = `${this.config.baseUrl}/Member/Order/Choselogistics?${params.toString()}`;
      return redirectUrl;
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
        Sender_address: request.senderAddress || '',
        PassCode: this.generatePassCode(request.orderNumber, request.totalAmount.toString())
      };

      const encryptedData = this.encryptOrderData(orderData);
      const params = new URLSearchParams({
        JsonOrder: encryptedData
      });

      const response = await fetch(`${this.config.baseUrl}/api/Orderapi/Add_Order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return this.parseOrderResponse(result);
    } catch (error) {
      console.error('PayNow create logistics order error:', error);
      throw error;
    }
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
      const params = new URLSearchParams({
        UpdateOrder: encryptedData
      });

      const response = await fetch(`${this.config.baseUrl}/api/Orderapi/Put`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
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
   */
  private encryptApiCode(): string {
    return tripleDESEncrypt(this.config.apiCode, this.config.apiCode);
  }

  /**
   * 加密訂單資料 (TripleDES + URL Encode)
   */
  private encryptOrderData(data: Record<string, unknown>): string {
    const jsonString = JSON.stringify(data);
    const encrypted = tripleDESEncrypt(jsonString, this.config.apiCode);
    return urlEncode(encrypted);
  }

  /**
   * 生成 PassCode (SHA-1 雜湊)
   */
  private generatePassCode(orderNumber: string, totalAmount?: string): string {
    return generatePayNowPassCode(
      this.config.userAccount,
      orderNumber,
      totalAmount || '0',
      this.config.apiCode
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
