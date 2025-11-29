/**
 * PayNow 加密工具
 * 實現 PayNow 所需的 TripleDES 加密和 SHA-1 雜湊
 */

import crypto from 'crypto';

/**
 * TripleDES 加密 (3DES-CBC + Zero IV + PKCS7 Padding)
 * 根據 PayNow API 文件要求
 */
export function tripleDESEncrypt(text: string, password: string): string {
  try {
    // 根據 PayNow 附錄一：私鑰格式為 1234567890 + Password + 123456
    console.log('[CRYPTO-CHECK] Using 3DES-CBC with Zero IV and PKCS7 Padding');
    const key = buildTripleDesKey(password);
    const iv = Buffer.alloc(8, 0); // Zero IV
    
    // PKCS7 Padding
    const blockSize = 8;
    const pad = blockSize - (text.length % blockSize);
    const paddedText = Buffer.concat([Buffer.from(text, 'utf8'), Buffer.alloc(pad, pad)]);
    
    const cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
    cipher.setAutoPadding(false); // We do manual padding

    const enc = Buffer.concat([cipher.update(paddedText), cipher.final()]);
    
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
 * 必須與加密方法匹配：使用 CBC 模式，Zero IV，並移除 PKCS7 Padding
 */
export function tripleDESDecrypt(encryptedText: string, password: string): string {
  try {
    const key = buildTripleDesKey(password);
    const iv = Buffer.alloc(8, 0); // Zero IV
    const normalizedText = encryptedText.replace(/\s/g, '+');

    const decipher = crypto.createDecipheriv('des-ede3-cbc', key, iv);
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(normalizedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return removePKCS7Padding(decrypted);
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

/*
function zeroPad(buffer: Buffer): Buffer {
  const blockSize = 8;
  const remainder = buffer.length % blockSize;
  if (remainder === 0) {
    return buffer;
  }
  const padLen = blockSize - remainder;
  return Buffer.concat([buffer, Buffer.alloc(padLen, 0x00)]);
}
*/

/*
function removeZeroPadding(text: string): string {
  return text.replace(/\0+$/, '');
}
*/

function removePKCS7Padding(text: string): string {
  if (text.length === 0) return text;
  const lastChar = text.charCodeAt(text.length - 1);
  // Check if the last char is a valid padding length (1 to 8)
  if (lastChar > 0 && lastChar <= 8) {
    return text.substring(0, text.length - lastChar);
  }
  return text;
}
