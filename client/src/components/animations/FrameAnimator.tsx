import React, { useEffect, useRef } from 'react';

interface FrameAnimatorProps {
  frames: string[];
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FrameAnimator: React.FC<FrameAnimatorProps> = ({ 
  frames, 
  fps = 30, 
  className,
  style 
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!imgRef.current || frames.length === 0) return;
    
    let currentFrame = 0;
    const interval = 1000 / fps;
    
    const animate = () => {
      if (imgRef.current) {
        imgRef.current.src = frames[currentFrame];
        currentFrame = (currentFrame + 1) % frames.length;
      }
    };
    
    const timer = setInterval(animate, interval);
    animate();
    
    return () => clearInterval(timer);
  }, [frames, fps]);
  
  return (
    <img 
      ref={imgRef} 
      className={className}
      style={style}
      alt="Animation"
    />
  );
};