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
import { getPayNowConfig } from '@/config/paynow.config';

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

      // 移除 Ibon 禁用字元（根據 PayNow API 文件，7-11 訂單所有欄位都不能包含這些字元）
      // 禁用字元: ', ", %, |, &, `, ^, @, !, ., #, (, ), *, _, +, -, ;, :, ,
      // 注意：Email 欄位需要保留 @ 和 . 符號，所以使用特殊處理
      const removeIbonForbiddenChars = (text: string, preserveAt: boolean = false): string => {
        if (!text) return text;
        if (preserveAt) {
          // Email 欄位：只移除會破壞 Email 格式的禁用字元，保留 @ 和 .
          return text.replace(/['"%|&`^!#()*_+\-;:,]/g, '');
        } else {
          // 其他欄位：移除所有禁用字元（包括 @ 和 .）
          return text.replace(/['"%|&`^@!\.#()*_+\-;:,]/g, '');
        }
      };

      // 驗證 OrderNo 只包含英文和數字（根據 PayNow API 文件要求）
      const sanitizeOrderNumber = (orderNumber: string): string => {
        return orderNumber.replace(/[^a-zA-Z0-9]/g, '');
      };

      const cleanedOrderNumber = sanitizeOrderNumber(orderData.orderNumber);
      
      const requestPayload: PayNowLogisticsRequest = {
        orderNumber: cleanedOrderNumber, // 只保留英文和數字
        logisticsService: '01', // 7-11 交貨便
        deliverMode: '02', // 取貨不付款
        totalAmount: orderData.total,
        remark: removeIbonForbiddenChars(orderData.customerNotes || ''),
        description: removeIbonForbiddenChars(`訂單${cleanedOrderNumber}`), // 使用清理後的訂單編號
        receiverStoreId: removeIbonForbiddenChars(orderData.logisticsInfo.storeId),
        receiverStoreName: removeIbonForbiddenChars(orderData.logisticsInfo.storeName),
        returnStoreId: '',
        receiverName: truncateName(removeIbonForbiddenChars(orderData.name), 10), // 先移除禁用字元再截斷
        receiverPhone: orderData.phone,
        receiverEmail: removeIbonForbiddenChars(orderData.email, true), // Email 保留 @ 符號
        receiverAddress: removeIbonForbiddenChars(orderData.logisticsInfo.storeAddress),
        senderName: truncateName(removeIbonForbiddenChars('324SAMISA'), 10), // 移除點號，7-11 限制 10 字元
        senderPhone: '0952759957',
        senderEmail: removeIbonForbiddenChars('axikorea@gmail.com', true), // Email 保留 @ 符號
        senderAddress: removeIbonForbiddenChars('台北市信義區信義路五段7號')
      };

      if (dryRun) {
        const preview = payNowLogisticsService.buildCreateOrderPayload(requestPayload);
        const config = getPayNowConfig();
        
        // 解析 formBody 獲取 JsonOrder 參數（用於 Postman 測試）
        const jsonOrderMatch = preview.formBody.match(/JsonOrder=([^&]+)/);
        
        // 從 orderData 中提取 PassCode（PassCode 現在在 JSON 中）
        const passCode = preview.orderData?.PassCode as string | undefined;
        
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: '以下資料可用於 Postman 測試（使用 x-www-form-urlencoded）',
          postmanTest: {
            standard: {
              Apicode: config.apiCode,
              JsonOrder: jsonOrderMatch ? decodeURIComponent(jsonOrderMatch[1]) : '',
              PassCode: passCode ?? preview.orderData.PassCode
            },
            legacy: {
              Apicode: config.apiCode,
              payload: preview.legacy?.payload ?? '',
              JsonOrder: preview.legacy ? decodeURIComponent(preview.legacy.encryptedData) : '',
              PassCode: passCode ?? preview.orderData.PassCode
            }
          },
          preview: {
            ...preview,
            // 添加原始 JSON 供參考
            jsonString: JSON.stringify(preview.orderData),
            // 添加 PassCode 計算用的原始值
            passCodeCalculation: {
              user_account: config.userAccount,
              OrderNo: requestPayload.orderNumber,
              TotalAmount: requestPayload.totalAmount.toString(),
              apicode: config.apiCode,
              combined: `${config.userAccount}${requestPayload.orderNumber}${requestPayload.totalAmount.toString()}${config.apiCode}`,
              expectedPassCode: passCode
            }
          }
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
