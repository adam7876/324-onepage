/**
 * PayNow 加密測試 API
 * 測試 TripleDES 加密是否正常工作
 */

import { NextResponse } from 'next/server';
import { tripleDESEncrypt, generatePayNowPassCode } from '@/lib/paynow-crypto';

export async function GET() {
  try {
    // 測試附錄一的範例
    const examplePassword = '70828783';
    const exampleText = '402595001111222299912/12';
    const expectedResult = 'Sg8WeCxr1ebvGrkGOkjH7UvrNKxCEeJF';
    
    // 測試你的實際密碼
    const yourPassword = '324moonp';
    const yourText = '324moonp';
    
    // 測試附錄一範例
    const exampleEncrypted = tripleDESEncrypt(exampleText, examplePassword);
    const exampleMatch = exampleEncrypted === expectedResult;
    
    // 測試你的密碼
    const yourEncrypted = tripleDESEncrypt(yourText, yourPassword);
    
    // 測試私鑰生成
    const yourPrivateKey = `1234567890${yourPassword}123456`;
    const yourPaddedKey = yourPrivateKey.substring(0, 24);
    
    // 測試 PassCode 生成（使用測試用的 base64Cipher）
    const testBase64Cipher = 'TEST_BASE64_CIPHER';
    const passCode = generatePayNowPassCode('S225319286', testBase64Cipher, yourPassword);
    
    return NextResponse.json({
      success: true,
      // 附錄一範例測試
      exampleTest: {
        password: examplePassword,
        text: exampleText,
        expected: expectedResult,
        actual: exampleEncrypted,
        match: exampleMatch
      },
      // 你的密碼測試
      yourTest: {
        password: yourPassword,
        text: yourText,
        privateKey: yourPrivateKey,
        paddedKey: yourPaddedKey,
        paddedKeyLength: yourPaddedKey.length,
        encrypted: yourEncrypted
      },
      // PassCode 測試
      passCodeTest: {
        passCode: passCode
      },
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
