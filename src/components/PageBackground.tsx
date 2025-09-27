"use client";

import { useEffect, useState } from 'react';

interface PageBackgroundProps {
  backgroundImage?: string;
  fallbackGradient?: string;
  children: React.ReactNode;
  className?: string;
}

export default function PageBackground({ 
  backgroundImage, 
  fallbackGradient = "from-purple-100 via-pink-50 to-blue-100",
  children,
  className = ""
}: PageBackgroundProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!backgroundImage) {
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = backgroundImage;
  }, [backgroundImage]);

  const backgroundStyle = backgroundImage && imageLoaded && !imageError ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100dvh'
  } : {};

  return (
    <div 
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={backgroundStyle}
    >
      {/* 載入中的背景或備用背景 */}
      {(!imageLoaded || imageError) && (
        <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
      )}
      
      {/* 載入動畫 */}
      {backgroundImage && !imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-gray-500">載入中...</div>
        </div>
      )}
      
      {/* 內容 */}
      {children}
    </div>
  );
}
