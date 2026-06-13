import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Ticket, CreditCard, ChevronRight, Wallet, AlertTriangle } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutProps {
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompletePurchase: (discountAmount: number, paymentMethod: string) => void;
  onBackToStore: () => void;
  userBalance: number;
}

export default function Checkout({ cartItems, onRemoveItem, onClearCart, onCompletePurchase, onBackToStore, userBalance }: CheckoutProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0); // decimal percent (e.g. 0.20 for 20%)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const rawPrice = Number(item.product?.price) || 0;
    const isSub = (item.product?.category === 'entertainment' || item.product?.category === 'productivity') && item.product?.productType !== 'account' && item.product?.productType !== 'auto_keys';
    const itemPrice = isSub ? (item.selectedPlan === 'yearly' ? rawPrice : parseFloat((rawPrice / 12).toFixed(2))) : rawPrice;
    return acc + (itemPrice * (item.quantity || 1));
  }, 0);

  const discountVal = subtotal * promoDiscount;
  const taxVal = 0;
  const totalVal = subtotal - discountVal;

  const remainingBalance = userBalance - totalVal;
  const isInsufficient = userBalance < totalVal;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    const code = promoCode.trim().toUpperCase();
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          productId: cartItems[0]?.product.id,
          categoryId: cartItems[0]?.product.category
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setPromoFeedback(errData.error || 'عذراً، كود الخصم غير صحيح أو منتهي الصلاحية.');
        setAppliedPromo(null);
        setPromoDiscount(0);
        return;
      }

      const coupon = await res.json();
      setAppliedPromo(coupon.code);
      
      if (coupon.type === 'percent') {
        setPromoDiscount(Number(coupon.value) / 100);
        setPromoFeedback(`تم تطبيق كود الخصم الفاخر بنجاح! خصم ${coupon.value}% شامل لمشترياتك.`);
      } else {
        const percentEquivalent = Math.min(0.99, Number(coupon.value) / subtotal);
        setPromoDiscount(percentEquivalent);
        setPromoFeedback(`تم تطبيق كود الخصم الفاخر بنجاح! تم خصم ${coupon.value} $ من السلة.`);
      }
    } catch (err) {
      setPromoFeedback('عذراً، حدث خطأ أثناء تطبيق كود الخصم.');
    }
  };

  const handlePurchase = () => {
    if (isInsufficient) return;
    setShowConfirmModal(true);
  };

  return (
    <div className="space-y-6 pt-2 pb-28">
      
      {/* HEADER SECTION */}
      <header className="bg-slate-900/60 border-b border-white/5 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="relative">
          <ShoppingCart size={22} className="text-cyan-400" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-cyan-400 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </div>
        <h1 className="text-base font-bold text-white text-right">الدفع الآمن والتأكيد</h1>
        <button 
          onClick={onBackToStore}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-cyan-400"
        >
          <ChevronRight size={18} />
        </button>
      </header>

      {cartItems.length === 0 ? (
        <div className="px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
            <ShoppingCart size={28} />
          </div>
          <h2 className="text-base font-bold">سلتك متفرغة حالياً</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">تصفح أقسام ريكسون واختر من بين أفضل الاشتراكات والخدمات الرقمية المتوفرة.</p>
          <button 
            onClick={onBackToStore}
            className="px-6 py-2 bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg"
          >
            تصفح المنتجات الآن
          </button>
        </div>
      ) : (
        <main className="px-4 space-y-6">
          
          {/* SUMMARY INVENTORY CARDS */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-400 text-right">ملخص السلة</h2>
            
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
              <AnimatePresence>
                {cartItems.map((item) => {
                  const rawPrice = Number(item.product?.price) || 0;
                  const isSub = (item.product?.category === 'entertainment' || item.product?.category === 'productivity') && item.product?.productType !== 'account' && item.product?.productType !== 'auto_keys';
                  const itemPrice = isSub ? (item.selectedPlan === 'yearly' ? rawPrice : parseFloat((rawPrice / 12).toFixed(2))) : rawPrice;
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center p-4 gap-4 bg-slate-950/20"
                    >
                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex-1 text-right space-y-0.5">
                        <div className="font-bold text-xs text-white line-clamp-1">{item.product?.name}</div>
                        <p className="text-[10px] text-gray-400">
                          {isSub ? (item.selectedPlan === 'yearly' ? 'اشتراك سنوي شامل' : 'اشتراك شهري مرن') : 'شراء وتملّك فوري لكود أو حساب كامل'} (الكمية: {item.quantity})
                        </p>
                        <div className="text-xs font-semibold text-cyan-400 mt-1">{((itemPrice || 0) * (item.quantity || 1)).toLocaleString('en-US')} $</div>
                      </div>

                      <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                        {item.product?.imageUrl ? (
                          <img 
                            src={item.product?.imageUrl} 
                            alt={item.product?.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-cyan-400 font-extrabold text-xs">RX</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>

          {/* Wallet Payment Status Dashboard */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-400 text-right">طريقة الدفع المعتمدة</h2>
            
            <div className="glass-card rounded-2xl p-4 border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
              
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">تلقائي فوري ✅</span>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-white">الدفع بواسطة محفظة المتجر الإلكترونية</h3>
                </div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-3 text-right">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 block">رصيدك الحالي</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {(userBalance || 0).toLocaleString('en-US')} $
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 block">المبلغ المطلوب للطلب</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    {(totalVal || 0).toLocaleString('en-US')} $
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  {isInsufficient ? (
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/10">رصيد غير كافٍ ❌</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/10">متوفر ومتطابق ✅</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-right">
                  <span className={`text-xs font-black ${isInsufficient ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}`}>
                    {Math.max(0, remainingBalance || 0).toLocaleString('en-US')} $
                  </span>
                  <span className="text-[10px] text-gray-400">الرصيد المتبقي بعد الشراء</span>
                </div>
              </div>

              {isInsufficient && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-right flex items-start gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-red-300 font-bold block">تنبيه: رصيدك غير كافٍ لإتمام الشراء!</span>
                    <p className="text-[9px] text-gray-400 leading-relaxed mt-0.5">
                      قيمة سلة المشتريات والضريبة المضافة تتخطى الرصيد المتوفر في محفظتك حالياً. يرجى التوجه لصفحة حسابك لإعادة الشحن.
                    </p>
                  </div>
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                </div>
              )}
            </div>
          </section>

          {/* COUPON SECTION */}
          <section className="space-y-2">
            <div className="flex gap-2">
              <button 
                onClick={handleApplyPromo}
                className="glass-button text-cyan-400 font-bold px-5 py-3 rounded-xl text-xs shrink-0"
              >
                تطبيق
              </button>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="كود الخصم (مثال: R3XON)" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-right text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {promoFeedback && (
              <p className={`text-[10px] text-right font-medium leading-relaxed ${appliedPromo ? 'text-emerald-400' : 'text-red-400'}`}>
                {promoFeedback}
              </p>
            )}
          </section>

          {/* REVENUE/PRICE DETAILS */}
          <section className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span className="font-semibold text-white">{subtotal.toLocaleString('en-US')} $</span>
              <span>المجموع الفرعي</span>
            </div>
            
            {appliedPromo && (
              <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                <span className="font-semibold">- {discountVal.toLocaleString('en-US')} $</span>
                <span>الخصم (%٣٠)</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
              <span className="font-extrabold">٠ $</span>
              <span>الضريبة المضافة (%٠) معفاة 🎉</span>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-xl font-black text-cyan-400">{totalVal.toLocaleString('en-US')} $</span>
              <span className="text-sm font-bold text-white">إجمالي الحساب</span>
            </div>
          </section>

          {/* PROTECTED BY SECURE TRANSACTIONS */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
            <ShieldCheck size={14} className="text-cyan-500" />
            <span>كافة المعاملات آمنة ومحمية بالتشفير الرقمي المعتمد</span>
          </div>

          {/* SUBMIT BUTTON WITH AUTO CALCULATIONS */}
          <section className="pt-2">
            <motion.button
              whileTap={{ scale: isInsufficient ? 1 : 0.98 }}
              disabled={isInsufficient}
              onClick={handlePurchase}
              className={`w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isInsufficient
                  ? 'bg-slate-800 text-gray-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-cyan-400/10 cursor-pointer'
              }`}
            >
              {isInsufficient ? (
                <span>رصيدك غير كافٍ للشراء ⚠️</span>
              ) : (
                <>
                  <span>تأكيد الدفع والخصم من المحفظة</span>
                  <span className="text-xs bg-slate-950/20 py-0.5 px-2 rounded-full font-mono">{totalVal.toLocaleString('en-US')} $</span>
                </>
              )}
            </motion.button>
          </section>

        </main>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden text-right shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-blue-600"></div>
              
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Wallet size={24} />
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className="text-base font-black text-white">هل أنت متأكد من الشراء؟</h3>
                  <p className="text-xs text-gray-300 leading-relaxed px-1">
                    سيتم خصم الرصيد من محفظتك الرقمية لإتمام العملية وتوفير اشتراكك فورياً.
                  </p>
                </div>

                {/* Billing specs inside modal */}
                <div className="bg-slate-950/50 rounded-2xl p-3.5 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="font-bold text-white font-mono">{totalVal.toLocaleString('en-US')} $</span>
                    <span>قيمة المشتريات (المخصوم)</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 pt-2 border-t border-white/5">
                    <span className="font-black font-mono">{remainingBalance.toLocaleString('en-US')} $</span>
                    <span className="font-bold">رصيدك المتبقي بعد العملية</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      onCompletePurchase(discountVal, 'wallet');
                    }}
                    className="py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-400/10"
                  >
                    نعم، تأكيد الشراء
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="py-3 bg-slate-950 border border-white/10 hover:bg-white/5 text-gray-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
