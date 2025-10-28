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

    // 測試不同的 URL 格式
    const testUrls = {
      original: redirectUrl,
      withoutAspx: redirectUrl.replace('.aspx', ''),
      withAspx: redirectUrl,
      alternative: `https://logistic.paynow.com.tw/Member/Order/Choselogistics?user_account=S225319286&orderno=${testOrderNumber}&apicode=324moonp&Logistic_serviceID=01&returnUrl=https://324-onepage.vercel.app/checkout/success`
    };

    return NextResponse.json({
      success: true,
      testOrderNumber,
      redirectUrl,
      testUrls,
      message: 'PayNow 門市選擇 URL 已生成，包含多種格式測試',
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
