import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Palette, Type, Layout, Check, Sparkles, MessageSquare } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Customize() {
  const [theme, setTheme] = useState('silver');
  const [bgType, setBgType] = useState('moon');
  const [bgMode, setBgMode] = useState('3d');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [font, setFont] = useState('Inter');
  const [bubbleStyle, setBubbleStyle] = useState('modern');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const loadSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setTheme(data.theme || 'silver');
          setBgType(data.bgType || 'moon');
          setBgMode(data.bgMode || '3d');
          setBgColor(data.bgColor || '#ffffff');
          setFont(data.font || 'Inter');
          setBubbleStyle(data.bubbleStyle || 'modern');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    loadSettings();
  }, []);

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Cyan', value: '#00ffff' },
    { name: 'Magenta', value: '#ff00ff' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Gold', value: '#fbbf24' },
    { name: 'Crimson', value: '#ef4444' },
    { name: 'Indigo', value: '#6366f1' },
  ];

  const fonts = ['Inter', 'JetBrains Mono', 'Space Grotesk', 'Outfit'];

  const saveSettings = async (updates: any) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      if (updates.theme) setTheme(updates.theme);
      if (updates.bgType) setBgType(updates.bgType);
      if (updates.bgMode) setBgMode(updates.bgMode);
      if (updates.bgColor) setBgColor(updates.bgColor);
      if (updates.font) setFont(updates.font);
      if (updates.bubbleStyle) setBubbleStyle(updates.bubbleStyle);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const bgTypes = [
    { id: 'moon', name: 'Lunar Surface', desc: 'Default atmospheric moon background' },
    { id: 'nebula', name: 'Nebula Flow', desc: 'Cosmic gradients with pulse effects' },
    { id: 'grid', name: 'Grid HUD', desc: 'Cyberpunk technical floor grid' },
    { id: 'matrix', name: 'Data Matrix', desc: 'Raining binary code particles' }
  ];

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Customize</h1>
          <p className="text-silver/40 text-xs md:text-sm">Personalize your workspace and AI experience.</p>
        </header>

        <div className="space-y-12">
          {/* Background Type */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Atmosphere Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bgTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => saveSettings({ bgType: type.id })}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col gap-1 text-left",
                    bgType === type.id ? "bg-accent/10 border-accent" : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{type.name}</span>
                    {bgType === type.id && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-[10px] text-silver/40">{type.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Background Info */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Background Status
            </h3>
            <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium">Spline 3D Active</p>
                <p className="text-xs text-silver/40">Using the high-performance interactive scene provided.</p>
              </div>
            </div>
          </section>

          {/* Background Mode */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layout className="w-5 h-5 text-accent" />
              Background Mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => saveSettings({ bgMode: '3d' })}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex flex-col gap-2 text-left",
                  bgMode === '3d' ? "bg-accent/10 border-accent" : "bg-white/5 border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">3D Animation</span>
                  {bgMode === '3d' && <Check className="w-4 h-4 text-accent" />}
                </div>
                <p className="text-xs text-silver/40">High-quality interactive 3D scene (Spline). Requires better hardware.</p>
              </button>
              <button
                onClick={() => saveSettings({ bgMode: 'simple' })}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex flex-col gap-2 text-left",
                  bgMode === 'simple' ? "bg-accent/10 border-accent" : "bg-white/5 border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Simple Gradient</span>
                  {bgMode === 'simple' && <Check className="w-4 h-4 text-accent" />}
                </div>
                <p className="text-xs text-silver/40">Lightweight atmospheric gradient. Best for performance and stability.</p>
              </button>
            </div>
          </section>

          {/* Bubble Style */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Bubble Chat Style
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'modern', name: 'Modern', desc: 'Sleek with subtle shadows' },
                { id: 'glass', name: 'Glass', desc: 'Frosted glass effect' },
                { id: 'minimal', name: 'Minimal', desc: 'Clean and flat design' },
                { id: 'cyber', name: 'Cyberpunk', desc: 'Tech-cut angled bubbles' },
                { id: 'neo', name: 'Neomorphic', desc: 'Soft gradients and deep depth' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => saveSettings({ bubbleStyle: style.id })}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col gap-1 text-left",
                    bubbleStyle === style.id ? "bg-accent/10 border-accent" : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{style.name}</span>
                    {bubbleStyle === style.id && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-[10px] text-silver/40">{style.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Color Selection */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Custom Color
            </h3>
            <div className="flex flex-wrap gap-4">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => saveSettings({ bgColor: c.value })}
                  className={cn(
                    "group relative flex flex-col items-center gap-2",
                    bgColor === c.value ? "scale-110" : "hover:scale-105"
                  )}
                >
                  <div 
                    className="w-12 h-12 rounded-full border-2 transition-all"
                    style={{ 
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? 'white' : 'transparent'
                    }}
                  />
                  <span className="text-[10px] text-silver/40 uppercase tracking-widest">{c.name}</span>
                </button>
              ))}
              <div className="flex flex-col items-center gap-2">
                <input 
                  type="color" 
                  value={bgColor}
                  onChange={(e) => saveSettings({ bgColor: e.target.value })}
                  className="w-12 h-12 rounded-full bg-transparent border-none cursor-pointer"
                />
                <span className="text-[10px] text-silver/40 uppercase tracking-widest">Custom</span>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Type className="w-5 h-5 text-accent" />
              Typography
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fonts.map((f) => (
                <button
                  key={f}
                  onClick={() => saveSettings({ font: f })}
                  className={cn(
                    "w-full p-4 rounded-xl border transition-all flex items-center justify-between",
                    font === f ? "bg-accent/10 border-accent" : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                  style={{ fontFamily: f }}
                >
                  <span className="text-lg">{f}</span>
                  {font === f && <Check className="w-4 h-4 text-accent" />}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
