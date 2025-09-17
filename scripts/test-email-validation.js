#!/usr/bin/env node

/**
 * Email 驗證測試工具
 * 使用方法：node scripts/test-email-validation.js
 */

// 複製驗證邏輯
function isValidEmail(email) {
  // 基本格式檢查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // 檢查是否為常見的垃圾 email 模式
  const suspiciousPatterns = [
    /^[a-z0-9]{20,}@/i,  // 超長隨機字符
    /^[0-9]{10,}@/,      // 純數字超長
    /test.*test/i,       // 包含 test...test
    /temp.*temp/i,       // 包含 temp...temp
    /fake.*fake/i,       // 包含 fake...fake
    /spam.*spam/i,       // 包含 spam...spam
    /^(qwe|asd|zxc|123|abc)/i, // 常見鍵盤序列開頭
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  // 檢查域名是否合理
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // 拒絕明顯假的域名
  const fakeDomainPatterns = [
    /^[a-z]{1,3}\.com$/,     // 太短的域名如 ab.com
    /test\.com$/,            // test.com
    /temp\.com$/,            // temp.com
    /fake\.com$/,            // fake.com
    /example\.com$/,         // example.com
    /localhost$/,            // localhost
  ];

  for (const pattern of fakeDomainPatterns) {
    if (pattern.test(domain)) {
      return false;
    }
  }

  return true;
}

function isCommonEmailProvider(email) {
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'live.com', 'msn.com', 'aol.com',
    'protonmail.com', 'tutanota.com', 'me.com',
    'ymail.com', 'rocketmail.com', 'mail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return commonProviders.includes(domain || '');
}

// 測試用例
const testEmails = [
  // 有效的 email
  'user@gmail.com',
  'test@yahoo.com',
  'someone@outlook.com',
  'me@icloud.com',
  
  // 您提到的例子
  '1234wefedcsregt43@gmail.com',
  
  // 應該被拒絕的 email
  'qwerty123@gmail.com',           // 鍵盤序列
  '12345678901234567890@gmail.com', // 超長數字
  'testuser@test.com',             // test.com 域名
  'user@fake.com',                 // fake.com 域名
  'spam@example.com',              // example.com 域名
  'user@ab.com',                   // 太短域名
  'testtesttest@gmail.com',        // 重複 test
  'temptempemail@gmail.com',       // 重複 temp
  'fakefakeuser@gmail.com',        // 重複 fake
  'abcdefghijklmnopqrstuvwxyz@gmail.com', // 超長隨機
  
  // 非常見提供商但可能合法
  'user@company.com',
  'service@business.org',
  'admin@school.edu',
  
  // 格式錯誤
  'invalid-email',
  'user@',
  '@gmail.com',
  'user@.com',
];

console.log('🧪 Email 驗證測試\n');
console.log('格式：[結果] Email地址 -> 驗證結果\n');

testEmails.forEach((email, index) => {
  const isValid = isValidEmail(email);
  const isCommon = isCommonEmailProvider(email);
  
  const status = isValid ? '✅' : '❌';
  const commonStatus = isCommon ? '(常見)' : '(非常見)';
  
  console.log(`${status} ${email.padEnd(35)} -> ${isValid ? '通過' : '拒絕'} ${isValid && !isCommon ? commonStatus : ''}`);
});

console.log('\n📊 測試摘要：');
const validCount = testEmails.filter(email => isValidEmail(email)).length;
const totalCount = testEmails.length;
console.log(`✅ 通過：${validCount}/${totalCount}`);
console.log(`❌ 拒絕：${totalCount - validCount}/${totalCount}`);

console.log('\n💡 保護機制：');
console.log('1. 基本格式驗證');
console.log('2. 拒絕鍵盤序列 (qwe, asd, 123...)');
console.log('3. 拒絕超長隨機字符');
console.log('4. 拒絕重複單詞 (test, temp, fake...)');
console.log('5. 拒絕假域名 (test.com, fake.com...)');
console.log('6. 提示非常見 email 提供商');

console.log('\n🔧 如要調整驗證規則，請修改 src/lib/game-utils.ts');
