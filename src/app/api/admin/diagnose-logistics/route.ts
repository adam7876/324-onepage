/**
 * 診斷 PayNow 物流訂單建立問題 API
 * 詳細記錄所有請求和回應資訊
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';
import type { PayNowLogisticsRequest } from '@/services/paynow-logistics.service';
import { generatePayNowPassCode } from '@/lib/paynow-crypto';
import { getPayNowConfig } from '@/config/paynow.config';

export async function POST(request: NextRequest) {
  try {
    // 管理員認證
    const authResult = await AdminAuth.verifyAdmin(request);
    if (!authResult.success) {
      return AdminAuth.createUnauthorizedResponse(authResult.error);
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: '訂單 ID 是必需的'
      }, { status: 400 });
    }

    // 查詢訂單
    const orderRef = doc(db, 'orders', orderId);
    const orderDocSnap = await getDoc(orderRef);
    
    if (!orderDocSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: '訂單不存在'
      }, { status: 404 });
    }

    const orderData = orderDocSnap.data();

    // 檢查必要條件
    if (orderData.status !== '已付款' && orderData.paymentStatus !== '已付款') {
      return NextResponse.json({
        success: false,
        error: '訂單尚未付款'
      }, { status: 400 });
    }

    if (orderData.shipping !== '7-11 超商取貨') {
      return NextResponse.json({
        success: false,
        error: '此訂單不是 7-11 超商取貨'
      }, { status: 400 });
    }

    if (!orderData.logisticsInfo || !orderData.logisticsInfo.storeId) {
      return NextResponse.json({
        success: false,
        error: '訂單缺少門市資訊'
      }, { status: 400 });
    }

    // 組裝請求資料
    const truncateName = (name: string, maxLength: number = 10): string => {
      return name.substring(0, maxLength);
    };

    const requestPayload: PayNowLogisticsRequest = {
      orderNumber: orderData.orderNumber,
      logisticsService: '01',
      deliverMode: '02',
      totalAmount: orderData.total,
      remark: orderData.customerNotes || '',
      description: `訂單 ${orderData.orderNumber}`,
      receiverStoreId: orderData.logisticsInfo.storeId,
      receiverStoreName: orderData.logisticsInfo.storeName,
      returnStoreId: '',
      receiverName: truncateName(orderData.name, 10),
      receiverPhone: orderData.phone,
      receiverEmail: orderData.email,
      receiverAddress: orderData.logisticsInfo.storeAddress,
      senderName: truncateName('324.SAMISA', 10),
      senderPhone: '0952759957',
      senderEmail: 'axikorea@gmail.com',
      senderAddress: '台北市信義區信義路五段7號'
    };

    // 取得配置
    const config = getPayNowConfig();

    // 計算 PassCode
    const passCode = generatePayNowPassCode(
      config.userAccount,
      requestPayload.orderNumber,
      requestPayload.totalAmount.toString(),
      config.apiCode
    );

    // 組裝要加密的資料
    const orderDataToEncrypt = {
      user_account: config.userAccount,
      apicode: '7XBJHzfFtxw=', // 加密後的 apicode
      Logistic_service: requestPayload.logisticsService,
      OrderNo: requestPayload.orderNumber,
      DeliverMode: requestPayload.deliverMode,
      TotalAmount: requestPayload.totalAmount.toString(),
      Remark: requestPayload.remark,
      Description: requestPayload.description,
      EC: '',
      receiver_storeid: requestPayload.receiverStoreId,
      receiver_storename: requestPayload.receiverStoreName,
      return_storeid: requestPayload.returnStoreId || '',
      Receiver_Name: requestPayload.receiverName,
      Receiver_Phone: requestPayload.receiverPhone,
      Receiver_Email: requestPayload.receiverEmail,
      Receiver_address: requestPayload.receiverAddress,
      Sender_Name: requestPayload.senderName,
      Sender_Phone: requestPayload.senderPhone,
      Sender_Email: requestPayload.senderEmail,
      Sender_address: requestPayload.senderAddress || '',
      PassCode: passCode
    };

    // 建立 payload 預覽
    const preview = payNowLogisticsService.buildCreateOrderPayload(requestPayload);

    // 嘗試實際建立（捕捉所有錯誤）
    let actualResponse = null;
    let actualError = null;
    try {
      const result = await payNowLogisticsService.createLogisticsOrder(requestPayload);
      actualResponse = result;
    } catch (error) {
      actualError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        config: {
          baseUrl: config.baseUrl,
          userAccount: config.userAccount,
          apiCode: '***' // 隱藏真實密碼
        },
        requestPayload: {
          ...requestPayload,
          receiverName: `${requestPayload.receiverName} (${requestPayload.receiverName.length} 字元)`,
          senderName: `${requestPayload.senderName} (${requestPayload.senderName.length} 字元)`
        },
        passCodeCalculation: {
          formula: 'user_account + OrderNo + TotalAmount + apicode',
          calculation: `${config.userAccount} + ${requestPayload.orderNumber} + ${requestPayload.totalAmount} + ${config.apiCode}`,
          passCode: passCode
        },
        orderDataToEncrypt: orderDataToEncrypt,
        preview: preview,
        actualResponse: actualResponse,
        actualError: actualError,
        apiUrl: `${config.baseUrl}/api/Orderapi/Add_Order`
      }
    });

  } catch (error) {
    console.error('診斷 API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
