/**
 * 檢查 PayNow 物流訂單狀態 API
 * 查詢特定訂單的物流狀態
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayNowConfig } from '@/config/paynow.config';
import { generatePayNowPassCode } from '@/lib/paynow-crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('orderNumber');
    
    if (!orderNumber) {
      return NextResponse.json({
        success: false,
        error: '訂單編號是必需的',
        usage: '使用方式: /api/paynow/check-order?orderNumber=20251030001'
      }, { status: 400 });
    }

    const config = getPayNowConfig();
    
    // 查詢 PayNow 物流訂單狀態
    const queryUrl = `${config.baseUrl}/api/Orderapi/Get_Order_Info_orderno?orderno=${encodeURIComponent(orderNumber)}&user_account=${config.userAccount}&sno=1`;
    
    console.log('查詢 PayNow 物流訂單:', {
      orderNumber,
      queryUrl,
      userAccount: config.userAccount
    });

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`PayNow API 回應錯誤: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    console.log('PayNow API 回應:', data);

    // 嘗試解析回應
    let orderInfo;
    try {
      orderInfo = JSON.parse(data);
    } catch (parseError) {
      console.error('解析 PayNow 回應失敗:', parseError);
      return NextResponse.json({
        success: false,
        error: '無法解析 PayNow 回應',
        rawResponse: data,
        orderNumber,
        queryUrl
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      payNowResponse: orderInfo,
      queryUrl,
      timestamp: new Date().toISOString(),
      message: orderInfo.ErrorMsg ? `PayNow 錯誤: ${orderInfo.ErrorMsg}` : '查詢成功'
    });

  } catch (error) {
    console.error('檢查 PayNow 物流訂單錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
