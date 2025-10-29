/**
 * 測試 ECB 模式加密
 * 完全按照 PayNow 附錄一實現
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const results = [];
    
    // PayNow 附錄一測試資料
    const testPassword = "70828783";
    const testText = "402595001111222299912/12";
    const expectedResult = "Sg8WeCxr1ebvGrkGOkjH7UvrNKxCEeJF";
    
    // 1. 測試不同的 ECB 實現方式
    const privateKey = `1234567890${testPassword}123456`;
    const paddedKey = privateKey.substring(0, 24);
    const iv = Buffer.from('12345678', 'utf8');
    
    // 方法 1: 使用 des-ede3-ecb
    try {
      const cipher1 = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), iv);
      cipher1.setAutoPadding(false);
      let encrypted1 = cipher1.update(testText, 'utf8', 'base64');
      encrypted1 += cipher1.final('base64');
      encrypted1 = encrypted1.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3-ecb with IV',
        encrypted: encrypted1,
        match: encrypted1 === expectedResult,
        note: '使用 IV 的 ECB 模式'
      });
    } catch (error) {
      results.push({
        method: 'des-ede3-ecb with IV',
        encrypted: 'ERROR',
        match: false,
        note: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }
    
    // 方法 2: 使用 des-ede3-ecb 無 IV
    try {
      const cipher2 = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(0));
      cipher2.setAutoPadding(false);
      let encrypted2 = cipher2.update(testText, 'utf8', 'base64');
      encrypted2 += cipher2.final('base64');
      encrypted2 = encrypted2.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3-ecb without IV',
        encrypted: encrypted2,
        match: encrypted2 === expectedResult,
        note: '不使用 IV 的 ECB 模式'
      });
    } catch (error) {
      results.push({
        method: 'des-ede3-ecb without IV',
        encrypted: 'ERROR',
        match: false,
        note: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }
    
    // 方法 3: 使用 des-ede3-ecb 零 IV
    try {
      const cipher3 = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(8, 0));
      cipher3.setAutoPadding(false);
      let encrypted3 = cipher3.update(testText, 'utf8', 'base64');
      encrypted3 += cipher3.final('base64');
      encrypted3 = encrypted3.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3-ecb zero IV',
        encrypted: encrypted3,
        match: encrypted3 === expectedResult,
        note: '使用零 IV 的 ECB 模式'
      });
    } catch (error) {
      results.push({
        method: 'des-ede3-ecb zero IV',
        encrypted: 'ERROR',
        match: false,
        note: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }
    
    // 方法 4: 手動實現 ECB 模式
    try {
      // ECB 模式不使用 IV，直接加密每個 8 字節塊
      const textBuffer = Buffer.from(testText, 'utf8');
      const blockSize = 8;
      const paddedLength = Math.ceil(textBuffer.length / blockSize) * blockSize;
      const paddedBuffer = Buffer.alloc(paddedLength);
      textBuffer.copy(paddedBuffer);
      
      let encrypted4 = '';
      for (let i = 0; i < paddedLength; i += blockSize) {
        const block = paddedBuffer.subarray(i, i + blockSize);
        const cipher = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(0));
        cipher.setAutoPadding(false);
        let blockEncrypted = cipher.update(block, undefined, 'base64');
        blockEncrypted += cipher.final('base64');
        encrypted4 += blockEncrypted;
      }
      encrypted4 = encrypted4.replace(/\s/g, '+');
      
      results.push({
        method: 'Manual ECB blocks',
        encrypted: encrypted4,
        match: encrypted4 === expectedResult,
        note: '手動實現 ECB 模式'
      });
    } catch (error) {
      results.push({
        method: 'Manual ECB blocks',
        encrypted: 'ERROR',
        match: false,
        note: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }
    
    return NextResponse.json({
      success: true,
      testData: {
        password: testPassword,
        text: testText,
        expected: expectedResult,
        privateKey,
        paddedKey,
        paddedKeyLength: paddedKey.length
      },
      results,
      message: 'ECB 模式加密測試完成'
    });

  } catch (error) {
    console.error('ECB 測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: 'ECB 測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
