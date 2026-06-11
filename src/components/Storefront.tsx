import React, { useState } from 'react';
import { Search, Brain, Tv, Music, Palette, BadgePercent, Layout, Flame, Sparkles, Gamepad2, Smartphone, Shield, UserPlus, ArrowLeft, ShoppingCart, ShoppingBag, Eye, Heart } from 'lucide-react';
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

  // Filter products by category and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
    const nameLower = (p.name || '').toLowerCase();
    const queryLower = (searchQuery || '').toLowerCase();
    const matchesSearch = nameLower.includes(queryLower) || 
                          (Array.isArray(p.features) && p.features.some(f => f && typeof f === 'string' && f.toLowerCase().includes(queryLower)));
    return matchesCategory && matchesSearch;
  });

  const getCategoryNameAr = (cat: string) => {
    const found = categories.find(c => c.id === cat);
    return found ? found.name : 'الجميع';
  };

  const renderCategoryIcon = (iconName: string) => {
    if (!iconName) return <Sparkles size={13} className="text-cyan-400" />;
    
    // Check if it is a real image URL
    if (iconName.startsWith('http') || iconName.startsWith('/') || iconName.startsWith('data:')) {
      return (
        <img 
          src={iconName} 
          alt="" 
          referrerPolicy="no-referrer"
          className="w-5 h-5 rounded-md object-cover border border-white/10 shrink-0" 
        />
      );
    }

    switch (iconName) {
      case 'Tv': return <Tv size={13} className="text-cyan-400" />;
      case 'Gamepad2': return <Gamepad2 size={13} className="text-cyan-400" />;
      case 'Palette': return <Palette size={13} className="text-cyan-400" />;
      case 'Shield': return <Shield size={13} className="text-cyan-400" />;
      default: return <Sparkles size={13} className="text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-24">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-[#050614]/80 backdrop-blur-md border-b border-white/5 py-4 px-4 flex justify-between items-center rounded-b-3xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <motion.div 
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="text-lg font-black bg-gradient-to-r from-cyan-400 via-blue-200 to-indigo-400 bg-clip-text text-transparent italic tracking-wider select-none"
            >
              {siteSettings?.siteName || "R3XON"}
            </motion.div>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
          </div>

          {/* User Balance Header Pill moved exactly next to URL/Logo as requested */}
          {userBalance !== undefined && onRechargeClick && (
            <div 
              onClick={onRechargeClick}
              className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 hover:border-amber-400 px-2 py-0.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-[0_0_8px_rgba(251,191,36,0.2)] font-sans select-none"
            >
              <span className="text-[10px] font-black text-amber-300 font-mono tracking-wide">
                {userBalance.toLocaleString('ar-EG')} د.ع
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center pb-[1px] shadow-sm pointer-events-none shrink-0 leading-none">
                +
              </div>
            </div>
          )}
        </div>

        {/* Search Bar Interactive */}
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-full text-xs py-1 px-3 pr-8 w-full outline-none text-right focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="absolute right-2 text-gray-400 hover:text-white">
                <ArrowLeft size={14} />
              </button>
            </motion.div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            >
              <Search size={20} />
            </button>
          )}

          {/* Cart Counter Header */}
          {cartCount > 0 && (
            <div className="relative">
              <ShoppingBag size={20} className="text-cyan-400 animate-pulse" />
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* HERO HERO PROMOTIONAL SLIDER */}
      <section className="px-4">
        <div className="flex overflow-x-auto gap-4 scrollbar-hide no-scrollbar snap-x snap-mandatory pt-1">
          {(banners.length > 0 ? banners : [
            { id: 'slide-1', title: 'باقة ChatGPT Plus السنوية', imageUrl: 'https://images.unsplash.com/photo-1675557009875-436f09780264?q=80&w=600', linkTo: 'prod-chatgpt' },
            { id: 'slide-2', title: 'باقة Netflix 4K الشهرية', imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?q=80&w=600', linkTo: 'prod-netflix' }
          ]).map((slide: any, idx: number) => {
            const product = products.find(p => p.id === slide.linkTo);
            return (
              <motion.div
                key={slide.id || idx}
                onClick={() => product && onSelectProduct(product)}
                whileHover={{ scale: 1.01 }}
                className="min-w-[290px] w-full flex-shrink-0 relative overflow-hidden h-40 glass-card rounded-3xl border border-white/10 snap-center cursor-pointer bg-[#0c0d1e]"
              >
                {slide.imageUrl && (
                  <img 
                    src={slide.imageUrl} 
                    className="absolute inset-0 w-full h-full object-contain bg-slate-950/40" 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050614] p-4 via-[#050614]/40 to-transparent pointer-events-none"></div>

                <div className="absolute bottom-4 right-4 left-4 text-right z-10 space-y-1 pointer-events-none">
                  <div className="inline-block bg-cyan-400 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-md">
                    عرض مميز وحصري
                  </div>
                  <h2 className="text-sm font-black text-white">{slide.title}</h2>
                  {product ? (
                    <p className="text-[10px] text-cyan-400 font-bold">{product.price.toLocaleString('ar-EG')} د.ع / {product.period}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">تابع التفاصيل والشراء الفوري فوراً</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Carousel indicators dots synced to index */}
        <div className="flex justify-center mt-3 gap-1.5 direction-ltr">
          {(banners.length > 0 ? banners : [1, 2]).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-4 bg-cyan-400' : 'w-1 bg-gray-600'}`}
              onClick={() => setActiveSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layout size={16} className="text-cyan-400" />
            <span>أقسام المتجر</span>
          </h3>
          <span className="text-[10px] bg-cyan-400/10 text-cyan-400 py-0.5 px-2 rounded-full font-bold">تسليم ذهبي آمن</span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id || cat.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[11px] font-bold border transition-all ${
                  isSelected 
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-400/20' 
                    : 'glass-button text-gray-300'
                }`}
              >
                {renderCategoryIcon(cat.imageOrIcon || 'Sparkles')}
                <span>{cat.name || 'العامة'}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* PRODUCTS GRID / POPULAR DEALS */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame size={16} className="text-red-400 animate-pulse" />
            <span>{selectedCategory === 'all' ? 'صفقات شائعة' : getCategoryNameAr(selectedCategory)}</span>
          </h3>
          <span className="text-[10px] text-gray-400">{filteredProducts.length} منتجات</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-gray-400 text-sm">
            لا توجد منتجات مطابقة للبحث أو الفئة المحددة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredProducts.map((p) => {
              // Dynamically pick render icon
              let IconComp = Sparkles;
              if (p.iconName === 'brain') IconComp = Brain;
              else if (p.iconName === 'tv') IconComp = Tv;
              else if (p.iconName === 'music') IconComp = Music;
              else if (p.iconName === 'palette') IconComp = Palette;
              else if (p.iconName === 'smartphone') IconComp = Smartphone;
              else if (p.iconName === 'shield') IconComp = Shield;

              return (
                <motion.div
                  key={p.id}
                  layoutId={`product-${p.id}`}
                  className="glass-card rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group border border-white/5 hover:border-white/10"
                >
                  {/* Small discount tag */}
                  {p.originalPrice && (
                    <div className="absolute top-1 left-1 bg-red-500/80 backdrop-blur-xs text-[7px] text-white px-1.5 py-0.5 rounded-md font-bold">
                      {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% خصم
                    </div>
                  )}

                  {/* Stock tag */}
                  <div className="absolute top-1 right-1 text-[8px] px-1 text-slate-400 font-medium">
                    {p.stock > 0 ? `متوفر: ${p.stock}` : 'نفذت الكمية'}
                  </div>

                  <div className="cursor-pointer space-y-2 mt-2" onClick={() => onSelectProduct(p)}>
                    {/* Media / Image Display */}
                    <div className="w-full aspect-square bg-slate-900/60 rounded-xl mb-2 flex items-center justify-center overflow-hidden border border-white/5 relative">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-3 rounded-full bg-cyan-400/10 text-cyan-400">
                          <IconComp size={24} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center">
                        <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                          <Eye size={12} /> مشاهدة
                        </span>
                      </div>

                      {/* Heart Toggle Button */}
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(p.id);
                          }}
                          className="absolute bottom-1.5 right-1.5 z-20 p-1.5 rounded-full bg-slate-950/80 border border-white/10 text-rose-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg"
                        >
                          <Heart 
                            size={13} 
                            className={favoriteIds.includes(p.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"} 
                          />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white text-right leading-tight min-h-8 line-clamp-2">
                      {p.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 text-right truncate">
                      {p.period}
                    </p>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[8px] text-yellow-400 font-semibold flex items-center gap-0.5">
                        ⭐ {p.rating}
                      </span>
                      <p className="text-xs font-bold text-cyan-400">
                        {p.price.toLocaleString('ar-EG')} <span className="text-[8px] text-gray-400 font-normal">د.ع</span>
                      </p>
                    </div>
                  </div>

                  {/* Fast action add to cart */}
                  <div className="pt-3 mt-1 border-t border-white/5 w-full">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(p);
                      }}
                      className="w-full py-1.5 glass-button rounded-lg text-[10px] text-gray-300 font-semibold flex items-center justify-center gap-1.5"
                    >
                      <span>أضف إلى السلة</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                    </motion.button>
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
