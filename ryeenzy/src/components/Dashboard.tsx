import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Shield, Cpu, ArrowRight, Activity, Code, MessageSquare, History } from 'lucide-react';
import { Tab } from '../App';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  setActiveTab: (tab: Tab) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [stats, setStats] = useState([
    { label: 'Total Chats', value: '0', icon: MessageSquare },
    { label: 'Code Projects', value: '0', icon: Code },
    { label: 'Days Streak', value: '1', icon: Activity },
    { label: 'AI Accuracy', value: '98%', icon: Sparkles },
  ]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubChats = onSnapshot(collection(db, 'users', user.uid, 'chats'), (snap) => {
      setStats(prev => prev.map(s => s.label === 'Total Chats' ? { ...s, value: snap.size.toString() } : s));
    });

    const unsubProjects = onSnapshot(collection(db, 'users', user.uid, 'projects'), (snap) => {
      setStats(prev => prev.map(s => s.label === 'Code Projects' ? { ...s, value: snap.size.toString() } : s));
    });

    return () => {
      unsubChats();
      unsubProjects();
    };
  }, []);

  const features = [
    {
      title: 'AI Assistant',
      desc: 'Advanced conversational AI powered by Gemini 3.1 Pro.',
      icon: MessageSquare,
      tab: 'ai',
      color: 'from-blue-500/20 to-purple-500/20'
    },
    {
      title: 'Coding IDE',
      desc: 'Professional code editor with real-time preview and multi-file support.',
      icon: Code,
      tab: 'coding',
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      title: 'History',
      desc: 'Manage and revisit your previous conversations and projects.',
      icon: History,
      tab: 'history',
      color: 'from-orange-500/20 to-red-500/20'
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-silver/60 text-[10px] md:text-sm font-mono tracking-[0.3em] uppercase mb-2"
          >
            System Overview
          </motion.h2>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-4xl font-bold tracking-tight"
          >
            Good Evening, <span className="text-accent">Ryeenzy!</span>
          </motion.h1>
          <p className="text-silver/40 mt-2 text-sm md:text-base">Your intelligent AI assistant is ready to help you create, code, and explore.</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <stat.icon className="w-5 h-5 text-accent/40 mb-4" />
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-silver/40 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-accent/10 to-transparent border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="w-32 h-32 text-accent" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Next Generation AI</h3>
                <p className="text-silver/60 max-w-md mb-8">
                  Experience the power of advanced reasoning and creative generation. 
                  RyeenzyAI adapts to your style, whether you're coding complex systems or having a casual chat.
                </p>
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="bg-accent text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  Start New Chat
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Quick Access
              </h4>
              <div className="space-y-3">
                {features.map((f) => (
                  <button
                    key={f.title}
                    onClick={() => setActiveTab(f.tab as Tab)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", f.color)}>
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium group-hover:text-white transition-colors">{f.title}</p>
                      <p className="text-[10px] text-silver/40">Open feature</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-silver/60" />
            Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Multimodal', desc: 'Process text, images, and voice notes seamlessly.' },
              { title: 'Context Aware', desc: 'Maintains deep context across long conversations.' },
              { title: 'Code Expert', desc: 'Write, debug, and explain code in 50+ languages.' }
            ].map((cap, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <h4 className="font-semibold mb-2">{cap.title}</h4>
                <p className="text-sm text-silver/60">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
