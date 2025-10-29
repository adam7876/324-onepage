/**
 * PayNow 測試 API
 * 測試門市選擇 URL 生成
 */

import { NextResponse } from 'next/server';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';

export async function GET() {
  try {
    const testOrderNumber = `TEST_${Date.now()}`;
    const formHtml = await payNowLogisticsService.chooseLogisticsService(testOrderNumber, '01');

    return NextResponse.json({
      success: true,
      testOrderNumber,
      formHtml,
      message: 'PayNow 門市選擇表單已生成，使用 POST 方法和加密 apicode',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PayNow test error:', error);
    return NextResponse.json({
      success: false,
      error: '無法生成 PayNow 門市選擇表單',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
