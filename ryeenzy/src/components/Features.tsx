import { motion } from 'motion/react';
import { Sparkles, MessageSquare, Code, Eye, Mic, History, Cpu, Zap, Shield, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Features() {
  const features = [
    {
      title: "Neural Chat Engine",
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      desc: "Powered by Gemini architecture, featuring deep context understanding and creative reasoning.",
      items: ["Context Awareness", "Creative Writing", "Problem Solving"]
    },
    {
      title: "Quantum Code IDE",
      icon: Code,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      desc: "Full-stack development environment with real-time analysis and multi-language support.",
      items: ["Real-time Execution", "Smart Debugging", "Multi-file Projects"]
    },
    {
      title: "Neural Vision",
      icon: Eye,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      desc: "Advanced visual processing for image analysis, OCR, and object recognition.",
      items: ["Image Analysis", "Text Extraction", "Scene Understanding"]
    },
    {
      title: "Bio-Audio Sync",
      icon: Mic,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      desc: "Voice message analysis and speech-to-text integration for seamless interaction.",
      items: ["Voice Recognition", "Emotional Tone", "Noise Reduction"]
    },
    {
      title: "Temporal Archive",
      icon: History,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      desc: "Your entire journey preserved in a high-speed neural database for instant recall.",
      items: ["Instant Search", "Session Persistence", "Smart Filtering"]
    },
    {
      title: "Atmospheric HUD",
      icon: Zap,
      color: "text-accent",
      bg: "bg-accent/10",
      desc: "Fully customizable interface with 3D Spline integration and motion graphics.",
      items: ["3D Environments", "Theme Sync", "Adaptive HUD"]
    }
  ];

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-4"
          >
            <Cpu className="w-3 h-3" />
            System Capabilities
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Neural Architecture Features</h1>
          <p className="text-silver/40 max-w-2xl">
            RyeenzyAI is built on a distributed neural network, providing a complete suite of intelligent tools designed for the next generation of digital interaction.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 hover:border-accent/20 transition-all overflow-hidden h-full flex flex-col"
            >
              {/* Decorative backgrounds */}
              <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-opacity group-hover:opacity-40", f.bg)} />
              
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10", f.bg)}>
                <f.icon className={cn("w-7 h-7", f.color)} />
              </div>

              <h3 className="text-xl font-bold mb-3 relative z-10">{f.title}</h3>
              <p className="text-sm text-silver/50 leading-relaxed mb-6 flex-1 relative z-10">
                {f.desc}
              </p>

              <div className="space-y-2 relative z-10">
                {f.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] font-medium text-silver/30 group-hover:text-accent/60 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/20" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-12 -translate-y-full group-hover:animate-[scan_2s_linear_infinite]" />
            </motion.div>
          ))}
        </div>

        {/* System Stats Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Neural Latency', val: '0.04s', icon: Zap },
            { label: 'Encryption', val: 'AES-256', icon: Shield },
            { label: 'Uptime', val: '99.99%', icon: Globe },
            { label: 'Sync Status', val: 'Active', icon: Cpu }
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
              <stat.icon className="w-4 h-4 text-accent/40 mb-2" />
              <p className="text-[10px] text-silver/40 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="font-bold text-accent">{stat.val}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
