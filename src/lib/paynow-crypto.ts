/**
 * PayNow 加密工具
 * 實現 PayNow 所需的 TripleDES 加密和 SHA-1 雜湊
 */

import crypto from 'crypto';

/**
 * TripleDES 加密 (3DES-ECB + PKCS7 Padding)
 * v14-UTF16LE: 使用 UTF-16LE 編碼進行加密，以配合 C# String 內部格式
 */
export function tripleDESEncrypt(text: string, password: string): string {
  try {
    // 根據 PayNow 附錄一：私鑰格式為 1234567890 + Password + 123456
    console.log('[CRYPTO-CHECK] Using 3DES-ECB with PKCS7 Padding (UTF-16LE)');
    const key = buildTripleDesKey(password);
    // ECB 模式不需要 IV
    
    const cipher = crypto.createCipheriv('des-ede3-ecb', key, null);
    cipher.setAutoPadding(true); // Use Node.js default PKCS7 padding

    // 使用 UTF-16LE (ucs2) 編碼
    const enc = Buffer.concat([cipher.update(text, 'ucs2'), cipher.final()]);
    
    return enc.toString('base64').replace(/\s/g, '+');
  } catch (error) {
    console.error('TripleDES encryption error:', error);
    console.error('Error details:', {
      text,
      password,
      keyStr: `1234567890${password}123456`
    });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * TripleDES 解密
 * 必須與加密方法匹配：使用 ECB 模式，並移除 PKCS7 Padding，最後轉回 UTF-16LE
 */
export function tripleDESDecrypt(encryptedText: string, password: string): string {
  try {
    const key = buildTripleDesKey(password);
    // ECB 模式不需要 IV
    const normalizedText = encryptedText.replace(/\s/g, '+');

    const decipher = crypto.createDecipheriv('des-ede3-ecb', key, null);
    decipher.setAutoPadding(true); // Use Node.js default PKCS7 padding removal

    let decrypted = decipher.update(normalizedText, 'base64', 'ucs2');
    decrypted += decipher.final('ucs2');

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
 * 生成 PayNow PassCode（用於建立物流訂單）
 * 格式: SHA1(Apicode + Base64Cipher + Password)
 * 注意：Base64Cipher 必須是未 URL 編碼的
 */
export function generatePayNowPassCode(
  apicode: string,
  base64Cipher: string, // 未 URL 編碼的 Base64 密文
  password: string // 私鑰
): string {
  const raw = apicode + base64Cipher + password;
  const sha1 = crypto.createHash('sha1').update(raw, 'utf8').digest('hex');
  return sha1.toUpperCase(); // 轉為大寫
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

function buildTripleDesKey(password: string): Buffer {
  const keyStr = `1234567890${password}123456`;
  const keyBuffer = Buffer.from(keyStr, 'utf8');
  if (keyBuffer.length === 24) return keyBuffer;
  if (keyBuffer.length > 24) return keyBuffer.subarray(0, 24);
  const padded = Buffer.alloc(24);
  keyBuffer.copy(padded);
  return padded;
}
