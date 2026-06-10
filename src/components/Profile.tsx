import React, { useState } from 'react';
import { 
  CreditCard, Copy, CheckCircle2, ChevronLeft, ShieldAlert, BadgeAlert, 
  Award, FileText, Settings, Heart, HelpCircle, Key, RefreshCw, 
  ArrowRight, Sparkles, ShieldCheck, Cpu, Coins, Info, HeartOff 
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
  onUpdateProfile?: (userId: string, newName: string) => void;
  onAddBalance?: (userId: string, amount: number) => void;
  onSelectProduct?: (product: Product) => void;
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
  onUpdateProfile,
  onAddBalance,
  onSelectProduct
}: ProfileProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Navigation State inside Profile Account tab
  const [activeSubSection, setActiveSubSection] = useState<'none' | 'favorites' | 'settings' | 'about'>('none');

  // Local state for edits
  const [editName, setEditName] = useState(userName);
  const [rechargeAmount, setRechargeAmount] = useState<string>('');

  const triggerCopy = (text: string, label: string, fieldId: string) => {
    onCopyText(text, label);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveName = () => {
    if (!editName.trim()) return;
    if (onUpdateProfile && userId) {
      onUpdateProfile(userId, editName);
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
                  <p className="text-2xl font-black">{(userBalance ?? 0).toFixed(2)} ر.س</p>
                </div>

                <div className="relative z-10 bg-slate-950/10 p-3 rounded-2xl border border-white/10 shrink-0">
                  <CreditCard size={26} className="text-slate-950" />
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
                            <p className="text-xs font-black text-cyan-400">{(order.price ?? 0).toFixed(2)} ر.س</p>
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
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover font-sans" />
                          ) : (
                            <Sparkles size={16} className="text-cyan-400" />
                          )}
                        </div>
                        <div className="text-right">
                          <h4 className="font-extrabold text-xs text-white leading-snug line-clamp-1">{p.name}</h4>
                          <span className="text-[10px] text-cyan-400 font-bold font-sans">{p.price} ر.س</span>
                          <span className="text-[8px] text-gray-400 mr-2">{p.period}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {onToggleFavorite && (
                          <button
                            onClick={() => onToggleFavorite(p.id)}
                            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all"
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
                            className="px-3 py-2 bg-cyan-400 text-slate-950 font-black rounded-xl text-[10px] hover:bg-cyan-300 transition-colors"
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
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings size={18} className="text-purple-400 animate-spin-slow" />
                <span>إعدادات الحساب</span>
              </h2>
            </div>

            {/* Change username Form */}
            <div className="glass-card rounded-3xl p-5 space-y-4 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200 border-b border-white/5 pb-2.5">
                <Award size={14} className="text-purple-400" />
                <span>الاسم الشخصي والمعرّف الرسمي</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 block">اسم المستخدم الحالي:</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="أدخل الاسم الجديد"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-purple-400/50 text-right font-sans"
                />
              </div>

              <button
                onClick={handleSaveName}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>حفظ التعديلات الرسمية</span>
                <CheckCircle2 size={13} />
              </button>
            </div>

            {/* Safe simulated Wallet recharging panel */}
            <div className="glass-card rounded-3xl p-5 space-y-4 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200 border-b border-white/5 pb-2.5">
                <Coins size={14} className="text-amber-400 animate-pulse" />
                <span>شحن وتعبئة الرصيد التجريبي</span>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                رصيدك الحالي غير كافٍ لتجربة الشراء؟ اختر أحد المبالغ السريعة التالية لتعبئة محفظتك فورياً بدون بطاقات دفع حقيقية:
              </p>

              {/* Fast presets buttons */}
              <div className="grid grid-cols-4 gap-2 font-sans">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleChargeWallet(val)}
                    className="py-2.5 glass-button text-amber-300 font-bold text-[10px] rounded-xl hover:bg-amber-400/10 hover:border-amber-400/20"
                  >
                    +{val} ر.س
                  </button>
                ))}
              </div>

              {/* Custom recharging input */}
              <div className="flex gap-2">
                <button
                  onClick={handleCustomChargeWallet}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] px-4 rounded-xl shrink-0 active:scale-95 transition-all"
                >
                  شحن المبلغ
                </button>
                <input 
                  type="number" 
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="أدخل مبلغاً مخصصاً (ر.س)"
                  className="flex-grow bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-400/50 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                />
              </div>
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
