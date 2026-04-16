import { motion } from 'motion/react';
import ThreeBackground from './ThreeBackground';

interface LoadingScreenProps {
  theme?: string;
  type?: string;
  color?: string;
  mode?: string;
}

export default function LoadingScreen({ theme = 'silver', type = 'moon', color = '#ffffff', mode = '3d' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      <ThreeBackground type={type} color={color} mode={mode} />
      
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-full border-[20px] border-accent/5 ring-[1px] ring-accent/10 m-8 rounded-[4rem]"
        />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent/10" />
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-accent/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-80 h-80 mb-12 flex items-center justify-center">
          {/* Circular HUD Elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-accent/10 rounded-full border-dashed"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-[2px] border-accent/20 rounded-full border-t-transparent border-b-transparent"
          />
          
          {/* Scanning Line */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-accent/40 shadow-[0_0_15px_rgba(var(--accent-color),0.8)] z-20"
          />

          {/* Robot / Logo Centerpiece */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-48 h-48 relative"
          >
            {/* Inner Glow Surround */}
            <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl" />
            
            <img 
              src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
              alt="RyeenzyAI Logo" 
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(var(--accent-color),0.8)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Loading Progress HUD */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 mb-2">
            <div className="h-0.5 w-16 bg-accent/20" />
            <motion.span 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-[10px] font-mono tracking-[0.5em] text-accent uppercase"
            >
              System Online
            </motion.span>
            <div className="h-0.5 w-16 bg-accent/20" />
          </div>

          <div className="w-80 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-full bg-accent shadow-[0_0_20px_rgba(var(--accent-color),0.5)]"
            />
          </div>
          
          <div className="flex justify-between w-80 text-[8px] font-mono text-silver/40 px-1">
            <span>CORE_SYNC_INIT</span>
            <motion.span
              animate={{ opacity: [0, 1] }}
              transition={{ duration: 0.1, repeat: Infinity }}
            >
              DATA_WRITING...
            </motion.span>
            <span>v2.9.1_SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
