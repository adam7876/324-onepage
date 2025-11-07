/**
 * PayNow 詳細調試 API
 * 分析 PayNow 的具體加密要求
 */

import { NextResponse } from 'next/server';
import { getPayNowConfig } from '@/config/paynow.config';
import { tripleDESEncrypt, generatePayNowPassCode } from '@/lib/paynow-crypto';
import crypto from 'crypto';

export async function GET() {
  try {
    const config = getPayNowConfig();
    const results = [];

    // 測試不同的加密方式
    const testPassword = config.apiCode; // "324moonp"
    const testText = config.apiCode; // "324moonp"
    
    // 1. 測試原始密碼（不加密）
    results.push({
      method: '原始密碼',
      apicode: testPassword,
      note: '直接使用原始密碼，不加密'
    });

    // 2. 測試 Base64 編碼
    results.push({
      method: 'Base64 編碼',
      apicode: Buffer.from(testPassword, 'utf8').toString('base64'),
      note: 'Base64 編碼的原始密碼'
    });

    // 3. 測試 URL 編碼
    results.push({
      method: 'URL 編碼',
      apicode: encodeURIComponent(testPassword),
      note: 'URL 編碼的原始密碼'
    });

    // 4. 測試 TripleDES 加密（當前方式）
    try {
      const encrypted = tripleDESEncrypt(testPassword, testPassword);
      results.push({
        method: 'TripleDES 加密（當前）',
        apicode: encrypted,
        note: '使用 TripleDES 加密'
      });
    } catch (error) {
      results.push({
        method: 'TripleDES 加密（當前）',
        apicode: 'ERROR',
        note: `加密失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }

    // 5. 測試不同的私鑰格式
    const privateKeyFormats = [
      `1234567890${testPassword}123456`, // 當前格式
      `1234567890${testPassword}1234567890`, // 加長格式
      testPassword, // 直接使用密碼
      `1234567890${testPassword}`, // 前綴格式
      `${testPassword}123456`, // 後綴格式
    ];

    for (const privateKey of privateKeyFormats) {
      try {
        const paddedKey = privateKey.substring(0, 24);
        const iv = Buffer.alloc(8, 0);
        const cipher = crypto.createCipheriv('des-ede3-cbc', Buffer.from(paddedKey, 'utf8'), iv);
        cipher.setAutoPadding(false);
        
        let encrypted = cipher.update(testText, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        encrypted = encrypted.replace(/\s/g, '+');
        
        results.push({
          method: `私鑰格式: ${privateKey.substring(0, 20)}...`,
          apicode: encrypted,
          note: `私鑰長度: ${privateKey.length}, 填充後: ${paddedKey.length}`
        });
      } catch (error) {
        results.push({
          method: `私鑰格式: ${privateKey.substring(0, 20)}...`,
          apicode: 'ERROR',
          note: `加密失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
        });
      }
    }

    // 6. 測試 PassCode 生成（使用測試用的 base64Cipher）
    const testBase64Cipher = 'TEST_BASE64_CIPHER';
    const passCode = generatePayNowPassCode(config.apiCode, testBase64Cipher, config.apiCode);
    
    return NextResponse.json({
      success: true,
      config: {
        userAccount: config.userAccount,
        apiCode: config.apiCode,
        baseUrl: config.baseUrl
      },
      testData: {
        password: testPassword,
        text: testText
      },
      results,
      passCode,
      message: 'PayNow 詳細調試完成'
    });

  } catch (error) {
    console.error('PayNow 詳細調試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '調試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
