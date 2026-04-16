import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Globe, Bug, Bell, LogOut, Save, Camera } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Settings() {
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    aiStyle: 'formal',
    language: 'id'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('custom_gemini_api_key');
    if (savedKey) setCustomApiKey(savedKey);

    const user = auth.currentUser;
    if (!user) return;
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            displayName: data.displayName || '',
            email: data.email || '',
            aiStyle: data.aiStyle || 'formal',
            language: data.language || 'id'
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      localStorage.setItem('custom_gemini_api_key', customApiKey);
      await updateDoc(doc(db, 'users', user.uid), profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Refresh the page to apply the new API key
      if (customApiKey) {
        window.location.reload();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-silver/40 text-xs md:text-sm">Manage your account and application preferences.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all w-full md:w-auto",
              success ? "bg-emerald-500 text-white" : "bg-accent text-black hover:opacity-90"
            )}
          >
            {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
            <Save className="w-4 h-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-silver/60" />
                Profile Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <img 
                      src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-3xl border-2 border-white/10 group-hover:border-white/40 transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    <button className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-silver/40 uppercase tracking-widest">Display Name</label>
                        <input
                          type="text"
                          value={profile.displayName}
                          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-silver/40 uppercase tracking-widest">Email Address</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-silver/60" />
                AI Interaction Style
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {['formal', 'casual', 'creative'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setProfile({ ...profile, aiStyle: style })}
                    className={cn(
                      "p-4 rounded-xl border text-sm font-medium capitalize transition-all",
                      profile.aiStyle === style ? "bg-white/10 border-white/40" : "bg-white/5 border-white/5 hover:border-white/20"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-silver/60" />
                Language
              </h3>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40 appearance-none"
              >
                <option value="id" className="bg-zinc-900">Bahasa Indonesia</option>
                <option value="en" className="bg-zinc-900">English</option>
                <option value="jp" className="bg-zinc-900">Japanese</option>
              </select>
            </section>

            <section className="p-6 rounded-2xl bg-accent/5 border border-accent/20">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-accent">
                <Shield className="w-5 h-5" />
                Gemini API Configuration
              </h3>
              <p className="text-silver/40 text-xs mb-4">
                If the AI is not responding, you can manually set your Gemini API Key here. 
                This key is stored locally in your browser.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] text-silver/40 uppercase tracking-widest">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Paste your API Key here..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent/40 text-sm font-mono"
                />
                <p className="text-[10px] text-silver/30">
                  Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent hover:underline">Google AI Studio</a>
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-silver/60" />
                Notifications
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-silver/80">Email Alerts</span>
                  <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-silver/80">System Sounds</span>
                  <div className="w-10 h-5 bg-silver rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-400">
                <Bug className="w-4 h-4" />
                Danger Zone
              </h4>
              <button className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                Report a Bug
              </button>
              <button 
                onClick={() => auth.signOut()}
                className="w-full mt-3 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
