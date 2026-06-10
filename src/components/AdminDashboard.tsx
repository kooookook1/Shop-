import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, Plus, Edit, Trash2, 
  TrendingUp, DollarSign, Activity, CheckCircle, Clock, XCircle, Search, 
  Filter, X, Smartphone, Tv, Brain, Music, Palette, ShieldCheck, ChevronRight,
  Copy, ArrowUpDown, Tag, PlusCircle, Power, RefreshCw, Send, Sliders, 
  Volume2, Download, Upload, Info, MessageSquare, AlertCircle, Play, Sparkles,
  ExternalLink, Layers, FileText, Share2, HelpCircle, Eye, ShieldAlert, BadgePercent, Lock,
  Loader2, Image as ImageIcon
} from 'lucide-react';
import { Product, User, Transaction, Order, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  products: Product[];
  users: User[];
  transactions: Transaction[];
  onAddProduct: (product: any) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBackToStore: () => void;
}

interface Category {
  id: string;
  name: string;
  orderIndex: number;
  isActive: number;
  isHidden: number;
  viewLayout: string;
  imageOrIcon: string;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  expiryDate: string;
  maxUses: number;
  usedCount: number;
  assignedTo: string;
  isActive: number;
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl: string;
  linkTo: string;
  isActive: number;
  orderIndex: number;
}

interface SiteSettings {
  id: string;
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  termsPage: string;
  privacyPage: string;
  socialTwitter: string;
  socialTelegram: string;
  socialWhatsapp: string;
}

interface AuditLog {
  id: string;
  adminName: string;
  actionType: string;
  details: string;
  timestamp: string;
}

interface Broadcast {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  createdAt: string;
}

export default function AdminDashboard({ 
  products, 
  users, 
  transactions, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct, 
  onBackToStore 
}: AdminDashboardProps) {
  
  // Custom Dashboard Tabs configuration
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'categories' | 'products' | 'coupons' | 'orders' | 'users' | 'chat' | 'broadcast' | 'layout' | 'settings' | 'system'
  >('analytics');

  // Dynamic States loaded asynchronously from our Turso/SQLite API server
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [fullOrders, setFullOrders] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  // Support state helper
  const [chatReplyText, setChatReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminName, setAdminName] = useState('أحمد محمد (المشرف)');
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<string>('');
  const [adminReplyImage, setAdminReplyImage] = useState<string | null>(null);
  const [isAdminUploading, setIsAdminUploading] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Refresh dynamic states helper
  const loadDynamicData = async () => {
    try {
      const [catRes, coupRes, bannerRes, settingsRes, logsRes, broadRes, ordersRes, msgRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/coupons'),
        fetch('/api/banners'),
        fetch('/api/settings'),
        fetch('/api/logs'),
        fetch('/api/broadcasts'),
        fetch('/api/orders'),
        fetch('/api/messages')
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (coupRes.ok) setCoupons(await coupRes.json());
      if (bannerRes.ok) setBanners(await bannerRes.json());
      if (settingsRes.ok) setSiteSettings(await settingsRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (broadRes.ok) setBroadcasts(await broadRes.json());
      if (ordersRes.ok) setFullOrders(await ordersRes.json());
      if (msgRes.ok) {
        const data = await msgRes.json();
        if (Array.isArray(data)) setChatMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin custom states:", e);
    }
  };

  // Run on mount
  useEffect(() => {
    loadDynamicData();
    // Poll support messages every 7 seconds for dynamic customer support updates
    const interval = setInterval(() => {
      fetch('/api/messages')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setChatMessages(data);
        })
        .catch(err => console.error("Poll messages error: ", err));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Write new action log helper
  const writeLog = async (actionType: string, details: string) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, actionType, details })
      });
      loadDynamicData();
    } catch (e) {
      console.error(e);
    }
  };

  // Modal Control States
  const [activeModal, setActiveModal] = useState<'category' | 'product' | 'coupon' | 'banner' | 'broadcast' | 'orderCredentials' | 'userEdit' | null>(null);
  
  // Modals fields schemas
  // 1. Category Form fields
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catLayout, setCatLayout] = useState('vertical');
  const [catIcon, setCatIcon] = useState('Shield');
  const [catIsActive, setCatIsActive] = useState(true);
  const [catIsHidden, setCatIsHidden] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 2. Product Additional Form fields
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('accounts');
  const [prodPrice, setProdPrice] = useState('29.99');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('45.00');
  const [prodPeriod, setProdPeriod] = useState('شهر');
  const [prodStock, setProdStock] = useState('30');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodExtraImages, setProdExtraImages] = useState(''); // Text links comma-separated
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodCommission, setProdCommission] = useState('15');
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);
  const [prodTagText, setProdTagText] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // 3. Coupon Form fields
  const [coupId, setCoupId] = useState('');
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState('percent');
  const [coupValue, setCoupValue] = useState('15');
  const [coupExpiry, setCoupExpiry] = useState('2027-12-31');
  const [coupMaxUses, setCoupMaxUses] = useState('100');
  const [coupAssignedTo, setCoupAssignedTo] = useState('all');
  const [coupIsActive, setCoupIsActive] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // 4. Banner Slide fields
  const [bannerId, setBannerId] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [bannerVid, setBannerVid] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerActive, setBannerActive] = useState(true);
  const [bannerOrder, setBannerOrder] = useState('1');
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // 5. Broadcast Message fields
  const [broadTitle, setBroadTitle] = useState('');
  const [broadBody, setBroadBody] = useState('');
  const [broadAudience, setBroadAudience] = useState('all');

  // 6. User editor fields
  const [userIdState, setUserIdState] = useState('');
  const [userNameState, setUserNameState] = useState('');
  const [userEmailState, setUserEmailState] = useState('');
  const [userBalanceState, setUserBalanceState] = useState('450');
  const [userStatusState, setUserStatusState] = useState<'VIP' | 'نشط' | 'محظور'>('نشط');

  // 7. Order credentials adjustment fields
  const [orderTargetId, setOrderTargetId] = useState('');
  const [orderCredUsername, setOrderCredUsername] = useState('');
  const [orderCredPassword, setOrderCredPassword] = useState('');
  const [orderCredCode, setOrderCredCode] = useState('');
  const [orderStatusField, setOrderStatusField] = useState('تم تسليم الطلب');

  // Search Filter values
  const [globalSearch, setGlobalSearch] = useState('');
  const [userFilterText, setUserFilterText] = useState('');
  const [orderFilterText, setOrderFilterText] = useState('');

  // Local storage indicators
  const [toastText, setToastText] = useState<string | null>(null);
  
  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => setToastText(null), 3000);
  };

  // Core Math computations for Analytics
  const completedOrders = fullOrders.filter(o => o.status === 'مكتب المشتريات' || o.status === 'تم تسليم الطلب' || o.status === 'مكتمل');
  const totalCompletedCount = completedOrders.length;
  const grossIncome = completedOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  const netCommission = completedOrders.reduce((sum, o) => {
    const rate = Number(o.commission_rate || 15) / 100;
    return sum + ((Number(o.price) || 0) * rate);
  }, 0);
  const partnerShares = grossIncome - netCommission;

  // Active Users count
  const blockedUsersCount = users.filter(u => u.status === 'محظور').length;
  const vipUsersCount = users.filter(u => u.status === 'VIP').length;

  // Revenue analytics aggregates simulation for charts
  const dailyRev = (grossIncome * 0.12).toFixed(2);
  const weeklyRev = (grossIncome * 0.45).toFixed(2);
  const monthlyRev = grossIncome.toFixed(2);

  // CATEGORY OPERATIONS
  const handleOpenCategoryModal = (c: Category | null = null) => {
    if (c) {
      setEditingCategory(c);
      setCatId(c.id);
      setCatName(c.name);
      setCatOrder(c.orderIndex?.toString() || '');
      setCatLayout(c.viewLayout);
      setCatIcon(c.imageOrIcon);
      setCatIsActive(c.isActive === 1);
      setCatIsHidden(c.isHidden === 1);
    } else {
      setEditingCategory(null);
      setCatId(`cat-${Date.now()}`);
      setCatName('');
      setCatOrder((categories.length + 1).toString());
      setCatLayout('vertical');
      setCatIcon('Shield');
      setCatIsActive(true);
      setCatIsHidden(false);
    }
    setActiveModal('category');
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      id: catId,
      name: catName,
      orderIndex: parseInt(catOrder) || 0,
      isActive: catIsActive ? 1 : 0,
      isHidden: catIsHidden ? 1 : 0,
      viewLayout: catLayout,
      imageOrIcon: catIcon
    };

    try {
      const url = editingCategory ? `/api/categories/${catId}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast(editingCategory ? "تم تعديل القسم بنجاح 📂" : "تم إنشاء القسم وتفعيله بنجاح ✅");
        await writeLog(
          editingCategory ? "تعديل قسم" : "إنشاء قسم", 
          `تم الحفظ ببيانات: اسم القسم (${catName})، ترتيب (${catOrder})`
        );
        setActiveModal(null);
      } else {
        showToast("فشلت العملية، يرجى المحاولة لاحقاً");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف القسم "${name}" بالكامل؟ سيؤثر هذا على تصفية المنتجات.`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("تم حذف القسم بنجاح🗑️");
        await writeLog("حذف قسم", `تم إزالة قسم: ${name} (ID: ${id})`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    try {
      const updatedActive = cat.isActive === 1 ? 0 : 1;
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          isActive: updatedActive
        })
      });
      if (res.ok) {
        showToast(updatedActive === 1 ? "تم تفعيل وتثبيت القسم 🟢" : "تم تعطيل القسم مؤقتاً 🔴");
        await writeLog("تغيير حالة القسم", `تم تغيير تفعيل القسم ${cat.name} إلى ${updatedActive ? 'مفعّل' : 'معطّل'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const moveCategoryOrder = async (cat: Category, direction: 'up' | 'down') => {
    const offset = direction === 'up' ? -1 : 1;
    const nextOrder = cat.orderIndex + offset;
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          orderIndex: Math.max(0, nextOrder)
        })
      });
      showToast("تم تعديل ترتيب القسم ⚡");
      loadDynamicData();
    } catch (e) {
      console.error(e);
    }
  };

  // PRODUCT OPERATIONS
  const handleOpenProductModal = (p: Product | null = null) => {
    if (p) {
      setEditingProduct(p);
      setProdId(p.id);
      setProdName(p.name);
      setProdCategory(p.category);
      setProdPrice(p.price?.toString() || '0');
      setProdOriginalPrice((p.originalPrice || p.price * 1.3).toFixed(2));
      setProdPeriod(p.period);
      setProdStock(p.stock?.toString() || '0');
      setProdImageUrl(p.imageUrl || '');
      setProdExtraImages(Array.isArray((p as any).extraImages) ? (p as any).extraImages.join(', ') : '');
      setProdVideoUrl((p as any).videoUrl || '');
      setProdFeatures(p.features.join('\n'));
      setProdCommission((p.commission_rate || 15)?.toString() || '15');
      setProdIsFeatured((p as any).isFeatured);
      setProdIsBestSeller((p as any).isBestSeller);
      setProdTagText((p as any).tagText || '');
    } else {
      setEditingProduct(null);
      setProdId(`prod-${Date.now()}`);
      setProdName('');
      setProdCategory(categories[0]?.id || 'accounts');
      setProdPrice('29.00');
      setProdOriginalPrice('39.00');
      setProdPeriod('اشتراك شهري بملف خاص');
      setProdStock('50');
      setProdImageUrl('');
      setProdExtraImages('');
      setProdVideoUrl('');
      setProdFeatures('ملف خاص بك بالكامل VIP\nضمان ذهبي ممتد طوال فترة الاشتراك\nمشاهدة آمنة بجودة 4K فائقة الوضوح\nتسليم فوري ومباشر بمجرد الدفع');
      setProdCommission('15');
      setProdIsFeatured(false);
      setProdIsBestSeller(false);
      setProdTagText('');
    }
    setActiveModal('product');
  };

  const handleCloneProduct = (p: Product) => {
    setEditingProduct(null);
    setProdId(`prod-${Date.now()}`);
    setProdName(`${p.name} (نسخة جديدة)`);
    setProdCategory(p.category);
    setProdPrice(p.price?.toString() || '0');
    setProdOriginalPrice((p.originalPrice || (p.price ? p.price * 1.3 : 0))?.toString() || '0');
    setProdPeriod(p.period);
    setProdStock(p.stock?.toString() || '0');
    setProdImageUrl(p.imageUrl || '');
    setProdExtraImages(Array.isArray((p as any).extraImages) ? (p as any).extraImages.join(', ') : '');
    setProdVideoUrl((p as any).videoUrl || '');
    setProdFeatures(p.features.join('\n'));
    setProdCommission((p.commission_rate || 15)?.toString() || '15');
    setProdIsFeatured((p as any).isFeatured);
    setProdIsBestSeller((p as any).isBestSeller);
    setProdTagText((p as any).tagText || '');
    setActiveModal('product');
    showToast("تم نسخ المنتج بسرعة! عدل حفظ البيانات للحفظ 📄");
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const featuresList = prodFeatures.split('\n').filter(f => f.trim() !== '');
    const exImagesList = prodExtraImages.split(',').map(img => img.trim()).filter(img => img.length > 0);
    
    const body = {
      id: prodId,
      name: prodName,
      category: prodCategory,
      price: parseFloat(prodPrice) || 29.99,
      originalPrice: parseFloat(prodOriginalPrice) || null,
      period: prodPeriod,
      stock: parseInt(prodStock) || 0,
      imageUrl: prodImageUrl,
      iconName: 'box',
      features: featuresList,
      commission_rate: parseFloat(prodCommission) || 15,
      extraImages: exImagesList,
      videoUrl: prodVideoUrl,
      isFeatured: prodIsFeatured ? 1 : 0,
      isBestSeller: prodIsBestSeller ? 1 : 0,
      tagText: prodTagText
    };

    if (editingProduct) {
      await onEditProduct(body as any);
      showToast("تم تعديل بيانات المنتج وحفظها بنجاح 💎");
      await writeLog("تعديل منتج", `تم حفظ التعديلات على المنتج: ${prodName} بـ سعر ${prodPrice} ر.س`);
    } else {
      await onAddProduct(body);
      showToast("تم إنشاء المنتج الرقمي وإضافته للمتجر بنجاح 🛒");
      await writeLog("إضافة منتج", `صناعة منتج جديد: ${prodName} بنجاح كجزء من ${prodCategory}`);
    }

    setActiveModal(null);
    setIsLoading(false);
    loadDynamicData();
  };

  const deleteProductItem = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد تماماً من رغبتك في مسح المنتج ${name} بشكل نهائي من قاعدة البيانات؟`)) return;
    try {
      await onDeleteProduct(id);
      showToast("تمت إزالة المنتج نهائياً🗑️");
      await writeLog("حذف منتج", `تم شطب منتج رقمي بالكامل: ${name} (ID: ${id})`);
      loadDynamicData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickUpdateStock = async (p: Product, newStock: number) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...p,
          stock: newStock
        })
      });
      if (res.ok) {
        showToast("حرصاً على الرصيد، تم تحديث الكمية المتوفرة فوراً ⚡");
        loadDynamicData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // COUPON OPERATIONS
  const handleOpenCouponModal = (c: Coupon | null = null) => {
    if (c) {
      setEditingCoupon(c);
      setCoupId(c.id);
      setCoupCode(c.code);
      setCoupType(c.type);
      setCoupValue(c.value?.toString() || '0');
      setCoupExpiry(c.expiryDate);
      setCoupMaxUses(c.maxUses?.toString() || '1');
      setCoupAssignedTo(c.assignedTo);
      setCoupIsActive(c.isActive === 1);
    } else {
      setEditingCoupon(null);
      setCoupId(`coup-${Date.now()}`);
      setCoupCode(`COUPON${Math.floor(100+Math.random()*900)}`);
      setCoupType('percent');
      setCoupValue('15');
      setCoupExpiry('2027-12-31');
      setCoupMaxUses('100');
      setCoupAssignedTo('all');
      setCoupIsActive(true);
    }
    setActiveModal('coupon');
  };

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      id: coupId,
      code: coupCode.toUpperCase().trim(),
      type: coupType,
      value: parseFloat(coupValue) || 15,
      expiryDate: coupExpiry,
      maxUses: parseInt(coupMaxUses) || 500,
      usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      assignedTo: coupAssignedTo,
      isActive: coupIsActive ? 1 : 0
    };

    try {
      const url = editingCoupon ? `/api/coupons/${coupId}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        showToast(editingCoupon ? "تم تحديث كوبون الخصم 🔖" : "تم إنشاء الكوبون الجديد بنجاح 🎊");
        await writeLog(
          editingCoupon ? "تعديل كوبون" : "صناعة كوبون",
          `اسم الكوبون (${coupCode}) بقيمة ${coupValue}${coupType === 'percent' ? '%' : 'ر.س'}`
        );
        setActiveModal(null);
      } else {
        showToast("اسم كود الخصم مستخدم من قبل، يرجى كتابة كود فريد");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCoupon = async (id: string, code: string) => {
    if (!confirm(`هل تود التخلص ومسح كود الخصم "${code}" ؟`)) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("تم حذف الكوبون الحركي 🗑️");
        await writeLog("حذف كوبون خصم", `تمت إزالة كوبون ${code}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ORDER CREDENTIALS & KEY DELIVERIES MANAGEMENT
  const handleOpenOrderCredentialsModal = (order: any) => {
    setOrderTargetId(order.id);
    setOrderCredUsername(order.credentials?.username || '');
    setOrderCredPassword(order.credentials?.password || '');
    setOrderCredCode(order.credentials?.code || '');
    setOrderStatusField(order.status || 'تم تسليم الطلب');
    setActiveModal('orderCredentials');
  };

  const saveOrderCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const credentials = {
      username: orderCredUsername,
      password: orderCredPassword,
      code: orderCredCode
    };

    try {
      const res = await fetch(`/api/orders/${orderTargetId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, status: orderStatusField })
      });

      if (res.ok) {
        showToast("تم تسليم وتحديث مفاتيح وبيانات الحساب بنجاح 🔐");
        await writeLog("تعديل طلب رقمي", `تم تسليم البيانات للطلب ${orderTargetId} مع تحويل حالته لـ ${orderStatusField}`);
        setActiveModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في شطب وإلغاء هذا الطلب من السجل؟")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("تم إلغاء الطلب من القائمة 🗑️");
        await writeLog("حذف طلب", `تم حذف الطلب بالكامل: ${id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SUPPORT CHAT DIRECT REPLY
  const handleSendAdminReply = async () => {
    if (!chatReplyText.trim() && !adminReplyImage) return;
    if (!selectedConversationUserId) {
      showToast("يرجى اختيار عميل من القائمة اليسرى أولاً للرد عليه ⚠️");
      return;
    }
    try {
      const res = await fetch('/api/admin/reply-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chatReplyText,
          adminName,
          userId: selectedConversationUserId,
          image: adminReplyImage || ''
        })
      });
      if (res.ok) {
        setChatReplyText('');
        setAdminReplyImage(null);
        showToast("تجاوب سريع! تم ترحيل ردك للعميل بالدردشة 💬");
        loadDynamicData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BROADCAST NOTIFICATION SENDER
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadTitle.trim() || !broadBody.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: broadTitle, body: broadBody, targetAudience: broadAudience })
      });
      if (res.ok) {
        showToast("تم بث ونشر الإشعار الشامل لجميع الأفراد المستهدفين 📡");
        await writeLog("بث إشعار عام", `عنوان الإشعار (${broadTitle}) لشريحة (${broadAudience})`);
        setBroadTitle('');
        setBroadBody('');
        setActiveModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // HOMEPAGE CAROUSEL BANNERS MANAGEMENT
  const handleOpenBannerModal = (b: Banner | null = null) => {
    if (b) {
      setEditingBanner(b);
      setBannerId(b.id);
      setBannerTitle(b.title);
      setBannerImg(b.imageUrl);
      setBannerVid(b.videoUrl);
      setBannerLink(b.linkTo);
      setBannerActive(b.isActive === 1);
      setBannerOrder(b.orderIndex?.toString() || '0');
    } else {
      setEditingBanner(null);
      setBannerId(`slide-${Date.now()}`);
      setBannerTitle('');
      setBannerImg('');
      setBannerVid('');
      setBannerLink('');
      setBannerActive(true);
      setBannerOrder((banners.length + 1).toString());
    }
    setActiveModal('banner');
  };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      id: bannerId,
      title: bannerTitle,
      imageUrl: bannerImg,
      videoUrl: bannerVid,
      linkTo: bannerLink,
      isActive: bannerActive ? 1 : 0,
      orderIndex: parseInt(bannerOrder) || 1
    };

    try {
      const url = editingBanner ? `/api/banners/${bannerId}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast(editingBanner ? "تم تحديث البنر الإعلاني 🎥" : "تم رفع وحفظ البنر الترويجي بنجاح 🖼️");
        await writeLog(
          editingBanner ? "تعديل بنر إعلاني" : "إضافة بنر إعلاني",
          `تحت مسمى (${bannerTitle})`
        );
        setActiveModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBanner = async (id: string, title: string) => {
    if (!confirm(`هل تود إزالة شريحة البنر "${title}"؟`)) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("تم مسح البنر من العرض 🗑️");
        await writeLog("حذف بنر إعلاني", `إصدار أمر إبعاد لـ ${title}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SYSTEM SETTINGS SAVER
  const [siteName, setSiteName] = useState('متجر ريكسون الرقمي R3XON');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#22d3ee');
  const [termsPageText, setTermsPageText] = useState('');
  const [privacyPageText, setPrivacyPageText] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('https://twitter.com');
  const [socialTelegram, setSocialTelegram] = useState('https://t.me');
  const [socialWhatsapp, setSocialWhatsapp] = useState('https://wa.me');

  // Load current settings into form when tab opens
  useEffect(() => {
    if (activeTab === 'settings' && siteSettings) {
      setSiteName(siteSettings.siteName);
      setLogoUrl(siteSettings.logoUrl || '');
      setPrimaryColor(siteSettings.primaryColor || '#22d3ee');
      setTermsPageText(siteSettings.termsPage || '');
      setPrivacyPageText(siteSettings.privacyPage || '');
      setSocialTwitter(siteSettings.socialTwitter || '');
      setSocialTelegram(siteSettings.socialTelegram || '');
      setSocialWhatsapp(siteSettings.socialWhatsapp || '');
    }
  }, [activeTab, siteSettings]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      siteName,
      logoUrl,
      faviconUrl: '',
      primaryColor,
      termsPage: termsPageText,
      privacyPage: privacyPageText,
      socialTwitter,
      socialTelegram,
      socialWhatsapp
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("تم تحديث وحفظ الإعدادات الفنية والهوية التجميلية للمتجر 🎨");
        await writeLog("تحديث إعدادات الهوية", `تغيير اسم الموقع لـ (${siteName}) واختيار السمة اللونية (${primaryColor})`);
        
        // Dynamic styling sync
        document.documentElement.style.setProperty('--primary-color', primaryColor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // USER MANAGEMENT
  const handleOpenUserEditModal = (u: User) => {
    setUserIdState(u.id);
    setUserNameState(u.name);
    setUserEmailState(u.email);
    setUserBalanceState(u.balance?.toString() || '0');
    setUserStatusState(u.status);
    setActiveModal('userEdit');
  };

  const saveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      name: userNameState,
      email: userEmailState,
      balance: parseFloat(userBalanceState) || 0,
      status: userStatusState
    };

    try {
      const res = await fetch(`/api/users/${userIdState}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("تم تعديل رصيد وحالة العميل بنجاح 👥");
        await writeLog("تعديل بيانات عميل", `رصيد (${userNameState}) أصبح ${userBalanceState} ر.س وحالته (${userStatusState})`);
        setActiveModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`هل تود فعلاً طرد وحذف العميل "${name}" بالكامل من مخدمات المتجر؟`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("تم حذف العميل بنجاح 🗑️");
        await writeLog("حذف عميل نهائياً", `إقصاء وتطهير حساب: ${name}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BACKUP & RESTORATION UTILITIES
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rixon_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showToast("تم تصدير وحفظ نسخة احتياطية من جميع جداول المتجر بنجاح 🗄️");
      await writeLog("نسخة احتياطية", "تم سحب وحفظ نسخة احتياطية محلية متكاملة.");
    } catch (e) {
      console.error(e);
      showToast("فشل تصدير البيانات");
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setIsLoading(true);
          const res = await fetch('/api/admin/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
          });
          if (res.ok) {
            showToast("الحمد لله! تم استيراد واستعادة البيانات والملفات الرقمية بنجاح 🔄");
            await writeLog("استعادة النظام", "استدعاء واسترداد نسخة احتياطية سابقة ومغفرة البيانات العشوائية.");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast("الملف المرفق تالف أو غير متناسق مع بنية الجداول");
          }
        } catch(err) {
          showToast("عذراً، محتوى الملف ليس بصيغة JSON صحيحة");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch(err) {
      console.error(err);
    }
  };

  // EXPORT ORDERS LIST CSV SIMULATION
  const handleExportOrdersCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "رقم الطلب,المنتج,القيمة,التاريخ,الحالة,بيانات التفعيل\n";
    
    fullOrders.forEach(o => {
      const credsText = o.credentials?.code ? `كود: ${o.credentials.code}` : `حساب: ${o.credentials?.username || ''} | سر: ${o.credentials?.password || ''}`;
      csvContent += `${o.id},${o.productName},${o.price} ر.س,${o.date},${o.status},"${credsText}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `rixon_orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("تم إنشاء وتصدير تقرير الطلبات بتنسيق CSV ممتاز 📊");
  };

  // Helper filters for GUI search
  const filteredProducts = products.filter(p => {
    const term = (globalSearch || '').toLowerCase();
    const pName = (p && p.name || '').toLowerCase();
    const pCat = (p && p.category || '').toLowerCase();
    return pName.includes(term) || pCat.includes(term);
  });

  const filteredUsers = users.filter(u => {
    const term = (userFilterText || '').toLowerCase();
    const uName = (u && u.name || '').toLowerCase();
    const uEmail = (u && u.email || '').toLowerCase();
    return uName.includes(term) || uEmail.includes(term);
  });

  const filteredOrders = fullOrders.filter(o => {
    const term = (orderFilterText || '').toLowerCase();
    const oId = (o && o.id || '').toLowerCase();
    const oProdName = (o && o.productName || '').toLowerCase();
    return oId.includes(term) || oProdName.includes(term);
  });

  return (
    <div className="space-y-6 pt-2 pb-28 text-white text-right font-sans min-h-screen bg-[#050614]" dir="rtl">
      
      {/* Toast Overlay alert */}
      <AnimatePresence>
        {toastText && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-2xl z-50 text-xs text-center border border-white/25 flex items-center gap-2"
          >
            <Sparkles size={16} className="animate-spin" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER CONTROLS */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 sticky top-0 bg-[#050614]/90 backdrop-blur-md z-40 border-b border-white/5">
        <button 
          onClick={onBackToStore}
          className="p-2.5 hover:bg-white/5 rounded-full transition-colors text-cyan-400 text-xs flex items-center gap-1 shrink-0 bg-slate-950/40 border border-white/5"
        >
          <ChevronRight size={16} />
          <span>المتجر الرقمي</span>
        </button>
        <div>
          <div className="text-right text-lg font-black text-white flex items-center gap-1.5 justify-end">
            <span className="bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500 bg-clip-text text-transparent">لوحة الإشراف العليا</span>
            <Lock size={16} className="text-amber-400" />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">التحكم الدائم برصيد الفئات والمنتجات والتشغيل</p>
        </div>
      </header>

      {/* HORIZONTAL SWIPEABLE NAVIGATION RAIL FOR BOTH MOBILES AND IPADS */}
      <section className="px-4 overflow-x-auto no-scrollbar scroll-smooth flex gap-2 select-none py-1">
        {[
          { tab: 'analytics', label: 'الإحصائيات', icon: LayoutDashboard },
          { tab: 'categories', label: 'الأقسام', icon: Layers },
          { tab: 'products', label: 'المنتجات', icon: ShoppingBag },
          { tab: 'coupons', label: 'الخصومات', icon: Tag },
          { tab: 'orders', label: 'الطلبات', icon: FileText },
          { tab: 'users', label: 'العملاء', icon: Users },
          { tab: 'chat', label: 'الدعم العاجل', icon: MessageSquare },
          { tab: 'broadcast', label: 'بث إشعارات', icon: Volume2 },
          { tab: 'layout', label: 'تخطيط الرئسية', icon: Sliders },
          { tab: 'settings', label: 'إعداد الهوية', icon: Palette },
          { tab: 'system', label: 'إدارة مخازن', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                isActive 
                  ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10 font-black border-cyan-300' 
                  : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </section>

      {/* MAIN VIEW CONTROLLER GRID FLOW */}
      <main className="px-4 space-y-6">

        {/* 1. TAB: ANALYTICS & INTERACTIVE KPIS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Bento Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#1e1b4b]/60 border border-indigo-500/10 p-4 rounded-3xl text-right">
                <span className="text-[10px] text-indigo-300 font-bold block mb-1">المبيعات الكلية</span>
                <p className="text-[17px] font-black tracking-tight text-white">{grossIncome.toFixed(2)} ر.س</p>
                <span className="text-[8px] text-gray-300 mt-1 block">توزيع عوائد وتسويات</span>
              </div>

              <div className="bg-[#1c1d1a]/80 border border-green-500/10 p-4 rounded-3xl text-right">
                <span className="text-[10px] text-emerald-400 font-bold block mb-1">صافي أرباح ريكسون</span>
                <p className="text-[17px] font-black tracking-tight text-emerald-400">{netCommission.toFixed(2)} ر.س</p>
                <div className="text-[8px] text-gray-400 mt-1">العمولة المهيأة (%15 كمتوسط)</div>
              </div>

              <div className="bg-[#1f2025]/80 border border-amber-500/10 p-4 rounded-3xl text-right">
                <span className="text-[10px] text-amber-300 font-bold block mb-1">مستحقات الشركاء</span>
                <p className="text-[17px] font-black tracking-tight text-amber-400">{partnerShares.toFixed(2)} ر.س</p>
                <span className="text-[8px] text-gray-400 mt-1 block">قابلة للسحب للبنوك</span>
              </div>

              <div className="bg-[#111827]/80 border border-cyan-500/10 p-4 rounded-3xl text-right">
                <span className="text-[10px] text-cyan-400 font-bold block mb-1">العملاء النشِطين</span>
                <p className="text-[17px] font-black tracking-tight text-white">{users.length} عميل</p>
                <span className="text-[8px] text-gray-400 mt-1 block">مكتمل تشغيله لـ {vipUsersCount} VIP</span>
              </div>
            </div>

            {/* Simulated interactive sales aggregates */}
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">تدفق مالي مستمر</span>
                <h3 className="text-xs font-bold text-white">توزيع الإيرادات والأرباح</h3>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="font-mono font-bold text-cyan-400">{dailyRev} ر.س</span>
                  <span className="text-gray-400">الأرباح التقديرية اليومية</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><div className="bg-cyan-400 h-1 rounded-full" style={{ width: '40%' }}></div></div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-mono font-bold text-amber-400">{weeklyRev} ر.س</span>
                  <span className="text-gray-400">الأرباح التقديرية الأسبوعية</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><div className="bg-amber-400 h-1 rounded-full" style={{ width: '70%' }}></div></div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-mono font-bold text-emerald-400">{monthlyRev} ر.س</span>
                  <span className="text-gray-400">الأرباح التقديرية الشهرية</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><div className="bg-emerald-400 h-1 rounded-full" style={{ width: '100%' }}></div></div>
              </div>
            </div>

            {/* Dynamic statistics visualizers */}
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl">
              <h3 className="text-xs font-bold text-white mb-4 text-right">أقوى المنتجات الرقمية مبيعاً</h3>
              <div className="divide-y divide-white/5">
                {products.slice(0, 3).map((p, idx) => (
                  <div key={p.id || `best-${idx}`} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-bold text-gray-400">الترتيب #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-white">{p.name}</p>
                        <span className="text-[10px] text-gray-400">تم بيع {150 - Number(p.stock)} وحدة</span>
                      </div>
                      {p.imageUrl && <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleOpenCategoryModal()}
                className="bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>إضافة قسم جديد</span>
              </button>
              <h2 className="text-xs font-bold text-gray-300">أقسام المتجر المتاحة للد فرى</h2>
            </div>

            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={cat.id || `category-${idx}`} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3">
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-2 hover:bg-white/5 rounded-xl text-yellow-400 text-xs"
                      title="تعديل القسم"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      className="p-2 hover:bg-white/5 rounded-xl text-red-500 text-xs"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={() => toggleCategoryActive(cat)}
                      className={`p-2 rounded-xl text-xs ${cat.isActive === 1 ? 'text-green-400' : 'text-gray-400'}`}
                      title="تفعيل/إيقاف"
                    >
                      <Power size={14} />
                    </button>
                  </div>

                  {/* Ordering Index and templates */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => moveCategoryOrder(cat, 'up')} className="text-gray-400 hover:text-white p-1">
                        <ChevronRight size={12} className="-rotate-90" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-cyan-400">#{cat.orderIndex}</span>
                      <button onClick={() => moveCategoryOrder(cat, 'down')} className="text-gray-400 hover:text-white p-1">
                        <ChevronRight size={12} className="rotate-90" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                        <span>{cat.name}</span>
                        {cat.isHidden === 1 && <span className="bg-amber-500/10 text-amber-500 text-[8px] px-1.5 py-0.5 rounded-md">مخفي مؤقتاً</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">تنسيق عرض: {cat.viewLayout === 'horizontal' ? 'أفقي' : 'عمودي (افتراضي)'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TAB: PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            
            {/* Filter and Creators header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleOpenProductModal()}
                  className="bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
                >
                  <PlusCircle size={16} />
                  <span>إضافة منتج رقمي</span>
                </button>
                <h2 className="text-xs font-bold text-gray-300">مخزن الاشتراكات الرقمية</h2>
              </div>

              {/* Instant Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث السريع عن منتج بالأسم..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl w-full text-xs py-3 px-3 pl-8 text-right outline-none focus:border-cyan-400"
                />
                <Search size={14} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredProducts.map((p, idx) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div key={p.id || `product-${idx}`} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      
                      {/* Products Controllers */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenProductModal(p)}
                          className="p-2 hover:bg-white/5 rounded-xl text-yellow-400"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          onClick={() => handleCloneProduct(p)}
                          className="p-2 hover:bg-white/5 rounded-xl text-cyan-400"
                          title="نسخ المنتج"
                        >
                          <Copy size={13} />
                        </button>
                        <button 
                          onClick={() => deleteProductItem(p.id, p.name)}
                          className="p-2 hover:bg-white/5 rounded-xl text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Header product title and icons representing services */}
                      <div className="flex items-start gap-2.5">
                        <div className="text-right">
                          <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                            <span>{p.name}</span>
                            {(p as any).isFeatured && <span className="bg-amber-400/20 text-amber-300 text-[8px] px-1 rounded-sm">مميز⭐</span>}
                          </h4>
                          <span className="text-[10px] text-cyan-400">{p.period}</span>
                        </div>
                        {p.imageUrl && (
                          <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    {/* Stock Quick updates and Prices row */}
                    <div className="grid grid-cols-2 bg-slate-950/40 p-2.5 rounded-xl text-[11px] items-center">
                      <div className="text-left font-mono">
                        <span className="text-white text-xs font-bold">{p.price} ر.س</span>
                        {p.originalPrice && <span className="text-gray-500 line-through mr-1 text-[9px]">{p.originalPrice} ر.س</span>}
                      </div>

                      <div className="flex items-center gap-1.5 justify-end">
                        <div className="text-right">
                          <span className="text-gray-400">الكمية: </span>
                          <span className={`font-mono font-bold ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>{p.stock}</span>
                        </div>
                        
                        {/* Instant Stock updater buttons */}
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleQuickUpdateStock(p, Math.max(0, p.stock - 5))}
                            className="bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-[9px]"
                          >
                            -5
                          </button>
                          <button 
                            onClick={() => handleQuickUpdateStock(p, p.stock + 10)}
                            className="bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-[9px]"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Video and metadata tags verification banner if exists */}
                    {((p as any).videoUrl || (p as any).tagText) && (
                      <div className="flex items-center justify-between text-[9px] text-gray-400 px-1">
                        <span>{(p as any).videoUrl ? '🎥 يحتوي على فيديو تعريفي' : ''}</span>
                        <span className="bg-white/5 px-1.5 py-0.5 rounded-sm text-cyan-400">{(p as any).tagText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. TAB: COUPON DISCOUNTS WORKBOOK */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleOpenCouponModal()}
                className="bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
              >
                <Tag size={16} />
                <span>إنشاء كود خصم جديد</span>
              </button>
              <h2 className="text-xs font-bold text-gray-300">أكواد خصم العملاء الفعالة</h2>
            </div>

            <div className="space-y-2.5">
              {coupons.map((c, idx) => (
                <div key={c.id || `coupon-${idx}`} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3">
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenCouponModal(c)}
                      className="p-2 hover:bg-white/5 rounded-xl text-yellow-400"
                    >
                      <Edit size={13} />
                    </button>
                    <button 
                      onClick={() => deleteCoupon(c.id, c.code)}
                      className="p-2 hover:bg-white/5 rounded-xl text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Coupon Details */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${c.isActive === 1 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {c.isActive === 1 ? 'فعال ونشط' : 'معطّل'}
                      </span>
                      <p className="text-xs font-mono font-black text-white bg-slate-950 px-2 py-1 rounded-lg tracking-wider border border-white/5">{c.code}</p>
                    </div>

                    <p className="text-[11px] text-gray-300 mt-2">
                      قيمة الخصم: <span className="text-cyan-400 font-bold">{c.value}{c.type === 'percent' ? '%' : 'ر.س'}</span>
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      الاستخدام: {c.usedCount} من أصل {c.maxUses} استخدام • تاريخ الانتهاء: {c.expiryDate || 'مفتوح'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TAB: ORDERS LEDGER */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Headers and export */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleExportOrdersCSV}
                  className="bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>تصدير الطلبات CSV</span>
                </button>
                <h2 className="text-xs font-bold text-gray-300">تفاصيل وتلقينات حسابات البيع</h2>
              </div>

              {/* Mini Search orders */}
              <input
                type="text"
                placeholder="ابحث برقم الطلب أو اسم العميل..."
                value={orderFilterText}
                onChange={(e) => setOrderFilterText(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl text-xs py-2.5 px-3 outline-none text-right focus:border-cyan-400"
              />
            </div>

            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const totalIncome = Number(ord.price) || 0;
                const companyProfit = (totalIncome * (Number(ord.commission_rate || 15) / 100)).toFixed(2);
                
                return (
                  <div key={ord.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      
                      {/* Delete actions or manual credential trigger delivery values */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenOrderCredentialsModal(ord)}
                          className="bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1"
                        >
                          <Edit size={11} />
                          <span>تسليم وتعديل الحساب</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="p-1.5 hover:bg-white/5 text-red-500 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-white/5">#{ord.id}</span>
                        <h4 className="text-xs font-bold text-white mt-1.5">{ord.productName}</h4>
                        <span className="text-[9px] text-gray-400">{ord.date}</span>
                      </div>
                    </div>

                    {/* Delivery content status verification */}
                    <div className="bg-slate-950/40 p-3 rounded-2xl text-right text-[11px] space-y-2">
                      <div className="flex justify-between">
                        <span className="font-mono text-white font-bold">{ord.price} ر.س</span>
                        <span className="text-gray-400">القيمة الإجمالية</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-mono text-amber-400">{companyProfit} ر.س (%{ord.commission_rate})</span>
                        <span className="text-gray-400">صافي العمولة</span>
                      </div>

                      <div className="border-t border-white/5 pt-2">
                        <span className="text-gray-400 block mb-1">البيانات الرقمية المسلمة للعميل:</span>
                        {ord.credentials?.code ? (
                          <div className="bg-slate-900 p-2 rounded-lg text-left font-mono text-[9px] text-cyan-400 select-all border border-cyan-500/10">
                            الكود: {ord.credentials.code}
                          </div>
                        ) : ord.credentials?.username ? (
                          <div className="bg-slate-900 p-2 rounded-lg text-right font-mono text-[9px] text-emerald-400 space-y-1 select-all border border-emerald-500/10">
                            <div>البريد: {ord.credentials.username}</div>
                            <div>السر: {ord.credentials.password}</div>
                          </div>
                        ) : (
                          <span className="text-amber-500">لا يوجد بيانات مسجلة حالياً</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">حالة تسليم الطلب:</span>
                      <span className="text-emerald-400 font-bold">{ord.status || 'مكتمل التسليم'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TAB: USERS REGISTER & BALANCES */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="البحث عن عميل بالإيميل أو الأسم..."
                value={userFilterText}
                onChange={(e) => setUserFilterText(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl w-full text-xs py-3 px-3 pl-8 text-right outline-none focus:border-cyan-400"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-gray-400" />
            </div>

            <div className="space-y-2.5">
              {filteredUsers.map((u, idx) => (
                <div key={u.id || `user-${idx}`} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Control edits */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleOpenUserEditModal(u)}
                        className="bg-cyan-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                      >
                        <Edit size={11} />
                        <span>تعديل الرصيد</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-red-500 hover:bg-white/5 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Meta info info */}
                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                          <span>{u.name}</span>
                          <span className={`text-[8px] px-1 rounded-sm ${u.status === 'VIP' ? 'bg-amber-400/20 text-amber-300' : u.status === 'محظور' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                            {u.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{u.email}</p>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-cyan-400/10 text-cyan-400 text-center font-black flex items-center justify-center border border-cyan-400/20">
                        {u.avatarLetter || (u.name ? u.name.charAt(0) : 'ع')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-950/40 px-3 py-2 rounded-xl">
                    <span className="font-mono text-cyan-400 font-extrabold">{Number(u.balance).toFixed(2)} ر.س</span>
                    <span className="text-gray-400">الرصيد المشحون بالمحفظة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. TAB: SUPPORT DESK ROOMS */}
        {activeTab === 'chat' && (() => {
          // Drive unique conversation list sorted by latest
          const conversations = (() => {
            const map: { [key: string]: any } = {};
            chatMessages.forEach((msg) => {
              const cid = msg.userId || msg.senderName;
              if (!cid) return;
              const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
              
              if (!map[cid]) {
                map[cid] = {
                  userId: msg.userId || cid,
                  senderName: isAgent ? (msg.userId || cid) : msg.senderName,
                  lastMessage: msg.text || (msg.image ? "صورة 📸" : ""),
                  timestamp: msg.timestamp,
                  unreadCount: 0
                };
              } else {
                map[cid].lastMessage = msg.text || (msg.image ? "صورة 📸" : "");
                map[cid].timestamp = msg.timestamp;
                if (!isAgent) {
                  map[cid].senderName = msg.senderName;
                }
              }

              if (!isAgent && Number(msg.isRead) === 0) {
                map[cid].unreadCount += 1;
              }
            });
            return Object.values(map).reverse();
          })();

          // Automatically activate first conversation if none selected
          const activeUserId = selectedConversationUserId || (conversations[0]?.userId || '');
          if (activeUserId && !selectedConversationUserId) {
            setSelectedConversationUserId(activeUserId);
          }

          const filteredMsgs = chatMessages.filter(
            (m) => m.userId === activeUserId || (!m.userId && (m.senderName === activeUserId || m.userId === activeUserId))
          );

          const handleSelectConversation = async (userId: string) => {
            setSelectedConversationUserId(userId);
            try {
              await fetch('/api/messages/read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, sender: 'user' }) // Developer reads user's chat messages
              });
              loadDynamicData();
            } catch (err) {
              console.error(err);
            }
          };

          const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
              setIsAdminUploading(true);
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  setAdminReplyImage(reader.result);
                }
                setIsAdminUploading(false);
              };
              reader.onerror = () => setIsAdminUploading(false);
              reader.readAsDataURL(file);
            }
          };

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2.5 py-1 rounded-full font-bold">
                  {conversations.length} غرف دردشة نشطة
                </span>
                <h3 className="text-xs font-bold text-gray-300">منظومة الدعم المباشر ومراسلة العملاء المتميزة</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* 1. RIGHT SIDE: ACTIVE CONTACTS LIST */}
                <div className="md:col-span-4 bg-slate-900/60 border border-white/5 rounded-3xl p-3 h-[450px] overflow-y-auto no-scrollbar flex flex-col gap-2">
                  <p className="text-[10px] text-gray-400 font-bold px-2 mb-1 text-right">المحادثات النشطة</p>
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <p className="text-xs font-bold text-gray-400">لا توجد محادثات تواصل حالياً 📭</p>
                    </div>
                  ) : (
                    conversations.map((room) => {
                      const isActive = room.userId === activeUserId;
                      return (
                        <button
                          key={room.userId}
                          onClick={() => handleSelectConversation(room.userId)}
                          className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isActive 
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300/40' 
                              : 'bg-slate-950/40 text-white border-white/5 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[80%]">
                            <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 uppercase ${
                              isActive ? 'bg-slate-950 text-cyan-400' : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {room.senderName?.charAt(0) || 'ع'}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold truncate">{room.senderName}</h4>
                              <p className={`text-[9px] truncate mt-0.5 ${isActive ? 'text-slate-800' : 'text-gray-400'}`}>
                                {room.lastMessage || "عرض التفاصيل"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1.5">
                            <span className={`text-[8px] ${isActive ? 'text-slate-800 font-semibold' : 'text-gray-500'}`}>
                              {room.timestamp}
                            </span>
                            {room.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* 2. LEFT SIDE: CHAT PANEL WORKSPACE */}
                <div className="md:col-span-8 flex flex-col justify-between bg-slate-900/40 border border-white/5 rounded-3xl p-4 h-[450px]">
                  
                  {/* Messages container workspace */}
                  <div className="flex-1 overflow-y-auto pr-1 pl-1 space-y-3 mb-3 no-scrollbar">
                    {!activeUserId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-2">
                        <p className="text-xs font-bold text-gray-300">الرجاء اختيار عميل للبدء بالمراسلة 💬</p>
                        <p className="text-[10px] text-gray-500">سيتم تفعيل صندوق الرد الفوري وموجز الدردشة كاملاً فور الاختيار.</p>
                      </div>
                    ) : (
                      filteredMsgs.map((msg, index) => {
                        const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
                        return (
                          <div 
                            key={msg.id || `admin-msg-${index}`} 
                            className={`flex ${isAgent ? 'justify-start' : 'justify-end'} gap-2`}
                          >
                            <div className={`p-3 max-w-[80%] rounded-2xl text-xs space-y-1.5 border shadow-sm ${
                              isAgent 
                                ? 'bg-slate-950 text-white border-white/5 rounded-tr-none text-right' 
                                : 'bg-cyan-400 text-slate-950 border-cyan-400/20 rounded-tl-none font-medium'
                            }`}>
                              <div className="text-[8px] opacity-70 flex justify-between gap-6 font-bold">
                                <span>{msg.timestamp}</span>
                                <span>{msg.senderName}</span>
                              </div>
                              
                              {msg.image && (
                                <div className="rounded-xl overflow-hidden border border-white/10 max-w-[180px] cursor-pointer group hover:brightness-110 relative">
                                  <img 
                                    src={msg.image} 
                                    alt="Attached" 
                                    className="w-full h-auto max-h-32 object-cover"
                                    onClick={() => setZoomImage(msg.image || null)}
                                  />
                                </div>
                              )}

                              {msg.text && (
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Attachment indicator wrapper if active */}
                  {adminReplyImage && (
                    <div className="mb-2 bg-slate-950 p-2 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2">
                        <img 
                          src={adminReplyImage} 
                          alt="Reply Attachment Preview" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10"
                        />
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-gray-300">مرفق جاهز للمراسلة 🖼️</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAdminReplyImage(null)}
                        className="text-red-400 text-[9px] bg-red-400/15 p-1 rounded-md"
                      >
                        حذف
                      </button>
                    </div>
                  )}

                  {/* Inputs message bar section */}
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={adminFileInputRef}
                      onChange={handleAdminFileChange}
                    />

                    <button
                      type="button"
                      onClick={() => adminFileInputRef.current?.click()}
                      className="bg-slate-900 border border-white/5 hover:bg-slate-800 text-gray-400 hover:text-white p-3 rounded-xl transition-all relative flex items-center justify-center shrink-0"
                      title="إدراج صورة بالرد"
                    >
                      {isAdminUploading ? (
                        <Loader2 size={15} className="animate-spin text-cyan-400" />
                      ) : (
                        <ImageIcon size={15} />
                      )}
                    </button>

                    <button
                      onClick={handleSendAdminReply}
                      className="bg-cyan-400 text-slate-950 p-3 rounded-xl hover:bg-cyan-300 transition-colors shrink-0"
                    >
                      <Send size={15} />
                    </button>
                    
                    <input
                      type="text"
                      placeholder={activeUserId ? "اكتب ردك المساعد المباشر للعميل حالاً..." : "اختر عميل أولاً من القائمة..."}
                      value={chatReplyText}
                      onChange={(e) => setChatReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendAdminReply(); }}
                      disabled={!activeUserId}
                      className="bg-transparent text-xs text-white text-right outline-none w-full px-2 disabled:opacity-40"
                    />
                  </div>

                </div>

              </div>
              {/* ZOOM IMAGE OVERLAY FOR DEV PREVIEW */}
              <AnimatePresence>
                {zoomImage && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 cursor-pointer"
                    onClick={() => setZoomImage(null)}
                  >
                    <button 
                      type="button"
                      className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all"
                      onClick={() => setZoomImage(null)}
                    >
                      <X size={20} />
                    </button>
                    
                    <img 
                      src={zoomImage} 
                      alt="Zoomed attachment" 
                      className="max-w-full max-h-[85vh] rounded-2xl border border-white/10 object-contain shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="mt-4 text-center">
                      <p className="text-[10px] text-gray-400">انقر في أي مكان للخروج</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })()}

        {/* 8. TAB: SEGMENT NOTIFICATION BROADCASTS */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleOpenBannerModal()}
                className="bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
                style={{ display: 'none' }} // Simple anchor
              />
              <h3 className="text-xs font-bold text-gray-300">بث تحديث وإشعارات فورية للعملاء</h3>
            </div>

            <form onSubmit={handleSendBroadcast} className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl space-y-4 text-right">
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold">شريحة العملاء المستهدفة</label>
                <select
                  value={broadAudience}
                  onChange={(e) => setBroadAudience(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2 px-3 text-right text-white outline-none w-full"
                >
                  <option value="all">كل المشتركين والعملاء بالمتجر</option>
                  <option value="VIP">عملاء الـ VIP المميزين فقط</option>
                  <option value="نشط">العملاء النشطين فقط</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold">عنوان البث (الإشعار)</label>
                <input
                  type="text"
                  placeholder="مثال: خصم خاص %25 على اشتراكات نيتفليكس"
                  value={broadTitle}
                  onChange={(e) => setBroadTitle(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-right text-white outline-none w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold">محتوى الإشعار والشرح</label>
                <textarea
                  placeholder="تفاصيل التنبيه المثير للعملاء لزيادة نسبة المبيعات..."
                  value={broadBody}
                  onChange={(e) => setBroadBody(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-right text-white outline-none w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-400 hover:bg-cyan-500 py-3 rounded-xl text-slate-950 text-xs font-black transition-colors"
              >
                {isLoading ? 'جاري البث الفوري...' : 'بث الإشعار الجماعي حالاً 📡'}
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-gray-400 text-right">أرشيف الإعلانات المرسلة سابقاً:</h4>
              {broadcasts.map((b, idx) => (
                <div key={b.id || `broadcast-${idx}`} className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-1 text-[9px]">
                    <span className="text-gray-400">{b.createdAt}</span>
                    <span className="bg-cyan-400/10 text-cyan-400 px-1.5 py-0.5 rounded-sm">شريحة: {b.targetAudience}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white text-right">{b.title}</h5>
                  <p className="text-[10px] text-gray-400 text-right mt-1.5 leading-relaxed">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. TAB: HOMEPAGE SLIDES & BANNER ADS BUILDER */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleOpenBannerModal()}
                className="bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>إضافة سلايد عرض جديد</span>
              </button>
              <h3 className="text-xs font-bold text-gray-300">أشرطة البنرات الإعلانية بالواجهة</h3>
            </div>

            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 text-right space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    
                    {/* Controls */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenBannerModal(b)}
                        className="p-1.5 hover:bg-white/5 text-yellow-400 rounded-lg"
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        onClick={() => deleteBanner(b.id, b.title)}
                        className="p-1.5 hover:bg-white/5 text-red-500 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">{b.title || 'بنر رقمي معلق'}</h4>
                      <p className="text-[9px] text-gray-400 mt-1">الربط بمنتج: {b.linkTo || 'لا يوجد'}</p>
                    </div>
                  </div>

                  {b.imageUrl && (
                    <img src={b.imageUrl} className="w-full h-24 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. TAB: SITE SETTINGS & LOOK */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-300">تخصيص هوية وعلامة المتجر بالكامل</h3>

            <form onSubmit={saveSettings} className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl space-y-4 text-right text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">إسم الموقع الأساسي</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-right text-white outline-none w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">رابط لوجو الموقع (Logo URL)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-left font-mono text-white outline-none w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">اللون الرئيسي الأساسي (Theme Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-none outline-none cursor-pointer p-0.5 bg-slate-950"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-center font-mono text-white outline-none w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">صفحة شروط الخدمة والسياسة الشرطية</label>
                <textarea
                  value={termsPageText}
                  onChange={(e) => setTermsPageText(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-right text-white outline-none w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">صفحة سياسة الخصوصية وسرية البيانات</label>
                <textarea
                  value={privacyPageText}
                  onChange={(e) => setPrivacyPageText(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xs py-2.5 px-3 text-right text-white outline-none w-full"
                />
              </div>

              <div className="border-t border-white/5 pt-3 space-y-3">
                <p className="text-[10px] font-bold text-gray-400">روابط قنوات الاتصال والتواصل الاجتماعي:</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="رابط تيليقرام"
                    value={socialTelegram}
                    onChange={(e) => setSocialTelegram(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl text-xxs py-2 px-3 text-left font-mono text-white outline-none w-full"
                  />
                  <input
                    type="text"
                    placeholder="رابط تويتر"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl text-xxs py-2 px-3 text-left font-mono text-white outline-none w-full"
                  />
                </div>

                <input
                  type="text"
                  placeholder="رابط الاتصال واتساب السريع"
                  value={socialWhatsapp}
                  onChange={(e) => setSocialWhatsapp(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl text-xxs py-2 px-3 text-left font-mono text-white outline-none w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-400 hover:bg-cyan-500 py-3 rounded-xl text-slate-950 text-xs font-black transition-all"
              >
                {isLoading ? 'جاري التحديث والحفظ بالفهرس...' : 'حفظ التحديثات الرائعة بالموقع 💾'}
              </button>
            </form>
          </div>
        )}

        {/* 11. TAB: BACKUP & OPERATIONAL ACTIONS LOG */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl space-y-4 text-right text-xs">
              <h3 className="text-xs font-black text-white">النسخ الاحتياطي للأمان وحفظ الجداول</h3>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="bg-slate-950 text-white border border-white/10 hover:bg-slate-900 py-3 px-2 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5"
                >
                  <Download size={18} className="text-cyan-400" />
                  <span>تصدير نسخة احتياطية</span>
                </button>

                <label className="bg-slate-950 text-white border border-white/10 hover:bg-slate-900 py-3 px-2 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <Upload size={18} className="text-amber-400" />
                  <span>استعادة نسخة سابقة</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Logs trail */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-300 text-right">سجل الأحداث والعمليات الفنية (Logs)</h3>
              
              <div className="bg-slate-950 rounded-3xl p-4 h-64 overflow-y-auto no-scrollbar border border-white/5 flex flex-col gap-2">
                {auditLogs.map((log, idx) => (
                  <div key={log.id || `log-${idx}`} className="text-right text-[10px] bg-slate-900/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-[8px] font-mono">
                      <span>{log.timestamp}</span>
                      <span className="text-cyan-400 font-extrabold">{log.adminName}</span>
                    </div>
                    <div>
                      <span className="bg-white/5 text-gray-300 px-1 py-0.5 rounded-sm font-bold text-[9px] ml-1">{log.actionType}</span>
                      <span className="text-white leading-relaxed">{log.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CORE POPUPS & MODALS DIALOGS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/85 backdrop-blur-md">
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-sm w-full p-5 space-y-4 overflow-y-auto max-h-[85vh] text-right"
          >
            
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/5 rounded-full">
                <X size={15} />
              </button>
              <h3 className="text-xs font-extrabold text-white">
                {activeModal === 'category' ? (editingCategory ? 'تعديل هذا القسم' : 'إضافة قسم للموقع') : ''}
                {activeModal === 'product' ? (editingProduct ? 'تعديل وتلميق المنتج' : 'إضافة منتج رقمي متميز') : ''}
                {activeModal === 'coupon' ? (editingCoupon ? 'تعديل شروط الكوبون' : 'صناعة كوبون ترويجي') : ''}
                {activeModal === 'banner' ? (editingBanner ? 'تعديل البنر' : 'رفع إعلان السلايدر') : ''}
                {activeModal === 'orderCredentials' ? 'تسليم بيانات الدخول الرقمية للزبون' : ''}
                {activeModal === 'userEdit' ? 'تعديل محفظة ورتب صديق المتجر' : ''}
              </h3>
            </div>

            {/* POPUP SUBVIEWS FORMS */}

            {/* CATEGORY FORM */}
            {activeModal === 'category' && (
              <form onSubmit={saveCategory} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400">إسم القسم باللغة العربية</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full mt-1 outline-none text-white focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">ترتيب الظهور الفرزي</label>
                    <input
                      type="number"
                      value={catOrder}
                      onChange={(e) => setCatOrder(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full mt-1 outline-none text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block">التخطيط بالواجهة</label>
                    <select
                      value={catLayout}
                      onChange={(e) => setCatLayout(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full mt-1 text-white outline-none"
                    >
                      <option value="vertical">عمودي (bento layout)</option>
                      <option value="horizontal">أفقي (horizontal rows)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 items-center justify-end py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsHidden}
                      onChange={(e) => setCatIsHidden(e.target.checked)}
                      className="rounded border-white/10Accent text-cyan-400"
                    />
                    <span className="text-gray-400 text-[10px]">إخفاء مؤقت من العرض</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded border-white/10Accent text-cyan-400"
                    />
                    <span className="text-gray-400 text-[10px]">نشط وفوري للجميع</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-400 py-3 rounded-xl text-slate-950 font-black"
                >
                  {isLoading ? 'جاري الفهرسة...' : 'حفظ القسم ببيانات التفعيل 📁'}
                </button>
              </form>
            )}

            {/* PRODUCT FORM */}
            {activeModal === 'product' && (
              <form onSubmit={saveProduct} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400">اسم المنتج والاشتراك الرقمي</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full mt-1 outline-none text-white focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">سعر البيع (ر.س)</label>
                    <input
                      type="text"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full mt-1 outline-none text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 text-right">السعر قبل الخصم (ر.س)</label>
                    <input
                      type="text"
                      value={prodOriginalPrice}
                      onChange={(e) => setProdOriginalPrice(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full mt-1 outline-none text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">القسم المعروض فيه</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-2 text-right w-full mt-1 text-white"
                    >
                      {categories.map((c, idx) => (
                        <option key={c.id || `product-cat-opt-${idx}`} value={c.id}>{c.name}</option>
                      ))}
                      {!categories.some(c => c.id === 'accounts') && <option value="accounts">حسابات مميزة</option>}
                      {!categories.some(c => c.id === 'entertainment') && <option value="entertainment">اشتراكات ترفيه</option>}
                      {!categories.some(c => c.id === 'productivity') && <option value="productivity">برامج إنتاجية</option>}
                      {!categories.some(c => c.id === 'games') && <option value="games">خدمات الألعاب</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">مدة/نوع الاشتراك</label>
                    <input
                      type="text"
                      value={prodPeriod}
                      onChange={(e) => setProdPeriod(e.target.value)}
                      placeholder="مثال: سنة كاملة بملف"
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-2 text-right w-full mt-1 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">الكمية/المخزون المتوفر</label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full mt-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">عمولة المتجر (%)</label>
                    <input
                      type="number"
                      value={prodCommission}
                      onChange={(e) => setProdCommission(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full mt-1 text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">يمكنك رفع ملف أو كتابة رابط</span>
                    <label className="text-[10px] text-gray-400">الصورة الرئيسية للمنتج</label>
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono flex-1 text-white text-xs"
                    />
                    <label className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setProdImageUrl(reader.result);
                                showToast("تم الاستيراد من المعرض بنجاح! 📸");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {prodImageUrl && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-950/20 p-1.5 rounded-xl border border-white/5">
                      <img src={prodImageUrl} className="w-12 h-12 rounded object-cover border border-white/10" alt="" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setProdImageUrl('')}
                        className="text-red-400 text-[10px] bg-red-400/10 px-2 py-1 rounded-md"
                      >
                        حذف الصورة
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">اختياري: صور من معرضك تفصل بينها فاصلة</span>
                    <label className="text-[10px] text-gray-400">صور إضافية للمنتج</label>
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="text"
                      value={prodExtraImages}
                      onChange={(e) => setProdExtraImages(e.target.value)}
                      placeholder="رابط صور مفرقة, رابط ثاني, رابط ثالث"
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono flex-1 text-white text-xs"
                    />
                    <label className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>رفع صور</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          if (files.length > 0) {
                            const newBase64s: string[] = [];
                            let loadedCount = 0;
                            files.forEach((file: File) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  newBase64s.push(reader.result);
                                }
                                loadedCount++;
                                if (loadedCount === files.length) {
                                  const currentList = prodExtraImages.split(',').map(x => x.trim()).filter(Boolean);
                                  const combinedList = [...currentList, ...newBase64s];
                                  setProdExtraImages(combinedList.join(', '));
                                  showToast(`تم رفع وإضافة ${files.length} صور إلى المعرض بنجاح! 📸`);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400">رابط الفيديو التعريفي (العرض التجاري للمنتج)</label>
                  <input
                    type="text"
                    value={prodVideoUrl}
                    onChange={(e) => setProdVideoUrl(e.target.value)}
                    placeholder="مثال: ملخص ميزات على اليوتيوب"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono w-full mt-1 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400">وصف وميزات الاشتراك الرقمي (سطر منفرد لكل ميزة)</label>
                  <textarea
                    value={prodFeatures}
                    onChange={(e) => setProdFeatures(e.target.value)}
                    rows={4}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full mt-1 outline-none text-white focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodIsFeatured}
                      onChange={(e) => setProdIsFeatured(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    <span>تمييز كمنتج مميز ⭐</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodIsBestSeller}
                      onChange={(e) => setProdIsBestSeller(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    <span>من الأكثر طلباً / مبيعاً 🔥</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400">ملصق ترويجي خاص بالمنتج (Tag label)</label>
                  <input
                    type="text"
                    value={prodTagText}
                    onChange={(e) => setProdTagText(e.target.value)}
                    placeholder="مثال: الأكثر مبيعاً، خصم %30"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full mt-1 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-400 py-3 rounded-2xl text-slate-950 font-black text-xs"
                >
                  {isLoading ? 'جاري صناعة الاشتراك...' : 'حفظ ونشر المادّة الرقمية بالمتجر 🚀'}
                </button>
              </form>
            )}

            {/* COUPON FORM */}
            {activeModal === 'coupon' && (
              <form onSubmit={saveCoupon} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400">كود الخصم (Promo Code)</label>
                  <input
                    type="text"
                    value={coupCode}
                    onChange={(e) => setCoupCode(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center font-mono font-black tracking-widest text-white w-full mt-1 outline-none uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">نوع كود الخصم</label>
                    <select
                      value={coupType}
                      onChange={(e) => setCoupType(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 w-full text-white text-right"
                    >
                      <option value="percent">نسبة مئوية (%)</option>
                      <option value="flat">مبلغ مالي ثابت (ر.س)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">كل الفائدة / القيمة</label>
                    <input
                      type="number"
                      value={coupValue}
                      onChange={(e) => setCoupValue(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">سقف الاستخدام (مرة)</label>
                    <input
                      type="number"
                      value={coupMaxUses}
                      onChange={(e) => setCoupMaxUses(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={coupExpiry}
                      onChange={(e) => setCoupExpiry(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">تخصيص الخصم لمن؟</label>
                  <select
                    value={coupAssignedTo}
                    onChange={(e) => setCoupAssignedTo(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 w-full text-white text-right"
                  >
                    <option value="all">الكل (شامل لكل المتجر والاشتراكات)</option>
                    {products.map((p, idx) => (
                      <option key={p.id || `coupon-prod-opt-${idx}`} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer py-1 justify-end">
                  <input
                    type="checkbox"
                    checked={coupIsActive}
                    onChange={(e) => setCoupIsActive(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span className="text-gray-400 text-[10px]">تفعيل الكوبون فوراً للاستخدام</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-400 py-3 rounded-2xl text-slate-950 font-black text-xs"
                >
                  {isLoading ? 'جاري الحفظ والتدقيق...' : 'حفظ كود الخصم الفعال 🔖'}
                </button>
              </form>
            )}

            {/* CAROUSEL BANNERS FORM */}
            {activeModal === 'banner' && (
              <form onSubmit={saveBanner} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400">عنوان البنر الترويجي</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right text-white w-full mt-1"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">يمكنك اختيار صورة من جهازك</span>
                    <label className="text-[10px] text-gray-400">صورة البنر العريض</label>
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="text"
                      value={bannerImg}
                      onChange={(e) => setBannerImg(e.target.value)}
                      placeholder="https://..."
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono text-white flex-1 text-xs"
                      required
                    />
                    <label className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setBannerImg(reader.result);
                                showToast("تم تحميل البنر بنجاح من المعرض الخاص بك! 📸");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {bannerImg && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-950/20 p-1.5 rounded-xl border border-white/5">
                      <img src={bannerImg} className="w-full h-20 rounded object-cover border border-white/10" alt="" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setBannerImg('')}
                        className="text-red-400 text-[10px] bg-red-400/10 px-2 py-1 rounded-md shrink-0"
                      >
                        حذف البنر
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-gray-400">رابط الفيديو المرفق للبنر البراق (إن وجد)</label>
                  <input
                    type="text"
                    value={bannerVid}
                    onChange={(e) => setBannerVid(e.target.value)}
                    placeholder="رابط فيديو MP4 للترويج"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono text-white w-full mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">الربط بمنتج محدد عند النقر</label>
                    <select
                      value={bannerLink}
                      onChange={(e) => setBannerLink(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-right w-full"
                    >
                      <option value="">لا يوجد ارتباط نقر</option>
                      {products.map((p, idx) => (
                        <option key={p.id || `banner-prod-opt-${idx}`} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">رقم ترتيب شريحة سلايد بنر</label>
                    <input
                      type="number"
                      value={bannerOrder}
                      onChange={(e) => setBannerOrder(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center text-white w-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-400 py-3 rounded-2xl text-slate-950 font-black text-xs"
                >
                  {isLoading ? 'جاري الرفع والتركيب...' : 'نشر وتثبيت البنر الإعلاني برأس الصفحة الرئسية 📸'}
                </button>
              </form>
            )}

            {/* ORDER CREDENTIALS/SERIALS DELIVERY FORM */}
            {activeModal === 'orderCredentials' && (
              <form onSubmit={saveOrderCredentials} className="space-y-3.5 text-xs text-right">
                
                <div className="bg-slate-950/70 p-3 rounded-xl mb-2 text-center text-[10px] text-cyan-400 leading-relaxed border border-cyan-400/10">
                  سيتم تسليم البيانات التالية فوراً ومجاناً للعميل في بروفايله الخاص مع إرسال إشعار تلقائي.
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">إيميل أو يوزر الحساب المسلّم (لحسابات الترفيه والبرودكتفيتي)</label>
                  <input
                    type="text"
                    value={orderCredUsername}
                    onChange={(e) => setOrderCredUsername(e.target.value)}
                    placeholder="example@netflix.com, user_rx_12"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono text-white w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">كلمة المرور للحساب المسلّم</label>
                  <input
                    type="text"
                    value={orderCredPassword}
                    onChange={(e) => setOrderCredPassword(e.target.value)}
                    placeholder="Passcode!234"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono text-white w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">كود شحن مخصص أو رمز رقمي مستقل (للألعاب والبطاقات الرقمية والشدات)</label>
                  <input
                    type="text"
                    value={orderCredCode}
                    onChange={(e) => setOrderCredCode(e.target.value)}
                    placeholder="PUBG-CODE-660-HJKT-892"
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center font-mono text-cyan-400 w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">حالة الطلب الحركية</label>
                  <select
                    value={orderStatusField}
                    onChange={(e) => setOrderStatusField(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right w-full text-white"
                  >
                    <option value="تم تسليم الطلب">تم تسليم الطلب الرقمي 🟢</option>
                    <option value="مكتمل">مكتمل ومغلق 🔵</option>
                    <option value="قيد الانتظار">قيد المراجعة والانتظار 🟡</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-400 py-3 rounded-2xl text-slate-950 font-black text-xs"
                >
                  {isLoading ? 'جاري التسجيل...' : 'إرسال بيانات التفعيل وتغيير الحالة فوراً 🔐'}
                </button>
              </form>
            )}

            {/* USER EDIT POPUP VIEW */}
            {activeModal === 'userEdit' && (
              <form onSubmit={saveUserChanges} className="space-y-3.5 text-xs text-right">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400">الاسم واللقب</label>
                  <input
                    type="text"
                    value={userNameState}
                    onChange={(e) => setUserNameState(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right text-white w-full"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400">الإيميل</label>
                  <input
                    type="email"
                    value={userEmailState}
                    onChange={(e) => setUserEmailState(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-left font-mono text-white w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">رتبة العميل</label>
                    <select
                      value={userStatusState}
                      onChange={(e) => setUserStatusState(e.target.value as any)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-right text-white w-full font-bold"
                    >
                      <option value="نشط">نشط (فعال)</option>
                      <option value="VIP">شخصية VIP ⭐</option>
                      <option value="محظور">محظور ومطرود 🚫</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">شحن الرصيد بموجب (ر.س)</label>
                    <input
                      type="number"
                      value={userBalanceState}
                      onChange={(e) => setUserBalanceState(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-center text-white w-full text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-400 py-3 rounded-2xl text-slate-950 font-black text-xs"
                >
                  تعديل وحفظ بيانات العميل 👥
                </button>
              </form>
            )}

          </motion.div>
        </div>
      )}

    </div>
  );
}
