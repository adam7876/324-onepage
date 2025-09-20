const admin = require('firebase-admin');
const fs = require('fs');

// 讀取 Firebase Admin Key
const serviceAccount = require('../firebase-admin-key.json');

// 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkRewardConfig() {
  try {
    console.log('🔍 檢查 Firestore 中的獎品配置...');
    
    const docRef = db.collection('gameConfig').doc('reward');
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ 找到獎品配置:');
      console.log(JSON.stringify(data, null, 2));
      
      // 更新 game-config.ts 中的預設值
      const configPath = '../src/lib/game-config.ts';
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // 替換預設值
      configContent = configContent.replace(
        /reward: \{[^}]*\}/s,
        `reward: {
    type: '${data.type}' as 'coupon' | 'discount',
    value: ${data.value},
    description: '${data.description}',
  }`
      );
      
      fs.writeFileSync(configPath, configContent);
      console.log('✅ 已更新 game-config.ts 中的預設值');
      
    } else {
      console.log('❌ Firestore 中沒有獎品配置');
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  } finally {
    process.exit(0);
  }
}

checkRewardConfig();
