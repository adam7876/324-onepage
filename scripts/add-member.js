#!/usr/bin/env node

/**
 * 手動新增會員腳本
 * 用於新增新會員到遊戲系統
 */

const admin = require('firebase-admin');
const readline = require('readline');

// 初始化 Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 建立讀取介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 新增會員
 */
async function addMember(name, email) {
  try {
    // 正規化 email
    const normalizedEmail = email.toLowerCase().trim();
    const docId = normalizedEmail.replace(/[.@]/g, '_');
    
    // 檢查是否已存在
    const existingDoc = await db.collection('members').doc(docId).get();
    
    if (existingDoc.exists) {
      console.log(`❌ 會員已存在: ${normalizedEmail}`);
      return false;
    }
    
    // 新增會員資料
    const memberData = {
      name: name.trim(),
      email: normalizedEmail,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      gameHistory: {
        lastPlayed: null,
        totalPlays: 0
      },
      updatedAt: new Date().toISOString(),
      addedBy: 'manual',
      addedAt: new Date().toISOString()
    };
    
    await db.collection('members').doc(docId).set(memberData);
    
    console.log(`✅ 成功新增會員:`);
    console.log(`   姓名: ${memberData.name}`);
    console.log(`   Email: ${memberData.email}`);
    console.log(`   狀態: ${memberData.status}`);
    console.log(`   加入日期: ${memberData.joinDate}`);
    
    return true;
  } catch (error) {
    console.error('❌ 新增會員失敗:', error);
    return false;
  }
}

/**
 * 批量新增會員
 */
async function batchAddMembers() {
  console.log('📋 批量新增會員模式');
  console.log('輸入格式: 姓名,Email (每行一個)');
  console.log('輸入 "done" 結束');
  console.log('');
  
  const members = [];
  
  return new Promise((resolve) => {
    rl.on('line', async (input) => {
      if (input.toLowerCase() === 'done') {
        rl.close();
        
        if (members.length === 0) {
          console.log('❌ 沒有要新增的會員');
          resolve();
          return;
        }
        
        console.log(`\n🚀 開始批量新增 ${members.length} 位會員...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const member of members) {
          const success = await addMember(member.name, member.email);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
        
        console.log(`\n📊 批量新增完成:`);
        console.log(`   成功: ${successCount} 位`);
        console.log(`   失敗: ${errorCount} 位`);
        
        resolve();
      } else {
        const parts = input.split(',');
        if (parts.length === 2) {
          members.push({
            name: parts[0].trim(),
            email: parts[1].trim()
          });
          console.log(`📝 已記錄: ${parts[0].trim()} - ${parts[1].trim()}`);
        } else {
          console.log('❌ 格式錯誤，請使用: 姓名,Email');
        }
      }
    });
  });
}

/**
 * 查詢會員
 */
async function searchMember(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const docId = normalizedEmail.replace(/[.@]/g, '_');
    
    const memberDoc = await db.collection('members').doc(docId).get();
    
    if (memberDoc.exists) {
      const member = memberDoc.data();
      console.log(`✅ 找到會員:`);
      console.log(`   姓名: ${member.name}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   狀態: ${member.status}`);
      console.log(`   加入日期: ${member.joinDate}`);
      console.log(`   遊戲次數: ${member.gameHistory.totalPlays}`);
      console.log(`   最後遊戲: ${member.gameHistory.lastPlayed || '未玩過'}`);
    } else {
      console.log(`❌ 找不到會員: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error('❌ 查詢會員失敗:', error);
  }
}

/**
 * 主要執行函數
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🎮 324遊樂園 - 會員管理工具');
  console.log('');

  switch (command) {
    case 'add':
      const name = args[1];
      const email = args[2];
      
      if (!name || !email) {
        console.error('❌ 請提供姓名和 Email');
        console.log('用法: node add-member.js add "姓名" "email@example.com"');
        process.exit(1);
      }
      
      await addMember(name, email);
      break;

    case 'batch':
      await batchAddMembers();
      break;

    case 'search':
      const searchEmail = args[1];
      
      if (!searchEmail) {
        console.error('❌ 請提供 Email');
        console.log('用法: node add-member.js search "email@example.com"');
        process.exit(1);
      }
      
      await searchMember(searchEmail);
      break;

    default:
      console.log('📋 可用指令:');
      console.log('  add "姓名" "email"     - 新增單一會員');
      console.log('  batch                 - 批量新增會員');
      console.log('  search "email"        - 查詢會員');
      console.log('');
      console.log('範例:');
      console.log('  node add-member.js add "王小明" "wang@gmail.com"');
      console.log('  node add-member.js batch');
      console.log('  node add-member.js search "wang@gmail.com"');
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
  addMember,
  searchMember
};
