#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 圖片壓縮配置
const COMPRESSION_CONFIG = {
  // 目標檔案大小 (bytes)
  targetSize: 500 * 1024, // 500KB
  
  // 支援的圖片格式
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
  
  // 壓縮品質設定
  quality: {
    jpg: 85,
    png: 90,
    webp: 80
  }
};

// 檢查檔案大小
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`無法讀取檔案: ${filePath}`, error.message);
    return 0;
  }
}

// 壓縮圖片建議
function getCompressionSuggestions(filePath) {
  const fileSize = getFileSize(filePath);
  const fileSizeKB = Math.round(fileSize / 1024);
  const targetSizeKB = Math.round(COMPRESSION_CONFIG.targetSize / 1024);
  
  console.log(`\n📁 檔案: ${path.basename(filePath)}`);
  console.log(`📊 目前大小: ${fileSizeKB}KB`);
  console.log(`🎯 目標大小: ${targetSizeKB}KB`);
  
  if (fileSize > COMPRESSION_CONFIG.targetSize) {
    const reductionPercent = Math.round(((fileSize - COMPRESSION_CONFIG.targetSize) / fileSize) * 100);
    console.log(`⚠️  需要壓縮: ${reductionPercent}%`);
    
    // 提供壓縮建議
    const ext = path.extname(filePath).toLowerCase();
    console.log(`\n🔧 壓縮建議:`);
    
    if (ext === '.jpg' || ext === '.jpeg') {
      console.log(`   • 使用 TinyPNG: https://tinypng.com/`);
      console.log(`   • 使用 Squoosh: https://squoosh.app/`);
      console.log(`   • Photoshop: 品質設為 ${COMPRESSION_CONFIG.quality.jpg}%`);
      console.log(`   • 建議尺寸: 1920x1080 或更小`);
    } else if (ext === '.png') {
      console.log(`   • 使用 TinyPNG: https://tinypng.com/`);
      console.log(`   • 使用 ImageOptim (Mac)`);
      console.log(`   • 建議轉換為 JPG 格式`);
    } else if (ext === '.webp') {
      console.log(`   • 使用 Squoosh: https://squoosh.app/`);
      console.log(`   • 品質設為 ${COMPRESSION_CONFIG.quality.webp}%`);
    }
    
    console.log(`\n💡 額外建議:`);
    console.log(`   • 考慮使用 WebP 格式 (更小的檔案大小)`);
    console.log(`   • 調整圖片尺寸到 1920x1080 或更小`);
    console.log(`   • 移除不必要的 EXIF 資料`);
    
    return false;
  } else {
    console.log(`✅ 檔案大小合適`);
    return true;
  }
}

// 掃描目錄中的圖片
function scanImages(directory) {
  const images = [];
  
  function scanDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDir(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (COMPRESSION_CONFIG.supportedFormats.includes(ext)) {
            images.push(filePath);
          }
        }
      });
    } catch (error) {
      console.error(`掃描目錄失敗: ${dir}`, error.message);
    }
  }
  
  scanDir(directory);
  return images;
}

// 主函數
function main() {
  console.log('🖼️  圖片壓縮分析工具');
  console.log('='.repeat(50));
  
  const publicDir = path.join(__dirname, '..', 'public');
  const imagesDir = path.join(publicDir, 'images');
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ 找不到 images 目錄');
    return;
  }
  
  console.log(`📂 掃描目錄: ${imagesDir}`);
  
  const images = scanImages(imagesDir);
  
  if (images.length === 0) {
    console.log('❌ 找不到圖片檔案');
    return;
  }
  
  console.log(`\n📊 找到 ${images.length} 個圖片檔案`);
  console.log('='.repeat(50));
  
  let optimizedCount = 0;
  let needOptimizationCount = 0;
  
  images.forEach(imagePath => {
    const isOptimized = getCompressionSuggestions(imagePath);
    if (isOptimized) {
      optimizedCount++;
    } else {
      needOptimizationCount++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 分析結果:');
  console.log(`✅ 已優化: ${optimizedCount} 個檔案`);
  console.log(`⚠️  需要優化: ${needOptimizationCount} 個檔案`);
  
  if (needOptimizationCount > 0) {
    console.log('\n🚀 快速壓縮工具:');
    console.log('1. TinyPNG: https://tinypng.com/ (推薦)');
    console.log('2. Squoosh: https://squoosh.app/ (Google 開發)');
    console.log('3. ImageOptim: https://imageoptim.com/ (Mac)');
    console.log('4. Photoshop: 檔案 → 匯出 → 儲存為網頁用');
  }
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { getCompressionSuggestions, scanImages };
