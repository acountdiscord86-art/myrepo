import { User } from 'firebase/auth';
import { LayoutDashboard, MessageSquare, Code, History, Palette, Settings, LogOut, Plus, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tab } from '../App';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'ai', icon: MessageSquare, label: 'AI Chat' },
    { id: 'features', icon: Sparkles, label: 'AI Features' },
    { id: 'coding', icon: Code, label: 'Coding IDE' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'customize', icon: Palette, label: 'Customize' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col p-4 z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-color),0.2)]">
          <img 
            src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-lg">RyeenzyAI</h1>
          <p className="text-[10px] text-accent/40 uppercase tracking-widest">Next-Gen Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
              activeTab === item.id 
                ? "bg-accent/10 text-accent" 
                : "text-silver/60 hover:text-white hover:bg-white/5"
            )}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
              />
            )}
            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === item.id && "text-accent")} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
        <button
          onClick={() => setActiveTab('ai')}
          className="w-full flex items-center justify-center gap-2 bg-accent text-black py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">New Chat</span>
        </button>

        <div className="flex items-center gap-3 px-2 py-2">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border border-white/20"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
            <p className="text-[10px] text-silver/40 truncate">{user.email}</p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-white/10 rounded-lg text-silver/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
