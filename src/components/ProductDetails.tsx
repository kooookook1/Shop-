import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Star, Check, Sparkles, Brain, Tv, Music, Palette, Smartphone, Shield, ShoppingCart, CreditCard } from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailsProps {
  product: Product;
  allProducts?: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, plan: 'monthly' | 'yearly', playerId?: string) => void;
  onBuyNow: (product: Product, plan: 'monthly' | 'yearly', playerId?: string) => void;
}

export default function ProductDetails({ product, allProducts, onBack, onAddToCart, onBuyNow }: ProductDetailsProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [playerId, setPlayerId] = useState('');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const subProducts = allProducts ? allProducts.filter(p => p.parentId === product.id) : [];

  const [activeProduct, setActiveProduct] = useState<Product>(() => {
    return subProducts.length > 0 ? subProducts[0] : product;
  });

  React.useEffect(() => {
    const subs = allProducts ? allProducts.filter(p => p.parentId === product.id) : [];
    setActiveProduct(subs.length > 0 ? subs[0] : product);
    setImageIndex(0);
    setPlayerId('');
  }, [product, allProducts]);

  // Safely parse extra images from database (which are loaded as string array or json string)
  let extraImagesArray: string[] = [];
  if (activeProduct.extraImages) {
    if (Array.isArray(activeProduct.extraImages)) {
      extraImagesArray = activeProduct.extraImages;
    } else if (typeof activeProduct.extraImages === 'string') {
      try {
        extraImagesArray = JSON.parse(activeProduct.extraImages);
      } catch (e) {
        extraImagesArray = activeProduct.extraImages.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // Combine standard main image & screenshots for full interactive swipe/browse
  const allImages = [
    ...(activeProduct.imageUrl ? [activeProduct.imageUrl] : []),
    ...(Array.isArray(activeProduct.images) ? activeProduct.images : []),
    ...extraImagesArray
  ].filter(Boolean);

  // Subscriptions are ONLY Netflix/Spotify/Productivity services, NOT physical account listings or keys
  const isSubscription = (activeProduct.category === 'entertainment' || activeProduct.category === 'productivity') && activeProduct.productType !== 'account' && activeProduct.productType !== 'auto_keys' && activeProduct.productType !== 'manual_id';

  // Plan adjusted price
  const displayPrice = (!isSubscription || selectedPlan === 'yearly') ? activeProduct.price : parseFloat((activeProduct.price / 12).toFixed(2));

  // Safely parse the detailed specifications of the account
  let detailsObj: any = null;
  if (activeProduct.productType === 'account' && activeProduct.accountDetails) {
    if (typeof activeProduct.accountDetails === 'string') {
      try {
        detailsObj = JSON.parse(activeProduct.accountDetails);
      } catch (e) {
        detailsObj = {};
      }
    } else if (typeof activeProduct.accountDetails === 'object') {
      detailsObj = activeProduct.accountDetails;
    }
  }

  // Pick display icon dynamically
  let IconComp = Sparkles;
  if (activeProduct.iconName === 'brain') IconComp = Brain;
  else if (activeProduct.iconName === 'tv') IconComp = Tv;
  else if (activeProduct.iconName === 'music') IconComp = Music;
  else if (activeProduct.iconName === 'palette') IconComp = Palette;
  else if (activeProduct.iconName === 'smartphone') IconComp = Smartphone;
  else if (activeProduct.iconName === 'shield') IconComp = Shield;

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
        <h1 className="text-base font-bold text-white max-w-[150px] truncate">{activeProduct.name}</h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      {/* PROMOTIONAL CARD BANNER & INTERACTIVE GALLERY */}
      <section className="px-4 space-y-3">
        <motion.div 
          layoutId={`product-${product.id}`}
          style={{
            background: activeProduct.gradientClass || 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)'
          }}
          className="rounded-3xl h-64 relative overflow-hidden flex flex-col justify-between shadow-xl border border-white/10 group"
        >
          {/* Animated background flare */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/10 rounded-full filter blur-xl animate-pulse"></div>

          {/* Product Image taking full banner width/height */}
          <div 
            className="absolute inset-0 z-0 cursor-zoom-in flex items-center justify-center bg-slate-950/40"
            onClick={() => setIsImageFullscreen(true)}
          >
            {allImages.length > 0 ? (
              <img 
                src={allImages[imageIndex]} 
                alt={`${activeProduct.name} - ${imageIndex + 1}`} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90 transition-all duration-300 transform group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                  <IconComp size={64} className="text-amber-400 opacity-20" />
              </div>
            )}
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/10 to-transparent"></div>
          </div>

          <div className="relative z-10 flex justify-between items-start w-full p-6 pb-0">
            <span className="bg-amber-400 text-black font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-widest shadow-lg">
              {activeProduct.productType === 'account' ? 'حساب معروض للبيع بقوة 🛒' : 'مميز للغاية'}
            </span>
            {allImages.length > 1 && (
              <span className="bg-slate-905/90 backdrop-blur border border-white/10 text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                {imageIndex + 1} / {allImages.length}
              </span>
            )}
          </div>

          {/* Slider Controls Inside Image view */}
          {allImages.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                }}
                className="w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950 transition-all active:scale-95 pointer-events-auto"
                title="الصورة السابقة"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageIndex((prev) => (prev + 1) % allImages.length);
                }}
                className="w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950 transition-all active:scale-95 pointer-events-auto"
                title="الصورة التالية"
              >
                →
              </button>
            </div>
          )}

          <div className="relative z-10 text-right p-6 pt-0 space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{activeProduct.name}</h2>
            <p className="text-[10px] text-slate-200 drop-shadow">انقر على المربع لتكبير لقطة الشاشة الأصلية بشكل كامل 🔍</p>
          </div>
        </motion.div>

        {/* Swipe-able Thumbnail list below the primary frame */}
        {allImages.length > 1 && (
          <div className="flex gap-2 items-center justify-start overflow-x-auto py-1 px-1 rounded-xl bg-slate-950/30 scrollbar-none border border-white/5">
            {allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImageIndex(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-200 border-2 ${imageIndex === idx ? 'border-amber-400 scale-95 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'border-white/10 hover:border-white/30'}`}
              >
                <img 
                  src={imgUrl} 
                   alt="" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* NESTED PACKAGES SELECTOR */}
      {subProducts.length > 0 && (
        <section className="px-4 space-y-3">
          <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 text-right uppercase tracking-wider">
              اختر العرض أو الفئة الفرعية الشحن:
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {subProducts.map((sub) => {
                const isSelected = activeProduct.id === sub.id;
                const isOutOfStock = sub.stock === 0 || (sub.productType === 'auto_keys' && (!sub.keys || sub.keys.length === 0));
                
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveProduct(sub);
                      setImageIndex(0); // Reset image gallery on subproduct switch if needed
                    }}
                    className={`relative p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.2)]' 
                        : 'border-white/5 bg-slate-900/60 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-[11px] font-bold block ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {sub.name}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[9px] text-[#ef4444] font-medium bg-red-500/10 px-1.5 py-0.2 rounded-full border border-red-500/15">نفذت الكمية</span>
                      ) : (
                        <span className="text-[9px] text-[#10b981] font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/15">متاح فورا</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">السعر:</span>
                      <span className="text-xs font-black text-cyan-300">
                        {sub.price.toLocaleString('en-US')} <span className="text-[9.5px] font-bold">$</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCT SUB-HEADER INFO */}
      <section className="px-4 space-y-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white text-right">
            {activeProduct.name} {isSubscription ? (selectedPlan === 'yearly' ? '- اشتراك سنوي' : '- اشتراك شهري') : ''}
          </h3>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">({activeProduct.reviewsCount} تقييم)</span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                {activeProduct.rating} <Star size={11} fill="currentColor" />
              </span>
            </div>

            <p className="text-2xl font-black text-white">
              {(displayPrice || 0).toLocaleString('en-US')} <span className="text-xs text-cyan-400 font-bold">$</span> 
              {isSubscription && (
                <span className="text-[10px] text-gray-500 font-normal"> / {selectedPlan === 'yearly' ? 'سنةكاملة' : 'شهر'}</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ACCOUNT SPECS SECTION (For PUBG and Social media accounts) */}
      {activeProduct.productType === 'account' && detailsObj && (
        <section className="px-4 space-y-3">
          <div className="glass-card rounded-2xl p-4 border border-[#fbbf24]/20 shadow-lg shadow-[#fbbf24]/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full font-bold border border-amber-400/20">
                مواصفات حصرية فحص فوري 🔍
              </span>
              <h4 className="text-xs font-black text-white text-right">تفاصيل ومواصفات الحساب الكلية</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              {/* Account Username */}
              {detailsObj.username && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9.5px] text-gray-400 block font-sans">اسم المستخدم / المعرف</span>
                  <span className="text-xs font-black text-cyan-400 dir-ltr inline-block font-mono">
                    {detailsObj.username}
                  </span>
                </div>
              )}

              {/* Rank or Level */}
              {detailsObj.rankOrUc && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9.5px] text-gray-400 block font-sans">المستوى / التصنيف الرقمي</span>
                  <span className="text-xs font-black text-white">
                    {detailsObj.rankOrUc}
                  </span>
                </div>
              )}

              {/* Followers / Subscribers */}
              {(detailsObj.followers || detailsObj.subscribers) && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9.5px] text-gray-400 block font-sans">قاعدة المتابعين / المشتركين</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {detailsObj.followers || detailsObj.subscribers}
                  </span>
                </div>
              )}

              {/* Linked Method */}
              {detailsObj.linkedMethod && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[9.5px] text-gray-400 block font-sans">قنوات الارتباط الأمنية</span>
                  <span className="text-xs font-bold text-amber-300">
                    {detailsObj.linkedMethod}
                  </span>
                </div>
              )}

              {/* Is Verified */}
              {detailsObj.isVerified && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-0.5 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black ${detailsObj.isVerified === 'yes' ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {detailsObj.isVerified === 'yes' ? 'موثق بالعلامة الزرقاء ✓' : 'حساب عادي معتمد'}
                    </span>
                    <span className="text-[9.5px] text-gray-400 font-sans">توثيق الحساب بالمنصة</span>
                  </div>
                </div>
              )}

              {/* Link */}
              {detailsObj.link && (
                <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9.5px] text-gray-400 block font-sans mb-1.5">رابط تصفح الحساب مباشرة</span>
                  <a
                    href={detailsObj.link.startsWith('http') ? detailsObj.link : `https://${detailsObj.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 px-3 rounded-lg border border-cyan-400/20 text-xs font-bold transition-all active:scale-95"
                  >
                    <span className="text-[9px] font-mono text-cyan-300 max-w-[200px] truncate">{detailsObj.link}</span>
                    <span>بيان الحساب الفعلي المعروض ↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Note about login info security */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5 text-right">
              <div className="text-right flex-1">
                <span className="text-[10px] text-amber-300 font-black block mb-0.5">🔒 التسليم الآمن لمعلومات الدخول:</span>
                <p className="text-[9.5px] text-gray-400 leading-relaxed">
                  احصل على البريد الإلكتروني وكلمة المرور بالكامل فوراً وبشكل آلي داخل صفحة حسابك الشخصي "مشترياتي" مباشرة بعد إتمام عملية الدفع وتأكيد الشراء بنجاح. لا يتم مشاركة بيانات تسجيل الدخول لأي زائر قبل الشراء لضمان الأمان والخصوصية المطلقة.
                </p>
              </div>
              <div className="bg-amber-400/10 p-1 rounded-lg text-amber-400 shrink-0 mt-0.5">
                <Shield size={14} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BILLING / PLAN TOGGLE BOX */}
      {isSubscription && (
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
      )}

      {/* PLAYER ID INPUT FOR MANUAL CHARGE */}
      {(activeProduct.productType === 'manual_id' || activeProduct.requirePlayerId) && (
        <section className="px-4">
          <div className="glass-card p-4 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <h4 className="text-xs font-bold text-white text-right mb-2">أدخل كود اللاعب (ID)</h4>
            <p className="text-[10px] text-cyan-200 text-right mb-3">
              لتمكيننا من شحن الرصيد لحسابك بأمان وسرعة، يرجى كتابة كود اللاعب الخاص بك (Player ID).
            </p>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="مثال: 512345678"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-right text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </section>
      )}

      {/* CORE FEATURES LIST */}
      <section className="px-4">
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">أبرز المزايا والمواصفات:</h4>
          
          <ul className="space-y-3">
            {(activeProduct.features || []).map((feature, index) => (
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
          {activeProduct.isSold || activeProduct.stock === 0 || (activeProduct.productType === 'account' && (activeProduct as any).isSold) ? (
            <button
              disabled
              className="w-full bg-slate-900 border border-white/5 text-gray-500 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <span>{activeProduct.productType === 'account' ? 'هذا الحساب تم بيعه مسبقاً ❌' : 'الخدمة غير متاحة حالياً لعدم توفر رموز الشحن ⛔'}</span>
            </button>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onAddToCart(activeProduct, selectedPlan, playerId)}
                className="flex-1 glass-button text-white hover:text-cyan-400 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingCart size={15} />
                <span>أضف إلى السلة</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onBuyNow(activeProduct, selectedPlan, playerId)}
                className="flex-[2] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/10 transition-colors cursor-pointer"
              >
                <CreditCard size={15} />
                <span>اشتر الآن</span>
              </motion.button>
            </>
          )}
        </div>
      </footer>

      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {isImageFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsImageFullscreen(false)}
          >
            <button className="absolute top-4 right-4 text-white p-2 z-10" onClick={() => setIsImageFullscreen(false)}>✕</button>
            
            <img src={allImages[imageIndex]} alt={activeProduct.name} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            
            {allImages.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-4 z-10"
                  onClick={(e) => { e.stopPropagation(); setImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length); }}
                >
                  ←
                </button>
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-4 z-10"
                  onClick={(e) => { e.stopPropagation(); setImageIndex((prev) => (prev + 1) % allImages.length); }}
                >
                  →
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs z-10">
                  {imageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
