/**
 * PayNow 加密工具
 * 實現 PayNow 所需的 TripleDES 加密和 SHA-1 雜湊
 */

import crypto from 'crypto';

/**
 * TripleDES 加密
 * 根據 PayNow API 文件要求
 * 使用 ECB 模式和 Zeros 填充
 */
export function tripleDESEncrypt(text: string, password: string): string {
  try {
    // 根據 PayNow 文件：私鑰格式為 1234567890 + Password + 123456
    const privateKey = `1234567890${password}123456`;
    
    // 確保私鑰長度為 24 字節
    const paddedKey = privateKey.substring(0, 24);
    
    // 使用 createCipheriv 替代已棄用的 createCipher
    // ECB 模式不需要 IV，使用零向量
    const iv = Buffer.alloc(8, 0); // 8 字節零向量
    
    const cipher = crypto.createCipheriv('des-ede3', Buffer.from(paddedKey, 'utf8'), iv);
    cipher.setAutoPadding(false); // 使用 Zeros 填充
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 根據文件，將空格替換為 +
    encrypted = encrypted.replace(/\s/g, '+');
    
    return encrypted;
  } catch (error) {
    console.error('TripleDES encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * TripleDES 解密
 */
export function tripleDESDecrypt(encryptedText: string, key: string): string {
  try {
    const paddedKey = key.padEnd(24, '0').substring(0, 24);
    
    // 使用 createDecipheriv 替代已棄用的 createDecipher
    const iv = Buffer.alloc(8, 0); // 8 字節零向量
    
    const decipher = crypto.createDecipheriv('des-ede3', Buffer.from(paddedKey, 'utf8'), iv);
    decipher.setAutoPadding(false);
    
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('TripleDES decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * SHA-1 雜湊
 * 用於生成 PassCode
 */
export function sha1Hash(text: string): string {
  try {
    return crypto.createHash('sha1').update(text, 'utf8').digest('hex');
  } catch (error) {
    console.error('SHA-1 hash error:', error);
    throw new Error('Failed to generate hash');
  }
}

/**
 * 生成 PayNow PassCode
 * 格式: user_account + OrderNo + TotalAmount + apicode
 */
export function generatePayNowPassCode(
  userAccount: string,
  orderNumber: string,
  totalAmount: string,
  apiCode: string
): string {
  const combinedString = `${userAccount}${orderNumber}${totalAmount}${apiCode}`;
  return sha1Hash(combinedString);
}

/**
 * URL 編碼
 */
export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

/**
 * URL 解碼
 */
export function urlDecode(encodedText: string): string {
  return decodeURIComponent(encodedText);
}
