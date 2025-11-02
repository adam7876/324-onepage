/**
 * 測試建立 PayNow 物流訂單 API（直接測試，不更新資料庫）
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';
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
    const { orderNumber } = body;

    if (!orderNumber) {
      return NextResponse.json({
        success: false,
        error: '訂單編號是必需的'
      }, { status: 400 });
    }

    // 測試用的物流訂單資料（使用你的實際訂單資料）
    const testPayload: PayNowLogisticsRequest = {
      orderNumber: orderNumber,
      logisticsService: '01', // 7-11 交貨便
      deliverMode: '02', // 取貨不付款
      totalAmount: 20,
      remark: '',
      description: `測試訂單 ${orderNumber}`,
      receiverStoreId: '193867',
      receiverStoreName: '陽光城門市',
      returnStoreId: '',
      receiverName: 'YUN CHE TS', // 已截斷到 10 字元
      receiverPhone: '0952759957',
      receiverEmail: 'adam11341@gmail.com',
      receiverAddress: '台南市善化區蓮潭里9鄰陽光大道198號1樓',
      senderName: '324.SAMISA',
      senderPhone: '0952759957',
      senderEmail: 'axikorea@gmail.com',
      senderAddress: '台北市信義區信義路五段7號'
    };

    try {
      console.log('開始測試建立 PayNow 物流訂單...');
      const result = await payNowLogisticsService.createLogisticsOrder(testPayload);
      
      return NextResponse.json({
        success: true,
        message: '測試建立物流訂單成功',
        result: result,
        note: '這是測試，不會更新資料庫'
      });
    } catch (error) {
      console.error('測試建立 PayNow 物流訂單失敗:', error);
      return NextResponse.json({
        success: false,
        error: '測試建立物流訂單失敗',
        details: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('測試 API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
