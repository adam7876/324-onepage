/**
 * 測試 324moonp 密碼加密
 * 對比 Python/C# 的結果
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const results = [];
    
    // 測試 324moonp 密碼
    const testPassword = "324moonp";
    const testText = "324moonp";
    const expectedResult = "7XBJHzfFtxw="; // 你提供的正確結果
    
    // 構建私鑰
    const privateKey = `1234567890${testPassword}123456`;
    const paddedKey = privateKey.substring(0, 24);
    
    // 方法 1: 使用 des-ede3-ecb 無 IV
    try {
      const cipher1 = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(0));
      cipher1.setAutoPadding(false);
      let encrypted1 = cipher1.update(testText, 'utf8', 'base64');
      encrypted1 += cipher1.final('base64');
      encrypted1 = encrypted1.replace(/\s/g, '+');
      
      results.push({
        method: 'des-ede3-ecb without IV',
        encrypted: encrypted1,
        match: encrypted1 === expectedResult,
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
    
    // 方法 2: 手動實現 Zero Padding
    try {
      const textBuffer = Buffer.from(testText, 'utf8');
      const blockSize = 8;
      const paddedLength = Math.ceil(textBuffer.length / blockSize) * blockSize;
      const paddedBuffer = Buffer.alloc(paddedLength);
      textBuffer.copy(paddedBuffer);
      
      const cipher2 = crypto.createCipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(0));
      cipher2.setAutoPadding(false);
      let encrypted2 = cipher2.update(paddedBuffer, undefined, 'base64');
      encrypted2 += cipher2.final('base64');
      encrypted2 = encrypted2.replace(/\s/g, '+');
      
      results.push({
        method: 'Manual Zero Padding',
        encrypted: encrypted2,
        match: encrypted2 === expectedResult,
        note: '手動實現 Zero Padding'
      });
    } catch (error) {
      results.push({
        method: 'Manual Zero Padding',
        encrypted: 'ERROR',
        match: false,
        note: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
    }
    
    // 方法 3: 使用 createCipher (已棄用但可能更準確)
    try {
      const cipher3 = crypto.createCipher('des-ede3', paddedKey);
      cipher3.setAutoPadding(false);
      let encrypted3 = cipher3.update(testText, 'utf8', 'base64');
      encrypted3 += cipher3.final('base64');
      encrypted3 = encrypted3.replace(/\s/g, '+');
      
      results.push({
        method: 'createCipher (deprecated)',
        encrypted: encrypted3,
        match: encrypted3 === expectedResult,
        note: '使用已棄用的 createCipher'
      });
    } catch (error) {
      results.push({
        method: 'createCipher (deprecated)',
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
      message: '324moonp 密碼加密測試完成'
    });

  } catch (error) {
    console.error('324moonp 測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '324moonp 測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
