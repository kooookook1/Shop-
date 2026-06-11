import React, { useState } from 'react';
import { Home, MessageCircle, ShoppingBag, User, Settings, ShieldAlert, HelpCircle } from 'lucide-react';
import { Product, CartItem, Order, User as UserType, Transaction, Message } from './types';
import { initialProducts, initialUsers, initialOrders, initialTransactions, initialMessages } from './data';
import Notification from './components/Notification';
import LoginScreen from './components/LoginScreen';
import Storefront from './components/Storefront';
import ProductDetails from './components/ProductDetails';
import Checkout from './components/Checkout';
import Profile from './components/Profile';
import RechargePage from './components/RechargePage';
import SupportChat from './components/SupportChat';
import AdminDashboard from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // App Core States loaded from local storage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rixon_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    try {
      return localStorage.getItem('rixon_current_user_name') || 'أحمد محمد';
    } catch {
      return 'أحمد محمد';
    }
  });
  const [currentUserObj, setCurrentUserObj] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem('rixon_current_user_obj');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [userBalance, setUserBalance] = useState<number>(() => {
    try {
      const isLogged = localStorage.getItem('rixon_is_logged_in') === 'true';
      if (!isLogged) return 0.00;
      const stored = localStorage.getItem('rixon_user_balance');
      const val = stored ? parseFloat(stored) : 0.00;
      return isNaN(val) ? 0.00 : val;
    } catch {
      return 0.00;
    }
  });

  // Tab View Controller State
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'cart' | 'profile' | 'admin'>(() => {
    try {
      const stored = localStorage.getItem('rixon_active_tab');
      return (stored as any) || 'home';
    } catch {
      return 'home';
    }
  });
  const [profileSubSection, setProfileSubSection] = useState<'none' | 'favorites' | 'settings' | 'about' | 'recharge'>('none');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Synced Inventories / Users State
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // Use refs to prevent stale state closures in background poll effects
  const currentUserObjRef = React.useRef(currentUserObj);
  const currentUserRef = React.useRef(currentUser);

  React.useEffect(() => {
    currentUserObjRef.current = currentUserObj;
    currentUserRef.current = currentUser;
  }, [currentUserObj, currentUser]);

  // Cart operations State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('rixon_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem('rixon_favorites', JSON.stringify(updated));
      showToast(
        exists ? 'تمت إزالة المنتج من المفضلة 💔' : 'تمت إضافة المنتج للمفضلة بنجاح ❤️',
        'success'
      );
      return updated;
    });
  };

  // Feedback Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // 1. Core Synchronization Sync
  const syncAllData = async (userObj?: UserType) => {
    try {
      // Products
      const prodRes = await fetch("/api/products");
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Orders
      const orderRes = await fetch("/api/orders");
      const orderData = await orderRes.json();
      setOrders(orderData);

      // Users
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Transactions
      const txRes = await fetch("/api/transactions");
      const txData = await txRes.json();
      setTransactions(txData);

      // Messages (scoped to logged-in user)
      const currentUId = userObj?.id || currentUserObjRef.current?.id || currentUserRef.current;
      const msgRes = await fetch(`/api/messages?userId=${encodeURIComponent(currentUId)}`);
      const msgData = await msgRes.json();
      if (Array.isArray(msgData)) {
        setChatMessages(msgData);
      } else {
        console.error("Messages not array:", msgData);
        setChatMessages([]);
      }

      // Update current user balance if they are logged in
      const currentId = userObj?.id || currentUserObjRef.current?.id;
      if (currentId) {
        const foundUser = usersData.find((u: any) => u.id === currentId);
        if (foundUser) {
          setCurrentUserObj(foundUser);
          const parsedBalance = typeof foundUser.balance === 'number' ? foundUser.balance : parseFloat(foundUser.balance);
          setUserBalance(isNaN(parsedBalance) ? 0.00 : parsedBalance);
        } else {
          // If logged in user is no longer found in data, default to 0
          setUserBalance(0.00);
        }
      } else {
        setUserBalance(0.00);
      }
    } catch (err) {
      console.error("Error fetching synced data:", err);
    }
  };

  // Sync data automatically on mount or login
  React.useEffect(() => {
    if (isLoggedIn) {
      syncAllData();
      const interval = setInterval(() => syncAllData(), 5000); // poll every 5s for real-time transactions & chats
      return () => clearInterval(interval);
    } else {
      setUserBalance(0.0);
    }
  }, [isLoggedIn]);

  // Persist authentication and app views to localStorage on change
  React.useEffect(() => {
    try {
      localStorage.setItem('rixon_is_logged_in', isLoggedIn ? 'true' : 'false');
      localStorage.setItem('rixon_current_user_name', currentUser || '');
      localStorage.setItem('rixon_current_user_obj', currentUserObj ? JSON.stringify(currentUserObj) : '');
      localStorage.setItem('rixon_user_balance', String(userBalance));
      localStorage.setItem('rixon_active_tab', activeTab);
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [isLoggedIn, currentUser, currentUserObj, userBalance, activeTab]);

  // Login handler
  const handleLogin = async (userName: string, email: string, password?: string) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: userName, password })
      });
      const userObj = await res.json();
      if (userObj.error) {
        showToast(userObj.error, 'info');
        return;
      }
      setCurrentUser(userObj.name);
      setCurrentUserObj(userObj);
      const parsedBalance = typeof userObj.balance === 'number' ? userObj.balance : parseFloat(userObj.balance);
      setUserBalance(isNaN(parsedBalance) ? 0.00 : parsedBalance);
      setIsLoggedIn(true);
      showToast(`مرحباً بك يا ${userObj.name} في عالم ريكسون الرقمي!`, 'success');
      syncAllData(userObj);
    } catch (err) {
      showToast("حدث خطأ أثناء تسجيل الدخول", "info");
    }
  };

  // Adding item to cart
  const handleAddToCart = (product: Product, plan: 'monthly' | 'yearly' = 'yearly', playerId?: string) => {
    if (product.stock <= 0) {
      showToast('عذراً، نفذت الكمية المتوفرة من هذا المنتج الرقمي!', 'info');
      return;
    }

    if ((product.productType === 'manual_id' || product.requirePlayerId) && !playerId?.trim()) {
      showToast('عذراً، يجب إدخال كود اللاعب (ID) لإتمام عملية الشراء بنجاح', 'info');
      return;
    }

    // Check if matching item is in cart
    const existingIndex = cartItems.findIndex(i => i.product.id === product.id && i.selectedPlan === plan && i.playerId === playerId);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        id: `cart-${Date.now()}`,
        product,
        quantity: 1,
        selectedPlan: plan,
        playerId
      }]);
    }
    
    showToast(`تمت إضافة ${product.name} بنجاح إلى سلة المشتريات.`, 'success');
  };

  const handleBuyNow = (product: Product, plan: 'monthly' | 'yearly' = 'yearly', playerId?: string) => {
    if ((product.productType === 'manual_id' || product.requirePlayerId) && !playerId?.trim()) {
      showToast('عذراً، يجب إدخال كود اللاعب (ID) لإتمام عملية الشراء بنجاح', 'info');
      return;
    }
    handleAddToCart(product, plan, playerId);
    if (product.stock > 0 && (!(product.productType === 'manual_id' || product.requirePlayerId) || playerId?.trim())) {
      setSelectedProduct(null);
      setActiveTab('cart');
    }
  };

  // Removing from cart
  const handleRemoveFromCart = (cartId: string) => {
    setCartItems(cartItems.filter(i => i.id !== cartId));
    showToast('تمت إزالة المنتج السلعي من السلة.', 'info');
  };

  // Real checkout database transaction
  const handleCompleteCheckout = async (discountAmount: number, paymentMethod: string) => {
    if (cartItems.length === 0 || !currentUserObj) return;

    // Check if user has sufficient balance
    const totalSpent = cartItems.reduce((acc, item) => {
      const p = item.selectedPlan === 'yearly' ? item.product.price : parseFloat((item.product.price / 12).toFixed(2));
      return acc + (p * item.quantity);
    }, 0) - discountAmount;
    const finalBillWithTax = totalSpent + (totalSpent * 0.15);

    if (userBalance < finalBillWithTax) {
      showToast('عذراً، رصيدك الحالي غير كافٍ لإتمام عملية الشراء! يرجى شحن الرصيد.', 'info');
      setActiveTab('profile');
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          userId: currentUserObj.id,
          discountAmount
        })
      });

      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'info');
        return;
      }

      showToast('شكراً لك! تم تأكيد الشراء وتوفير بيانات حسابك فورياً في صفحة طلباتي.', 'success');
      setCartItems([]);
      await syncAllData();
      setActiveTab('profile');
    } catch (err) {
      showToast('حدث خطأ أثناء إتمام عملية الشراء', 'info');
    }
  };

  // Chat message send loop via db
  const handleSendMessage = async (text: string, image?: string) => {
    try {
      const uId = currentUserObj?.id || currentUser;
      const userMsg = {
        sender: 'user',
        senderName: currentUser,
        text,
        userId: uId,
        image: image || ''
      };

      // Add temporarily for clean fluid animation feeling
      const tempId = `temp-${Date.now()}`;
      setChatMessages(prev => [...prev, {
        id: tempId,
        sender: 'user',
        senderName: currentUser,
        text,
        userId: uId,
        image: image || '',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }]);

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMsg)
      });
      
      // Load real messages which includes response from database
      await syncAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Recieving orders confirmation in db
  const handleConfirmReceipt = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/confirm`, {
        method: "PUT"
      });
      showToast('تم تأكيد استلام الحساب بنجاح، شكراً لثقتكم!', 'success');
      await syncAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Copying helper with window navigator
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ ${label} بنجاح للذاكرة الحافظة 📋`, 'success');
  };

  const handleUpdateProfile = async (newUserId: string, newName: string, newEmail?: string, newPassword?: string) => {
    try {
       const res = await fetch(`/api/users/${newUserId}/update`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: newName, email: newEmail, password: newPassword })
       });
       const data = await res.json();
       if (!data.error) {
         setCurrentUser(newName);
         showToast('تم تحديث بيانات حسابك بنجاح!', 'success');
         await syncAllData();
       } else {
         showToast(data.error || 'فشل تحديث بيانات الحساب', 'info');
       }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'info');
    }
  };

  const handleAddBalance = async (newUserId: string, amount: number) => {
    try {
      const res = await fetch(`/api/users/${newUserId}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.error) {
        showToast(`تم شحن رصيد محفظتك بمبلغ ${amount} ر.س بنجاح! 🚀`, 'success');
        await syncAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin inventory updates to database
  const handleAddProductAdmin = async (newP: Product) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newP)
      });
      await syncAllData();
      showToast(`تمت إضافة منتج ${newP.name} بنجاح إلى قائمة البيع.`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductAdmin = async (updatedP: Product) => {
    try {
      await fetch(`/api/products/${updatedP.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedP)
      });
      await syncAllData();
      showToast(`تم تعديل بيانات ${updatedP.name} المجدولة بنجاح.`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProductAdmin = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      await syncAllData();
      showToast('تم إقصاء المنتج الرقمي من المخزون بنجاح.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Authentication gating
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050614] text-white selection:bg-cyan-400 selection:text-slate-950 select-none">
      
      {/* Toast Alert overlay notifications */}
      <AnimatePresence>
        {toastMessage && (
          <Notification 
            message={toastMessage} 
            type={toastType === 'success' ? 'success' : 'error'} 
            onClose={() => setToastMessage(null)} 
          />
        )}
      </AnimatePresence>

      {/* Main app panel flow container */}
      <div className="flex-1 w-full max-w-md mx-auto relative bg-[#050614] flex flex-col justify-between">
        
        {/* VIEW CONDITIONAL RENDER AREA WITH ANIMATIONS */}
        <div className="flex-grow overflow-y-auto no-scrollbar pb- safe">
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              <motion.div
                key="product-details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.25 }}
              >
                <ProductDetails 
                  product={selectedProduct} 
                  onBack={() => setSelectedProduct(null)}
                  onAddToCart={(p, plan, playerId) => handleAddToCart(p, plan, playerId)}
                  onBuyNow={(p, plan, playerId) => handleBuyNow(p, plan, playerId)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'home' && (
                  <Storefront 
                    products={products} 
                    onSelectProduct={setSelectedProduct}
                    onAddToCart={(p) => handleAddToCart(p, 'yearly')}
                    cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                    userBalance={userBalance}
                    onRechargeClick={() => {
                      setProfileSubSection('recharge');
                      setActiveTab('profile');
                    }}
                  />
                )}

                {activeTab === 'support' && (
                  <SupportChat 
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    onBackToStore={() => setActiveTab('home')}
                    userId={currentUserObj?.id || currentUser}
                  />
                )}

                {activeTab === 'cart' && (
                  <Checkout 
                    cartItems={cartItems}
                    onRemoveItem={handleRemoveFromCart}
                    onClearCart={() => setCartItems([])}
                    onCompletePurchase={handleCompleteCheckout}
                    onBackToStore={() => setActiveTab('home')}
                    userBalance={userBalance}
                  />
                )}

                {activeTab === 'profile' && (
                  <Profile 
                    userName={currentUser}
                    userBalance={userBalance}
                    orders={orders}
                    onOpenChat={() => setActiveTab('support')}
                    onCopyText={handleCopyText}
                    onConfirmReceipt={handleConfirmReceipt}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                    allProducts={products}
                    userId={currentUserObj?.id || users.find(u => u.name === currentUser || u.email === currentUserObj?.email)?.id || currentUser || 'guest_user'}
                    userEmail={currentUserObj?.email || 'kooookook1@gmail.com'}
                    userPassword={currentUserObj?.password || ''}
                    onUpdateProfile={handleUpdateProfile}
                    onAddBalance={handleAddBalance}
                    onSelectProduct={(p) => { setSelectedProduct(p); }}
                    activeSubSection={profileSubSection}
                    setActiveSubSection={setProfileSubSection}
                  />
                )}

                {activeTab === 'admin' && (
                  <AdminDashboard 
                    products={products}
                    users={users}
                    transactions={transactions}
                    orders={orders}
                    onAddProduct={handleAddProductAdmin}
                    onEditProduct={handleEditProductAdmin}
                    onDeleteProduct={handleDeleteProductAdmin}
                    onBackToStore={() => setActiveTab('home')}
                    onRefreshUsers={syncAllData}
                    onRefreshOrders={syncAllData}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM GLOBAL MOBILE TAB NAVIGATION BAR */}
        {!selectedProduct && activeTab !== 'support' && (
          <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-40 max-w-md mx-auto rounded-t-3xl">
            
            {/* Tab: Profile */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'profile' ? 'text-amber-400 font-extrabold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <User size={22} className={activeTab === 'profile' ? 'text-amber-400 scale-110' : ''} />
              <span className="text-[10px] font-sans">حسابي</span>
            </button>

            {/* Tab: Cart */}
            <button 
              onClick={() => setActiveTab('cart')}
              className={`flex flex-col items-center gap-1 relative transition-all ${
                activeTab === 'cart' ? 'text-cyan-400 font-extrabold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShoppingBag size={22} className={activeTab === 'cart' ? 'text-cyan-400 scale-110' : ''} />
              <span className="text-[10px]">السلة</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-cyan-400 text-slate-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>

             {/* Tab: Support Chat */}
             <button 
               onClick={() => setActiveTab('support')}
               className={`flex flex-col items-center gap-1 relative transition-all ${
                 activeTab === 'support' ? 'text-cyan-400 font-extrabold' : 'text-gray-400 hover:text-white'
               }`}
             >
               <div className="relative">
                 <MessageCircle size={22} className={activeTab === 'support' ? 'text-cyan-400 scale-110' : ''} />
                 {chatMessages.some(msg => msg.sender === 'agent' && Number(msg.isRead) === 0) && (
                   <span className="absolute -top-1 -right-1 flex h-2 w-2 z-10">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                   </span>
                 )}
               </div>
               <span className="text-[10px]">الدعم</span>
             </button>

            {/* Tab: Admin Dashboard */}
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'admin' ? 'text-cyan-400 font-extrabold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings size={22} className={activeTab === 'admin' ? 'text-cyan-400 scale-110' : ''} />
              <span className="text-[10px]">لوحةالتحكم</span>
            </button>

            {/* Tab: Home Storefront */}
            <button 
              onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'home' ? 'text-cyan-400 font-extrabold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home size={22} className={activeTab === 'home' ? 'text-cyan-400 scale-110' : ''} />
              <span className="text-[10px]">الرئيسية</span>
            </button>

          </nav>
        )}

        {/* STANDALONE SECURE RECHARGE PAGE OVERLAY (COMPLETELY MINDFULLY ISOLATED) */}
        <AnimatePresence>
          {profileSubSection === 'recharge' && (
            <RechargePage
              userId={currentUserObj?.id || users.find(u => u.name === currentUser || u.email === currentUserObj?.email)?.id || currentUser || 'guest_user'}
              userName={currentUser}
              userEmail={currentUserObj?.email || 'kooookook1@gmail.com'}
              userBalance={userBalance}
              onAddBalance={handleAddBalance}
              onClose={() => setProfileSubSection('none')}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
