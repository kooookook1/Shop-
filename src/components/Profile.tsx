import React, { useState } from 'react';
import { 
  CreditCard, Copy, CheckCircle2, ChevronLeft, ShieldAlert, BadgeAlert, 
  Award, FileText, Settings, Heart, HelpCircle, Key, RefreshCw, 
  ArrowRight, Sparkles, ShieldCheck, Cpu, Coins, Info, HeartOff, Plus 
} from 'lucide-react';
import { Order, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  userName: string;
  userBalance: number;
  orders: Order[];
  onOpenChat: () => void;
  onCopyText: (text: string, label: string) => void;
  onConfirmReceipt: (orderId: string) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  allProducts?: Product[];
  userId?: string;
  userEmail?: string;
  userPassword?: string;
  onUpdateProfile?: (userId: string, newName: string, newEmail?: string, newPassword?: string) => void;
  onAddBalance?: (userId: string, amount: number) => void;
  onSelectProduct?: (product: Product) => void;
  activeSubSection?: 'none' | 'favorites' | 'settings' | 'about' | 'recharge';
  setActiveSubSection?: (sec: 'none' | 'favorites' | 'settings' | 'about' | 'recharge') => void;
}

export default function Profile({ 
  userName, 
  userBalance, 
  orders, 
  onOpenChat, 
  onCopyText, 
  onConfirmReceipt,
  favoriteIds = [],
  onToggleFavorite,
  allProducts = [],
  userId = '',
  userEmail = '',
  userPassword = '',
  onUpdateProfile,
  onAddBalance,
  onSelectProduct,
  activeSubSection: propsActiveSubSection,
  setActiveSubSection: propsSetActiveSubSection
}: ProfileProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Navigation State inside Profile Account tab
  const [localActiveSubSection, setLocalActiveSubSection] = useState<'none' | 'favorites' | 'settings' | 'about' | 'recharge'>('none');
  const activeSubSection = propsActiveSubSection !== undefined ? propsActiveSubSection : localActiveSubSection;
  const setActiveSubSection = propsSetActiveSubSection !== undefined ? propsSetActiveSubSection : setLocalActiveSubSection;

  // Local state for edits
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Asiacell Wallet Recharge states
  const [rechargeMethod, setRechargeMethod] = useState<'list' | 'demo' | 'asiacell' | 'crypto' | 'mastercard' | 'zaincash' | 'zain_transfer' | 'binance'>('list');
  const [acStep, setAcStep] = useState<number>(1);
  const [acRechargeType, setAcRechargeType] = useState<'card' | 'transfer'>('transfer');
  const [acPhone, setAcPhone] = useState<string>('');
  const [acOtp, setAcOtp] = useState<string>('');
  const [acSessionId, setAcSessionId] = useState<string>('');
  const [acVoucher, setAcVoucher] = useState<string>('');
  const [acAmountIQD, setAcAmountIQD] = useState<string>('');
  const [acLoading, setAcLoading] = useState<boolean>(false);
  const [acExchangeRate, setAcExchangeRate] = useState<number>(350);
  const [acMessage, setAcMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [telegramContact, setTelegramContact] = useState<string>('');
  const [whatsappContact, setWhatsappContact] = useState<string>('');
  const [asiacellPhoneSetting, setAsiacellPhoneSetting] = useState<string>('07700000000');

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data) {
          if (data.asiacellRate) {
            setAcExchangeRate(Number(data.asiacellRate));
          }
          if (data.socialTelegram) {
            setTelegramContact(data.socialTelegram);
          }
          if (data.socialWhatsapp) {
            setWhatsappContact(data.socialWhatsapp);
          }
          if (data.asiacellPhone) {
            setAsiacellPhoneSetting(data.asiacellPhone);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings rate:', err);
      }
    };
    if (activeSubSection === 'settings' || activeSubSection === 'recharge') {
      fetchSettings();
    }
  }, [activeSubSection]);

  const resetAsiacellWorkflow = () => {
    setAcStep(1);
    setAcPhone('');
    setAcOtp('');
    setAcSessionId('');
    setAcVoucher('');
    setAcAmountIQD('');
    setAcLoading(false);
  };

  const handleAsiacellLogin = async () => {
    if (!acPhone || acPhone.trim().length === 0) {
      setAcMessage({ text: 'من فضلك أدخل رقم هاتف آسياسيل الخاص بك', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
    const effectiveUserId = userId || userEmail || userName || 'system_guest';
    try {
      const res = await fetch('/api/asiacell/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: acPhone, userId: effectiveUserId })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else {
        setAcSessionId(data.sessionId);
        setAcStep(2);
        setAcMessage({ text: data.message || 'تم إرسال رمز التحقق OTP بنجاح', type: 'success' });
      }
    } catch (err: any) {
      setAcMessage({ text: 'حدث خطأ في الاتصال بالبوابة: ' + err.message, type: 'error' });
    } finally {
      setAcLoading(false);
    }
  };

  const handleAsiacellVerifyOtp = async () => {
    if (!acOtp || acOtp.trim().length === 0) {
      setAcMessage({ text: 'يرجى إدخال رمز التحقق OTP الذي وصلك', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
    try {
      const res = await fetch('/api/asiacell/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: acSessionId, otp: acOtp })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else if (data.success) {
        setAcStep(3);
        setAcOtp('');
        setAcMessage({ text: 'تم تسجيل دخول خطك ومزامنته بالكامل', type: 'success' });
      } else {
        setAcMessage({ text: data.message || 'رمز OTP غير صالح', type: 'error' });
      }
    } catch (err: any) {
      setAcMessage({ text: 'حدث خطأ أثناء تأكيد الرمز: ' + err.message, type: 'error' });
    } finally {
      setAcLoading(false);
    }
  };

  const handleAsiacellCardRecharge = async () => {
    if (!acVoucher || acVoucher.trim().length < 4) {
      setAcMessage({ text: 'رمز كارت الشحن غير مكتمل وصغير جداً', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
    try {
      const res = await fetch('/api/asiacell/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: acSessionId,
          voucher: acVoucher,
          username: userName
        })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else if (data.success) {
        setAcMessage({ text: data.message, type: 'success' });
        if (onAddBalance) {
          onAddBalance(userId || userEmail || userName || 'system_guest', data.credited);
        }
        setTimeout(() => {
          resetAsiacellWorkflow();
          setAcMessage(null);
        }, 3000);
      } else {
        setAcMessage({ text: data.message || 'فشلت عملية تعبئة كارت الرصيد', type: 'error' });
      }
    } catch (err: any) {
      setAcMessage({ text: 'حدث خطأ في البوابة: ' + err.message, type: 'error' });
    } finally {
      setAcLoading(false);
    }
  };

  const handleAsiacellTransferInitiate = async () => {
    const amt = parseInt(acAmountIQD);
    if (!amt || amt < 250) {
      setAcMessage({ text: 'الحد الأدنى لتحويل الرصيد هو 250 دينار عراقي', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
    try {
      const res = await fetch('/api/asiacell/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: acSessionId,
          amount: amt,
          username: userName
        })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else if (data.success) {
        setAcStep(4);
        setAcOtp('');
        setAcMessage({ text: data.message || 'تم إرسال كود تأكيد تحويل الرصيد المالي', type: 'info' });
      } else {
        setAcMessage({ text: data.message || 'فشلت عملية تهيئة التحويل', type: 'error' });
      }
    } catch (err: any) {
      setAcMessage({ text: 'خطأ بالتحويل: ' + err.message, type: 'error' });
    } finally {
      setAcLoading(false);
    }
  };

  const handleAsiacellTransferConfirm = async () => {
    if (!acOtp || acOtp.trim().length === 0) {
      setAcMessage({ text: 'يرجى كتابة رمز التحويل OTP لتدعيم المعاملة', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
    try {
      const res = await fetch('/api/asiacell/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: acSessionId,
          otp: acOtp
        })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else if (data.success) {
        setAcMessage({ text: data.message, type: 'success' });
        if (onAddBalance) {
          onAddBalance(userId || userEmail || userName || 'system_guest', data.credited);
        }
        setTimeout(() => {
          resetAsiacellWorkflow();
          setAcMessage(null);
        }, 3000);
      } else {
        setAcMessage({ text: data.message || 'فشل رمز التأكيد النهائي', type: 'error' });
      }
    } catch (err: any) {
      setAcMessage({ text: 'حدث خطأ أثناء التحويل: ' + err.message, type: 'error' });
    } finally {
      setAcLoading(false);
    }
  };

  React.useEffect(() => {
    setEditName(userName);
  }, [userName]);

  React.useEffect(() => {
    setEditEmail(userEmail);
  }, [userEmail]);

  const triggerCopy = (text: string, label: string, fieldId: string) => {
    onCopyText(text, label);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveProfileSettings = () => {
    if (!editName.trim()) {
      alert("الرسالة: يرجى عدم ترك الاسم فارغاً ⚠️");
      return;
    }
    if (!editEmail.trim()) {
      alert("الرسالة: يرجى عدم ترك البريد الإلكتروني فارغاً ⚠️");
      return;
    }

    let finalPassword = userPassword;
    if (newPasswordInput.trim()) {
      if (!oldPasswordInput.trim()) {
        alert("الرسالة: لتغيير كلمة المرور، يرجى كتابة كود كلمة المرور القديمة أولاً للتأكيد ⚠️");
        return;
      }
      if (oldPasswordInput !== userPassword) {
        alert("الرسالة: كلمة المرور القديمة المدخلة غير صحيحة ⚠️");
        return;
      }
      finalPassword = newPasswordInput;
    } else if (oldPasswordInput.trim()) {
      alert("الرسالة: يرجى إدخال كلمة المرور الجديدة المطلوبة ⚠️");
      return;
    }

    if (onUpdateProfile && userId) {
      onUpdateProfile(userId, editName, editEmail, finalPassword);
      setOldPasswordInput('');
      setNewPasswordInput('');
    }
  };

  const handleChargeWallet = (amount: number) => {
    if (onAddBalance && userId) {
      onAddBalance(userId, amount);
    }
  };

  const handleCustomChargeWallet = () => {
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (onAddBalance && userId) {
      onAddBalance(userId, amt);
      setRechargeAmount('');
    }
  };

  // Filter products by favoriteIds
  const favoritedProducts = allProducts.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="space-y-6 pt-2 pb-24 text-right">
      
      <AnimatePresence mode="wait">
        {activeSubSection === 'none' && (
          <motion.div
            key="profile-main"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* HEADER SECTION WITH USER INFO */}
            <header className="pt-4 px-4 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-cyan-400">
                  <Award size={22} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <h1 className="text-lg font-black text-white leading-tight">{userName}</h1>
                    <p className="text-[10px] text-gray-400">مرحباً بك مجدداً معنا</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 border-2 border-cyan-400 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400 select-none">
                    {(userName && typeof userName === 'string') ? userName.charAt(0) : 'أ'}
                  </div>
                </div>
              </div>

              {/* WALLET BALANCE CARD */}
              <div className="w-full bg-gradient-to-r from-amber-400 to-amber-200 p-5 rounded-3xl flex justify-between items-center shadow-lg text-slate-950 font-sans select-none relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-black" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, white 0%, transparent 40%)' }}></div>
                
                <div className="relative z-10 text-right space-y-1">
                  <span className="text-[10px] text-slate-800 font-bold tracking-widest uppercase">الرصيد المتاح بالمحفظة</span>
                  <p className="text-2xl font-black">{(userBalance ?? 0).toLocaleString('ar-EG')} د.ع</p>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRechargeMethod('list');
                      setActiveSubSection('recharge');
                    }}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-md border border-white/5 cursor-pointer"
                  >
                    <span>إعادة شحن</span>
                    <Plus size={11} className="text-amber-400" />
                  </button>

                  <div className="bg-slate-950/10 p-2.5 rounded-2xl border border-white/10 shrink-0">
                    <CreditCard size={20} className="text-slate-950" />
                  </div>
                </div>
              </div>

              {/* UNIQUE IDENTIFICATION CARD - REDESIGNED TO BE COPIOUSLY BEAUTIFUL, DYNAMIC, GLOWING */}
              <div className="w-full bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-blue-950/30 border-2 border-cyan-400/40 rounded-3xl p-5 flex flex-col gap-3.5 text-right mt-4 shadow-[0_0_25px_rgba(34,211,238,0.25)] relative overflow-hidden select-none">
                {/* Shining ambient background light overlay */}
                <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-center bg-transparent">
                  <div className="flex items-center gap-1.5 bg-cyan-400/10 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/20 text-[9px] font-extrabold animate-bounce">
                    <Sparkles size={11} className="text-cyan-400" />
                    <span>الكود الحصري لشحن المحفظة ⚡</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-1 justify-end leading-none">
                    <span>هل تود شحن رصيدك فوراً؟ 💰</span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                    من فضلك انسخ هذا الكود الفريد الموضح أدناه وشاركه فوراً مع الإشراف أو الدعم الفني بالدردشة ليقوموا بشحن حسابك أو تعديل نقاطك بالثواني!
                  </p>
                </div>

                {/* ID Input Copy Component */}
                <div className="flex items-center justify-between gap-2.5 bg-slate-950/80 rounded-2xl p-2.5 border border-cyan-400/20 shadow-inner">
                  <button 
                    onClick={() => triggerCopy(userId, 'معرف الحساب الشحني الفريد', 'userIdCode')}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all transform hover:scale-[1.03] active:scale-95 shadow shrink-0 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedId === 'userIdCode' ? 'تم النسخ!' : 'انسخ الكود الآن 📋'}</span>
                  </button>
                  
                  <div className="flex-grow text-left font-mono text-xs text-white bg-transparent outline-none uppercase tracking-widest font-black truncate max-w-[190px] select-all rtl:text-left">
                    {userId}
                  </div>
                </div>
              </div>
            </header>

            {/* USER ORDER DELIVERIES */}
            <section className="px-4 space-y-4">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] text-slate-400 font-medium font-sans">معلومات تسليم الحسابات فورية</span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-cyan-400" />
                  <span>طلباتي الأخيرة</span>
                </h2>
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">
                    لم تقم بأي طلبات شراء بعد. تسوق في المتجر لطلب مفاتيحك الرقمية!
                  </div>
                ) : (
                  orders.map((order) => {
                    const isDelivered = order.status === 'تم تسليم الطلب' || order.status === 'مكتمل';
                    const showCredentialsBox = isDelivered && order.credentials;

                    return (
                      <div 
                        key={order.id} 
                        className={`glass-card rounded-3xl p-4 space-y-4 border border-white/5 relative overflow-hidden ${
                          order.status === 'تم تسليم الطلب' ? 'border-l-4 border-l-amber-400' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                              {order.imageUrl ? (
                                <img 
                                  src={order.imageUrl} 
                                  alt={order.productName} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-cyan-400 font-extrabold text-xs">RX</span>
                              )}
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-xs text-white leading-tight line-clamp-2 max-w-[160px]">{order.productName}</h3>
                              <p className="text-[9px] text-gray-400 mt-1">{order.date} • رقم: #{order.id}</p>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <p className="text-xs font-black text-cyan-400">{(order.price ?? 0).toLocaleString('ar-EG')} د.ع</p>
                            <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold ${
                              order.status === 'تم تسليم الطلب' ? 'text-amber-400' : 
                              order.status === 'مكتمل' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              <span>{order.status}</span>
                              {isDelivered && <CheckCircle2 size={10} />}
                            </div>
                          </div>
                        </div>

                        {/* ACCOUNT CREDENTIALS HIGHLIGHTED BOX */}
                        {showCredentialsBox && (
                          <div className="glass-card rounded-2xl p-3.5 space-y-3 relative overflow-hidden">
                            <div className="flex justify-between items-center text-[10px] text-gray-400 border-b border-white/5 pb-1.5 select-none animate-pulse">
                              <span className="flex items-center gap-1"><Key size={10} /> بيانات حسابك جاهزة الآن</span>
                              <span>معلومات التسليم الآمن</span>
                            </div>

                            {order.credentials?.username && (
                              <div className="flex items-center justify-between text-xs">
                                <button 
                                  onClick={() => triggerCopy(order.credentials!.username!, 'اسم المستخدم', `${order.id}-user`)}
                                  className="glass-button text-cyan-400 text-[10px] px-2.5 py-1 rounded-lg"
                                >
                                  {copiedId === `${order.id}-user` ? 'تم النسخ!' : 'نسخ'}
                                </button>
                                <span className="text-gray-300 text-right leading-tight break-all font-mono pl-3 selection:bg-amber-400">
                                  {order.credentials.username} :<span className="text-gray-500 font-sans mr-1">المستخدم</span>
                                </span>
                              </div>
                            )}

                            {order.credentials?.password && (
                              <div className="flex items-center justify-between text-xs">
                                <button 
                                  onClick={() => triggerCopy(order.credentials!.password!, 'كلمة المرور', `${order.id}-pw`)}
                                  className="glass-button text-cyan-400 text-[10px] px-2.5 py-1 rounded-lg"
                                >
                                  {copiedId === `${order.id}-pw` ? 'تم النسخ!' : 'نسخ'}
                                </button>
                                <span className="text-gray-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400">
                                  {order.credentials.password} :<span className="text-gray-500 font-sans mr-1">كلمة المرور</span>
                                </span>
                              </div>
                            )}

                            {order.credentials?.code && (
                              <div className="flex items-center justify-between text-xs">
                                <button 
                                  onClick={() => triggerCopy(order.credentials!.code!, 'كود التفعيل', `${order.id}-code`)}
                                  className="glass-button text-amber-400 text-[10px] px-2.5 py-1 rounded-lg"
                                >
                                  {copiedId === `${order.id}-code` ? 'تم النسخ!' : 'نسخ الكود'}
                                </button>
                                <span className="text-gray-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400">
                                  {order.credentials.code} :<span className="text-gray-500 font-sans mr-1">الكود</span>
                                </span>
                              </div>
                            )}
                            {order.credentials?.keys && order.credentials.keys.map((key: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <button 
                                  onClick={() => triggerCopy(key, 'المفتاح', `${order.id}-key-${idx}`)}
                                  className="glass-button text-amber-400 text-[10px] px-2.5 py-1 rounded-lg"
                                >
                                  {copiedId === `${order.id}-key-${idx}` ? 'تم النسخ!' : 'نسخ المفتاح'}
                                </button>
                                <span className="text-gray-300 text-right leading-tight font-mono pl-3 selection:bg-amber-400">
                                  {key} :<span className="text-gray-500 font-sans mr-1">{order.credentials?.keys?.length === 1 ? 'المفتاح' : `المفتاح ${idx + 1}`}</span>
                                </span>
                              </div>
                            ))}

                            {order.credentials?.playerId && (
                              <div className="flex items-center justify-between text-xs border border-white/5 rounded-lg border-dashed p-2 bg-slate-900/50">
                                <span className="text-amber-400 font-bold ml-auto text-left leading-tight font-mono selection:bg-amber-400">
                                  {order.credentials.playerId}
                                </span>
                                <span className="text-gray-400 text-right font-sans mr-1">معرف اللاعب المرفق:</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delivery Confirmed Trigger */}
                        {order.status === 'تم تسليم الطلب' && (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onConfirmReceipt(order.id)}
                            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-colors shadow-md"
                          >
                            تم استلام الطلب وتأكيد الأمان
                          </motion.button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ADDITIONAL SETTINGS UTILITY NAVIGATION */}
            <section className="px-4 select-none">
              <div className="glass-card rounded-3xl overflow-hidden divide-y divide-white/5 border border-white/5">
                <button 
                  onClick={onOpenChat}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-right"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-200">محادثة الدعم الفني الفاخر</span>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                      <HelpCircle size={16} />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSubSection('recharge')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-right"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400">شحن الرصيد والمحفظة 🔥</span>
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 select-none animate-pulse">
                      <Coins size={16} />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSubSection('settings')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-right"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-200">إعدادات الحساب</span>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                      <Settings size={16} />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSubSection('favorites')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-right"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-200">المنتجات المفضلة</span>
                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                      <Heart size={16} />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSubSection('about')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-right"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-200">حول النظام والمنصة</span>
                    <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                      <Info size={16} />
                    </div>
                  </div>
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {/* 1. FAVORITES SUBSECTION SCREEN */}
        {activeSubSection === 'favorites' && (
          <motion.div
            key="profile-favorites"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-4 pt-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between select-none">
              <button 
                onClick={() => setActiveSubSection('none')}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-base font-black text-white flex items-center gap-2 font-sans">
                <Heart size={18} className="text-rose-500 fill-rose-500 animate-pulse" />
                <span>المنتجات المفضلة</span>
              </h2>
            </div>

            {/* List */}
            <div className="space-y-4">
              {favoritedProducts.length === 0 ? (
                <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 select-none">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <HeartOff size={30} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white">قائمتك المفضلة فارغة حالياً</h3>
                    <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                      تصفّح المتجر وأضف منتجاتك المفضلة لتظهر هنا وتصل إليها وتشتريها بلمسة واحدة.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoritedProducts.map((p) => (
                    <div key={p.id} className="glass-card rounded-3xl p-4 flex gap-4 items-center justify-between border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-rose-500 font-extrabold text-xs">Fav</span>
                          )}
                        </div>
                        <div className="text-right font-sans">
                          <h3 className="font-bold text-xs text-white leading-tight">{p.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-1">{p.price.toLocaleString('ar-EG')} د.ع</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onToggleFavorite && (
                          <button
                            onClick={() => onToggleFavorite(p.id)}
                            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                            title="إلغاء المفضلة"
                          >
                            <HeartOff size={14} />
                          </button>
                        )}
                        {onSelectProduct && (
                          <button
                            onClick={() => {
                              onSelectProduct(p);
                            }}
                            className="px-3 py-2 bg-cyan-400 text-slate-950 font-black rounded-xl text-[10px] hover:bg-cyan-300 transition-colors cursor-pointer"
                          >
                            عرض السلعة
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. ACCOUNT SETTINGS SUBSECTION SCREEN */}
        {activeSubSection === 'settings' && (
          <motion.div
            key="profile-settings"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-4 pt-4 text-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between select-none">
              <button 
                onClick={() => setActiveSubSection('none')}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white pb-0.5"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings size={18} className="text-purple-400 animate-spin" />
                <span>إعدادات الحساب والأمان</span>
              </h2>
            </div>

            {/* Current Registered Info Summary Display (Requested feature) */}
            <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/20 rounded-3xl p-5 space-y-4 shadow-lg select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 border-b border-white/5 pb-2">
                <Info size={14} className="text-purple-400" />
                <span>بيانات الحساب المسجلة حالياً</span>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                {/* Name */}
                <div className="flex items-center justify-between bg-slate-950/40 px-3.5 py-2.5 rounded-2xl border border-white/5">
                  <span className="text-white font-extrabold">{userName}</span>
                  <span className="text-gray-400 text-[11px]">اسم المستخدم المسجل:</span>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between bg-slate-950/40 px-3.5 py-2.5 rounded-2xl border border-white/5">
                  <span className="text-white font-sans">{userEmail || 'غير متوفر'}</span>
                  <span className="text-gray-400 text-[11px]">البريد الإلكتروني:</span>
                </div>

                {/* Current Password reveal & copy (Requested feature) */}
                <div className="flex items-center justify-between bg-slate-950/40 px-3.5 py-2.5 rounded-2xl border border-white/5 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerCopy(userPassword, 'رمز المرور الحالي', 'userCurrentPw')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-white/10 rounded-lg text-purple-300 text-[10px] font-sans active:scale-95 transition-all"
                    >
                      {copiedId === 'userCurrentPw' ? 'تم النسخ!' : 'نسخ'}
                    </button>
                    <button
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400 text-[10px] font-bold active:scale-95 transition-all"
                    >
                      {showCurrentPassword ? 'إخفاء' : 'إظهار الرمز'}
                    </button>
                  </div>
                  <div className="text-left font-mono text-white tracking-widest text-xs truncate max-w-[150px]">
                    {showCurrentPassword ? userPassword : '••••••••'}
                  </div>
                  <span className="text-gray-400 text-[11px] shrink-0">كلمة المرور الحالية:</span>
                </div>
              </div>
            </div>

            {/* Account Settings Updating Form */}
            <div className="glass-card rounded-3xl p-5 space-y-4 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200 border-b border-white/5 pb-2.5">
                <Settings size={14} className="text-purple-400" />
                <span>تعديل وحفظ بيانات حسابك</span>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block font-bold">البريد الإلكتروني المسجل:</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-purple-400/50 text-right font-sans"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block font-bold">اسم المستخدم الحالي:</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="أدخل الاسم الجديد"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-purple-400/50 text-right font-sans"
                />
              </div>

              {/* Password update segment with helpful inputs */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                <p className="text-[10px] font-bold text-purple-300">هل تود تغيير كلمة المرور الحالية؟ 🔐</p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5 text-right">
                    <label className="text-[9px] text-gray-400 block">كلمة المرور الجديدة:</label>
                    <input 
                      type="password" 
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="كلمة مرور جديدة"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400/50 text-right font-sans"
                    />
                  </div>
                  
                  <div className="space-y-1.5 text-right">
                    <label className="text-[9px] text-gray-400 block">كلمة المرور القديمة للتحقق:</label>
                    <input 
                      type="password" 
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="كلمة المرور القديمة"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400/50 text-right font-sans"
                    />
                  </div>
                </div>
                <p className="text-[8px] text-gray-500 font-sans">لتأكيد رغبتك في تغيير كلمة سر حسابك، اكتب الكلمة القديمة ثم الجديدة ثم اضغط "حفظ"</p>
              </div>

              <button
                onClick={handleSaveProfileSettings}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer active:scale-95"
              >
                <span>حفظ التعديلات الأمنية والحساب</span>
                <CheckCircle2 size={13} />
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. WALLET RECHARGE SUBSECTION SCREEN */}
        {activeSubSection === 'recharge' && (
          <motion.div
            key="profile-recharge"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-4 pt-4 text-right font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between select-none">
              <button 
                onClick={() => {
                  setActiveSubSection('none');
                  setRechargeMethod('list');
                }}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white pb-0.5"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Coins size={18} className="text-amber-400 animate-pulse" />
                <span>بوابة شحن الرصيد والمحفظة</span>
              </h2>
            </div>

            {/* Wallet Recharging Panel (Demo & Automatic Asiacell Iraqi Gateway) */}
            <div id="asiacell-recharge-section" className="glass-card rounded-3xl p-5 space-y-4 border border-white/5 scroll-mt-6">
              {/* Custom Header with Back-to-List functionality */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <Coins size={14} className="text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-gray-200">
                    {rechargeMethod === 'list' && "اختر نظام الدفع"}
                    {rechargeMethod === 'demo' && "الشحن التجريبي المجاني (Demo)"}
                    {rechargeMethod === 'asiacell' && "بوابة آسياسيل الذكية التلقائية 🇮🇶"}
                    {rechargeMethod === 'crypto' && "Crypto pay | شحن العملات الرقمية"}
                    {rechargeMethod === 'mastercard' && "ماستر كارد / فيزا (الدفع يدوياً)"}
                    {rechargeMethod === 'zaincash' && "زين كاش | Zain Cash (يدوياً)"}
                    {rechargeMethod === 'zain_transfer' && "تحويل رصيد زين اثير (يدوياً)"}
                    {rechargeMethod === 'binance' && "بايننس باي | Binance Pay (يدوياً)"}
                  </span>
                </div>

                {rechargeMethod !== 'list' && (
                  <button
                    onClick={() => setRechargeMethod('list')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-400/5 hover:bg-amber-400/10 rounded-xl border border-amber-400/10 transition-all cursor-pointer font-sans"
                  >
                    <span>رجوع للقائمة</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* ===== METHOD 0: GATEWAYS LIST SELECTION (DEFAULT) ===== */}
              {rechargeMethod === 'list' && (
                <div className="space-y-4 text-right">
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    اختر إحدى بوابات الدفع وشحن الرصيد المتاحة لتعبئة محفظة حسابك فورياً:
                  </p>

                  <div className="space-y-2.5 font-sans mt-2">
                    {/* 1. Crypto pay */}
                    <div 
                      onClick={() => setRechargeMethod('crypto')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/25">
                              احصل على بونص 🎁
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Crypto pay</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">شحن آلي فوري باستخدام العملات الرقمية</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center border border-emerald-400/20 shadow-md shrink-0">
                          <span className="font-sans font-black text-sm text-white">₮</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Asiacell Custom Auto */}
                    <div 
                      onClick={() => {
                        setRechargeMethod('asiacell');
                        setAcStep(1);
                      }}
                      className="flex items-center justify-between p-3.5 bg-[#e31b23]/10 hover:bg-[#e31b23]/15 rounded-2xl border border-[#e31b23]/25 hover:border-[#e31b23]/40 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-0.5 bg-[#e31b23] shadow-[0_0_10px_#e31b23]"></div>
                      
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-[#e31b23] group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                              تلقائي فوري ⚡
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">Asiacell Auto | اسياسيل تحويل تلقائي</span>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-0.5">شحن رصيدك تلقائياً عبر تحويل الرصيد الفوري أو كارت شحن آسيا</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center border border-red-400/20 shadow-md shrink-0 relative overflow-hidden">
                          <span className="font-sans font-black text-[9px] text-white tracking-tighter">Asia</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Card Master */}
                    <div 
                      onClick={() => setRechargeMethod('mastercard')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                              الدفع اليدوي
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Card Master - ماستر كارد</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">الشحن اليدوي لبطاقات الماستر كارد والفيزا والكي كارد العراقي</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-[#0a0f1d] flex items-center justify-center border border-white/5 shadow-md shrink-0 relative overflow-hidden">
                          <div className="relative w-6 h-4 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 absolute left-1" />
                            <div className="w-3 h-3 rounded-full bg-amber-500 absolute right-1 mix-blend-screen opacity-90" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Zain Cash */}
                    <div 
                      onClick={() => setRechargeMethod('zaincash')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                              الدفع اليدوي
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Zain Cash | زين كاش</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">شحن وإيداع الرصيد عبر محفظة زين كاش العراقية</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center border border-purple-400/20 shadow-md shrink-0">
                          <span className="font-sans font-black text-[9px] text-white">Zain</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Zain Transfer */}
                    <div 
                      onClick={() => setRechargeMethod('zain_transfer')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                              الدفع اليدوي
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">تحويل زين (اثير) | Zain</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">شحن الرصيد عن طريق تحويل رصيد خطوط زين اثير العراق يدوياً</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-700 flex items-center justify-center border border-pink-400/20 shadow-md shrink-0">
                          <span className="font-sans font-bold text-[9px] text-white">Zain</span>
                        </div>
                      </div>
                    </div>

                    {/* 6. Binance */}
                    <div 
                      onClick={() => setRechargeMethod('binance')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                              الدفع اليدوي
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-yellow-300 transition-colors">Binance | بايننس</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">الدفع السريع والآمن عبر معرف بينانس وبوابة Binance Pay</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center border border-yellow-400/20 shadow-md shrink-0">
                          <span className="font-sans font-black text-xs text-black">B</span>
                        </div>
                      </div>
                    </div>

                    {/* 7. Free Demo Test */}
                    <div 
                      onClick={() => setRechargeMethod('demo')}
                      className="flex items-center justify-between p-3.5 bg-slate-950/25 hover:bg-slate-950/35 rounded-2xl border border-dashed border-white/10 hover:border-cyan-500/20 transition-all cursor-pointer group active:scale-[0.99] mt-3"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                              تجربة سريعة 🧪
                            </span>
                            <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">شحن تجريبي مجاني (Demo)</span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">تعبئة رصيد المحفظة بمبلغ وهمي لاختبار عمليات الشراء السريعة وتجربة المتجر</span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-cyan-400/20 shadow-md shrink-0">
                          <span className="font-sans font-extrabold text-[9px] text-white">DEMO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== METHOD 1: DEMO RECHARGE ===== */}
              {rechargeMethod === 'demo' && (
                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    رصيدك الحالي غير كافٍ لتجربة الشراء؟ اختر أحد المبالغ السريعة التالية لتعبئة محفظتك فورياً بدون بطاقات دفع حقيقية:
                  </p>

                  {/* Fast presets buttons */}
                  <div className="grid grid-cols-4 gap-2 font-sans">
                    {[5000, 10000, 25000, 50000].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleChargeWallet(val)}
                        className="py-2.5 glass-button text-amber-300 font-bold text-[10px] rounded-xl hover:bg-amber-400/10 hover:border-amber-400/20 cursor-pointer"
                      >
                        +{val.toLocaleString('ar-EG')} د.ع
                      </button>
                    ))}
                  </div>

                  {/* Custom recharging input */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomChargeWallet}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] px-4 rounded-xl shrink-0 active:scale-95 transition-all cursor-pointer"
                    >
                      شحن المبلغ
                    </button>
                    <input 
                      type="number" 
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="أدخل مبلغاً مخصصاً (د.ع)"
                      className="flex-grow bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-400/50 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                    />
                  </div>
                </div>
              )}

              {/* ===== METHOD 2: AUTOMATIC ASIACELL PAYMENT GATEWAY ===== */}
              {rechargeMethod === 'asiacell' && (
                <div className="space-y-4 text-right">
                  {/* Exchange rate display card */}
                  <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-2xl flex items-center justify-between text-[11px] font-sans">
                    <span className="font-mono text-rose-400 font-bold">1 د.ع = 1 د.ع</span>
                    <span className="text-gray-400 font-bold">شحن مباشر 100% بدون رسوم إضافية</span>
                  </div>

                  {/* Messages box */}
                  {acMessage && (
                    <div className={`p-3 rounded-2xl text-[10px] leading-relaxed font-sans border text-right ${
                      acMessage.type === 'success' 
                        ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                        : acMessage.type === 'error'
                        ? 'bg-rose-950/40 border-rose-500/20 text-rose-300'
                        : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300'
                    }`}>
                      {acMessage.text}
                    </div>
                  )}

                  {/* ASIACELL STEP 1: LOGIN PHONE */}
                  {acStep === 1 && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-300 font-bold">رقم هاتف آسياسيل 🇮🇶</label>
                        <input
                          type="text"
                          value={acPhone}
                          onChange={(e) => setAcPhone(e.target.value)}
                          placeholder="مثال: 07701234567"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-left font-mono text-sm text-white outline-none focus:border-rose-500/50"
                        />
                        <p className="text-[8px] text-gray-500 font-sans text-right">أدخل رقم هاتف آسياسيل العراقي الخاص بك لتسجيل الدخول الآمن للبوابة.</p>
                      </div>

                      <button
                        onClick={handleAsiacellLogin}
                        disabled={acLoading}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        {acLoading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>جاري إرسال الرمز...</span>
                          </>
                        ) : (
                          <span>ربط رقم الخط وإرسال رمز OTP</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ASIACELL STEP 2: VERIFY LOGIN OTP */}
                  {acStep === 2 && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-300 font-bold">رمز التحقق OTP (رسالة نصية) 💬</label>
                        <input
                          type="text"
                          value={acOtp}
                          onChange={(e) => setAcOtp(e.target.value)}
                          placeholder="أدخل الرمز المكون من 6 أرقام"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50"
                        />
                        <p className="text-[8px] text-gray-500 font-sans text-right">تم إرسال كود OTP برسالة نصية إلى خطك لتأكيد هويتك لحماية رصيدك.</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={resetAsiacellWorkflow}
                          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold text-[11px] rounded-xl transition-all border border-white/5 cursor-pointer"
                        >
                          إلغاء وتغيير الرقم
                        </button>
                        <button
                          onClick={handleAsiacellVerifyOtp}
                          disabled={acLoading}
                          className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                        >
                          {acLoading ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>جاري التحقق...</span>
                            </>
                          ) : (
                            <span>تأكيد تسجيل الدخول</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ASIACELL STEP 3: SELECT TYPE (VOUCHER OR TRANSFER) AND AMOUNT */}
                  {acStep === 3 && (
                    <div className="space-y-3">
                      {/* Sub tab selectors for Recharge Type */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setAcRechargeType('transfer')}
                          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            acRechargeType === 'transfer' ? 'bg-rose-600/20 border border-rose-500/30 text-rose-300' : 'text-gray-400'
                          }`}
                        >
                          تحويل رصيد مباشر
                        </button>
                        <button
                          onClick={() => setAcRechargeType('card')}
                          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            acRechargeType === 'card' ? 'bg-rose-600/20 border border-rose-500/30 text-rose-300' : 'text-gray-400'
                          }`}
                        >
                          تعبئة كارت شحن آسياسيل
                        </button>
                      </div>

                      {acRechargeType === 'transfer' ? (
                        /* Sub workflow: Credit Transfer */
                        <div className="space-y-3 font-sans">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-300 font-bold">قيمة الرصيد المراد تحويله (دينار عراقي)</label>
                            <input
                              type="number"
                              value={acAmountIQD}
                              onChange={(e) => setAcAmountIQD(e.target.value)}
                              placeholder="الحد الأدنى: 250 دينار"
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-right font-mono text-sm text-white outline-none focus:border-rose-500/50"
                            />
                            
                            {/* Live conversion quote to Saudi Riyal */}
                            {parseInt(acAmountIQD) > 0 && (
                              <div className="bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-xl flex items-center justify-between text-xs text-rose-300 mt-1">
                                <span className="font-mono font-extrabold text-[11px]">
                                  +{parseInt(acAmountIQD).toLocaleString('ar-EG')} د.ع
                                </span>
                                <span className="text-[9px]">الرصيد المضاف لمحفظة المتجر:</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleAsiacellTransferInitiate}
                            disabled={acLoading}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                          >
                            {acLoading ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <span>إرسال طلب التحويل وجلب الرمز</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Sub workflow: Voucher Scratch Card */
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-300 font-bold">رمز الكارت (PIN الرقم السري) 💳</label>
                            <input
                              type="text"
                              value={acVoucher}
                              onChange={(e) => setAcVoucher(e.target.value)}
                              placeholder="أدخل رمز كارد التعبئة المكون من 14 رقماً"
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50"
                            />
                            <p className="text-[8px] text-gray-500 font-sans text-right">سيتم شحن كارت الشحن فورياً وتقدير قيمته ثم إيداع المبلغ المقابل في محفظتك تلقائياً بالدينار العراقي.</p>
                          </div>

                          <button
                            onClick={handleAsiacellCardRecharge}
                            disabled={acLoading}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                          >
                            {acLoading ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <span>شحن كارت التعبئة الآن</span>
                            )}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={resetAsiacellWorkflow}
                        className="w-full py-2 bg-slate-950 text-gray-400 font-bold text-[9px] rounded-xl border border-white/5 cursor-pointer hover:text-white transition-all"
                      >
                        تسجيل خروج وإلغاء العملية
                      </button>
                    </div>
                  )}

                  {/* ASIACELL STEP 4: VERIFY AMOUNT TRANSFER CONFIRM PASS */}
                  {acStep === 4 && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-300 font-bold">رمز تأكيد عملية التحويل OTP 🔑</label>
                        <input
                          type="text"
                          value={acOtp}
                          onChange={(e) => setAcOtp(e.target.value)}
                          placeholder="أدخل الرمز السري الثاني المستلم"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50"
                        />
                        <p className="text-[8px] text-gray-500 font-sans text-right">وصلك الآن رمز تأكيد آخر لإثبات الموافقة على تحويل {acAmountIQD} دينار عراقي من خطك.</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setAcStep(3)}
                          className="flex-1 py-3 bg-slate-900 text-gray-300 font-bold text-[11px] rounded-xl border border-white/5 cursor-pointer"
                        >
                          تعديل القيمة
                        </button>
                        <button
                          onClick={handleAsiacellTransferConfirm}
                          disabled={acLoading}
                          className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                        >
                          {acLoading ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>جاري إكمال التحويل...</span>
                            </>
                          ) : (
                            <span>تأكيد وإتمام الشحن 💸</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== METHOD 3: CRYPTO RECHARGE ===== */}
              {rechargeMethod === 'crypto' && (
                <div className="space-y-4 text-right animate-fadeIn">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-3xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400">بوابة شحن العملات الرقمية (Crypto pay) 🪙</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      نعمل حالياً على ربط بوابة الدفع التلقائية بالكامل بالتعاون مع Binance Pay لتمثيل شحن فوري وآمن لعملات USDT والعملات المشفرة مع بونص إضافي <span className="text-emerald-400 font-bold">%5</span> على كل عملية إيداع!
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                    <span className="text-[10px] font-bold text-white block">طريقة الشحن اليدوية المؤقتة:</span>
                    <ol className="text-[10px] text-gray-400 space-y-2 leading-relaxed text-right dir-rtl">
                      <li>١. تواصل مع الإدارة بالضغط على أزرار الدعم الحية أدناه لطلب عنوان محفظة التحويل (USDT TRC-20).</li>
                      <li>٢. قم بتحويل القيمة المطلوبة (سعر الإيداع المعتمد هو ١,٥٠٠ د.ع لكل دولار).</li>
                      <li>٣. أرسل لقطة شاشة للعملية الناجحة مع عنوان إيميلك المسجل بالمتجر ليتم شحن محفظتك خلال ثوانٍ.</li>
                    </ol>
                  </div>

                  {/* Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل تليجرام 💬</span>
                    </a>
                    <a 
                      href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل واتساب 🟢</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ===== METHOD 4: MASTERCARD RECHARGE ===== */}
              {rechargeMethod === 'mastercard' && (
                <div className="space-y-4 text-right animate-fadeIn">
                  <div className="p-4 bg-sky-950/20 border border-sky-500/10 rounded-3xl space-y-2">
                    <h4 className="text-xs font-bold text-sky-400">شحن ماستر كارد / فيزا (يدوياً) 💳</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      يمكنك شحن رصيد حسابك باستخدام بطاقة ماستر كارد، فيزا كارد أو كي كارد العراقي بسهولة عبر التحويل اليدوي المباشر لحسابنا التالي:
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                    <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-gray-500">رقم بطاقة المستلم المعتمدة:</span>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("5239 8810 2341 5567");
                            alert("تم نسخ رقم البطاقة!");
                          }} 
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/15 cursor-pointer"
                        >
                          نسخ الرقم
                        </button>
                        <span className="font-mono text-xs font-bold text-white tracking-widest">5239 8810 2341 5567</span>
                      </div>
                      <span className="text-[8px] text-gray-500 block">باسم: متجر دارك فولو المعتمد</span>
                    </div>

                    <ol className="text-[10px] text-gray-400 space-y-2 leading-relaxed text-right dir-rtl">
                      <li>١. قم بتحويل المبلغ المطلوب إلى رقم البطاقة الموضح أعلاه عبر تطبيق محفظتك أو حسابك البنكي.</li>
                      <li>٢. التقط لقطة شاشة تأكيد لإثبات نجاح الحوالة بالكامل.</li>
                      <li>٣. اضغط على أزرار الدعم أدناه لإرسال لقطة شاشة التحويل والبريد الإلكتروني لحسابك لإيداعه فورياً.</li>
                    </ol>
                  </div>

                  {/* Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل تليجرام 💬</span>
                    </a>
                    <a 
                      href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل واتساب 🟢</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ===== METHOD 5: ZAIN CASH RECHARGE ===== */}
              {rechargeMethod === 'zaincash' && (
                <div className="space-y-4 text-right animate-fadeIn">
                  <div className="p-4 bg-purple-950/20 border border-purple-500/10 rounded-3xl space-y-2">
                    <h4 className="text-xs font-bold text-purple-400">شحن رصيد محفظة زين كاش يدوياً 🟣</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      يمكنك إيداع الرصيد في حسابك يدوياً عبر تحويل مباشر إلى رقم محفظة زين كاش التجارية التابعة للوكيل المعتمد لمتجرنا:
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                    <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-gray-500">رقم المحفظة (Zain Cash) للمستلم:</span>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("07801234567");
                            alert("تم نسخ رقم المحفظة!");
                          }} 
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/15 cursor-pointer"
                        >
                          نسخ الرقم
                        </button>
                        <span className="font-mono text-xs font-bold text-white tracking-widest">07801234567</span>
                      </div>
                      <span className="text-[8px] text-gray-500 block">باسم: وكيل شحن زين كاش المعتمد</span>
                    </div>

                    <ol className="text-[10px] text-gray-400 space-y-2 leading-relaxed text-right dir-rtl">
                      <li>١. افتح تطبيق "زين كاش" على خطك الشخصي واختر خدمة تحويل الأموال.</li>
                      <li>٢. اكتب رقم محفظة المستلم الموضح وبجوارها القيمة المراد إرسالها.</li>
                      <li>٣. صور الشاشة عند الإكمال للمحافظة على إثبات الدفع، ثم انقر تواصل مع الدعم الفني بالأسفل لتلقي رصيدك فوراً في حسابك بالمتجر.</li>
                    </ol>
                  </div>

                  {/* Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل تليجرام 💬</span>
                    </a>
                    <a 
                      href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل واتساب 🟢</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ===== METHOD 6: ZAIN TRANSFER RECHARGE ===== */}
              {rechargeMethod === 'zain_transfer' && (
                <div className="space-y-4 text-right animate-fadeIn">
                  <div className="p-4 bg-pink-950/20 border border-pink-500/10 rounded-3xl space-y-2">
                    <h4 className="text-xs font-bold text-pink-400">إيداع عبر تحويل رصيد اتصال زين اثير 📞</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      إذا كنت تفضل الشحن العادي برصيد خط زين اثير، يرجى القيام بتحويل الرصيد المطلوب يدوياً وكتابة تفاصيله للدعم الفني للموافقة:
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                    <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-gray-500">رقم خط زين اثير للمستلم:</span>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("07812345678");
                            alert("تم نسخ رقم خط زين!");
                          }} 
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/15 cursor-pointer"
                        >
                          نسخ الرقم
                        </button>
                        <span className="font-mono text-xs font-bold text-white tracking-widest">07812345678</span>
                      </div>
                    </div>

                    <ol className="text-[10px] text-gray-400 space-y-2 leading-relaxed text-right dir-rtl">
                      <li>١. من خطك زين اثير الشخصي، قم بطلب كود تحويل الرصيد المباشر التالي: <span className="font-mono text-white font-bold text-[11px] bg-slate-950 px-1.5 py-0.5 rounded dir-ltr inline-block">*123*المبلغ*رقم_المستلم#</span> ثم اتصال.</li>
                      <li>٢. احرص على حفظ لقطة شاشة للرسالة تفيد اكتمال أو نجاح الحوالة.</li>
                      <li>٣. اضغط على أيٍ من أزرار التواصل أدناه وأرسل رقم خطك + سكرين تأكيد التحويل + إيميلك بالمتجر ليتم تفعيل محفظتك بثوانٍ.</li>
                    </ol>
                  </div>

                  {/* Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل تليجرام 💬</span>
                    </a>
                    <a 
                      href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل واتساب 🟢</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ===== METHOD 7: BINANCE RECHARGE ===== */}
              {rechargeMethod === 'binance' && (
                <div className="space-y-4 text-right animate-fadeIn">
                  <div className="p-4 bg-yellow-950/20 border border-yellow-500/10 rounded-3xl space-y-2">
                    <h4 className="text-xs font-bold text-yellow-500">تمويل عبر بايننس باي (Binance Pay ID) 🔶</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      إذا كنت تمتلك رصيداً في تطبيق Binance، يمكنك إرسال الدفع المباشر والآمن عبر معرف Binance Pay الخاص بالمتجر للشحن الفوري:
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                    <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-gray-500">معرف الدفع (Binance Pay ID) للمستلم:</span>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("87210943");
                            alert("تم نسخ معرف Binance Pay!");
                          }} 
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/15 cursor-pointer"
                        >
                          نسخ المعرف
                        </button>
                        <span className="font-mono text-xs font-bold text-white tracking-widest">87210943</span>
                      </div>
                    </div>

                    <ol className="text-[10px] text-gray-400 space-y-2 leading-relaxed text-right dir-rtl">
                      <li>١. توجه إلى تطبيق بينانس، اضغط على أيقونة الدفع في الأعلى، واختر "إرسال / Send".</li>
                      <li>٢. اختر الإرسال عبر "معرف الدفع (Pay ID)" واكتب الرقم الموضح أعلاه.</li>
                      <li>٣. أرسل المبلغ المراد (المقابل بالدولار) وأرسل لقطة إتمام التحويل الناجحة مع إيميلك للدعم لتأكيد رصيدك الفوري.</li>
                    </ol>
                  </div>

                  {/* Contact Links */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل تليجرام 💬</span>
                    </a>
                    <a 
                      href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>تواصل واتساب 🟢</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. ABOUT PLATFORM SUBSECTION SCREEN */}
        {activeSubSection === 'about' && (
          <motion.div
            key="profile-about"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 px-4 pt-4 text-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between select-none">
              <button 
                onClick={() => setActiveSubSection('none')}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Info size={18} className="text-cyan-400 animate-pulse" />
                <span>حول نظام ريكسون</span>
              </h2>
            </div>

            {/* About content card */}
            <div className="glass-card rounded-3xl p-5 space-y-5 border border-white/5 font-sans leading-relaxed">
              <div className="text-center space-y-2 select-none">
                <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg shadow-cyan-400/10">
                  RX
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">متجر ريكسون الرقمي العائلي</h3>
                  <p className="text-[9px] text-gray-400">الإصدار 2.4.0 (مستقر وآمن)</p>
                </div>
              </div>

              <hr className="border-white/5" />

              <div className="space-y-4 text-xs font-medium text-gray-300">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">عمليات تسليم تلقائي فورية آمنة</h4>
                    <p className="text-[10px] text-gray-400 mt-1">تتم المعالجة عبر نظام تسوية التشفير لضمان أمان المفاتيح وبيانات الحساب فور انتهاء الدفع الشفّاف.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-cyan-400/10 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                    <Cpu size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">قواعد بيانات متزامنة بالزمن الحقيقي</h4>
                    <p className="text-[10px] text-gray-400 mt-1">نظام ريكسون متكامل مباشرة مع محركات التخزين الذكية لتنبيهات الشات الفورية والمزامنة بين المشترين الإداريين.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-purple-400/10 text-purple-400 rounded-lg shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">حفظ التوازن وتوزيع العمولات</h4>
                    <p className="text-[10px] text-gray-400 mt-1">تقسيم ذكي للعمولات بين المتجر والمزودين لضمان الشفافية الكاملة لكل شحنة.</p>
                  </div>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Status details indicators */}
              <div className="space-y-2.5 bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-[10px] text-gray-400 font-sans">
                <div className="flex justify-between items-center bg-transparent">
                  <span className="text-emerald-400 font-extrabold">منشط وعامل (Online)</span>
                  <span>اتصال الخادم السحابي</span>
                </div>
                <div className="flex justify-between items-center bg-transparent">
                  <span className="text-white font-mono">AES-256 SSL</span>
                  <span>آلية التشفير</span>
                </div>
                <div className="flex justify-between items-center bg-transparent">
                  <span className="text-white font-mono">100% Instant</span>
                  <span>متوسط سرعة الإرسال</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
