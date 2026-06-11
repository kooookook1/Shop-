import React, { useState } from 'react';
import { 
  CreditCard, Copy, CheckCircle2, ChevronLeft, RefreshCw, ArrowRight, Sparkles, Coins, Plus, HelpCircle, Info 
} from 'lucide-react';
import { motion } from 'motion/react';

interface RechargePageProps {
  userId: string;
  userName: string;
  userEmail: string;
  userBalance: number;
  onAddBalance?: (userId: string, amount: number) => void;
  onClose: () => void;
}

export default function RechargePage({
  userId,
  userName,
  userEmail,
  userBalance,
  onAddBalance,
  onClose
}: RechargePageProps) {
  const [rechargeMethod, setRechargeMethod] = useState<'list' | 'asiacell'>('list');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  
  // Asiacell automatic states
  const [acStep, setAcStep] = useState<number>(1);
  const [acPhone, setAcPhone] = useState<string>('');
  const [acOtp, setAcOtp] = useState<string>('');
  const [acSessionId, setAcSessionId] = useState<string>('');
  const [acVoucher, setAcVoucher] = useState<string>('');
  const [acAmountIQD, setAcAmountIQD] = useState<string>('');
  const [acLoading, setAcLoading] = useState<boolean>(false);
  const [acExchangeRate, setAcExchangeRate] = useState<number>(350);
  const [acMessage, setAcMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Custom contacts
  const [telegramContact, setTelegramContact] = useState<string>('');
  const [whatsappContact, setWhatsappContact] = useState<string>('');
  const [asiacellPhoneSetting, setAsiacellPhoneSetting] = useState<string>('07700000000');
  const [acRechargeType, setAcRechargeType] = useState<'transfer' | 'voucher'>('transfer');

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data && !data.error) {
          setAcExchangeRate(data.asiacellRate || 350);
          setTelegramContact(data.socialTelegram || '');
          setWhatsappContact(data.socialWhatsapp || '');
          setAsiacellPhoneSetting(data.asiacellPhone || '07700000000');
        }
      } catch (err) {
        console.error('Failed to fetch settings rate:', err);
      }
    };
    fetchSettings();
  }, []);

  const resetAsiacellWorkflow = () => {
    setAcStep(1);
    setAcPhone('');
    setAcOtp('');
    setAcSessionId('');
    setAcVoucher('');
    setAcAmountIQD('');
    setAcLoading(false);
    setAcMessage(null);
  };

  const effectiveUserId = userId || userEmail || userName || 'system_guest';

  // Asiacell Handlers
  const handleAsiacellLogin = async () => {
    if (!acPhone || acPhone.trim().length === 0) {
      setAcMessage({ text: 'من فضلك أدخل رقم هاتف آسياسيل الخاص بك', type: 'error' });
      return;
    }
    setAcLoading(true);
    setAcMessage(null);
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
          username: effectiveUserId
        })
      });
      const data = await res.json();
      if (data.error) {
        setAcMessage({ text: data.error, type: 'error' });
      } else if (data.success) {
        setAcMessage({ text: data.message, type: 'success' });
        if (onAddBalance) {
          onAddBalance(effectiveUserId, data.credited);
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
          username: effectiveUserId
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
          onAddBalance(effectiveUserId, data.credited);
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

  const handleCustomChargeWallet = () => {
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (onAddBalance) {
      onAddBalance(effectiveUserId, amt);
      setRechargeAmount('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#040510] font-sans pb-16"
    >
      <div className="max-w-md mx-auto min-h-screen px-4 pt-6 pb-20 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Main Top Header */}
          <div className="flex items-center justify-between select-none">
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all pb-0.5 active:scale-95 cursor-pointer"
            >
              <ArrowRight size={18} />
            </button>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Coins size={18} className="text-amber-400 animate-pulse" />
              <span>بوابة شحن الرصيد والمحفظة</span>
            </h2>
          </div>

          {/* WALLET BALANCE DETAIL CARD */}
          <div className="w-full bg-gradient-to-r from-amber-400 to-amber-200 p-5 rounded-3xl flex justify-between items-center shadow-lg text-slate-950 font-sans select-none relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-black" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, white 0%, transparent 40%)' }}></div>
            
            <div className="relative z-10 text-right space-y-1">
              <span className="text-[10px] text-slate-800 font-bold tracking-widest uppercase">الرصيد المتاح بالمحفظة</span>
              <p className="text-2xl font-black">{(userBalance ?? 0).toLocaleString('ar-EG')} د.ع</p>
            </div>

            <div className="relative z-10 p-2.5 bg-slate-950/10 rounded-2xl border border-white/10 shrink-0">
              <CreditCard size={20} className="text-slate-950" />
            </div>
          </div>

          {/* Wallet Recharging Panel */}
          <div className="glass-card rounded-3xl p-5 space-y-4 border border-white/5 shadow-xl">
            {/* Custom Subheader with Back-to-List */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-gray-200">
                  {rechargeMethod === 'list' && "اختر نظام الدفع"}
                  {rechargeMethod === 'asiacell' && "بوابة آسياسيل الذكية التلقائية 🇮🇶"}
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
                  {/* 2. Asiacell Custom Auto */}
                  <div 
                    onClick={() => {
                      setRechargeMethod('asiacell');
                      setAcStep(1);
                    }}
                    className="flex items-center justify-between p-3.5 bg-[#e31b23]/10 hover:bg-[#e31b23]/15 rounded-2xl border border-[#e31b23]/25 hover:border-[#e31b23]/40 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-0.5 bg-[#e31b23] shadow-[0_0_10px_#e31b23]"></div>
                    <ChevronLeft size={14} className="text-[#e31b23] group-hover:text-white transition-all transform group-hover:-translate-x-0.5" />
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
                        <Coins size={18} className="text-white/80 animate-pulse" />
                      </div>
                    </div>
                  </div>
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
                        onClick={() => setAcRechargeType('voucher')}
                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          acRechargeType === 'voucher' ? 'bg-rose-600/20 border border-rose-500/30 text-rose-300' : 'text-gray-400'
                        }`}
                      >
                        تعبئة كارت شحن
                      </button>
                    </div>

                    {acRechargeType === 'voucher' ? (
                      <div className="space-y-2 text-right">
                        <label className="text-[10px] text-gray-400">ادخل رقم كارت آسيا المكون من 14 رقماً 👇</label>
                        <input
                          type="text"
                          value={acVoucher}
                          onChange={(e) => setAcVoucher(e.target.value)}
                          placeholder="اكتب رمز الكارت هنا"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50"
                        />
                        <button
                          onClick={handleAsiacellCardRecharge}
                          disabled={acLoading}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[11px] rounded-xl mt-1.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {acLoading ? <RefreshCw size={12} className="animate-spin" /> : 'تقديم وتعبئة كارت شحن الرصيد الآلي ⚡'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-right">
                        <label className="text-[10px] text-gray-400">مبلغ التحويل المطلوب (د.ع) 💰</label>
                        <input
                          type="number"
                          value={acAmountIQD}
                          onChange={(e) => setAcAmountIQD(e.target.value)}
                          placeholder="مثال: 5000"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={handleAsiacellTransferInitiate}
                          disabled={acLoading}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[11px] rounded-xl mt-1.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {acLoading ? <RefreshCw size={12} className="animate-spin" /> : 'متابعة وإرسال رصيد المعاملة الفورية'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ASIACELL STEP 4: CONFIRM TRANSFER OTP */}
                {acStep === 4 && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-300 font-bold">كود الموثقية النهائي OTP 💬</label>
                      <input
                        type="text"
                        value={acOtp}
                        onChange={(e) => setAcOtp(e.target.value)}
                        placeholder="ادخل الرمز المكون من 6 أرقام"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-sm text-white outline-none focus:border-rose-500/50"
                      />
                      <p className="text-[8px] text-gray-500 font-sans text-right">أرسلنا لك رمز تأكيد لإنهاء معاملة سحب الرصيد لإتمام الحوالة بنجاح.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAcStep(3)}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold text-[11px] rounded-xl transition-all border border-white/5 cursor-pointer"
                      >
                        رجوع وتعديل
                      </button>
                      <button
                        onClick={handleAsiacellTransferConfirm}
                        disabled={acLoading}
                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {acLoading ? <RefreshCw size={12} className="animate-spin" /> : 'تأكيد الحوالة وشحن الرصيد المالي ⚡'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== METHOD 3: CRYPTO PAY (DEMO AUTOMATIC GATEWAY) ===== */}
            {rechargeMethod === 'crypto' && (
              <div className="space-y-4 text-right animate-fadeIn">
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl flex items-center justify-between text-[11px] font-sans">
                  <span className="font-mono text-emerald-400 font-bold">1 USDT = 1350 د.ع</span>
                  <span className="text-gray-400 font-bold">شحن فوري + بونص 5% مجاناً 🎁</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500">عنوان محفظة (USDT TRC-20) للمتجر:</span>
                    <div className="flex items-center justify-between gap-1 bg-slate-950 p-2.5 rounded-xl border border-white/5 mt-1">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("TYp2WqB3pSg7K89jUoE84YfD17JkL56M92");
                          alert("تم نسخ العنوان بنجاح!");
                        }}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/15 cursor-pointer"
                      >
                        نسخ العنوان
                      </button>
                      <span className="font-mono text-[10px] text-white truncate max-w-[210px]">TYp2WqB3pSg7K89jUoE84YfD17JkL56M92</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans text-right">
                    بعد إرسال المعاملة بنجاح، يرجى كتابة الهاش (TxID) أو سكرين إرسال الدفع بالكامل لكي يقوم مشرفو ريكسون بمراجعة العملية وشحن حسابك بثوانٍ معدودة.
                  </p>
                </div>

                {/* Submitting button */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a 
                    href={telegramContact ? `https://t.me/${telegramContact.replace('@', '')}` : 'https://t.me/dark_follow_support'}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <span>الدعم تليجرام 💬</span>
                  </a>
                  <a 
                    href={whatsappContact ? `https://wa.me/${whatsappContact.replace('+', '')}` : 'https://wa.me/message'}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <span>الدعم واتساب 🟢</span>
                  </a>
                </div>
              </div>
            )}

            {/* ===== METHOD 4: MASTERCARD RECHARGE ===== */}
            {rechargeMethod === 'mastercard' && (
              <div className="space-y-4 text-right animate-fadeIn">
                <div className="p-4 bg-amber-950/20 border border-amber-500/10 rounded-3xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-400">شحن الرصيد عبر ماستر كارد / فيزا 💳</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    يمكنك إرسال المبالغ يدوياً عبر بوابات الويب سريعة الدفع أو عبر التحويل المباشر من محفظة ماستركارد العراق الخاصة بك بالتواصل مع فريقنا:
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 space-y-3 font-sans text-right">
                  <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-white/5">
                    <span className="text-[9px] text-gray-500">اسم صاحب الحساب المستلم (الوكيل المعتمد):</span>
                    <span className="text-xs font-bold text-white block mt-0.5">Ahmed M. Al-Iraq</span>
                    <span className="text-[9px] text-gray-500 block mt-2">رقم البطاقة الائتمانية:</span>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("4263 1098 7321 0945");
                          alert("تم نسخ رقم البطاقة!");
                        }} 
                        className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/5 px-2 py-1 rounded border border-amber-400/15 cursor-pointer"
                      >
                        نسخ الرقم
                      </button>
                      <span className="font-mono text-xs font-bold text-white tracking-widest">4263 1098 7321 0945</span>
                    </div>
                  </div>

                  <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-2xl">
                    <ol className="text-[9px] text-gray-400 space-y-1 leading-relaxed text-right list-decimal list-inside pr-1">
                      <li>١. بعد إكمال عملية التحويل، يرجى كتابة اسمك الثلاثي ومرفقات المعاملة.</li>
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
              </div>
            )}
          </div>
        </div>

        {/* Outer Brand Footer */}
        <div className="text-center text-[9px] text-gray-600 pt-8 mt-auto animate-pulse select-none">
          بوابة شحن آمنة ومحمية بالكامل © ريكسون الرقمي
        </div>
      </div>
    </motion.div>
  );
}
