/**
 * PayNow 門市選擇 API
 * 跳轉到 PayNow 門市選擇頁面
 */

import { NextRequest, NextResponse } from 'next/server';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber) {
      return NextResponse.json({
        success: false,
        error: '訂單編號是必需的'
      }, { status: 400 });
    }

    // 生成 PayNow 門市選擇 URL
    const redirectUrl = await payNowLogisticsService.chooseLogisticsService(orderNumber, '01');

    return NextResponse.json({
      success: true,
      redirectUrl,
      message: '門市選擇頁面已準備就緒'
    });

  } catch (error) {
    console.error('PayNow 門市選擇錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '無法開啟門市選擇頁面',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
