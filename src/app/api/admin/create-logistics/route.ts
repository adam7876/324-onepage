/**
 * 管理員手動建立 PayNow 物流訂單 API
 * 由管理員在確認對帳後手動觸發
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';
import { getDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';
import type { PayNowLogisticsRequest } from '@/services/paynow-logistics.service';

export async function POST(request: NextRequest) {
  try {
    // 管理員認證
    const authResult = await AdminAuth.verifyAdmin(request);
    if (!authResult.success) {
      return AdminAuth.createUnauthorizedResponse(authResult.error);
    }

    const body = await request.json();
    const { orderId, dryRun } = body as { orderId: string; dryRun?: boolean };

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

    // 檢查訂單是否已付款
    if (orderData.status !== '已付款' && orderData.paymentStatus !== '已付款') {
      return NextResponse.json({
        success: false,
        error: '訂單尚未付款，無法建立物流訂單'
      }, { status: 400 });
    }

    // 檢查是否為 7-11 超商取貨
    if (orderData.shipping !== '7-11 超商取貨') {
      return NextResponse.json({
        success: false,
        error: '此訂單不是 7-11 超商取貨，無法建立物流訂單'
      }, { status: 400 });
    }

    // 檢查是否已有門市資訊
    if (!orderData.logisticsInfo || !orderData.logisticsInfo.storeId) {
      return NextResponse.json({
        success: false,
        error: '訂單缺少門市資訊，無法建立物流訂單'
      }, { status: 400 });
    }

    // 檢查是否已經建立過物流訂單
    if (orderData.logisticsInfo.logisticsNo) {
      return NextResponse.json({
        success: false,
        error: '此訂單已建立過物流訂單',
        logisticsNo: orderData.logisticsInfo.logisticsNo
      }, { status: 400 });
    }

    // 建立 PayNow 物流訂單（支援乾跑）
    try {
      // 7-11 交貨便的姓名長度限制為 10 個字元
      const truncateName = (name: string, maxLength: number = 10): string => {
        return name.substring(0, maxLength);
      };

      const requestPayload: PayNowLogisticsRequest = {
        orderNumber: orderData.orderNumber,
        logisticsService: '01', // 7-11 交貨便
        deliverMode: '02', // 取貨不付款
        totalAmount: orderData.total,
        remark: orderData.customerNotes || '',
        description: `訂單 ${orderData.orderNumber}`,
        receiverStoreId: orderData.logisticsInfo.storeId,
        receiverStoreName: orderData.logisticsInfo.storeName,
        returnStoreId: '',
        receiverName: truncateName(orderData.name, 10), // 7-11 限制 10 字元
        receiverPhone: orderData.phone,
        receiverEmail: orderData.email,
        receiverAddress: orderData.logisticsInfo.storeAddress,
        senderName: truncateName('324.SAMISA', 10), // 7-11 限制 10 字元
        senderPhone: '0952759957',
        senderEmail: 'axikorea@gmail.com',
        senderAddress: '台北市信義區信義路五段7號'
      };

      if (dryRun) {
        const preview = payNowLogisticsService.buildCreateOrderPayload(requestPayload);
        return NextResponse.json({
          success: true,
          dryRun: true,
          preview
        });
      }

      const logisticsResult = await payNowLogisticsService.createLogisticsOrder(requestPayload);

      // 更新訂單物流資訊
      await updateDoc(orderRef, {
        'logisticsInfo.logisticsNo': logisticsResult.logisticsNumber,
        'logisticsInfo.logisticsStatus': 'shipped',
        'logisticsInfo.shippedAt': Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: '物流訂單建立成功',
        logisticsInfo: {
          logisticsNumber: logisticsResult.logisticsNumber,
          status: logisticsResult.status,
          paymentNumber: logisticsResult.paymentNumber,
          validationNumber: logisticsResult.validationNumber
        }
      });

    } catch (logisticsError) {
      console.error('PayNow 物流訂單建立失敗:', logisticsError);
      return NextResponse.json({
        success: false,
        error: '建立物流訂單失敗',
        details: logisticsError instanceof Error ? logisticsError.message : '未知錯誤'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('建立物流訂單 API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
