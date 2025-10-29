/**
 * PayNow 簡單加密測試
 * 測試基本的 TripleDES 加密功能
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    // 測試附錄一的範例
    const password = '70828783';
    const text = '402595001111222299912/12';
    const expectedResult = 'Sg8WeCxr1ebvGrkGOkjH7UvrNKxCEeJF';
    
    // 構建私鑰
    const privateKey = `1234567890${password}123456`;
    const paddedKey = privateKey.substring(0, 24);
    
    console.log('Test details:', {
      password,
      text,
      privateKey,
      paddedKey,
      paddedKeyLength: paddedKey.length
    });
    
    // 嘗試不同的加密方法
    const results = [];
    
    // 方法 1: 使用零向量 IV
    try {
      const iv1 = Buffer.alloc(8, 0);
      const cipher1 = crypto.createCipheriv('des-ede3', Buffer.from(paddedKey, 'utf8'), iv1);
      cipher1.setAutoPadding(false);
      let encrypted1 = cipher1.update(text, 'utf8', 'base64');
      encrypted1 += cipher1.final('base64');
      encrypted1 = encrypted1.replace(/\s/g, '+');
      
      results.push({
        method: 'Zero IV',
        encrypted: encrypted1,
        match: encrypted1 === expectedResult
      });
    } catch (error) {
      results.push({
        method: 'Zero IV',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // 方法 2: 使用 '12345678' 作為 IV
    try {
      const iv2 = Buffer.from('12345678', 'utf8');
      const cipher2 = crypto.createCipheriv('des-ede3', Buffer.from(paddedKey, 'utf8'), iv2);
      cipher2.setAutoPadding(false);
      let encrypted2 = cipher2.update(text, 'utf8', 'base64');
      encrypted2 += cipher2.final('base64');
      encrypted2 = encrypted2.replace(/\s/g, '+');
      
      results.push({
        method: '12345678 IV',
        encrypted: encrypted2,
        match: encrypted2 === expectedResult
      });
    } catch (error) {
      results.push({
        method: '12345678 IV',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // 方法 3: 使用 createCipher (已棄用但可能有效)
    try {
      const cipher3 = crypto.createCipher('des-ede3', paddedKey);
      cipher3.setAutoPadding(false);
      let encrypted3 = cipher3.update(text, 'utf8', 'base64');
      encrypted3 += cipher3.final('base64');
      encrypted3 = encrypted3.replace(/\s/g, '+');
      
      results.push({
        method: 'createCipher (deprecated)',
        encrypted: encrypted3,
        match: encrypted3 === expectedResult
      });
    } catch (error) {
      results.push({
        method: 'createCipher (deprecated)',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json({
      success: true,
      testData: {
        password,
        text,
        expectedResult,
        privateKey,
        paddedKey,
        paddedKeyLength: paddedKey.length
      },
      results,
      message: 'PayNow 簡單加密測試完成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple encryption test error:', error);
    return NextResponse.json({
      success: false,
      error: '簡單加密測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
