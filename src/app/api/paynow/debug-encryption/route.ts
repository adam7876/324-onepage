/**
 * PayNow 加密調試 API
 * 詳細分析加密過程中的每個步驟
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    // 附錄一範例
    const password = '70828783';
    const text = '402595001111222299912/12';
    const expectedResult = 'Sg8WeCxr1ebvGrkGOkjH7UvrNKxCEeJF';
    
    // 詳細分析密鑰生成
    const privateKey = `1234567890${password}123456`;
    const paddedKey = privateKey.substring(0, 24);
    
    console.log('Debug details:', {
      password,
      text,
      privateKey,
      paddedKey,
      paddedKeyLength: paddedKey.length,
      paddedKeyBytes: Buffer.from(paddedKey, 'utf8').length
    });
    
    const results = [];
    
    // 測試 1: 檢查密鑰是否正確
    const keyBuffer = Buffer.from(paddedKey, 'utf8');
    results.push({
      test: 'Key Analysis',
      privateKey,
      paddedKey,
      keyLength: paddedKey.length,
      keyBufferLength: keyBuffer.length,
      keyBufferHex: keyBuffer.toString('hex')
    });
    
    // 測試 2: 檢查文字編碼
    const textBuffer = Buffer.from(text, 'utf8');
    results.push({
      test: 'Text Analysis',
      originalText: text,
      textLength: text.length,
      textBufferLength: textBuffer.length,
      textBufferHex: textBuffer.toString('hex')
    });
    
    // 測試 3: 嘗試不同的填充方式
    try {
      const iv = Buffer.from('12345678', 'utf8');
      const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuffer, iv);
      cipher.setAutoPadding(true); // 使用自動填充
      
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      encrypted = encrypted.replace(/\s/g, '+');
      
      results.push({
        test: 'Auto Padding',
        encrypted,
        match: encrypted === expectedResult
      });
    } catch (error) {
      results.push({
        test: 'Auto Padding',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // 測試 4: 嘗試手動填充
    try {
      const iv = Buffer.from('12345678', 'utf8');
      const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuffer, iv);
      cipher.setAutoPadding(false);
      
      // 手動填充到 8 字節的倍數
      const blockSize = 8;
      const textBufferPadded = Buffer.alloc(Math.ceil(textBuffer.length / blockSize) * blockSize);
      textBuffer.copy(textBufferPadded);
      
      let encrypted = cipher.update(textBufferPadded, undefined, 'base64');
      encrypted += cipher.final('base64');
      encrypted = encrypted.replace(/\s/g, '+');
      
      results.push({
        test: 'Manual Padding',
        originalLength: textBuffer.length,
        paddedLength: textBufferPadded.length,
        encrypted,
        match: encrypted === expectedResult
      });
    } catch (error) {
      results.push({
        test: 'Manual Padding',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // 測試 5: 嘗試不同的 IV
    try {
      const iv = Buffer.alloc(8, 0); // 零向量
      const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuffer, iv);
      cipher.setAutoPadding(false);
      
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      encrypted = encrypted.replace(/\s/g, '+');
      
      results.push({
        test: 'Zero IV',
        encrypted,
        match: encrypted === expectedResult
      });
    } catch (error) {
      results.push({
        test: 'Zero IV',
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
        paddedKey
      },
      results,
      message: 'PayNow 加密調試完成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug encryption error:', error);
    return NextResponse.json({
      success: false,
      error: '加密調試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
