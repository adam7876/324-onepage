/**
 * PayNow 加密工具
 * 實現 PayNow 所需的 TripleDES 加密和 SHA-1 雜湊
 */

import crypto from 'crypto';

/**
 * TripleDES 加密 (3DES-ECB + ZeroPadding + Base64)
 * 根據 PayNow API 文件要求
 * 使用 ECB 模式和 ZeroPadding（若剛好整除，仍需補 8 個 0x00）
 */
export function tripleDESEncrypt(text: string, password: string): string {
  try {
    // 根據 PayNow 附錄一：私鑰格式為 1234567890 + Password + 123456
    const keyStr = `1234567890${password}123456`; // 24 chars
    const key = Buffer.from(keyStr, 'utf8');
    
    // 手動實現 Zero Padding
    let data = Buffer.from(text, 'utf8');
    const blockSize = 8;
    // 若剛好整除，仍需補 8 個 0x00
    const padLen = blockSize - (data.length % blockSize || blockSize);
    data = Buffer.concat([data, Buffer.alloc(padLen, 0x00)]);
    
    // 使用 des-ede3 模式，IV 為 null（ECB 模式）
    const cipher = crypto.createCipheriv('des-ede3', key, null);
    cipher.setAutoPadding(false); // 關閉自動 padding（我們自己做 ZeroPadding）
    
    // 加密
    const enc = Buffer.concat([cipher.update(data), cipher.final()]);
    
    // Base64，並把 / 換成 +
    return enc.toString('base64').replace(/\//g, '+');
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
 * 必須與加密方法匹配：使用 ECB 模式，不使用 IV
 */
export function tripleDESDecrypt(encryptedText: string, password: string): string {
  try {
    // 根據 PayNow 附錄一：私鑰格式為 1234567890 + Password + 123456（與加密方法一致）
    const privateKey = `1234567890${password}123456`;
    
    // 確保私鑰長度為 24 字節
    const paddedKey = privateKey.substring(0, 24);
    
    // 還原空格替換（加密時將空格替換為 +）
    const normalizedText = encryptedText.replace(/\+/g, ' ');
    
    // 使用 des-ede3-ecb 模式，不使用 IV（與加密方法一致）
    const decipher = crypto.createDecipheriv('des-ede3-ecb', Buffer.from(paddedKey, 'utf8'), Buffer.alloc(0));
    decipher.setAutoPadding(false); // PaddingMode.Zeros
    
    let decrypted = decipher.update(normalizedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // 移除 Zero Padding（手動移除末尾的 \0）
    return decrypted.replace(/\0+$/, '');
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
