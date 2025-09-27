// 背景圖片優化工具

export interface BackgroundImageConfig {
  src: string;
  alt?: string;
  fallback?: string;
  preload?: boolean;
}

// 預載入背景圖片
export function preloadBackgroundImages(images: string[]): Promise<void[]> {
  return Promise.all(
    images.map(src => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });
    })
  );
}

// 圖片壓縮建議
export const IMAGE_OPTIMIZATION_TIPS = {
  // 建議的圖片尺寸
  recommendedSizes: {
    mobile: '800x600',
    tablet: '1200x800', 
    desktop: '1920x1080'
  },
  
  // 建議的檔案大小
  maxFileSize: '500KB',
  
  // 支援的格式
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  
  // 壓縮工具建議
  compressionTools: [
    'TinyPNG',
    'Squoosh',
    'ImageOptim',
    'Photoshop Save for Web'
  ]
};

// 背景圖片配置
export const BACKGROUND_IMAGES = {
  passwordLogin: '/images/backgrounds/password-login-bg.jpg',
  games: '/images/backgrounds/games-bg.jpg',
  cart: '/images/backgrounds/cart-bg.jpg',
  admin: '/images/backgrounds/admin-bg.jpg',
  product: '/images/backgrounds/product-bg.jpg'
};

// 預載入所有背景圖片
export function preloadAllBackgrounds(): Promise<void[]> {
  const images = Object.values(BACKGROUND_IMAGES);
  return preloadBackgroundImages(images);
}
