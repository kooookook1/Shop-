import React, { useState } from 'react';
import { Search, Brain, Tv, Music, Palette, BadgePercent, Layout, Flame, Sparkles, Gamepad2, Smartphone, Shield, UserPlus, ArrowLeft, ShoppingCart, ShoppingBag, Eye, Heart, Star, Zap, PackageX, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface StorefrontProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  cartCount: number;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  userBalance?: number;
  onRechargeClick?: () => void;
}

/** Category-tuned gradient palettes used for graceful media fallbacks */
const CATEGORY_GRADIENTS: Record<string, { bg: string; glow: string; Icon: any }> = {
  accounts:      { bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #1e1b4b 100%)', glow: 'rgba(139,92,246,0.35)', Icon: Shield },
  entertainment: { bg: 'linear-gradient(135deg, #881337 0%, #e11d48 55%, #0f172a 100%)', glow: 'rgba(244,63,94,0.35)',  Icon: Tv },
  productivity:  { bg: 'linear-gradient(135deg, #92400e 0%, #f59e0b 55%, #1c1917 100%)', glow: 'rgba(245,158,11,0.35)', Icon: Palette },
  games:         { bg: 'linear-gradient(135deg, #1e3a8a 0%, #4f46e5 55%, #020617 100%)', glow: 'rgba(99,102,241,0.4)', Icon: Gamepad2 },
};
const DEFAULT_THEME = { bg: 'linear-gradient(135deg, #0e7490 0%, #0891b2 55%, #04202b 100%)', glow: 'rgba(34,211,238,0.35)', Icon: Sparkles };

const PRODUCT_ICONS: Record<string, any> = {
  brain: Brain, tv: Tv, music: Music, palette: Palette, smartphone: Smartphone,
  shield: Shield, 'gamepad-2': Gamepad2, 'user-plus': UserPlus, layout: Layout, activity: Zap,
};

const getProductTheme = (p: Product) => CATEGORY_GRADIENTS[p.category] || DEFAULT_THEME;
const getProductIcon = (p: Product) => (p.iconName && PRODUCT_ICONS[p.iconName]) || getProductTheme(p).Icon;

/** Image box that degrades gracefully into a branded gradient + icon if the URL fails */
function MediaBox({ src, alt, product, className = '' }: { src?: string; alt: string; product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  const theme = getProductTheme(product);
  const Icon = getProductIcon(product);
  const showImage = !!src && !failed;

  return (
    <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 ${className}`} style={!showImage ? { background: product.gradientClass || theme.bg } : undefined}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      ) : (
        <>
          {/* Decorative glow blobs */}
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full" style={{ background: `radial-gradient(circle, ${theme.glow}, transparent 70%)` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-2xl float-slow">
              <Icon size={34} className="text-white drop-shadow-lg" />
            </div>
            <span className="text-[8px] font-black text-white/60 tracking-[0.2em]">R3XON</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/35 to-transparent" />
        </>
      )}
    </div>
  );
}

/** Banner slide with the same graceful fallback strategy */
interface BannerSlideProps { slide: any; product?: Product; onClick: () => void }
const BannerSlide: React.FC<BannerSlideProps> = ({ slide, product, onClick }) => {
  const [failed, setFailed] = useState(false);
  const fallbackProduct = product || ({ category: 'accounts' } as Product);
  const theme = getProductTheme(fallbackProduct);
  const Icon = getProductIcon(fallbackProduct);
  const showImage = !!slide.imageUrl && !failed;

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      className="min-w-full w-full flex-shrink-0 relative overflow-hidden h-44 rounded-3xl snap-center cursor-pointer border border-white/10 shadow-2xl"
      style={{ background: theme.bg }}
    >
      {showImage && (
        <img
          src={slide.imageUrl}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#040613] via-[#040613]/50 to-transparent pointer-events-none" />
      {!showImage && (
        <div className="absolute top-5 left-5 opacity-25 float-slow">
          <Icon size={88} className="text-white" strokeWidth={1.2} />
        </div>
      )}

      <div className="absolute bottom-4 right-4 left-4 text-right z-10 space-y-1.5 pointer-events-none">
        <div className="flex items-center justify-end gap-2">
          <div className="bg-gradient-to-l from-amber-300 to-amber-500 text-slate-950 text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-amber-500/30 flex items-center gap-1">
            <Star size={9} className="fill-slate-950" /> عرض حصري
          </div>
        </div>
        <h2 className="text-base font-black text-white drop-shadow-lg leading-snug">{slide.title}</h2>
        {product && product.price !== undefined && product.price !== null ? (
          <p className="text-[11px] font-bold flex items-center justify-end gap-1.5">
            <span className="text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">{(Number(product.price) || 0).toLocaleString('en-US')} $ / {product.period}</span>
          </p>
        ) : (
          <p className="text-[10px] text-white/70">تابع التفاصيل والشراء الفوري</p>
        )}
      </div>
    </motion.div>
  );
}

export default function Storefront({
  products,
  onSelectProduct,
  onAddToCart,
  cartCount,
  favoriteIds = [],
  onToggleFavorite,
  userBalance,
  onRechargeClick
}: StorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  // Auto-advance the hero slider
  React.useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % banners.length;
        sliderRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  // Load live configurations
  React.useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const activeCats = data.filter((c: any) => c.isActive === 1 && c.isHidden === 0);
        setCategories([
          { id: 'all', name: 'الجميع', imageOrIcon: 'Sparkles' },
          ...activeCats
        ]);
      })
      .catch(e => console.error(e));

    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        const activeBanners = data.filter((b: any) => b.isActive === 1);
        setBanners(activeBanners);
      })
      .catch(e => console.error(e));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSiteSettings(data);
        if (data.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        }
      })
      .catch(e => console.error(e));
  }, []);

  // Track which slide is centered (for dots) — RTL scroll positions are reversed
  const handleSliderScroll = () => {
    const el = sliderRef.current;
    if (!el || banners.length === 0) return;
    const idx = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setActiveSlide(Math.min(idx, banners.length - 1));
  };

  // Filter products by category and search query
  const filteredProducts = products.filter(p => {
    if (p.parentId && p.parentId.trim() !== '') return false; // sub-products stay on their parent page

    const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
    const nameLower = (p.name || '').toLowerCase();
    const queryLower = (searchQuery || '').toLowerCase();
    const matchesSearch = nameLower.includes(queryLower) ||
                          (Array.isArray(p.features) && p.features.some(f => f && typeof f === 'string' && f.toLowerCase().includes(queryLower)));
    return matchesCategory && matchesSearch;
  });

  // Newest (timestamp-id) products first
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aTime = a.id.startsWith('prod-') ? Number(a.id.substring(5)) : 0;
    const bTime = b.id.startsWith('prod-') ? Number(b.id.substring(5)) : 0;
    const aIsTimestamp = !isNaN(aTime) && aTime > 1700000000000;
    const bIsTimestamp = !isNaN(bTime) && bTime > 1700000000000;
    if (aIsTimestamp && bIsTimestamp) return bTime - aTime;
    if (aIsTimestamp) return -1;
    if (bIsTimestamp) return 1;
    return 0;
  });

  const getCategoryNameAr = (cat: string) => categories.find(c => c.id === cat)?.name || 'الجميع';

  const renderCategoryIcon = (iconName: string, active: boolean) => {
    const cls = active ? 'text-slate-950' : 'text-cyan-300';
    if (!iconName) return <Sparkles size={14} className={cls} />;
    if (iconName.startsWith('http') || iconName.startsWith('/') || iconName.startsWith('data:')) {
      return <img src={iconName} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-md object-cover border border-white/10 shrink-0" />;
    }
    switch (iconName) {
      case 'Tv': return <Tv size={14} className={cls} />;
      case 'Gamepad2': return <Gamepad2 size={14} className={cls} />;
      case 'Palette': return <Palette size={14} className={cls} />;
      case 'Shield': return <Shield size={14} className={cls} />;
      default: return <Sparkles size={14} className={cls} />;
    }
  };

  const displayBanners = banners.length > 0 ? banners : [
    { id: 'slide-1', title: 'باقة ChatGPT Plus السنوية', imageUrl: '', linkTo: 'prod-chatgpt' },
    { id: 'slide-2', title: 'باقة Netflix 4K الشهرية', imageUrl: '', linkTo: 'prod-netflix' }
  ];

  return (
    <div className="space-y-6 pt-2 pb-24 app-ambient-bg min-h-screen">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#050614]/70 backdrop-blur-xl border-b border-white/5 py-3.5 px-4 flex justify-between items-center rounded-b-[28px] shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <motion.div
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="text-lg font-black bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent italic tracking-wider select-none drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]"
            >
              {siteSettings?.siteName || "R3XON"}
            </motion.div>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          </div>

          {/* Wallet balance pill */}
          {userBalance !== undefined && userBalance !== null && onRechargeClick && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onRechargeClick}
              className="flex items-center gap-1.5 bg-gradient-to-l from-amber-400/15 to-yellow-400/5 border border-amber-300/40 hover:border-amber-300/70 pl-1 pr-2.5 py-1 rounded-full cursor-pointer transition-all shadow-[0_0_14px_rgba(251,191,36,0.25)] select-none"
            >
              <span className="text-[11px] font-black text-amber-200 font-mono tracking-wide">
                {(Number(userBalance) || 0).toLocaleString('en-US')} $
              </span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center leading-none shadow-md shadow-amber-500/40">
                +
              </span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isSearchOpen ? (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 180, opacity: 1 }} className="relative flex items-center">
              <input
                autoFocus
                type="text"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/8 border border-cyan-400/30 text-white rounded-full text-xs py-1.5 px-3 pr-8 w-full outline-none text-right focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 transition-all"
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="absolute right-2.5 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={14} />
              </button>
            </motion.div>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} aria-label="بحث" className="p-2.5 rounded-full glass-button text-gray-300 hover:text-cyan-300 transition-all">
              <Search size={18} />
            </button>
          )}

          {cartCount > 0 && (
            <div className="relative pl-1">
              <ShoppingBag size={19} className="text-cyan-300" />
              <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-rose-500/50 animate-bounce">
                {cartCount}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ================= HERO SLIDER ================= */}
      <section className="px-4">
        <div
          ref={sliderRef}
          onScroll={handleSliderScroll}
          className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory pt-1"
        >
          {displayBanners.map((slide: any, idx: number) => {
            const product = products.find(p => p.id === slide.linkTo);
            return (
              <BannerSlide
                key={slide.id || idx}
                slide={slide}
                product={product}
                onClick={() => product && onSelectProduct(product)}
              />
            );
          })}
        </div>

        {displayBanners.length > 1 && (
          <div className="flex justify-center mt-3.5 gap-2" dir="ltr">
            {displayBanners.map((_: any, i: number) => (
              <button
                key={i}
                aria-label={`الشريحة ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-6 bg-gradient-to-r from-cyan-300 to-sky-400 shadow-md shadow-cyan-400/40' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
                onClick={() => sliderRef.current?.scrollTo({ left: i * (sliderRef.current.clientWidth || 0) * -1, behavior: 'smooth' })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <Layout size={15} className="text-cyan-300" />
            </span>
            <span>أقسام المتجر</span>
          </h3>
          <span className="text-[10px] bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 py-1 px-2.5 rounded-full font-bold flex items-center gap-1">
            <Shield size={10} /> تسليم ذهبي آمن
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 select-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id || cat.name}
                whileTap={{ scale: 0.93 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black border transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-l from-cyan-300 via-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-400/35 scale-[1.03]'
                    : 'glass-button text-gray-300 hover:border-cyan-400/30'
                }`}
              >
                {renderCategoryIcon(cat.imageOrIcon || 'Sparkles', isSelected)}
                <span>{cat.name || 'العامة'}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ================= PRODUCTS GRID ================= */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-400/10 border border-rose-400/20">
              <Flame size={15} className="text-rose-400" />
            </span>
            <span className="text-gradient">{selectedCategory === 'all' ? 'صفقات شائعة' : getCategoryNameAr(selectedCategory)}</span>
          </h3>
          <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <TrendingUp size={11} className="text-cyan-300" />
            {filteredProducts.length} منتجات
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="glass-card-elevated rounded-3xl p-10 text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <PackageX size={26} className="text-gray-500" />
            </div>
            <p className="text-gray-300 text-sm font-bold">لا توجد منتجات مطابقة</p>
            <p className="text-gray-500 text-[11px]">جرّب كلمة بحث أخرى أو قسماً مختلفاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {sortedProducts.map((p, idx) => {
              const isOut = p.isSold || p.stock === 0 || (p.productType === 'account' && (p as any).isSold);
              const lowStock = !isOut && p.stock > 0 && p.stock <= 5;
              const discount = p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
              const pTimestamp = p.id.startsWith('prod-') ? Number(p.id.substring(5)) : 0;
              const isNew = !isNaN(pTimestamp) && pTimestamp > 1700000000000;

              return (
                <motion.div
                  key={p.id}
                  layoutId={`product-${p.id}`}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.35, ease: 'easeOut' }}
                  className="glass-card-elevated product-card rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden group border border-white/10"
                >
                  {/* Badges row */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-30 items-start pointer-events-none">
                    {isNew && (
                      <div className="bg-gradient-to-l from-emerald-400 to-teal-500 text-[8px] text-slate-950 px-2 py-0.5 rounded-lg font-black tracking-wide flex items-center gap-1 shadow-lg shadow-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
                        جديد
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="ribbon-badge bg-gradient-to-l from-rose-500 to-red-600 text-[8px] text-white pl-3 pr-1.5 py-0.5 rounded-md font-black shadow-lg shadow-rose-500/40 flex items-center gap-0.5">
                        <BadgePercent size={9} /> {discount}% خصم
                      </div>
                    )}
                  </div>

                  {/* Stock indicator */}
                  <div className="absolute top-3 right-3 z-30 pointer-events-none">
                    {isOut ? (
                      <span className="text-[8px] font-black bg-red-500/15 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm">تم البيع</span>
                    ) : lowStock ? (
                      <span className="text-[8px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm animate-pulse">بقي {p.stock} فقط</span>
                    ) : (
                      <span className="text-[8px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm">متوفر {p.stock}</span>
                    )}
                  </div>

                  <div className="cursor-pointer space-y-2 mt-1" onClick={() => onSelectProduct(p)}>
                    {/* Media */}
                    <div className="relative">
                      <MediaBox src={p.imageUrl} alt={p.name} product={p} />
                      <div className="absolute inset-0 rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-[11px] text-cyan-200 font-black flex items-center gap-1.5 bg-slate-950/60 border border-cyan-400/40 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                          <Eye size={13} /> مشاهدة التفاصيل
                        </span>
                      </div>
                      {onToggleFavorite && (
                        <button
                          aria-label="مفضلة"
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(p.id); }}
                          className="absolute bottom-2 right-2 z-20 p-2 rounded-full bg-slate-950/80 border border-white/10 hover:border-rose-400/50 hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-lg"
                        >
                          <Heart size={14} className={favoriteIds.includes(p.id) ? "fill-rose-500 text-rose-500" : "text-gray-300"} />
                        </button>
                      )}
                    </div>

                    <h4 className="text-[13px] font-black text-white text-right leading-snug min-h-9 line-clamp-2">
                      {p.name}
                    </h4>
                    <p className="text-[9.5px] text-gray-400 text-right truncate font-semibold">
                      {p.period}
                    </p>

                    <div className="flex items-center justify-between pt-1.5">
                      <span className="text-[10px] font-black flex items-center gap-1 bg-amber-400/10 border border-amber-400/25 text-amber-300 px-1.5 py-0.5 rounded-full">
                        <Star size={10} className="fill-amber-300 text-amber-300" /> {p.rating}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[9px] text-gray-500 line-through font-semibold">{(Number(p.originalPrice) || 0).toLocaleString('en-US')}</span>
                        )}
                        <p className="text-sm font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
                          {(Number(p.price) || 0).toLocaleString('en-US')} <span className="text-[9px] text-gray-400 font-bold">$</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2.5 mt-1.5 border-t border-white/10 w-full">
                    {isOut ? (
                      <button disabled className="w-full py-2 bg-slate-950/60 border border-white/5 rounded-xl text-[10px] text-gray-600 font-black flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <PackageX size={12} /> غير متاح حالياً
                      </button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                        className="w-full py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 bg-gradient-to-l from-cyan-400/15 via-cyan-400/10 to-transparent border border-cyan-400/35 text-cyan-200 hover:from-cyan-400/30 hover:to-cyan-400/10 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_18px_rgba(34,211,238,0.3)] transition-all duration-300"
                      >
                        <ShoppingCart size={13} />
                        <span>أضف إلى السلة</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
