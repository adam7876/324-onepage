"use client";

import { useEffect, useState } from 'react';

interface BackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function BackgroundImage({ src, className = "" }: BackgroundImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = src;
  }, [src]);

  if (imageError) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 ${className}`}>
        {/* 備用背景 */}
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${className}`}>
      {/* 背景圖片 */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      
      {/* 載入中的背景 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100" />
      )}
    </div>
  );
}
