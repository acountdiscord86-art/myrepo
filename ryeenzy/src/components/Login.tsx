import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, Github, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background HUD Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent/20" />
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-accent/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group"
      >
        {/* Scanning Line */}
        <motion.div
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-accent/30 z-20 pointer-events-none"
        />

        <div className="flex justify-center mb-8 relative">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-accent/20 rounded-full blur-2xl" 
          />
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center relative z-10 border border-white/10 shadow-2xl">
            <img 
              src="https://www.image2url.com/r2/default/images/1776259988731-7cc679d1-4c75-4ec5-b335-ad5c748f0010.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-accent/60 text-sm">
            {isRegister ? 'Join the future of AI' : 'Login to continue to RyeenzyAI'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-accent/20 focus:outline-none focus:border-accent/40 transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-accent/20 focus:outline-none focus:border-accent/40 transition-colors"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/40 px-2 text-accent/40">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Chrome className="w-4 h-4" />
            <span className="text-sm">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
            <Github className="w-4 h-4" />
            <span className="text-sm">GitHub</span>
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-silver/40">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-white hover:underline font-medium"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
