import Spline from '@splinetool/react-spline';
import { Suspense } from 'react';

interface ThemeProps {
  type: string;
  color: string;
  mode?: string;
}

export default function ThreeBackground({ type, color, mode = '3d' }: ThemeProps) {
  return (
    <div className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden flex items-center justify-center">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Simple Mode / Fallback Patterns */}
        {mode === 'simple' && (
          <div className="absolute inset-0">
            {type === 'moon' && (
              <div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1a1a1a_0%,transparent_60%),radial-gradient(circle_at_10%_80%,#c0c0c011_0%,transparent_50%)] bg-pulse-glow" 
              />
            )}
            {type === 'nebula' && (
              <div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#4f46e522_0%,transparent_50%),radial-gradient(circle_at_80%_80%,#ff00ff11_0%,transparent_50%)] bg-pulse-glow" 
              />
            )}
            {type === 'grid' && (
              <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  backgroundImage: `linear-gradient(${color}22 1px, transparent 1px), linear-gradient(90deg, ${color}22 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                  transform: 'perspective(500px) rotateX(60deg) translateY(-200px)',
                }}
              />
            )}
            {type === 'matrix' && (
              <div className="absolute inset-0 opacity-10 flex flex-wrap gap-1 p-2 overflow-hidden select-none font-mono text-[8px] leading-tight text-accent animate-float">
                {Array.from({ length: 1000 }).map((_, i) => (
                  <span key={i}>{Math.random() > 0.5 ? '1' : '0'}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" 
        />
      </div>

      {mode === '3d' && (
        <Suspense fallback={<div className="w-full h-full bg-transparent animate-pulse" />}>
          {/* We use a wrapper that shifts slightly on desktop to center relative to the main content area */}
          <div className="w-full h-full opacity-60 flex items-center justify-center lg:ml-32">
            <div className="w-full h-full min-w-[100vw] min-h-[100vh] flex items-center justify-center">
              <Spline 
                scene="https://prod.spline.design/yDE-LP5kwPt4yVU9/scene.splinecode" 
                className="w-full h-full"
                style={{ 
                  filter: 'brightness(0.5) contrast(1.5) saturate(0.8) grayscale(0.5)',
                  transform: 'scale(1.1)', 
                }}
              />
            </div>
          </div>
        </Suspense>
      )}
      
      {/* Heavy black vignette to isolate the robot */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />
      
      {/* Bottom and side fades to ensure UI readability and focus */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  );
}
