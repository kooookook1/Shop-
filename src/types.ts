export interface Product {
  id: string;
  name: string;
  category: string; // 'accounts' | 'entertainment' | 'productivity' | 'games'
  price: number;
  originalPrice?: number;
  period: string; // 'شهر' | 'سنة' | 'عائلي' | 'فردي' | '660UC' | etc.
  stock: number;
  imageUrl?: string;
  iconName?: string; // Icon identifier
  rating: number;
  reviewsCount: number;
  features: string[];
  gradientClass?: string | null;
  commission_rate?: number; // Store commission % (e.g. 15%)
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  joinDate: string;
  status: 'VIP' | 'نشط' | 'محظور';
  avatarLetter: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  price: number;
  date: string;
  status: 'تم تسليم الطلب' | 'مكتمل' | 'منتهي' | 'قيد الانتظار';
  credentials?: {
    username?: string;
    password?: string;
    code?: string;
  };
  imageUrl?: string;
  commission_rate?: number;
  store_share?: number;
  vendor_share?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  text: string;
  timestamp: string;
  userId?: string;
  image?: string;
  isRead?: number;
}

export interface Transaction {
  id: string;
  productName: string;
  customerName: string;
  price: number;
  status: 'مكتمل' | 'قيد الانتظار' | 'ملغى';
  date: string;
  iconBg: string; // Class for bg
  imageUrl?: string;
  store_share?: number;
  vendor_share?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedPlan: 'monthly' | 'yearly';
}
