import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Ticket, CreditCard, ChevronRight } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<string>('apple-pay');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0); // decimal percent (e.g. 0.20 for 20%)

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.selectedPlan === 'yearly' ? item.product.price : parseFloat((item.product.price / 12).toFixed(2));
    return acc + (itemPrice * item.quantity);
  }, 0);

  const discountVal = subtotal * promoDiscount;
  const taxVal = (subtotal - discountVal) * 0.15;
  const totalVal = (subtotal - discountVal) + taxVal;

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
        setPromoFeedback(`تم تطبيق كود الخصم الفاخر بنجاح! تم خصم ${coupon.value} ر.س من السلة.`);
      }
    } catch (err) {
      setPromoFeedback('عذراً، حدث خطأ أثناء تطبيق كود الخصم.');
    }
  };

  const handlePurchase = () => {
    onCompletePurchase(discountVal, paymentMethod);
  };

  const paymentMethodsList = [
    { id: 'apple-pay', label: ' Pay', logoText: 'Pay', isApple: true },
    { id: 'stc-pay', label: 'stc pay', logoClass: 'text-[#4F2D7F]', italicCyan: 'pay' },
    { id: 'visa', label: 'Visa/MC', isCardLogo: true },
    { id: 'mada', label: 'mada', isMadaLogo: true }
  ];

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
                  const itemPrice = item.selectedPlan === 'yearly' ? item.product.price : parseFloat((item.product.price / 12).toFixed(2));
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
                        <div className="font-bold text-xs text-white line-clamp-1">{item.product.name}</div>
                        <p className="text-[10px] text-gray-400">
                          {item.selectedPlan === 'yearly' ? 'اشتراك سنوي شامل' : 'اشتراك شهري مرن'} (الكمية: {item.quantity})
                        </p>
                        <div className="text-xs font-semibold text-cyan-400 mt-1">{(itemPrice * item.quantity).toFixed(2)} ر.س</div>
                      </div>

                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
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

          {/* PAYMENT METHODS */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-400 text-right">طرق الدفع المعتمدة</h2>
            
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide no-scrollbar select-none">
              {paymentMethodsList.map((method) => {
                const isActive = paymentMethod === method.id;
                return (
                  <motion.div
                    key={method.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex-shrink-0 w-28 h-16 bg-white rounded-xl flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all ${
                      isActive ? 'border-amber-400 shadow-md scale-102' : 'border-gray-200'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                          <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    )}

                    {method.isApple && (
                      <span className="text-slate-950 font-black text-sm"> Pay</span>
                    )}

                    {method.logoClass && (
                      <div className="text-slate-950 font-extrabold text-sm flex gap-0.5">
                        <span className={method.logoClass}>stc</span>
                        <span className="text-cyan-500 italic">pay</span>
                      </div>
                    )}

                    {method.isCardLogo && (
                      <div className="flex flex-col items-center">
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-red-500 opacity-80"></div>
                          <div className="w-5 h-5 rounded-full bg-amber-400 opacity-80"></div>
                        </div>
                        <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase italic font-mono">Master / Visa</span>
                      </div>
                    )}

                    {method.isMadaLogo && (
                      <div className="flex flex-col items-center gap-0.5 scale-90">
                        <div className="flex gap-1">
                          <div className="w-5 h-1.5 bg-blue-500 rounded-xs"></div>
                          <div className="w-5 h-1.5 bg-emerald-500 rounded-xs"></div>
                        </div>
                        <span className="text-[8px] font-black text-slate-800">mada</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
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
              <span className="font-semibold text-white">{subtotal.toFixed(2)} ر.س</span>
              <span>المجموع الفرعي</span>
            </div>
            
            {appliedPromo && (
              <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                <span className="font-semibold">- {discountVal.toFixed(2)} ر.س</span>
                <span>الخصم (%٣٠)</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-400">
              <span className="font-semibold text-white">{taxVal.toFixed(2)} ر.س</span>
              <span>الضريبة المضافة (%١٥)</span>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-xl font-black text-cyan-400">{totalVal.toFixed(2)} ر.س</span>
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
              whileTap={{ scale: 0.98 }}
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold py-4 rounded-2xl text-base shadow-lg shadow-cyan-400/10 hover:brightness-110 flex items-center justify-center gap-2"
            >
              <span>تأكيد الدفع والخصم من المحفظة</span>
              <span className="text-xs bg-slate-950/20 py-0.5 px-2 rounded-full font-mono">{totalVal.toFixed(2)} ر.س</span>
            </motion.button>
          </section>

        </main>
      )}

    </div>
  );
}
