/**
 * PayNow 環境變數測試 API
 * 檢查環境變數是否正確載入
 */

import { NextResponse } from 'next/server';
import { getPayNowConfig } from '@/config/paynow.config';

export async function GET() {
  try {
    // 取得配置
    const config = getPayNowConfig();
    
    // 檢查環境變數
    const envCheck = {
      PAYNOW_USER_ACCOUNT: process.env.PAYNOW_USER_ACCOUNT,
      PAYNOW_API_CODE: process.env.PAYNOW_API_CODE,
      PAYNOW_BASE_URL: process.env.PAYNOW_BASE_URL,
      PAYNOW_RETURN_URL: process.env.PAYNOW_RETURN_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    // 測試私鑰生成
    const privateKey = `1234567890${config.apiCode}123456`;
    const paddedKey = privateKey.substring(0, 24);
    
    return NextResponse.json({
      success: true,
      config,
      envCheck,
      keyGeneration: {
        apiCode: config.apiCode,
        privateKey,
        paddedKey,
        paddedKeyLength: paddedKey.length
      },
      message: 'PayNow 環境變數測試完成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PayNow env test error:', error);
    return NextResponse.json({
      success: false,
      error: 'PayNow 環境變數測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
