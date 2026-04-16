/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import ThreeBackground from './components/ThreeBackground';
import LoadingScreen from './components/LoadingScreen';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import IDE from './components/IDE';
import History from './components/History';
import Settings from './components/Settings';
import Customize from './components/Customize';
import Features from './components/Features';
import { motion, AnimatePresence } from 'motion/react';

export type Tab = 'dashboard' | 'ai' | 'features' | 'coding' | 'history' | 'customize' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState('silver');
  const [bgType, setBgType] = useState('moon');
  const [bgMode, setBgMode] = useState('3d');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [font, setFont] = useState('Inter');
  const [bubbleStyle, setBubbleStyle] = useState('modern');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Safety timeout to prevent getting stuck on loading screen
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Firebase initialization taking too long, forcing loading state to false.");
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setUser(user);
      setIsAuthReady(true);
      setTimeout(() => setLoading(false), 1000);
      clearTimeout(safetyTimeout);
    });
    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [loading]);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    const initProfile = async () => {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || '',
          theme: 'silver',
          aiStyle: 'formal',
          language: 'id',
          createdAt: new Date().toISOString()
        });
      }
    };
    initProfile();

    const unsubProfile = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTheme(data.theme || 'silver');
        setBgType(data.bgType || 'moon');
        setBgMode(data.bgMode || '3d');
        setBgColor(data.bgColor || '#ffffff');
        setFont(data.font || 'Inter');
        setBubbleStyle(data.bubbleStyle || 'modern');
      }
    });

    return () => unsubProfile();
  }, [user]);

  if (loading) {
    return <LoadingScreen theme={theme} type={bgType} color={bgColor} mode={bgMode} />;
  }

  if (!user) {
    return (
      <>
        <ThreeBackground type={bgType} color={bgColor} mode={bgMode} />
        <Login />
      </>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'ai': return (
        <Chat 
          user={user} 
          bubbleStyle={bubbleStyle} 
          initialChatId={selectedChatId} 
          onChatCreated={(id) => setSelectedChatId(id)}
        />
      );
      case 'features': return <Features />;
      case 'coding': return <IDE user={user} />;
      case 'history': return (
        <History 
          setActiveTab={setActiveTab} 
          setSelectedChatId={setSelectedChatId} 
        />
      );
      case 'customize': return <Customize />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div 
      className="flex h-screen bg-transparent text-white overflow-hidden font-sans relative"
      style={{ fontFamily: font }}
      data-theme={theme}
    >
      <ThreeBackground type={bgType} color={bgColor} mode={bgMode} />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img 
              src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-bold tracking-tight">RyeenzyAI</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <div className="w-6 h-0.5 bg-white mb-1.5 transition-all" style={{ transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : '' }} />
          <div className="w-6 h-0.5 bg-white mb-1.5 transition-all" style={{ opacity: isMobileMenuOpen ? 0 : 1 }} />
          <div className="w-6 h-0.5 bg-white transition-all" style={{ transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : '' }} />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'ai') setSelectedChatId(null);
          setIsMobileMenuOpen(false);
        }} 
        user={user} 
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 relative overflow-hidden pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

