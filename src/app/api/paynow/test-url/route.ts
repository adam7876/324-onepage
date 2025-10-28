/**
 * PayNow 測試 API
 * 測試門市選擇 URL 生成
 */

import { NextResponse } from 'next/server';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';

export async function GET() {
  try {
    const testOrderNumber = `TEST_${Date.now()}`;
    const redirectUrl = await payNowLogisticsService.chooseLogisticsService(testOrderNumber, '01');

    return NextResponse.json({
      success: true,
      testOrderNumber,
      redirectUrl,
      message: 'PayNow 門市選擇 URL 已生成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PayNow test error:', error);
    return NextResponse.json({
      success: false,
      error: '無法生成 PayNow 門市選擇 URL',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
