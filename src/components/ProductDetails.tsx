import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Star, Check, Sparkles, Brain, Tv, Music, Palette, Smartphone, Shield, ShoppingCart, CreditCard } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, plan: 'monthly' | 'yearly') => void;
  onBuyNow: (product: Product, plan: 'monthly' | 'yearly') => void;
}

export default function ProductDetails({ product, onBack, onAddToCart, onBuyNow }: ProductDetailsProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Plan adjusted price
  const displayPrice = selectedPlan === 'yearly' ? product.price : parseFloat((product.price / 12).toFixed(2));

  // Pick display icon dynamically
  let IconComp = Sparkles;
  if (product.iconName === 'brain') IconComp = Brain;
  else if (product.iconName === 'tv') IconComp = Tv;
  else if (product.iconName === 'music') IconComp = Music;
  else if (product.iconName === 'palette') IconComp = Palette;
  else if (product.iconName === 'smartphone') IconComp = Smartphone;
  else if (product.iconName === 'shield') IconComp = Shield;

  return (
    <div className="space-y-6 pt-2 pb-28">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#050614]/80 sticky top-0 z-40">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-cyan-400 flex items-center gap-1 text-xs"
        >
          <ChevronRight size={18} />
          <span>الرجوع للمتجر</span>
        </button>
        <h1 className="text-base font-bold text-white max-w-[150px] truncate">{product.name}</h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      {/* PROMOTIONAL CARD BANNER */}
      <section className="px-4">
        <motion.div 
          layoutId={`product-${product.id}`}
          style={{
            background: product.gradientClass || 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)'
          }}
          className="rounded-3xl p-6 h-56 relative overflow-hidden flex flex-col justify-between shadow-xl border border-white/10"
        >
          {/* Animated background flare */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/10 rounded-full filter blur-xl animate-pulse"></div>

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="bg-amber-400 text-black font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-widest">
              مميز للغاية
            </div>
            
            <div className="bg-slate-900/60 aspect-square rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 mb-6">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconComp size={24} className="text-amber-400" />
              )}
            </div>
          </div>

          <div className="relative z-10 text-right space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">{product.name}</h2>
            <p className="text-xs text-slate-200">الأدق والأسرع في تلبية الطلبات الرقمية</p>
          </div>
        </motion.div>
      </section>

      {/* PRODUCT SUB-HEADER INFO */}
      <section className="px-4 space-y-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white text-right">{product.name} - {selectedPlan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}</h3>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">({product.reviewsCount} تقييم)</span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                {product.rating} <Star size={11} fill="currentColor" />
              </span>
            </div>

            <p className="text-2xl font-black text-white">
              {displayPrice} <span className="text-xs text-cyan-400 font-bold">ر.س</span> 
              <span className="text-[10px] text-gray-500 font-normal"> / {selectedPlan === 'yearly' ? 'سنةكاملة' : 'شهر'}</span>
            </p>
          </div>
        </div>
      </section>

      {/* BILLING / PLAN TOGGLE BOX */}
      <section className="px-4">
        <div className="glass-card p-1 rounded-xl flex">
          <button 
            onClick={() => setSelectedPlan('monthly')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedPlan === 'monthly' ? 'bg-white text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            الدفع الشهري
          </button>
          <button 
            type="button"
            onClick={() => setSelectedPlan('yearly')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedPlan === 'yearly' ? 'bg-white text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            الدفع السنوي (وفّر ٢٠٪)
          </button>
        </div>
      </section>

      {/* CORE FEATURES LIST */}
      <section className="px-4">
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">أبرز المزايا والمواصفات:</h4>
          
          <ul className="space-y-3">
            {(product.features || []).map((feature, index) => (
              <li key={index} className="flex items-center justify-between gap-3 text-right">
                <span className="text-sm text-gray-200 leading-relaxed flex-1">{feature}</span>
                <div className="bg-cyan-500/20 p-0.5 rounded-full border border-cyan-500/30 shrink-0">
                  <Check size={14} className="text-cyan-400" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FIXED BOTTOM ACTIONS */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-white/10 z-50 flex flex-col gap-2 rounded-t-3xl shadow-2xl">
        <div className="flex gap-2 max-w-sm mx-auto w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart(product, selectedPlan)}
            className="flex-1 glass-button text-white hover:text-cyan-400 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingCart size={15} />
            <span>أضف إلى السلة</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onBuyNow(product, selectedPlan)}
            className="flex-[2] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/10 transition-colors"
          >
            <CreditCard size={15} />
            <span>اشتر الآن مجاناً</span>
          </motion.button>
        </div>
      </footer>

    </div>
  );
}
