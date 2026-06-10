import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Turso Libsql Db Client
const dbUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const dbToken = process.env.TURSO_AUTH_TOKEN;

console.log("Connecting database at URL:", dbUrl);
const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Seed data and tables helper
async function initDatabase() {
  try {
    // 1. Create Tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        originalPrice REAL,
        period TEXT NOT NULL,
        stock INTEGER NOT NULL,
        imageUrl TEXT,
        iconName TEXT,
        rating REAL,
        reviewsCount INTEGER,
        features TEXT,
        gradientClass TEXT,
        commission_rate REAL DEFAULT 15
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        balance REAL NOT NULL DEFAULT 450.0,
        joinDate TEXT NOT NULL,
        status TEXT NOT NULL,
        avatarLetter TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        productId TEXT,
        productName TEXT,
        price REAL,
        date TEXT,
        status TEXT,
        credentials TEXT,
        imageUrl TEXT,
        commission_rate REAL DEFAULT 15,
        store_share REAL,
        vendor_share REAL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        productName TEXT,
        customerName TEXT,
        price REAL,
        status TEXT,
        date TEXT,
        iconBg TEXT,
        imageUrl TEXT,
        store_share REAL,
        vendor_share REAL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        senderName TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Create custom Admin Panel Control tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        orderIndex INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1,
        isHidden INTEGER NOT NULL DEFAULT 0,
        viewLayout TEXT DEFAULT 'vertical',
        imageOrIcon TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL DEFAULT 'percent',
        value REAL NOT NULL,
        expiryDate TEXT,
        maxUses INTEGER DEFAULT 999,
        usedCount INTEGER DEFAULT 0,
        assignedTo TEXT DEFAULT 'all',
        isActive INTEGER NOT NULL DEFAULT 1
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id TEXT PRIMARY KEY,
        title TEXT,
        imageUrl TEXT,
        videoUrl TEXT,
        linkTo TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        orderIndex INTEGER NOT NULL DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        siteName TEXT DEFAULT 'متجر ريكسون الرقمي R3XON',
        logoUrl TEXT,
        faviconUrl TEXT,
        primaryColor TEXT DEFAULT '#22d3ee',
        termsPage TEXT,
        privacyPage TEXT,
        socialTwitter TEXT,
        socialTelegram TEXT,
        socialWhatsapp TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        adminName TEXT NOT NULL,
        actionType TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        targetAudience TEXT DEFAULT 'all',
        createdAt TEXT NOT NULL
      )
    `);

    // Safe Schema Alterations to product table to support rich promotional features
    try {
      await db.execute("ALTER TABLE products ADD COLUMN extraImages TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE products ADD COLUMN videoUrl TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE products ADD COLUMN isFeatured INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE products ADD COLUMN isBestSeller INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE products ADD COLUMN tagText TEXT");
    } catch (e) {}

    // Safe Schema Alterations to messages table
    try {
      await db.execute("ALTER TABLE messages ADD COLUMN userId TEXT");
    } catch (e) {
      console.log('Error adding userId column:', e);
    }
    try {
      await db.execute("ALTER TABLE messages ADD COLUMN image TEXT");
    } catch (e) {
      console.log('Error adding image column:', e);
    }
    try {
      await db.execute("ALTER TABLE messages ADD COLUMN isRead INTEGER DEFAULT 0");
    } catch (e) {
      console.log('Error adding isRead column:', e);
    }

    // Seed default Categories
    const catCheck = await db.execute("SELECT COUNT(*) as count FROM categories");
    if (Number(catCheck.rows[0].count) === 0) {
      console.log("Seeding default categories...");
      const initialCats = [
        { id: 'accounts', name: 'حسابات مميزة', orderIndex: 1, isActive: 1, isHidden: 0, viewLayout: 'vertical', imageOrIcon: 'Shield' },
        { id: 'entertainment', name: 'اشتراكات ترفيه', orderIndex: 2, isActive: 1, isHidden: 0, viewLayout: 'vertical', imageOrIcon: 'Tv' },
        { id: 'productivity', name: 'برامج إنتاجية', orderIndex: 3, isActive: 1, isHidden: 0, viewLayout: 'vertical', imageOrIcon: 'Palette' },
        { id: 'games', name: 'خدمات الألعاب', orderIndex: 4, isActive: 1, isHidden: 0, viewLayout: 'vertical', imageOrIcon: 'Gamepad2' }
      ];
      for (const c of initialCats) {
        await db.execute({
          sql: "INSERT INTO categories (id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [c.id, c.name, c.orderIndex, c.isActive, c.isHidden, c.viewLayout, c.imageOrIcon]
        });
      }
    }

    // Seed default Site Settings
    const setCheck = await db.execute("SELECT COUNT(*) as count FROM site_settings");
    if (Number(setCheck.rows[0].count) === 0) {
      console.log("Seeding default site settings...");
      await db.execute({
        sql: `INSERT INTO site_settings (id, siteName, logoUrl, faviconUrl, primaryColor, termsPage, privacyPage, socialTwitter, socialTelegram, socialWhatsapp) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'main',
          'متجر ريكسون الرقمي R3XON',
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT',
          '',
          '#22d3ee',
          'شروط الخدمة لمتجر ريكسون الرقمي الفاخر:\n1. جميع الحسابات المعروضة رقمية بالكامل ويتم تسليم بيانات تسجيل الدخول وتفعيلها فوراً في حسابك.\n2. يُمنع منعاً باتاً تعديل الرقم السري أو البريد الإلكتروني للحسابات المشتركة لضمان استمرار مفعول الضمان.\n3. متجر ريكسون ملتزم بالضمان الذهبي الكامل للاشتراكات طوال المدة المحددة والمشتراة.',
          'سياسة الخصوصية الخاصة بمتجر ريكسون الرقمي R3XON:\nنحن نلتزم بتبني أعلى معايير الخصوصية لحماية معلومات ومشتريات عملائنا الكرام. جميع العمليات مشفرة ومؤمنة بالكامل بالاعتماد على بروتوكولات آمنة لحمايتها من أي استقطاب خارجي.',
          'https://twitter.com',
          'https://t.me',
          'https://wa.me'
        ]
      });
    }

    // Seed default Banners/Promos
    const banCheck = await db.execute("SELECT COUNT(*) as count FROM banners");
    if (Number(banCheck.rows[0].count) === 0) {
      console.log("Seeding default banners...");
      const initialBanners = [
        { id: 'slide-1', title: 'باقة ChatGPT Plus السنوية', imageUrl: 'https://images.unsplash.com/photo-1675557009875-436f09780264?q=80&w=600', videoUrl: '', linkTo: 'prod-chatgpt', isActive: 1, orderIndex: 1 },
        { id: 'slide-2', title: 'باقة Netflix 4K الشهرية', imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?q=80&w=600', videoUrl: '', linkTo: 'prod-netflix', isActive: 1, orderIndex: 2 }
      ];
      for (const b of initialBanners) {
        await db.execute({
          sql: "INSERT INTO banners (id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [b.id, b.title, b.imageUrl, b.videoUrl, b.linkTo, b.isActive, b.orderIndex]
        });
      }
    }

    // Seed default Coupon code
    const coupCheck = await db.execute("SELECT COUNT(*) as count FROM coupons");
    if (Number(coupCheck.rows[0].count) === 0) {
      console.log("Seeding default coupon...");
      await db.execute({
        sql: "INSERT INTO coupons (id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: ['coup-demo', 'REX20', 'percent', 20.0, '2027-12-31', 200, 0, 'all', 1]
      });
    }

    // Seed default Audit Log
    const logsCheck = await db.execute("SELECT COUNT(*) as count FROM logs");
    if (Number(logsCheck.rows[0].count) === 0) {
      await db.execute({
        sql: "INSERT INTO logs (id, adminName, actionType, details, timestamp) VALUES (?, ?, ?, ?, ?)",
        args: [`log-${Date.now()}`, 'النظام الأساسي', 'تهيئة لوحة التحكم', 'تم تأسيس لوحة الإدارة الذكية وتمرير السجلات والمخازن التفاعلية لمتجر ريكسون الرقمي.', new Date().toLocaleString('ar-SA')]
      });
    }

    console.log("Database tables verified successfully.");

    // 2. Check and Seed Products
    const prodCheck = await db.execute("SELECT COUNT(*) as count FROM products");
    const prodCount = Number(prodCheck.rows[0].count);
    if (prodCount === 0) {
      console.log("Seeding products table...");
      const initialProducts = [
        {
          id: 'prod-chatgpt',
          name: 'ChatGPT Plus',
          category: 'accounts',
          price: 89.99,
          originalPrice: 120.00,
          period: 'سنة كاملة',
          stock: 15,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT',
          iconName: 'brain',
          rating: 4.9,
          reviewsCount: 341,
          features: JSON.stringify([
            'الوصول السريع والخاص خلال أوقات الذروة',
            'إتاحة موديلات GPT-4 و GPT-4o المتقدمة',
            'تحليل البيانات المتقدم البرمجي وتصفح الإنترنت',
            'صناعة الصور الاحترافية عبر DALL-E 3',
            'دعم فني أولوي وأسرع استجابة'
          ]),
          gradientClass: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 50%, #4c1d95 100%)',
          commission_rate: 15
        },
        {
          id: 'prod-netflix',
          name: 'Netflix 4K',
          category: 'entertainment',
          price: 35.00,
          originalPrice: 45.00,
          period: 'اشتراك شهري بملف خاص',
          stock: 22,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRrWN0OaAv3gwd72tYj-1BOoOJ3uXRPZcH1sAbCILFWFZfypJEcJN7enzKsz9b1C6BYynIVhtunsooZzGVivAE7GaAjYqF8uaBfTVSt2F_qYsFlE9Ap4kikFyPi0HdEvkuCfHIYY_dQXkc5XfxEB7-h8r7D6FWsMyUvTAyqovUoVdj-2SG5P4c-1GKeZ4F5sb_BaPnJ7Ix0yZAnMz1NPpazvt6UCOI7jAYS6Zy-tQczBSocWsnAVRVz71FhdzWacfjJ9YocmnMYA5U',
          iconName: 'tv',
          rating: 4.8,
          reviewsCount: 290,
          features: JSON.stringify([
            'باقة ULTRA HD و 4K المتميزة لجميع الأفلام والمسلسلات',
            'ملف خاص بك محمي برمز مرور من اختيارك',
            'تشغيل غير محدود على مختلف شاشات اللاب توب والتلفاز والجوال',
            'التحميل متاح للمشاهدة بدون إنترنت على أي جهاز',
            'ضمان ذهبي ممتد طوال فترة الاشتراك'
          ]),
          gradientClass: 'linear-gradient(135deg, #111827 0%, #7f1d1d 100%)',
          commission_rate: 10
        },
        {
          id: 'prod-spotify',
          name: 'Spotify Premium',
          category: 'entertainment',
          price: 29.99,
          originalPrice: 35.00,
          period: 'اشتراك فردي',
          stock: 50,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1UmJnDi-EtgVqGmTg_y4osYbNH-0ADlfVLJRvoOFVpK-v1C1guqc17f_wvWSsvE5DWRT02yACAkgCj79mcHk3OpdMNn8u_fyB3RImJE70EXb7rzPxFoI9Dz2tJ69ByNfbXaOPbDhroKUNLQMXhfmuI_MptTWAp_ymZ7wnjxltjATaEWPUZXmrR0rqAmn7P98J-XkXnjdaBgld26jvTF-JNXJFPUwGiEfGENe1aOlvGeItKb9CG_lOEvqDBHkp3PCvjFIpnrhfesKT',
          iconName: 'music',
          rating: 4.7,
          reviewsCount: 198,
          features: JSON.stringify([
            'استماع بدون إعلانات نهائياً',
            'تحميل وتنزيل الأغاني والبودكاست للمشاهدة دون اتصال',
            'جودة صوت فائقة النقاء وعالية الدقة (حتى 320kbps)',
            'تشغيل غير المحدود وتخطي مرن للأغاني',
            'فولدر خاص بك متوافق مع حسابك الأصلي'
          ]),
          gradientClass: null,
          commission_rate: 12
        },
        {
          id: 'prod-snapchat',
          name: 'Snapchat Plus',
          category: 'productivity',
          price: 49.99,
          originalPrice: 65.00,
          period: 'اشتراك شهري مميز',
          stock: 30,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQMS-MCsnBq2NZUQcwC7gUDv88fD7U68h2HKCXHXMOZFVX45TZL6Kw1EbMw67RCyZv2bXlGK8uD5A7OqefZ4O7e0-cvupQFg-cZQZUU3RjVa1LnDfBmwbatssWdWV0RNfx8RYEjd7mgUie25R9sdbKGAc3RXka9hG2FSQfkRg1F3gWsUs3WerEd9U-6InQUPocm3PbKxjPfvcAUHVnO-5CYRqZqe7XLGHg_hxcp_irCM6WIpsqCmfyrVfzDmDAPh8LEV3bdLLLwCPX',
          iconName: 'layout',
          rating: 4.8,
          reviewsCount: 320,
          features: JSON.stringify([
            'تغيير نغمة رنين الإشعارات وصوت التنبيه الحصري مخصصاً لـ VIP',
            'دبوس محادثة صديقك المفضل وتثبيته في صدارة المحادثات دائماً #1',
            'أيقونة وخلفية بروفايل مذهلة وحصرية لأعضاء Snapchat+ وبادج مميز',
            'معرفة من أعاد مشاهدة ستوري السناب الخاص بك بدقة تامة',
            'استخدام أداة الذكاء الاصطناعي My AI المتطورة في أي وقت'
          ]),
          gradientClass: null,
          commission_rate: 15
        },
        {
          id: 'prod-pubg',
          name: 'شحن شدات ببجي 660UC',
          category: 'games',
          price: 45.00,
          originalPrice: 55.00,
          period: '660 شدة فورية',
          stock: 150,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
          iconName: 'gamepad-2',
          rating: 4.9,
          reviewsCount: 810,
          features: JSON.stringify([
            'شحن رسمي وفوري مباشر عبر الايدي (ID)',
            'توفير الكود وتفعيله فورياً عبر موقع Midasbuy الرسمي لـ PUBG MOBILE',
            'متاح لإجمالي المبيعات والبطولات وتفعيل الرويال باس فوراً',
            'دعم وضمان شحن رسمي موثوق مائة بالمائة'
          ]),
          gradientClass: null,
          commission_rate: 8
        }
      ];

      for (const p of initialProducts) {
        await db.execute({
          sql: `INSERT INTO products (id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.id, p.name, p.category, p.price, p.originalPrice, p.period, p.stock, p.imageUrl, p.iconName, p.rating, p.reviewsCount, p.features, p.gradientClass, p.commission_rate]
        });
      }
    }

    // 3. Seed Users
    const userCheck = await db.execute("SELECT COUNT(*) as count FROM users");
    const userCount = Number(userCheck.rows[0].count);
    if (userCount === 0) {
      console.log("Seeding users table...");
      const initialUsers = [
        {
          id: 'user-ahmed',
          name: 'أحمد علي',
          email: 'kooookook1@gmail.com', // Override with user email context or default
          balance: 650.00,
          joinDate: '2024-05-15',
          status: 'VIP',
          avatarLetter: 'أ'
        },
        {
          id: 'user-fatima',
          name: 'فاطمة حسن',
          email: 'fatty_hasan@gmail.com',
          balance: 340.00,
          joinDate: '2024-04-12',
          status: 'نشط',
          avatarLetter: 'ف'
        }
      ];
      for (const u of initialUsers) {
        await db.execute({
          sql: `INSERT INTO users (id, name, email, balance, joinDate, status, avatarLetter)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.name, u.email, u.balance, u.joinDate, u.status, u.avatarLetter]
        });
      }
    }

    // 4. Seed Messages
    const msgsCheck = await db.execute("SELECT COUNT(*) as count FROM messages");
    const msgsCount = Number(msgsCheck.rows[0].count);
    if (msgsCount === 0) {
      console.log("Seeding support messages...");
      const initialMessages = [
        {
          id: 'msg-1',
          sender: 'agent',
          senderName: 'خالد العمري',
          text: 'مرحباً بك في خدمة عملاء متجر ريكسون الفاخر. كيف يمكنني خدمتك ومساعدتك في طلبك اليوم؟',
          timestamp: '9:30 AM'
        },
        {
          id: 'msg-2',
          sender: 'user',
          senderName: 'العميل',
          text: 'أهلاً بك خالد، لدي استفسار حول كيفية استلام حسابي المشترك وتفعيله؟',
          timestamp: '9:31 AM'
        },
        {
          id: 'msg-3',
          sender: 'agent',
          senderName: 'خالد العمري',
          text: 'يسعدني إجابتك. بمجرد تأكيد الدفع والطلب، سيظهر الحساب تلقائياً في صفحة "طلباتي" بالاسم والرقم السري معاً لتسجيل الدخول الفوري دون انتظار!',
          timestamp: '9:32 AM'
        }
      ];
      for (const m of initialMessages) {
        await db.execute({
          sql: `INSERT INTO messages (id, sender, senderName, text, timestamp) VALUES (?, ?, ?, ?, ?)`,
          args: [m.id, m.sender, m.senderName, m.text, m.timestamp]
        });
      }
    }

    // 5. Seed Transactions (to give a rich initial analytics look)
    const txCheck = await db.execute("SELECT COUNT(*) as count FROM transactions");
    const txCount = Number(txCheck.rows[0].count);
    if (txCount === 0) {
      console.log("Seeding transactions...");
      const dummyTx = [
        {
          id: 'TXN-1011',
          productName: 'Snapchat Plus',
          customerName: 'فاطمة حسن',
          price: 49.99,
          status: 'مكتمل',
          date: new Date().toISOString().split('T')[0],
          iconBg: 'bg-yellow-400',
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQMS-MCsnBq2NZUQcwC7gUDv88fD7U68h2HKCXHXMOZFVX45TZL6Kw1EbMw67RCyZv2bXlGK8uD5A7OqefZ4O7e0-cvupQFg-cZQZUU3RjVa1LnDfBmwbatssWdWV0RNfx8RYEjd7mgUie25R9sdbKGAc3RXka9hG2FSQfkRg1F3gWsUs3WerEd9U-6InQUPocm3PbKxjPfvcAUHVnO-5CYRqZqe7XLGHg_hxcp_irCM6WIpsqCmfyrVfzDmDAPh8LEV3bdLLLwCPX',
          store_share: 7.50,
          vendor_share: 42.49
        },
        {
          id: 'TXN-1012',
          productName: 'ChatGPT Plus',
          customerName: 'أحمد علي',
          price: 89.99,
          status: 'مكتمل',
          date: new Date().toISOString().split('T')[0],
          iconBg: 'bg-blue-600',
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT',
          store_share: 13.50,
          vendor_share: 76.49
        }
      ];
      for (const t of dummyTx) {
        await db.execute({
          sql: `INSERT INTO transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [t.id, t.productName, t.customerName, t.price, t.status, t.date, t.iconBg, t.imageUrl, t.store_share, t.vendor_share]
        });
      }
    }
  } catch (err) {
    console.error("Error setting up / seeding database:", err);
  }
}

initDatabase();

// API Endpoints

// 1. PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM products ORDER BY id DESC");
    const products = result.rows.map((row) => ({
      ...row,
      price: Number(row.price),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
      stock: Number(row.stock),
      rating: Number(row.rating),
      reviewsCount: Number(row.reviewsCount),
      commission_rate: Number(row.commission_rate || 15),
      features: row.features ? JSON.parse(row.features as string) : [],
      extraImages: row.extraImages ? JSON.parse(row.extraImages as string) : [],
      videoUrl: row.videoUrl || "",
      isFeatured: Number(row.isFeatured || 0) === 1,
      isBestSeller: Number(row.isBestSeller || 0) === 1,
      tagText: row.tagText || ""
    }));
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, extraImages, videoUrl, isFeatured, isBestSeller, tagText } = req.body;
    await db.execute({
      sql: `INSERT INTO products (id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, extraImages, videoUrl, isFeatured, isBestSeller, tagText)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id || `prod-${Date.now()}`,
        name,
        category,
        Number(price),
        originalPrice ? Number(originalPrice) : null,
        period || "شهر",
        Number(stock) || 0,
        imageUrl || "",
        iconName || "box",
        Number(rating) || 5.0,
        Number(reviewsCount) || 1,
        JSON.stringify(features || []),
        gradientClass || null,
        Number(commission_rate) || 15,
        JSON.stringify(extraImages || []),
        videoUrl || "",
        isFeatured ? 1 : 0,
        isBestSeller ? 1 : 0,
        tagText || ""
      ]
    });
    res.json({ success: true, message: "Product created" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, originalPrice, period, stock, imageUrl, iconName, features, commission_rate, extraImages, videoUrl, isFeatured, isBestSeller, tagText } = req.body;
    await db.execute({
      sql: `UPDATE products 
            SET name = ?, category = ?, price = ?, originalPrice = ?, period = ?, stock = ?, imageUrl = ?, iconName = ?, features = ?, commission_rate = ?, extraImages = ?, videoUrl = ?, isFeatured = ?, isBestSeller = ?, tagText = ?
            WHERE id = ?`,
      args: [
        name,
        category,
        Number(price),
        originalPrice ? Number(originalPrice) : null,
        period,
        Number(stock),
        imageUrl || "",
        iconName || "box",
        JSON.stringify(features || []),
        Number(commission_rate) || 15,
        JSON.stringify(extraImages || []),
        videoUrl || "",
        isFeatured ? 1 : 0,
        isBestSeller ? 1 : 0,
        tagText || "",
        id
      ]
    });
    res.json({ success: true, message: "Product updated" });
  } catch (error: any) {
    res.status(505).json({ error: error.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.1 CATEGORIES CRUD endpoints
app.get("/api/categories", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM categories ORDER BY orderIndex ASC, id ASC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon } = req.body;
    await db.execute({
      sql: "INSERT INTO categories (id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id || `cat-${Date.now()}`, name, Number(orderIndex) || 0, isActive ? 1 : 0, isHidden ? 1 : 0, viewLayout || 'vertical', imageOrIcon || 'Shield']
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon } = req.body;
    await db.execute({
      sql: "UPDATE categories SET name = ?, orderIndex = ?, isActive = ?, isHidden = ?, viewLayout = ?, imageOrIcon = ? WHERE id = ?",
      args: [name, Number(orderIndex) || 0, isActive ? 1 : 0, isHidden ? 1 : 0, viewLayout || 'vertical', imageOrIcon || 'Shield', id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.2 COUPONS CRUD
app.get("/api/coupons", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM coupons ORDER BY id DESC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/coupons", async (req, res) => {
  try {
    const { id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive } = req.body;
    await db.execute({
      sql: "INSERT INTO coupons (id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id || `coup-${Date.now()}`, code, type || 'percent', Number(value), expiryDate || '', Number(maxUses) || 999, Number(usedCount) || 0, assignedTo || 'all', isActive ? 1 : 0]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(505).json({ error: error.message });
  }
});

app.put("/api/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive } = req.body;
    await db.execute({
      sql: "UPDATE coupons SET code = ?, type = ?, value = ?, expiryDate = ?, maxUses = ?, usedCount = ?, assignedTo = ?, isActive = ? WHERE id = ?",
      args: [code, type || 'percent', Number(value), expiryDate || '', Number(maxUses) || 999, Number(usedCount) || 0, assignedTo || 'all', isActive ? 1 : 0, id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM coupons WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { code, productId, categoryId } = req.body;
    const result = await db.execute({
      sql: "SELECT * FROM coupons WHERE code = ? AND isActive = 1",
      args: [code]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو منتهي المفعول" });
    }
    const coupon = result.rows[0];
    
    if (Number(coupon.usedCount) >= Number(coupon.maxUses)) {
      return res.status(400).json({ error: "تم استنفاد عدد مرات استخدام هذا الكوبون" });
    }

    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate as string);
      const today = new Date();
      if (today > expiry) {
        return res.status(400).json({ error: "لقد انتهت صلاحية استخدام هذا الكوبون" });
      }
    }

    const assigned = coupon.assignedTo as string;
    if (assigned && assigned !== 'all') {
      if (productId && assigned !== productId && categoryId && assigned !== categoryId) {
        return res.status(400).json({ error: "هذا الكوبون غير مخصص لهذا المنتج" });
      }
    }

    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.3 BANNERS CRUD
app.get("/api/banners", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM banners ORDER BY orderIndex ASC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(505).json({ error: error.message });
  }
});

app.post("/api/banners", async (req, res) => {
  try {
    const { id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex } = req.body;
    await db.execute({
      sql: "INSERT INTO banners (id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id || `slide-${Date.now()}`, title || "", imageUrl || "", videoUrl || "", linkTo || "", isActive ? 1 : 0, Number(orderIndex) || 0]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, videoUrl, linkTo, isActive, orderIndex } = req.body;
    await db.execute({
      sql: "UPDATE banners SET title = ?, imageUrl = ?, videoUrl = ?, linkTo = ?, isActive = ?, orderIndex = ? WHERE id = ?",
      args: [title || "", imageUrl || "", videoUrl || "", linkTo || "", isActive ? 1 : 0, Number(orderIndex) || 0, id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM banners WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.4 SITE SETTINGS
app.get("/api/settings", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM site_settings WHERE id = 'main'");
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Settings not found" });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const { siteName, logoUrl, faviconUrl, primaryColor, termsPage, privacyPage, socialTwitter, socialTelegram, socialWhatsapp } = req.body;
    await db.execute({
      sql: `UPDATE site_settings 
            SET siteName = ?, logoUrl = ?, faviconUrl = ?, primaryColor = ?, termsPage = ?, privacyPage = ?, socialTwitter = ?, socialTelegram = ?, socialWhatsapp = ?
            WHERE id = 'main'`,
      args: [siteName, logoUrl || "", faviconUrl || "", primaryColor || '#22d3ee', termsPage || "", privacyPage || "", socialTwitter || "", socialTelegram || "", socialWhatsapp || ""]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5 AUDIT LOGS
app.get("/api/logs", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 150");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const { adminName, actionType, details } = req.body;
    const timestamp = new Date().toLocaleString('ar-SA');
    await db.execute({
      sql: "INSERT INTO logs (id, adminName, actionType, details, timestamp) VALUES (?, ?, ?, ?, ?)",
      args: [`log-${Date.now()}`, adminName || "مشرف المتجر", actionType, details, timestamp]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.6 BROADCASTS CRUD
app.get("/api/broadcasts", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM broadcasts ORDER BY id DESC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(550).json({ error: error.message });
  }
});

app.post("/api/broadcasts", async (req, res) => {
  try {
    const { title, body, targetAudience } = req.body;
    const createdAt = new Date().toLocaleString('ar-SA');
    await db.execute({
      sql: "INSERT INTO broadcasts (id, title, body, targetAudience, createdAt) VALUES (?, ?, ?, ?, ?)",
      args: [`broad-${Date.now()}`, title, body, targetAudience || 'all', createdAt]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.7 ADMIN MESSAGING DIRECT ACTIONS
app.post("/api/admin/reply-message", async (req, res) => {
  try {
    const { text, adminName, userId, image } = req.body;
    const replyId = `msg-reply-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    await db.execute({
      sql: "INSERT INTO messages (id, sender, senderName, text, timestamp, userId, image, isRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      args: [replyId, 'agent', adminName || "خالد العمري", text || '', timestamp, userId || '', image || '']
    });
    res.json({ success: true, id: replyId, timestamp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.8 DATABASE EXPORT/RESTORE UTILS
app.get("/api/admin/backup", async (req, res) => {
  try {
    const tables = ['products', 'categories', 'users', 'orders', 'transactions', 'messages', 'coupons', 'banners', 'site_settings', 'logs', 'broadcasts'];
    const backup: any = {};
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT * FROM ${table}`);
        backup[table] = result.rows;
      } catch (err) {
        backup[table] = [];
      }
    }
    res.json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/restore", async (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ error: "بيانات النسخة الاحتياطية غير صالحة" });
    }

    const tables = ['products', 'categories', 'users', 'orders', 'transactions', 'messages', 'coupons', 'banners', 'site_settings', 'logs', 'broadcasts'];
    for (const table of tables) {
      const rows = backupData[table];
      if (!Array.isArray(rows)) continue;
      
      try {
        await db.execute(`DELETE FROM ${table}`);
      } catch(e) {}

      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');
        const values = columns.map(col => {
          const val = row[col];
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val;
        });

        try {
          await db.execute({
            sql: `INSERT OR REPLACE INTO ${table} (${columnNames}) VALUES (${placeholders})`,
            args: values
          });
        } catch (insertErr) {
          console.error(`Error inserting restore row in ${table}:`, insertErr);
        }
      }
    }
    res.json({ success: true, message: "تمت استعادة البيانات بالكامل بنجاح" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Order Delivery Credentials (username, password, redeem code) and Status
app.put("/api/orders/:id/credentials", async (req, res) => {
  try {
    const { id } = req.params;
    const { credentials, status } = req.body;
    await db.execute({
      sql: "UPDATE orders SET credentials = ?, status = ? WHERE id = ?",
      args: [JSON.stringify(credentials || {}), status || "تم تسليم الطلب", id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM orders WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. USERS & BACKEND AUTHENTICATION GATING
app.get("/api/users", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM users");
    const users = result.rows.map((row) => ({
      ...row,
      balance: Number(row.balance),
    }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Check if user exists
    const check = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email]
    });

    if (check.rows.length > 0) {
      const u = check.rows[0];
      return res.json({
        ...u,
        balance: Number(u.balance),
      });
    }

    // Otherwise register a new user
    const id = `user-${Date.now()}`;
    const avatarLetter = name ? name.charAt(0) : email.charAt(0).toUpperCase();
    const joinDate = new Date().toISOString().split('T')[0];
    const balance = 350.0; // Gift starting balance for test mode
    
    await db.execute({
      sql: "INSERT INTO users (id, name, email, balance, joinDate, status, avatarLetter) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, name || email.split("@")[0], email, balance, joinDate, "نشط", avatarLetter]
    });

    res.json({ id, name: name || email.split("@")[0], email, balance, joinDate, status: "نشط", avatarLetter });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Balance Directly
app.post("/api/users/:id/balance", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    await db.execute({
      sql: "UPDATE users SET balance = balance + ? WHERE id = ?",
      args: [Number(amount), id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Name Directly
app.post("/api/users/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await db.execute({
      sql: "UPDATE users SET name = ? WHERE id = ?",
      args: [name, id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ORDERS (PURCHASE LOGIC & COMMISSION DIVISION)
app.get("/api/orders", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM orders ORDER BY date DESC, id DESC");
    const orders = result.rows.map((r) => ({
      ...r,
      price: Number(r.price),
      commission_rate: Number(r.commission_rate || 15),
      store_share: Number(r.store_share || 0),
      vendor_share: Number(r.vendor_share || 0),
      credentials: r.credentials ? JSON.parse(r.credentials as string) : undefined,
    }));
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, userId, discountAmount } = req.body;
    
    // Get user details
    const userRes = await db.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userId]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    let userBalance = Number(user.balance);

    const createdOrders = [];
    let grandTotal = 0;

    // Process each checkout item
    for (const item of items) {
      const { product, quantity, selectedPlan } = item;
      
      // Get latest state of product
      const prodRes = await db.execute({
        sql: "SELECT * FROM products WHERE id = ?",
        args: [product.id]
      });

      if (prodRes.rows.length === 0) {
        return res.status(404).json({ error: `Product ${product.name} not found` });
      }

      const dbProduct = prodRes.rows[0];
      const stock = Number(dbProduct.stock);
      
      if (stock < quantity) {
        return res.status(400).json({ error: `الكمية غير كافية للمنتج: ${product.name}` });
      }

      const singlePrice = selectedPlan === 'yearly' ? Number(dbProduct.price) : Number((Number(dbProduct.price) / 12).toFixed(2));
      const subtotal = singlePrice * quantity;
      grandTotal += subtotal;

      // commission calculation
      const commRate = Number(dbProduct.commission_rate || 15);
      const storeShare = subtotal * (commRate / 100);
      const vendorShare = subtotal - storeShare;

      // generate auto account credentials for instantaneous premium delivery
      const randId = Math.floor(10000 + Math.random() * 90000);
      const randUser = `rx_${String(dbProduct.id).split('-')[1] || 'cust'}_${Math.floor(Math.random() * 99)}`;
      const randPass = `RxSecure${Math.floor(Math.random() * 999)}!`;
      const randCode = `RX-KEY-${Math.floor(1000 + Math.random() * 9000)}-${(String(dbProduct.id)).split('-')[1]?.toUpperCase() || 'VAL'}`;

      let creds: any = {};
      if (dbProduct.category === 'accounts' || dbProduct.category === 'entertainment') {
        creds = { username: randUser, password: randPass };
      } else {
        creds = { code: randCode };
      }

      // Decrement stock
      await db.execute({
        sql: "UPDATE products SET stock = stock - ? WHERE id = ?",
        args: [quantity, dbProduct.id]
      });

      // Insert Order record
      const orderId = `ord-${randId}`;
      const dateStr = new Date().toLocaleDateString('ar-EG');
      
      await db.execute({
        sql: `INSERT INTO orders (id, productId, productName, price, date, status, credentials, imageUrl, commission_rate, store_share, vendor_share)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          dbProduct.id,
          dbProduct.name,
          subtotal,
          dateStr,
          'تم تسليم الطلب',
          JSON.stringify(creds),
          dbProduct.imageUrl || "",
          commRate,
          storeShare,
          vendorShare
        ]
      });

      createdOrders.push({
        id: orderId,
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: subtotal,
        date: dateStr,
        status: 'تم تسليم الطلب',
        credentials: creds,
        imageUrl: dbProduct.imageUrl
      });
    }

    const netSpent = grandTotal - (discountAmount || 0);
    const finalBillWithTax = netSpent + (netSpent * 0.15);

    // Deduct user balance
    await db.execute({
      sql: "UPDATE users SET balance = balance - ? WHERE id = ?",
      args: [finalBillWithTax, userId]
    });

    // Register a Transaction log
    const txnId = `TXN-${Date.now().toString().slice(-4)}`;
    const txProdName = items[0].product.name + (items.length > 1 ? ` (+${items.length - 1})` : '');
    const iconBg = items[0].product.category === 'games' ? 'bg-[#5865F2]' : 'bg-[#d4af37]';
    const totalCommRate = Number(items[0].product.commission_rate || 15);
    const overallStoreShare = netSpent * (totalCommRate / 100);
    const overallVendorShare = netSpent - overallStoreShare;

    await db.execute({
      sql: `INSERT INTO transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        txnId,
        txProdName,
        user.name,
        finalBillWithTax,
        'مكتمل',
        new Date().toISOString().split('T')[0],
        iconBg,
        items[0].product.imageUrl || "",
        overallStoreShare,
        overallVendorShare
      ]
    });

    res.json({
      success: true,
      orders: createdOrders,
      newBalance: userBalance - finalBillWithTax,
      transaction: { id: txnId, productName: txProdName, price: finalBillWithTax }
    });
  } catch (error: any) {
    console.error("Purchase error details:", error);
    res.status(500).json({ error: error.message });
  }
});

// Complete Order Receipts
app.put("/api/orders/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "UPDATE orders SET status = 'مكتمل' WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. TRANSACTIONS HISTORICAL DATA
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM transactions ORDER BY date DESC, id DESC");
    const txs = result.rows.map((r) => ({
      ...r,
      price: Number(r.price),
      store_share: Number(r.store_share || 0),
      vendor_share: Number(r.vendor_share || 0)
    }));
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. MESSAGES SUPPORT SYSTEM
app.get("/api/messages", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = "SELECT * FROM messages ORDER BY id ASC";
    let args: any[] = [];
    if (userId) {
      query = "SELECT * FROM messages WHERE userId = ? OR (userId IS NULL AND senderName = ?) ORDER BY id ASC";
      args = [userId, userId];
    }
    const result = await db.execute({ sql: query, args });
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/messages/conversations", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM messages ORDER BY id ASC");
    const rows = result.rows;
    const conversationsMap: { [key: string]: any } = {};

    rows.forEach((msg: any) => {
      const cid = msg.userId || msg.senderName;
      if (!cid) return;
      
      const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
      
      if (!conversationsMap[cid]) {
        conversationsMap[cid] = {
          userId: msg.userId || cid,
          senderName: isAgent ? (msg.userId || cid) : msg.senderName,
          lastMessage: msg.text || (msg.image ? "صورة 📸" : ""),
          timestamp: msg.timestamp,
          unreadCount: 0,
        };
      } else {
        conversationsMap[cid].lastMessage = msg.text || (msg.image ? "صورة 📸" : "");
        conversationsMap[cid].timestamp = msg.timestamp;
        if (!isAgent) {
          conversationsMap[cid].senderName = msg.senderName;
        }
      }

      if (!isAgent && Number(msg.isRead) === 0) {
        conversationsMap[cid].unreadCount += 1;
      }
    });

    const list = Object.values(conversationsMap).reverse();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/messages/read", async (req, res) => {
  try {
    const { userId, sender } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (sender) {
      await db.execute({
        sql: "UPDATE messages SET isRead = 1 WHERE (userId = ? OR senderName = ?) AND sender = ?",
        args: [userId, userId, sender]
      });
    } else {
      await db.execute({
        sql: "UPDATE messages SET isRead = 1 WHERE userId = ? OR senderName = ?",
        args: [userId, userId]
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { sender, senderName, text, userId, image } = req.body;
    const msgId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Store user message
    await db.execute({
      sql: "INSERT INTO messages (id, sender, senderName, text, timestamp, userId, image, isRead) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
      args: [msgId, sender, senderName, text || '', timestamp, userId || senderName, image || '']
    });

    // Generate responsive bot agent replay
    let replyText = 'يسعدني تواصلك معنا يا فندم! ريكسون هنا دائماً لضمان تقديم أفضل خدمة وتسهيل تفعيل اشتراكاتك فوراً وقائياً وبكل أمان.';
    const searchTxt = (text || '').toLowerCase();
    if (searchTxt.includes('تتبع') || searchTxt.includes('طلب') || searchTxt.includes('وين')) {
      replyText = 'أهلاً بك! يمكنك مراجعة وتتبع جميع حساباتك والبيانات الرقمية مباشرة ومجاناً عبر الذهاب إلى علامة تبويب "حسابي • طلباتي" في القائمة بالأسفل.';
    } else if (searchTxt.includes('مشكل') || searchTxt.includes('خلل') || searchTxt.includes('الباسورد') || searchTxt.includes('خطأ')) {
      replyText = 'لا تقلق أبداً! جميع حسابات متجر ريكسون شريانها الضمان الذهبي طوال فترة الاشتراك. في حال حدوث أي خلل، سنقوم باستبداله لك حالاً.';
    } else if (searchTxt.includes('ريكسون') || searchTxt.includes('سناب') || searchTxt.includes('ببجي') || searchTxt.includes('شحن')) {
      replyText = 'الاشتراكات ممتازة ومثبتة وبضمان رسمي معتمد. يسعدنا اختيارك وبإمكانك إتمام الدفع بأمان تام لتصلك البيانات بلحظتها.';
    }

    const replyId = `msg-reply-${Date.now()}`;
    const replyTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Store reply in db as unread for the user (isRead = 0)
    await db.execute({
      sql: "INSERT INTO messages (id, sender, senderName, text, timestamp, userId, image, isRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      args: [replyId, 'agent', 'خالد العمري', replyText, replyTime, userId || senderName, '']
    });

    res.json({
      userMessage: { id: msgId, sender, senderName, text, timestamp, userId: userId || senderName, image: image || '', isRead: 1 },
      replyMessage: { id: replyId, sender: 'agent', senderName: 'خالد العمري', text: replyText, timestamp: replyTime, userId: userId || senderName, image: '', isRead: 0 }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Serve UI with Vite middleware in development mode, static direct file server in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}...`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
