/**
 * 測試替代的 TripleDES 實現
 * 嘗試不同的 Node.js 方法
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const results = [];
    
    const testPassword = "324moonp";
    const testText = "324moonp";
    const expectedResult = "7XBJHzfFtxw=";
    
    const privateKey = `1234567890${testPassword}123456`;
    const paddedKey = privateKey.substring(0, 24);
    const keyBuffer = Buffer.from(paddedKey, 'utf8');
    const textBuffer = Buffer.from(testText, 'utf8');
    
    // 方法 1: 使用 des-ede3 (不是 des-ede3-ecb)
    try {
      const cipher1 = crypto.createCipheriv('des-ede3', keyBuffer, Buffer.alloc(0));
      cipher1.setAutoPadding(false);
      let encrypted1 = cipher1.update(textBuffer, undefined, 'base64');
      encrypted1 += cipher1.final('base64');
      encrypted1 = encrypted1.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3 without IV',
        encrypted: encrypted1,
        match: encrypted1 === expectedResult,
        success: true
      });
    } catch (error) {
      results.push({
        method: 'des-ede3 without IV',
        encrypted: 'ERROR',
        match: false,
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
    
    // 方法 2: 使用 des-ede3 與 12345678 IV
    try {
      const cipher2 = crypto.createCipheriv('des-ede3', keyBuffer, Buffer.from('12345678', 'utf8'));
      cipher2.setAutoPadding(false);
      let encrypted2 = cipher2.update(textBuffer, undefined, 'base64');
      encrypted2 += cipher2.final('base64');
      encrypted2 = encrypted2.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3 with 12345678 IV',
        encrypted: encrypted2,
        match: encrypted2 === expectedResult,
        success: true
      });
    } catch (error) {
      results.push({
        method: 'des-ede3 with 12345678 IV',
        encrypted: 'ERROR',
        match: false,
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
    
    // 方法 3: 使用 des-ede3-cbc 與 12345678 IV
    try {
      const cipher3 = crypto.createCipheriv('des-ede3-cbc', keyBuffer, Buffer.from('12345678', 'utf8'));
      cipher3.setAutoPadding(false);
      let encrypted3 = cipher3.update(textBuffer, undefined, 'base64');
      encrypted3 += cipher3.final('base64');
      encrypted3 = encrypted3.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3-cbc with 12345678 IV',
        encrypted: encrypted3,
        match: encrypted3 === expectedResult,
        success: true
      });
    } catch (error) {
      results.push({
        method: 'des-ede3-cbc with 12345678 IV',
        encrypted: 'ERROR',
        match: false,
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
    
    // 方法 4: 手動實現 ECB 模式
    try {
      // ECB 模式：直接加密每個 8 字節塊
      const blockSize = 8;
      let encrypted4 = '';
      
      for (let i = 0; i < textBuffer.length; i += blockSize) {
        const block = textBuffer.subarray(i, i + blockSize);
        const cipher = crypto.createCipheriv('des-ede3', keyBuffer, Buffer.alloc(0));
        cipher.setAutoPadding(false);
        let blockEncrypted = cipher.update(block, undefined, 'base64');
        blockEncrypted += cipher.final('base64');
        encrypted4 += blockEncrypted;
      }
      encrypted4 = encrypted4.replace(/\s/g, '+');
      
      results.push({
        method: 'Manual ECB with des-ede3',
        encrypted: encrypted4,
        match: encrypted4 === expectedResult,
        success: true
      });
    } catch (error) {
      results.push({
        method: 'Manual ECB with des-ede3',
        encrypted: 'ERROR',
        match: false,
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
    
    return NextResponse.json({
      success: true,
      testData: {
        password: testPassword,
        text: testText,
        expected: expectedResult,
        privateKey,
        paddedKey
      },
      results,
      message: '替代 TripleDES 實現測試完成'
    });

  } catch (error) {
    console.error('替代實現測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '替代實現測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
