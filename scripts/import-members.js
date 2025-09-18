#!/usr/bin/env node

/**
 * 會員資料匯入腳本
 * 從 Google Sheets CSV 匯入到 Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 初始化 Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * 匯入會員資料
 * @param {string} csvFilePath - CSV 檔案路徑
 */
async function importMembers(csvFilePath) {
  console.log('🚀 開始匯入會員資料...');
  
  const members = [];
  let successCount = 0;
  let errorCount = 0;

  // 讀取 CSV 檔案
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // CSV 欄位：姓名,信箱
        const member = {
          name: row['姓名'] || row['name'] || '',
          email: (row['信箱'] || row['email'] || '').toLowerCase().trim(),
          status: 'active', // 預設為啟用狀態
          joinDate: new Date().toISOString().split('T')[0], // 使用匯入日期
          gameHistory: {
            lastPlayed: null,
            totalPlays: 0
          },
          updatedAt: new Date().toISOString(),
          importedAt: new Date().toISOString()
        };

        // 驗證必要欄位
        if (member.email && member.email.includes('@')) {
          members.push(member);
        } else {
          console.warn(`⚠️ 跳過無效資料: ${JSON.stringify(row)}`);
        }
      })
      .on('end', async () => {
        console.log(`📊 讀取完成，共 ${members.length} 筆有效會員資料`);
        
        // 批次寫入 Firebase
        const batch = db.batch();
        const membersRef = db.collection('members');

        for (const member of members) {
          try {
            // 使用 email 作為文件 ID（移除特殊字元）
            const docId = member.email.replace(/[.@]/g, '_');
            const memberRef = membersRef.doc(docId);
            batch.set(memberRef, member);
            successCount++;
          } catch (error) {
            console.error(`❌ 處理會員失敗: ${member.email}`, error);
            errorCount++;
          }
        }

        try {
          await batch.commit();
          console.log(`✅ 匯入完成！成功: ${successCount}, 失敗: ${errorCount}`);
          
          // 建立統計資料
          await db.collection('adminConfig').doc('memberStats').set({
            totalMembers: successCount,
            lastImport: new Date().toISOString(),
            importSource: 'google-sheets-csv'
          });

          resolve({ success: successCount, error: errorCount });
        } catch (error) {
          console.error('❌ 批次寫入失敗:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ 讀取 CSV 失敗:', error);
        reject(error);
      });
  });
}

/**
 * 查詢會員統計
 */
async function getMemberStats() {
  try {
    const snapshot = await db.collection('members').count().get();
    const total = snapshot.data().count;
    
    console.log('📊 會員統計:');
    console.log(`   總會員數: ${total}`);
    
    return total;
  } catch (error) {
    console.error('❌ 查詢統計失敗:', error);
    return 0;
  }
}

/**
 * 測試會員查詢
 */
async function testMemberQuery(email) {
  try {
    const docId = email.replace(/[.@]/g, '_');
    const memberDoc = await db.collection('members').doc(docId).get();
    
    if (memberDoc.exists) {
      console.log(`✅ 找到會員: ${email}`);
      console.log(memberDoc.data());
    } else {
      console.log(`❌ 找不到會員: ${email}`);
    }
  } catch (error) {
    console.error('❌ 查詢會員失敗:', error);
  }
}

// 主要執行函數
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'import':
      const csvFile = args[1];
      if (!csvFile) {
        console.error('❌ 請提供 CSV 檔案路徑');
        console.log('用法: node import-members.js import <csv-file-path>');
        process.exit(1);
      }
      
      if (!fs.existsSync(csvFile)) {
        console.error(`❌ 檔案不存在: ${csvFile}`);
        process.exit(1);
      }
      
      await importMembers(csvFile);
      break;

    case 'stats':
      await getMemberStats();
      break;

    case 'test':
      const email = args[1];
      if (!email) {
        console.error('❌ 請提供要測試的 email');
        console.log('用法: node import-members.js test <email>');
        process.exit(1);
      }
      await testMemberQuery(email);
      break;

    default:
      console.log('📋 可用指令:');
      console.log('  import <csv-file>  - 匯入會員資料');
      console.log('  stats             - 查看會員統計');
      console.log('  test <email>      - 測試會員查詢');
      console.log('');
      console.log('範例:');
      console.log('  node import-members.js import members.csv');
      console.log('  node import-members.js test adam@gmail.com');
      break;
  }

  process.exit(0);
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未處理的錯誤:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  importMembers,
  getMemberStats,
  testMemberQuery
};
