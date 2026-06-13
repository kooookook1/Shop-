import React, { useState } from 'react';
import { Mail, Lock, Sparkles, User } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLogin: (userName: string, email: string, password?: string, isRegistering?: boolean, shippingCode?: string) => Promise<void> | void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ exists: boolean; message: string } | null>(null);

  const handleEmailCheck = async (val: string) => {
    if (!val || !val.includes('@')) {
      setEmailFeedback(null);
      return;
    }
    setEmailChecking(true);
    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.exists) {
        setEmailFeedback({
          exists: true,
          message: '⚠️ هذا البريد مسجل مسبقاً في ريكسون! يرجى تسجيل الدخول'
        });
      } else {
        setEmailFeedback({
          exists: false,
          message: '✨ بريد إلكتروني متاح للتنشيط الفوري'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isRegistering && emailFeedback?.exists) {
      alert("البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو اختيار بريد آخر.");
      return;
    }

    setIsLoading(true);

    // Beautiful premium artificial delay for a premium user waiting feedback feel
    await new Promise(resolve => setTimeout(resolve, 850));

    try {
      if (isRegistering) {
        const name = fullName.trim() || email.split('@')[0] || 'مستشار ريكسون';
        await onLogin(name, email, password, true);
      } else {
        const fallbackName = email ? email.split('@')[0] : 'أحمد محمد';
        await onLogin(fallbackName, email, password, false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (name: string, emailStr: string) => {
    if (isLoading) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 850));
    try {
      await onLogin(name, emailStr, undefined, false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between px-6 py-12 bg-gradient-to-b from-[#0a2562] to-[#051b4d]">
      {/* Background patterns */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"
        }}
      />
      <div 
        className="absolute top-0 left-0 right-0 h-2/5 pointer-events-none opacity-30 bg-gradient-to-b from-white/10 to-transparent"
        style={{
          maskImage: 'radial-gradient(circle at top, black, transparent 80%)'
        }}
      />



      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full z-10 py-6">
        {/* Brand Logo icon mirrored from screenshot */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-24 h-24 flex items-center justify-center p-2 rounded-full bg-gradient-to-br from-amber-200/5 to-amber-500/10 border border-amber-400/20 shadow-lg">
            <svg className="w-full h-full text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 100 100">
              <path d="M50 10 L80 40 L50 90 L20 40 Z" />
              <path d="M50 25 L65 40 L50 65 L35 40 Z" strokeWidth="2" />
              <path d="M50 10 C60 10 75 25 75 45 C75 70 50 85 50 85 C50 85 25 70 25 45 C25 25 40 10 50 10" strokeWidth="3" className="opacity-75" />
            </svg>
          </div>
        </motion.div>

        <motion.h1 
          key={isRegistering ? 'reg' : 'log'}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold mb-10 text-center tracking-wide text-white"
        >
          {isRegistering ? 'إنشاء حساب جديد' : 'مرحباً بك في ريكسون'}
        </motion.h1>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isRegistering && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <User className="w-5 h-5 text-brand-gold" />
              </div>
              <input 
                required
                disabled={isLoading}
                type="text" 
                placeholder="الاسم الكامل" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-right text-sm placeholder-white/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-gold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Mail className="w-5 h-5 text-brand-gold" />
            </div>
            <input 
              required
              disabled={isLoading}
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailFeedback) setEmailFeedback(null);
              }}
              onBlur={(e) => handleEmailCheck(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-right text-sm placeholder-white/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-gold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {emailChecking && (
            <div className="text-[10px] text-gray-300 text-right px-2 mt-1 animate-pulse">
              🔍 جاري التحقق من وجود الحساب...
            </div>
          )}

          {emailFeedback && (
            <div className={`text-[11px] font-bold text-right px-2 mt-1 ${emailFeedback.exists ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {emailFeedback.message}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Lock className="w-5 h-5 text-brand-gold" />
            </div>
            <input 
              required
              disabled={isLoading}
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-right text-sm placeholder-white/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-gold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <motion.button 
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-[#051b4d] font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/10 mt-6 transition-all border border-amber-300/30 text-center flex items-center justify-center gap-2.5 relative overflow-hidden disabled:opacity-90 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#051b4d]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="tracking-wide animate-pulse">جاري التحقق والاتصال الآمن...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#051b4d]" />
                <span>{isRegistering ? 'تسجيل حساب جديد' : 'تسجيل الدخول'}</span>
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Footer Links */}
      <div className="w-full flex justify-between text-xs text-white/50 max-w-sm mx-auto z-10 select-none">
        {isRegistering ? (
          <button type="button" disabled={isLoading} onClick={() => setIsRegistering(false)} className="hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">لديك حساب؟ تسجيل الدخول</button>
        ) : (
          <button type="button" disabled={isLoading} onClick={() => setIsRegistering(true)} className="hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">إنشاء حساب جديد</button>
        )}
        <button type="button" disabled={isLoading} className="hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">نسيت كلمة المرور؟</button>
      </div>
    </div>
  );
}
