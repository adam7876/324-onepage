/**
 * PayNow 加密測試 API
 * 測試 TripleDES 加密是否正常工作
 */

import { NextResponse } from 'next/server';
import { tripleDESEncrypt, generatePayNowPassCode } from '@/lib/paynow-crypto';

export async function GET() {
  try {
    const testPassword = '324moonp';
    const testText = '324moonp';
    
    // 測試私鑰生成
    const privateKey = `1234567890${testPassword}123456`;
    const paddedKey = privateKey.padEnd(24, '0').substring(0, 24);
    
    // 測試加密
    const encrypted = tripleDESEncrypt(testText, testPassword);
    
    // 測試 PassCode 生成
    const passCode = generatePayNowPassCode('S225319286', 'TEST123', '100', testPassword);
    
    return NextResponse.json({
      success: true,
      testPassword,
      testText,
      privateKey,
      paddedKey,
      paddedKeyLength: paddedKey.length,
      encrypted,
      passCode,
      message: 'PayNow 加密測試完成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PayNow encryption test error:', error);
    return NextResponse.json({
      success: false,
      error: 'PayNow 加密測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
