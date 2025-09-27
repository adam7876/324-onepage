#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 壓縮配置
const COMPRESSION_CONFIG = {
  targetSize: 500 * 1024, // 500KB
  quality: 85, // JPEG 品質
  maxWidth: 1920,
  maxHeight: 1080
};

// 檢查是否安裝了 ImageMagick
async function checkImageMagick() {
  try {
    await execAsync('magick -version');
    return true;
  } catch (error) {
    return false;
  }
}

// 使用 ImageMagick 壓縮圖片
async function compressWithImageMagick(inputPath, outputPath, quality = 85) {
  try {
    const command = `magick "${inputPath}" -quality ${quality} -resize ${COMPRESSION_CONFIG.maxWidth}x${COMPRESSION_CONFIG.maxHeight}> "${outputPath}"`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error(`ImageMagick 壓縮失敗: ${error.message}`);
    return false;
  }
}

// 使用 sharp 庫壓縮（如果可用）
async function compressWithSharp(inputPath, outputPath, quality = 85) {
  try {
    const sharp = require('sharp');
    await sharp(inputPath)
      .resize(COMPRESSION_CONFIG.maxWidth, COMPRESSION_CONFIG.maxHeight, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Sharp 壓縮失敗: ${error.message}`);
    return false;
  }
}

// 備用壓縮方法：使用 Node.js 內建方法
async function compressWithNode(inputPath, outputPath) {
  try {
    // 讀取原始檔案
    const originalData = fs.readFileSync(inputPath);
    
    // 簡單的檔案大小檢查
    if (originalData.length <= COMPRESSION_CONFIG.targetSize) {
      console.log(`✅ ${path.basename(inputPath)} 已經符合大小要求`);
      return true;
    }
    
    // 創建備份
    const backupPath = inputPath + '.backup';
    fs.copyFileSync(inputPath, backupPath);
    console.log(`📁 已創建備份: ${backupPath}`);
    
    return true;
  } catch (error) {
    console.error(`Node.js 壓縮失敗: ${error.message}`);
    return false;
  }
}

// 壓縮單個圖片
async function compressImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const nameWithoutExt = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);
  const outputPath = path.join(dir, `${nameWithoutExt}_compressed${ext}`);
  
  console.log(`\n🔄 壓縮: ${path.basename(inputPath)}`);
  
  // 檢查原始檔案大小
  const originalSize = fs.statSync(inputPath).size;
  const originalSizeKB = Math.round(originalSize / 1024);
  console.log(`📊 原始大小: ${originalSizeKB}KB`);
  
  if (originalSize <= COMPRESSION_CONFIG.targetSize) {
    console.log(`✅ 檔案已經符合大小要求`);
    return true;
  }
  
  // 嘗試不同的壓縮方法
  let success = false;
  
  // 方法 1: ImageMagick
  if (await checkImageMagick()) {
    console.log(`🔧 使用 ImageMagick 壓縮...`);
    success = await compressWithImageMagick(inputPath, outputPath, COMPRESSION_CONFIG.quality);
  }
  
  // 方法 2: Sharp
  if (!success) {
    try {
      require('sharp');
      console.log(`🔧 使用 Sharp 壓縮...`);
      success = await compressWithSharp(inputPath, outputPath, COMPRESSION_CONFIG.quality);
    } catch (error) {
      console.log(`⚠️  Sharp 未安裝，跳過...`);
    }
  }
  
  // 方法 3: 備用方法
  if (!success) {
    console.log(`🔧 使用備用方法...`);
    success = await compressWithNode(inputPath, outputPath);
  }
  
  if (success) {
    // 檢查壓縮後的大小
    if (fs.existsSync(outputPath)) {
      const compressedSize = fs.statSync(outputPath).size;
      const compressedSizeKB = Math.round(compressedSize / 1024);
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
      
      console.log(`📊 壓縮後大小: ${compressedSizeKB}KB`);
      console.log(`📈 減少: ${reduction}%`);
      
      if (compressedSize <= COMPRESSION_CONFIG.targetSize) {
        console.log(`✅ 壓縮成功！`);
        // 替換原始檔案
        fs.copyFileSync(outputPath, inputPath);
        fs.unlinkSync(outputPath);
        return true;
      } else {
        console.log(`⚠️  壓縮後仍然太大，需要手動優化`);
        return false;
      }
    }
  }
  
  console.log(`❌ 自動壓縮失敗，請使用手動工具`);
  return false;
}

// 主函數
async function main() {
  console.log('🚀 自動圖片壓縮工具');
  console.log('='.repeat(50));
  
  // 檢查工具
  const hasImageMagick = await checkImageMagick();
  console.log(`ImageMagick: ${hasImageMagick ? '✅ 已安裝' : '❌ 未安裝'}`);
  
  // 掃描圖片
  const publicDir = path.join(__dirname, '..', 'public');
  const imagesDir = path.join(publicDir, 'images');
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ 找不到 images 目錄');
    return;
  }
  
  // 找到需要壓縮的圖片
  const images = [];
  const scanDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDir(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          const size = stat.size;
          if (size > COMPRESSION_CONFIG.targetSize) {
            images.push(filePath);
          }
        }
      }
    });
  };
  
  scanDir(imagesDir);
  
  if (images.length === 0) {
    console.log('✅ 所有圖片都已經符合大小要求');
    return;
  }
  
  console.log(`📊 找到 ${images.length} 個需要壓縮的圖片`);
  console.log('='.repeat(50));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const imagePath of images) {
    const success = await compressImage(imagePath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 壓縮結果:');
  console.log(`✅ 成功: ${successCount} 個檔案`);
  console.log(`❌ 失敗: ${failCount} 個檔案`);
  
  if (failCount > 0) {
    console.log('\n🔧 手動壓縮建議:');
    console.log('1. TinyPNG: https://tinypng.com/');
    console.log('2. Squoosh: https://squoosh.app/');
    console.log('3. 安裝 ImageMagick: brew install imagemagick');
  }
}

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { compressImage, main };
