/**
 * PayNow 加密工具
 * 實現 PayNow 所需的 TripleDES 加密和 SHA-1 雜湊
 */

import crypto from 'crypto';

/**
 * TripleDES 加密 (3DES-ECB + PKCS7 Padding)
 * 回歸文件範例邏輯：ECB 模式，但使用標準 PKCS7 Padding
 */
export function tripleDESEncrypt(text: string, password: string): string {
  try {
    // 根據 PayNow 附錄一：私鑰格式為 1234567890 + Password + 123456
    console.log('[CRYPTO-CHECK] Using 3DES-ECB with PKCS7 Padding (UTF-8)');
    const key = buildTripleDesKey(password);
    // ECB 模式不需要 IV
    
    // 重要：某些老舊系統可能需要 Big5 或 UTF-16LE 編碼
    // 但 apicode 加密範例 (7XBJHzfFtxw=) 證明了 apicode 本身是用 UTF-8 (ASCII) 加密的
    // 如果 JSON 需要 UTF-16LE，那 apicode 應該也會不一樣
    // 暫時維持 UTF-8，因為我們已經用純英文測試過了
    // 但為了排除 Padding 實作差異，我們改用 Node.js 內建的 AutoPadding
    
    const cipher = crypto.createCipheriv('des-ede3-ecb', key, null);
    cipher.setAutoPadding(true); // Use Node.js default PKCS7 padding

    const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    
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
 * 必須與加密方法匹配：使用 ECB 模式，並移除 PKCS7 Padding
 */
export function tripleDESDecrypt(encryptedText: string, password: string): string {
  try {
    const key = buildTripleDesKey(password);
    // ECB 模式不需要 IV
    const normalizedText = encryptedText.replace(/\s/g, '+');

    const decipher = crypto.createDecipheriv('des-ede3-ecb', key, null);
    decipher.setAutoPadding(true); // Use Node.js default PKCS7 padding removal

    let decrypted = decipher.update(normalizedText, 'base64', 'utf8');
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

function removePKCS7Padding(text: string): string {
  if (text.length === 0) return text;
  const lastChar = text.charCodeAt(text.length - 1);
  // Check if the last char is a valid padding length (1 to 8)
  if (lastChar > 0 && lastChar <= 8) {
    return text.substring(0, text.length - lastChar);
  }
  return text;
}
