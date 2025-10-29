/**
 * PayNow 配置檢查 API
 * 檢查當前 PayNow 配置是否為測試模式
 */

import { NextResponse } from 'next/server';
import { getPayNowConfig } from '@/config/paynow.config';

export async function GET() {
  try {
    const config = getPayNowConfig();
    
    return NextResponse.json({
      success: true,
      config: {
        baseUrl: config.baseUrl,
        userAccount: config.userAccount,
        apiCode: config.apiCode ? `${config.apiCode.substring(0, 4)}****` : 'Not set',
        returnUrl: config.returnUrl,
        testMode: config.testMode,
        nodeEnv: process.env.NODE_ENV,
        paynowTestMode: process.env.PAYNOW_TEST_MODE
      },
      message: config.testMode ? '目前為測試模式' : '目前為正式模式 - 會產生真實物流訂單',
      warning: config.testMode ? null : '⚠️ 注意：目前為正式模式，物流訂單會真實建立並產生費用',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('PayNow 配置檢查錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
