/**
 * 調試 Node.js TripleDES 實現
 * 對比 Python/C# 的結果
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
    
    // 1. 檢查原始資料
    const textBuffer = Buffer.from(testText, 'utf8');
    const keyBuffer = Buffer.from(paddedKey, 'utf8');
    
    results.push({
      step: '原始資料',
      text: testText,
      textBuffer: textBuffer.toString('hex'),
      textLength: textBuffer.length,
      key: paddedKey,
      keyBuffer: keyBuffer.toString('hex'),
      keyLength: keyBuffer.length
    });
    
    // 2. Zero Padding
    const blockSize = 8;
    const paddedLength = Math.ceil(textBuffer.length / blockSize) * blockSize;
    const paddedBuffer = Buffer.alloc(paddedLength);
    textBuffer.copy(paddedBuffer);
    
    results.push({
      step: 'Zero Padding',
      originalLength: textBuffer.length,
      paddedLength: paddedLength,
      paddedBuffer: paddedBuffer.toString('hex'),
      paddingBytes: paddedLength - textBuffer.length
    });
    
    // 3. 測試不同的加密方式
    const methods = [
      {
        name: 'des-ede3-ecb with Buffer.alloc(0)',
        cipher: () => crypto.createCipheriv('des-ede3-ecb', keyBuffer, Buffer.alloc(0))
      },
      {
        name: 'des-ede3-ecb with null IV',
        cipher: () => crypto.createCipheriv('des-ede3-ecb', keyBuffer, Buffer.alloc(8, 0))
      },
      {
        name: 'des-ede3-ecb with 12345678 IV',
        cipher: () => crypto.createCipheriv('des-ede3-ecb', keyBuffer, Buffer.from('12345678', 'utf8'))
      }
    ];
    
    for (const method of methods) {
      try {
        const cipher = method.cipher();
        cipher.setAutoPadding(false);
        
        let encrypted = cipher.update(paddedBuffer, undefined, 'base64');
        encrypted += cipher.final('base64');
        encrypted = encrypted.replace(/\s/g, '+');
        
        results.push({
          step: method.name,
          encrypted: encrypted,
          match: encrypted === expectedResult,
          success: true
        });
      } catch (error) {
        results.push({
          step: method.name,
          encrypted: 'ERROR',
          match: false,
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }
    
    // 4. 測試不使用 padding 的情況
    try {
      const cipher = crypto.createCipheriv('des-ede3-ecb', keyBuffer, Buffer.alloc(0));
      cipher.setAutoPadding(false);
      
      let encrypted = cipher.update(textBuffer, undefined, 'base64');
      encrypted += cipher.final('base64');
      encrypted = encrypted.replace(/\s/g, '+');
      
      results.push({
        step: 'des-ede3-ecb without padding',
        encrypted: encrypted,
        match: encrypted === expectedResult,
        success: true
      });
    } catch (error) {
      results.push({
        step: 'des-ede3-ecb without padding',
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
      message: 'Node.js TripleDES 調試完成'
    });

  } catch (error) {
    console.error('Node.js 調試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: 'Node.js 調試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
