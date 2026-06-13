import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
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
      CREATE TABLE IF NOT EXISTS rx_products (
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
      CREATE TABLE IF NOT EXISTS rx_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        balance REAL NOT NULL DEFAULT 0.0,
        joinDate TEXT NOT NULL,
        status TEXT NOT NULL,
        avatarLetter TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS rx_orders (
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
        vendor_share REAL,
        userId TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS rx_transactions (
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
      CREATE TABLE IF NOT EXISTS rx_messages (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        senderName TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Create custom Admin Panel Control tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rx_categories (
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
      CREATE TABLE IF NOT EXISTS rx_coupons (
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
      CREATE TABLE IF NOT EXISTS rx_banners (
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
      CREATE TABLE IF NOT EXISTS rx_site_settings (
        id TEXT PRIMARY KEY,
        siteName TEXT DEFAULT 'متجر ريكسون الرقمي R3XON',
        logoUrl TEXT,
        faviconUrl TEXT,
        primaryColor TEXT DEFAULT '#22d3ee',
        termsPage TEXT,
        privacyPage TEXT,
        socialTwitter TEXT,
        socialTelegram TEXT,
        socialWhatsapp TEXT,
        supportAvatarUrl TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT'
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS rx_logs (
        id TEXT PRIMARY KEY,
        adminName TEXT NOT NULL,
        actionType TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS rx_broadcasts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        targetAudience TEXT DEFAULT 'all',
        createdAt TEXT NOT NULL
      )
    `);

    // Safe Schema Alterations to product table to support rich promotional features
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN extraImages TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN videoUrl TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN isFeatured INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN isBestSeller INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN tagText TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN productType TEXT DEFAULT 'standard'");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN keys TEXT DEFAULT '[]'");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN requirePlayerId INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN isSold INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN accountDetails TEXT DEFAULT '{}'");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_products ADD COLUMN parentId TEXT");
    } catch (e) {}


    // Safe Schema Alterations to users table
    try {
      await db.execute("ALTER TABLE rx_users ADD COLUMN password TEXT");
    } catch (e) {
      console.log('Error adding password column:', e);
    }
    try {
      await db.execute("ALTER TABLE rx_users ADD COLUMN shippingCode TEXT");
    } catch (e) {
      console.log('Error adding shippingCode column:', e);
    }

    // Set any old default/mock test balances (like 450.0, 350.0, 650.0) to 0.0
    try {
      await db.execute("UPDATE rx_users SET balance = 0.0 WHERE balance = 450.0 OR balance = 350.0 OR balance = 650.0");
      console.log('Successfully completed cleanup of older test/seed balances.');
    } catch (e) {
      console.log('Error cleaning up balances:', e);
    }

    // Safe Schema Alterations to messages table
    try {
      await db.execute("ALTER TABLE rx_messages ADD COLUMN userId TEXT");
    } catch (e) {
      console.log('Error adding userId column:', e);
    }
    // Safe Schema Alterations to rx_orders table for user tracking
    try {
      await db.execute("ALTER TABLE rx_orders ADD COLUMN userId TEXT");
    } catch (e) {
      console.log('Error adding userId column to rx_orders:', e);
    }
    try {
      await db.execute("ALTER TABLE rx_messages ADD COLUMN image TEXT");
    } catch (e) {
      console.log('Error adding image column:', e);
    }
    try {
      await db.execute("ALTER TABLE rx_messages ADD COLUMN isRead INTEGER DEFAULT 0");
    } catch (e) {
      console.log('Error adding isRead column:', e);
    }
    try {
      await db.execute("ALTER TABLE rx_messages ADD COLUMN replyToId TEXT");
      await db.execute("ALTER TABLE rx_messages ADD COLUMN replyToText TEXT");
    } catch (e) {
      console.log('Error adding reply fields:', e);
    }

    // Safe Schema Alterations to rx_site_settings table for Asiacell configuration
    try {
      await db.execute("ALTER TABLE rx_site_settings ADD COLUMN asiacellPhone TEXT");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_site_settings ADD COLUMN asiacellRate REAL DEFAULT 350.0");
    } catch (e) {}
    try {
      await db.execute("ALTER TABLE rx_site_settings ADD COLUMN supportAvatarUrl TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT'");
    } catch (e) {}

    // Seed default Categories
    const catCheck = await db.execute("SELECT COUNT(*) as count FROM rx_categories");
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
          sql: "INSERT INTO rx_categories (id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [c.id, c.name, c.orderIndex, c.isActive, c.isHidden, c.viewLayout, c.imageOrIcon]
        });
      }
    }

    // Seed default Site Settings
    const setCheck = await db.execute("SELECT COUNT(*) as count FROM rx_site_settings");
    if (Number(setCheck.rows[0].count) === 0) {
      console.log("Seeding default site settings...");
      await db.execute({
        sql: `INSERT INTO rx_site_settings (id, siteName, logoUrl, faviconUrl, primaryColor, termsPage, privacyPage, socialTwitter, socialTelegram, socialWhatsapp) 
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
    const banCheck = await db.execute("SELECT COUNT(*) as count FROM rx_banners");
    if (Number(banCheck.rows[0].count) === 0) {
      console.log("Seeding default banners...");
      const initialBanners = [
        { id: 'slide-1', title: 'باقة ChatGPT Plus السنوية', imageUrl: 'https://images.unsplash.com/photo-1675557009875-436f09780264?q=80&w=600', videoUrl: '', linkTo: 'prod-chatgpt', isActive: 1, orderIndex: 1 },
        { id: 'slide-2', title: 'باقة Netflix 4K الشهرية', imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?q=80&w=600', videoUrl: '', linkTo: 'prod-netflix', isActive: 1, orderIndex: 2 }
      ];
      for (const b of initialBanners) {
        await db.execute({
          sql: "INSERT INTO rx_banners (id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [b.id, b.title, b.imageUrl, b.videoUrl, b.linkTo, b.isActive, b.orderIndex]
        });
      }
    }

    // Seed default Coupon code
    const coupCheck = await db.execute("SELECT COUNT(*) as count FROM rx_coupons");
    if (Number(coupCheck.rows[0].count) === 0) {
      console.log("Seeding default coupon...");
      await db.execute({
        sql: "INSERT INTO rx_coupons (id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: ['coup-demo', 'REX20', 'percent', 20.0, '2027-12-31', 200, 0, 'all', 1]
      });
    }

    // Seed default Audit Log
    const logsCheck = await db.execute("SELECT COUNT(*) as count FROM rx_logs");
    if (Number(logsCheck.rows[0].count) === 0) {
      await db.execute({
        sql: "INSERT INTO rx_logs (id, adminName, actionType, details, timestamp) VALUES (?, ?, ?, ?, ?)",
        args: [`log-${Date.now()}`, 'النظام الأساسي', 'تهيئة لوحة التحكم', 'تم تأسيس لوحة الإدارة الذكية وتمرير السجلات والمخازن التفاعلية لمتجر ريكسون الرقمي.', new Date().toLocaleString('en-US')]
      });
    }

    console.log("Database tables verified successfully.");

    // 2. Check and Seed Products
    const prodCheck = await db.execute("SELECT COUNT(*) as count FROM rx_products");
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
          stock: 3,
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
          commission_rate: 8,
          productType: 'auto_keys',
          keys: JSON.stringify(["PUBG-ABC1-UC660", "PUBG-XYZ2-UC660", "PUBG-QWE3-UC660"])
        }
      ];

      for (const p of initialProducts) {
        await db.execute({
          sql: `INSERT INTO rx_products (id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, productType, keys)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.id, p.name, p.category, p.price, p.originalPrice, p.period, p.stock, p.imageUrl, p.iconName, p.rating, p.reviewsCount, p.features, p.gradientClass, p.commission_rate, (p as any).productType || 'standard', (p as any).keys || JSON.stringify([])]
        });
      }
    }

    // Ensure all extra PUBG Mobile UC tiers exist in the database for a rich selection
    const extraPubgProducts = [
      {
        id: 'prod-pubg-60',
        name: 'شحن شدات ببجي 60UC',
        category: 'games',
        price: 4.50,
        originalPrice: 6.00,
        period: '60 شدة فورية',
        stock: 50,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 4.8,
        reviewsCount: 310,
        features: JSON.stringify([
          'شحن رسمي وفوري مباشر عبر الايدي (ID)',
          'توفير الكود وتفعيله فورياً عبر Midasbuy',
          'ضمان رسمي موثوق مائة بالمائة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC60", "PUBG-XYZ-UC60", "PUBG-QWE-UC60"])
      },
      {
        id: 'prod-pubg-325',
        name: 'شحن شدات ببجي 325UC',
        category: 'games',
        price: 22.50,
        originalPrice: 28.00,
        period: '325 شدة فورية',
        stock: 40,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 4.9,
        reviewsCount: 420,
        features: JSON.stringify([
          'شحن رسمي وفوري مباشر عبر الايدي (ID)',
          'توفير الكود وتفعيله فورياً عبر Midasbuy',
          'ضمان رسمي موثوق مائة بالمائة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC325", "PUBG-XYZ-UC325", "PUBG-QWE-UC325"])
      },
      {
        id: 'prod-pubg-1320',
        name: 'شحن شدات ببجي 1320UC',
        category: 'games',
        price: 85.00,
        originalPrice: 110.00,
        period: '1320 شدة فورية',
        stock: 25,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 4.9,
        reviewsCount: 520,
        features: JSON.stringify([
          'شحن رسمي وفوري مباشر عبر الايدي (ID)',
          'توفير الكود وتفعيله فورياً عبر Midasbuy',
          'تفعيل سريع ومباشر للرويال بلس فورياً',
          'ضمان رسمي موثوق مائة بالمائة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC1320", "PUBG-XYZ-UC1320", "PUBG-QWE-UC1320"])
      },
      {
        id: 'prod-pubg-1800',
        name: 'شحن شدات ببجي 1800UC',
        category: 'games',
        price: 115.00,
        originalPrice: 150.00,
        period: '1800 شدة فورية',
        stock: 35,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 5.0,
        reviewsCount: 651,
        features: JSON.stringify([
          'شحن رسمي وفوري مباشر عبر الايدي (ID)',
          'أكواد ذهبية وتفعيل عبر موقع Midasbuy الرسمي',
          'شحن الحساب في بضع ثوانٍ معدودة',
          'ضمان رسمي موثوق مائة بالمائة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC1800", "PUBG-XYZ-UC1800"])
      },
      {
        id: 'prod-pubg-3850',
        name: 'شحن شدات ببجي 3850UC',
        category: 'games',
        price: 235.00,
        originalPrice: 300.00,
        period: '3850 شدة فورية',
        stock: 12,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 5.0,
        reviewsCount: 887,
        features: JSON.stringify([
          'شحن رسمي وحصري مباشر عبر الايدي (ID)',
          'الباقة الاحترافية الأعلى طلباً لفتح الصناديق والمواسم الرسمية',
          'تفعيل مباشر وفوري عبر موقع Midasbuy الرسمي لـ PUBG MOBILE',
          'ضمان رسمي موثوق مائة بالمائة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC3850", "PUBG-XYZ-UC3850"])
      },
      {
        id: 'prod-pubg-8100',
        name: 'شحن شدات ببجي 8100UC',
        category: 'games',
        price: 445.00,
        originalPrice: 580.00,
        period: '8100 شدة فورية',
        stock: 10,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb',
        iconName: 'gamepad-2',
        rating: 5.0,
        reviewsCount: 1240,
        features: JSON.stringify([
          'بطاقة تفعيل شحن رسمي وفوري مباشر عبر الايدي (ID)',
          'الباقة المليونية الأكبر لـ PUBG MOBILE لتفعيل الرويال باس وترقية الأسلحة المطورة وسكنات',
          'توفير الكود وتفعيله فورياً عبر موقع Midasbuy الرسمي لـ PUBG MOBILE',
          'دعم وضمان شحن رسمي موثوق مائة بالمائة بخصوصية تامة'
        ]),
        gradientClass: null,
        commission_rate: 8,
        productType: 'auto_keys',
        keys: JSON.stringify(["PUBG-ABC-UC8100", "PUBG-XYZ-UC8100"])
      }
    ];

    for (const p of extraPubgProducts) {
      const checkExists = await db.execute({
        sql: "SELECT COUNT(*) as count FROM rx_products WHERE id = ?",
        args: [p.id]
      });
      if (Number(checkExists.rows[0].count) === 0) {
        console.log(`Seeding extra PUBG UC pack: ${p.name}`);
        await db.execute({
          sql: `INSERT INTO rx_products (id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, productType, keys)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.id, p.name, p.category, p.price, p.originalPrice, p.period, p.stock, p.imageUrl, p.iconName, p.rating, p.reviewsCount, p.features, p.gradientClass, p.commission_rate, p.productType, p.keys]
        });
      }
    }

    // 3. Seed Users
    const userCheck = await db.execute("SELECT COUNT(*) as count FROM rx_users");
    const userCount = Number(userCheck.rows[0].count);
    if (userCount === 0) {
      console.log("Seeding users table...");
      const initialUsers = [
        {
          id: 'user-ahmed',
          name: 'أحمد علي',
          email: 'kooookook1@gmail.com', // Override with user email context or default
          balance: 0.00,
          joinDate: '2024-05-15',
          status: 'VIP',
          avatarLetter: 'أ'
        },
        {
          id: 'user-fatima',
          name: 'فاطمة حسن',
          email: 'fatty_hasan@gmail.com',
          balance: 0.00,
          joinDate: '2024-04-12',
          status: 'نشط',
          avatarLetter: 'ف'
        }
      ];
      for (const u of initialUsers) {
        await db.execute({
          sql: `INSERT INTO rx_users (id, name, email, balance, joinDate, status, avatarLetter)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.name, u.email, u.balance, u.joinDate, u.status, u.avatarLetter]
        });
      }
    }

    // 4. Seed Messages
    const msgsCheck = await db.execute("SELECT COUNT(*) as count FROM rx_messages");
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
          sql: `INSERT INTO rx_messages (id, sender, senderName, text, timestamp) VALUES (?, ?, ?, ?, ?)`,
          args: [m.id, m.sender, m.senderName, m.text, m.timestamp]
        });
      }
    }

    // 5. Seed Transactions (to give a rich initial analytics look)
    const txCheck = await db.execute("SELECT COUNT(*) as count FROM rx_transactions");
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
          sql: `INSERT INTO rx_transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
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

// Helper to safely normalize and parse values into a clean array of strings/items (handling double stringified values)
function ensureArray(val: any): any[] {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        const doubleParsed = JSON.parse(parsed.trim());
        if (Array.isArray(doubleParsed)) return doubleParsed;
      }
    } catch (e) {
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        } catch (_) {}
      }
      return trimmed.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// API Endpoints

// 1. PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM rx_products ORDER BY id DESC");
    const products = result.rows.map((row) => {
      const rawDetails = row.accountDetails ? JSON.parse(row.accountDetails as string) : {};
      const safeDetails = { ...rawDetails };
      // Security Scrubbing of sensitive fields for non-purchased listings
      if (safeDetails.password) {
        safeDetails.password = "********";
      }
      if (safeDetails.phone) {
        const ph = String(safeDetails.phone);
        if (ph.length > 5) {
          safeDetails.phone = ph.slice(0, 3) + "****" + ph.slice(-3);
        } else {
          safeDetails.phone = "****";
        }
      }

      return {
        ...row,
        price: Number(row.price),
        originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
        stock: Number(row.stock),
        rating: Number(row.rating),
        reviewsCount: Number(row.reviewsCount),
        commission_rate: Number(row.commission_rate || 15),
        features: ensureArray(row.features),
        extraImages: ensureArray(row.extraImages),
        videoUrl: row.videoUrl || "",
        isFeatured: Number(row.isFeatured || 0) === 1,
        isBestSeller: Number(row.isBestSeller || 0) === 1,
        tagText: row.tagText || "",
        productType: row.productType || "standard",
        keys: ensureArray(row.keys),
        requirePlayerId: Number(row.requirePlayerId || 0) === 1,
        isSold: Number(row.isSold || 0) === 1,
        accountDetails: safeDetails,
        parentId: row.parentId || ""
      };
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, extraImages, images, videoUrl, isFeatured, isBestSeller, tagText, productType, keys, requirePlayerId, isSold, accountDetails, parentId } = req.body;
    const finalExtraImages = extraImages || images;
    await db.execute({
      sql: `INSERT INTO rx_products (id, name, category, price, originalPrice, period, stock, imageUrl, iconName, rating, reviewsCount, features, gradientClass, commission_rate, extraImages, videoUrl, isFeatured, isBestSeller, tagText, productType, keys, requirePlayerId, isSold, accountDetails, parentId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        JSON.stringify(ensureArray(features)),
        gradientClass || null,
        Number(commission_rate) || 15,
        JSON.stringify(ensureArray(finalExtraImages)),
        videoUrl || "",
        isFeatured ? 1 : 0,
        isBestSeller ? 1 : 0,
        tagText || "",
        productType || "standard",
        JSON.stringify(ensureArray(keys)),
        requirePlayerId ? 1 : 0,
        isSold ? 1 : 0,
        JSON.stringify(accountDetails || {}),
        parentId || ""
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
    const { name, category, price, originalPrice, period, stock, imageUrl, iconName, features, commission_rate, extraImages, images, videoUrl, isFeatured, isBestSeller, tagText, productType, keys, requirePlayerId, isSold, accountDetails, parentId } = req.body;
    const finalExtraImages = extraImages || images;
    await db.execute({
      sql: `UPDATE rx_products 
            SET name = ?, category = ?, price = ?, originalPrice = ?, period = ?, stock = ?, imageUrl = ?, iconName = ?, features = ?, commission_rate = ?, extraImages = ?, videoUrl = ?, isFeatured = ?, isBestSeller = ?, tagText = ?, productType = ?, keys = ?, requirePlayerId = ?, isSold = ?, accountDetails = ?, parentId = ?
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
        JSON.stringify(ensureArray(features)),
        Number(commission_rate) || 15,
        JSON.stringify(ensureArray(finalExtraImages)),
        videoUrl || "",
        isFeatured ? 1 : 0,
        isBestSeller ? 1 : 0,
        tagText || "",
        productType || "standard",
        JSON.stringify(ensureArray(keys)),
        requirePlayerId ? 1 : 0,
        isSold ? 1 : 0,
        JSON.stringify(accountDetails || {}),
        parentId || "",
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
      sql: "DELETE FROM rx_products WHERE id = ?",
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
    const result = await db.execute("SELECT * FROM rx_categories ORDER BY orderIndex ASC, id ASC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon } = req.body;
    await db.execute({
      sql: "INSERT INTO rx_categories (id, name, orderIndex, isActive, isHidden, viewLayout, imageOrIcon) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
      sql: "UPDATE rx_categories SET name = ?, orderIndex = ?, isActive = ?, isHidden = ?, viewLayout = ?, imageOrIcon = ? WHERE id = ?",
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
      sql: "DELETE FROM rx_categories WHERE id = ?",
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
    const result = await db.execute("SELECT * FROM rx_coupons ORDER BY id DESC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/coupons", async (req, res) => {
  try {
    const { id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive } = req.body;
    await db.execute({
      sql: "INSERT INTO rx_coupons (id, code, type, value, expiryDate, maxUses, usedCount, assignedTo, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      sql: "UPDATE rx_coupons SET code = ?, type = ?, value = ?, expiryDate = ?, maxUses = ?, usedCount = ?, assignedTo = ?, isActive = ? WHERE id = ?",
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
      sql: "DELETE FROM rx_coupons WHERE id = ?",
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
      sql: "SELECT * FROM rx_coupons WHERE code = ? AND isActive = 1",
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
    const result = await db.execute("SELECT * FROM rx_banners ORDER BY orderIndex ASC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(505).json({ error: error.message });
  }
});

app.post("/api/banners", async (req, res) => {
  try {
    const { id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex } = req.body;
    await db.execute({
      sql: "INSERT INTO rx_banners (id, title, imageUrl, videoUrl, linkTo, isActive, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
      sql: "UPDATE rx_banners SET title = ?, imageUrl = ?, videoUrl = ?, linkTo = ?, isActive = ?, orderIndex = ? WHERE id = ?",
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
      sql: "DELETE FROM rx_banners WHERE id = ?",
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
    const result = await db.execute("SELECT * FROM rx_site_settings WHERE id = 'main'");
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
    const { siteName, logoUrl, faviconUrl, primaryColor, termsPage, privacyPage, socialTwitter, socialTelegram, socialWhatsapp, asiacellPhone, asiacellRate, supportAvatarUrl } = req.body;
    await db.execute({
      sql: `UPDATE rx_site_settings 
            SET siteName = ?, logoUrl = ?, faviconUrl = ?, primaryColor = ?, termsPage = ?, privacyPage = ?, socialTwitter = ?, socialTelegram = ?, socialWhatsapp = ?, asiacellPhone = ?, asiacellRate = ?, supportAvatarUrl = ?
            WHERE id = 'main'`,
      args: [
        siteName, 
        logoUrl || "", 
        faviconUrl || "", 
        primaryColor || '#22d3ee', 
        termsPage || "", 
        privacyPage || "", 
        socialTwitter || "", 
        socialTelegram || "", 
        socialWhatsapp || "",
        asiacellPhone || "",
        Number(asiacellRate) || 350.0,
        supportAvatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCmM4ZtcoZniNa-JQQnD_zy1K_5zAInZDJ6vj_LjGyr-BdCrpRaup5N9TPzQA9GeuajgqXcTYBcVwKQ0ZNcx4MYetSo7uhEYhz7KT6O3vFNzMn2zvoFyN_8w_TZw2GAD_b3sEFbiOH5pGOfK5cciSCy7vtAKFH63jETSus7c3Qjp2wJwZ3vCx-Hl2tDwybyxH33iB9EnRs-LVvGoJLDiJwqmt_6MsOj4HGkoFQYF4WEqXMMjOILF026U-TsnK_uWDWWVsEbZE-bxIzT"
      ]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5 AUDIT LOGS
app.get("/api/logs", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM rx_logs ORDER BY id DESC LIMIT 150");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const { adminName, actionType, details } = req.body;
    const timestamp = new Date().toLocaleString('en-US');
    await db.execute({
      sql: "INSERT INTO rx_logs (id, adminName, actionType, details, timestamp) VALUES (?, ?, ?, ?, ?)",
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
    const result = await db.execute("SELECT * FROM rx_broadcasts ORDER BY id DESC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(550).json({ error: error.message });
  }
});

app.post("/api/broadcasts", async (req, res) => {
  try {
    const { title, body, targetAudience } = req.body;
    const createdAt = new Date().toLocaleString('en-US');
    await db.execute({
      sql: "INSERT INTO rx_broadcasts (id, title, body, targetAudience, createdAt) VALUES (?, ?, ?, ?, ?)",
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
    const { text, adminName, userId, image, replyToId, replyToText } = req.body;
    const replyId = `msg-${Date.now()}-reply`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await db.execute({
      sql: "INSERT INTO rx_messages (id, sender, senderName, text, timestamp, userId, image, isRead, replyToId, replyToText) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
      args: [replyId, 'agent', adminName || "خالد العمري", text || '', timestamp, userId || '', image || '', replyToId || null, replyToText || null]
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
      sql: "UPDATE rx_orders SET credentials = ?, status = ? WHERE id = ?",
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
      sql: "DELETE FROM rx_orders WHERE id = ?",
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
    const result = await db.execute("SELECT * FROM rx_users");
    const users = result.rows.map((row) => ({
      ...row,
      balance: Number(row.balance),
    }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json({ exists: false });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const check = await db.execute({
      sql: "SELECT id FROM rx_users WHERE LOWER(email) = ?",
      args: [cleanEmail]
    });
    return res.json({ exists: check.rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, name, password, isRegistering, shippingCode } = req.body;
    if (!email) {
      return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user exists (case-insensitive)
    const check = await db.execute({
      sql: "SELECT * FROM rx_users WHERE LOWER(email) = ?",
      args: [cleanEmail]
    });

    if (isRegistering) {
      if (check.rows.length > 0) {
        return res.json({ error: "هذا الحساب تم تسجيله من قبل! يرجى تسجيل الدخول بدلاً من ذلك" });
      }

      // Otherwise register a new user
      const id = `user-${Date.now()}`;
      const cleanName = name ? name.trim() : cleanEmail.split("@")[0];
      const avatarLetter = cleanName.charAt(0);
      const joinDate = new Date().toISOString().split('T')[0];
      const balance = 0.0; // Starting/initial balance is zero
      
      await db.execute({
        sql: "INSERT INTO rx_users (id, name, email, balance, joinDate, status, avatarLetter, password, shippingCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, cleanName, cleanEmail, balance, joinDate, "نشط", avatarLetter, password || "", shippingCode || ""]
      });

      return res.json({ id, name: cleanName, email: cleanEmail, balance, joinDate, status: "نشط", avatarLetter, password: password || "", shippingCode: shippingCode || "" });
    } else {
      // Login flow
      if (check.rows.length > 0) {
        const u = check.rows[0];
        const finalName = name ? name.trim() : u.name;
        const avatarLetter = finalName.charAt(0);
        const updatedPassword = password !== undefined ? password : (u.password || "");
        
        // If a password was previously set and is not empty, check it!
        if (u.password && u.password !== "" && password !== undefined && u.password !== password) {
          return res.json({ error: "كلمة المرور غير صحيحة! يرجى كتابة الرمز الصحيح الخاص بك" });
        }

        // Update details if password needs updating (only if the existing didn't have one, or to make sure it is updated)
        await db.execute({
          sql: "UPDATE rx_users SET password = ?, name = ?, avatarLetter = ? WHERE id = ?",
          args: [updatedPassword, finalName, avatarLetter, u.id]
        });
        
        return res.json({
          ...u,
          name: finalName,
          email: cleanEmail,
          avatarLetter,
          password: updatedPassword,
          shippingCode: u.shippingCode || "",
          balance: Number(u.balance),
        });
      } else {
        return res.json({ error: "هذا الحساب غير مسجل من قبل! يمكنك الضغط على 'إنشاء حساب جديد' للتسجيل" });
      }
    }
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
      sql: "UPDATE rx_users SET balance = balance + ? WHERE id = ?",
      args: [Number(amount), id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Name / Email / Password Directly
app.post("/api/users/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    if (password !== undefined) {
      await db.execute({
        sql: "UPDATE rx_users SET name = ?, email = ?, password = ? WHERE id = ?",
        args: [name, email, password, id]
      });
    } else {
      await db.execute({
        sql: "UPDATE rx_users SET name = ?, email = ? WHERE id = ?",
        args: [name, email, id]
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user details (PUT)
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, balance, status, password } = req.body;
    if (password !== undefined) {
      await db.execute({
        sql: "UPDATE rx_users SET name = ?, email = ?, balance = ?, status = ?, password = ? WHERE id = ?",
        args: [name, email, Number(balance), status, password, id]
      });
    } else {
      await db.execute({
        sql: "UPDATE rx_users SET name = ?, email = ?, balance = ?, status = ? WHERE id = ?",
        args: [name, email, Number(balance), status, id]
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (DELETE)
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM rx_users WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ORDERS (PURCHASE LOGIC & COMMISSION DIVISION)
app.get("/api/orders", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM rx_orders ORDER BY date DESC, id DESC");
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
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!items || items.length === 0) return res.status(400).json({ error: "Empty items" });

    // Get user details
    const userRes = await db.execute({
      sql: "SELECT * FROM rx_users WHERE id = ?",
      args: [String(userId)]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    let userBalance = Number(user.balance);

    let projectedGrandTotal = 0;
    // Fast pass to verify stocks and balance
    for (const item of items) {
      const { product, quantity, selectedPlan } = item;
      if (!product || !product.id) return res.status(400).json({ error: "Invalid product" });
      const prodRes = await db.execute({ sql: "SELECT * FROM rx_products WHERE id = ?", args: [String(product.id)] });
      if (prodRes.rows.length === 0) return res.status(404).json({ error: `Product ${product.name} not found` });
      
      const dbProduct = prodRes.rows[0];
      const stock = Number(dbProduct.stock);
      if (stock < quantity) return res.status(400).json({ error: `الكمية غير كافية للمنتج: ${product.name}` });

      const isSub1 = ['accounts', 'entertainment', 'productivity'].includes(String(dbProduct.category));
      const singlePrice = (!isSub1 || selectedPlan === 'yearly') ? Number(dbProduct.price) : Number((Number(dbProduct.price) / 12).toFixed(2));
      projectedGrandTotal += (singlePrice * quantity);
    }
    
    const netSpent = projectedGrandTotal - (discountAmount || 0);
    const finalBillWithTax = netSpent;

    if (userBalance < finalBillWithTax) {
       return res.status(400).json({ error: 'عذراً، رصيدك الحالي غير كافٍ لإتمام عملية الشراء! يرجى شحن الرصيد.' });
    }

    const createdOrders = [];
    let grandTotal = 0;

    // Process each checkout item
    for (const item of items) {
      const { product, quantity, selectedPlan } = item;
      
      if (!product || !product.id) return res.status(400).json({ error: "Invalid product in cart" });

      // Get latest state of product
      const prodRes = await db.execute({
        sql: "SELECT * FROM rx_products WHERE id = ?",
        args: [String(product.id)]
      });

      if (prodRes.rows.length === 0) {
        return res.status(404).json({ error: `Product ${product.name} not found` });
      }

      const dbProduct = prodRes.rows[0];
      const stock = Number(dbProduct.stock);
      
      if (stock < quantity) {
        return res.status(400).json({ error: `الكمية غير كافية للمنتج: ${product.name}` });
      }

      const isSub2 = ['accounts', 'entertainment', 'productivity'].includes(String(dbProduct.category));
      const singlePrice = (!isSub2 || selectedPlan === 'yearly') ? Number(dbProduct.price) : Number((Number(dbProduct.price) / 12).toFixed(2));
      const subtotal = singlePrice * quantity;
      grandTotal += subtotal;

      // commission calculation
      const commRate = Number(dbProduct.commission_rate || 15);
      const storeShare = subtotal * (commRate / 100);
      const vendorShare = subtotal - storeShare;

      let creds: any = {};
      let orderStatus = 'تم تسليم الطلب';

      const keysArr = ensureArray(dbProduct.keys);

      if (dbProduct.productType === 'auto_keys' || keysArr.length > 0) {
        if (keysArr.length < quantity) {
          return res.status(400).json({ error: `نعتذر، لا تتوفر مفاتيح/حسابات كافية حالياً للمنتج: ${product.name}` });
        }
        const assignedKeys = keysArr.splice(0, quantity);
        creds = { keys: assignedKeys };
        // Update remaining keys and stock
        await db.execute({
          sql: "UPDATE rx_products SET keys = ?, stock = ? WHERE id = ?",
          args: [String(JSON.stringify(keysArr)), Number(keysArr.length) || 0, String(dbProduct.id)]
        });
      } else if (dbProduct.productType === 'account') {
        const rawDetails = dbProduct.accountDetails ? JSON.parse(dbProduct.accountDetails as string) : {};
        if (Number(dbProduct.isSold) === 1 || Number(dbProduct.stock) === 0) {
          return res.status(400).json({ error: `عذراً، هذا الحساب قد تم بيعه لشخص آخر بالفعل! مبيوع ❌` });
        }
        creds = { ...rawDetails };
        orderStatus = 'تم تسليم الطلب';
        // Immediately mark the product sold and clear raw details from public listing for absolute security
        await db.execute({
          sql: "UPDATE rx_products SET isSold = 1, stock = 0, accountDetails = '{}' WHERE id = ?",
          args: [String(dbProduct.id)]
        });
      } else if (dbProduct.productType === 'manual_id' || dbProduct.requirePlayerId) {
        creds = { playerId: item.playerId || 'لم يتم إدخال كود اللاعب' };
        orderStatus = 'قيد الانتظار';
        // Still decrement stock if needed, or leave it as is if manual isn't restricted by stock.
        // We'll decrement stock for consistency.
        await db.execute({
          sql: "UPDATE rx_products SET stock = stock - ? WHERE id = ?",
          args: [Number(quantity) || 1, String(dbProduct.id)]
        });
      } else {
        // Standard instantaneous simulated credential generation for preview
        const randUser = `rx_${String(dbProduct.id).split('-')[1] || 'cust'}_${Math.floor(Math.random() * 99)}`;
        const randPass = `RxSecure${Math.floor(Math.random() * 999)}!`;
        const randCode = `RX-KEY-${Math.floor(1000 + Math.random() * 9000)}-${(String(dbProduct.id)).split('-')[1]?.toUpperCase() || 'VAL'}`;

        if (dbProduct.category === 'accounts' || dbProduct.category === 'entertainment') {
          creds = { username: randUser, password: randPass };
        } else {
          creds = { code: randCode };
        }
        await db.execute({
          sql: "UPDATE rx_products SET stock = stock - ? WHERE id = ?",
          args: [Number(quantity) || 1, String(dbProduct.id)]
        });
      }

      // Insert Order record
      const randId = Math.floor(10000 + Math.random() * 90000);
      const orderId = `ord-${randId}`;
      const dateStr = new Date().toLocaleDateString('en-US');
      
      const safeSubtotal = isNaN(Number(subtotal)) ? 0 : Number(subtotal);
      const safeCommRate = isNaN(Number(commRate)) ? 15 : Number(commRate);
      const safeStoreShare = isNaN(Number(storeShare)) ? 0 : Number(storeShare);
      const safeVendorShare = isNaN(Number(vendorShare)) ? 0 : Number(vendorShare);

      await db.execute({
        sql: `INSERT INTO rx_orders (id, productId, productName, price, date, status, credentials, imageUrl, commission_rate, store_share, vendor_share, userId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          String(orderId),
          String(dbProduct.id),
          String(dbProduct.name || 'منتج مجهول'),
          safeSubtotal,
          String(dateStr),
          String(orderStatus),
          String(JSON.stringify(creds)),
          String(dbProduct.imageUrl || ""),
          safeCommRate,
          safeStoreShare,
          safeVendorShare,
          String(userId)
        ]
      });

      createdOrders.push({
        id: orderId,
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: subtotal,
        date: dateStr,
        status: orderStatus,
        credentials: creds,
        imageUrl: dbProduct.imageUrl,
        userId: String(userId)
      });
    }

    const safeFinalBillWithTax = isNaN(Number(finalBillWithTax)) ? 0 : Number(finalBillWithTax);
    // Deduct user balance
    await db.execute({
      sql: "UPDATE rx_users SET balance = balance - ? WHERE id = ?",
      args: [safeFinalBillWithTax, String(userId)]
    });

    // Register a Transaction log
    const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txProdName = items[0].product.name + (items.length > 1 ? ` (+${items.length - 1})` : '');
    const iconBg = items[0].product.category === 'games' ? 'bg-[#5865F2]' : 'bg-[#d4af37]';
    
    const parsedCommRate = Number(items[0].product.commission_rate);
    const safeTotalCommRate = isNaN(parsedCommRate) ? 15 : parsedCommRate;
    
    const rawOverallStoreShare = (Number(netSpent) || 0) * (safeTotalCommRate / 100);
    const safeOverallStoreShare = isNaN(rawOverallStoreShare) ? 0 : rawOverallStoreShare;
    
    const rawOverallVendorShare = (Number(netSpent) || 0) - safeOverallStoreShare;
    const safeOverallVendorShare = isNaN(rawOverallVendorShare) ? 0 : rawOverallVendorShare;

    await db.execute({
      sql: `INSERT INTO rx_transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        String(txnId),
        String(txProdName),
        String(user.name || 'مجهول'),
        safeFinalBillWithTax,
        'مكتمل',
        String(new Date().toISOString().split('T')[0]),
        String(iconBg),
        String(items[0].product.imageUrl || ""),
        safeOverallStoreShare,
        safeOverallVendorShare
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
      sql: "UPDATE rx_orders SET status = 'مكتمل' WHERE id = ?",
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
    const result = await db.execute("SELECT * FROM rx_transactions ORDER BY date DESC, id DESC");
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
    let query = "SELECT * FROM rx_messages ORDER BY id ASC";
    let args: any[] = [];
    if (userId) {
      query = "SELECT * FROM rx_messages WHERE userId = ? OR (userId IS NULL AND senderName = ?) ORDER BY id ASC";
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
    const result = await db.execute("SELECT * FROM rx_messages ORDER BY id ASC");
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
        sql: "UPDATE rx_messages SET isRead = 1 WHERE (userId = ? OR senderName = ?) AND sender = ?",
        args: [userId, userId, sender]
      });
    } else {
      await db.execute({
        sql: "UPDATE rx_messages SET isRead = 1 WHERE userId = ? OR senderName = ?",
        args: [userId, userId]
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ========== ASIACELL AUTOMATED PAYMENTS INTEGRATION GATEWAY =================
// ============================================================================

const AC_API = 'https://odpapp.asiacell.com';
const AC_API_KEY = '1ccbc4c913bc4ce785a0a2de444aa0d6';

const BASE_HEADERS: any = {
  'Host': 'odpapp.asiacell.com',
  'X-Odp-Api-Key': AC_API_KEY,
  'Cache-Control': 'no-cache',
  'X-Os-Version': '9',
  'X-Device-Type': '[Android][google][G011A 9][P][HMS][4.2.1:90000263]',
  'X-Odp-App-Version': '4.2.1',
  'X-From-App': 'odp',
  'X-Odp-Channel': 'mobile',
  'X-Screen-Type': 'false',
  'Content-Type': 'application/json; charset=UTF-8',
  'User-Agent': 'okhttp/5.0.0-alpha.2',
  'Connection': 'keep-alive',
};

// Admin Session State
let adminSession = {
  phone: '',
  deviceId: '',
  accessToken: '',
  pid: '',
  authenticated: false,
};

// Processed transfers to avoid double-crediting
const processedTransfers = new Set<string>();

// Customer sessions map
interface AsiacellSession {
  phone: string;
  deviceId: string;
  userId: string;
  pid: string;
  accessToken: string | null;
  username: string;
  amount: number;
  transferPid?: string;
  step: 'otp_sent' | 'authenticated' | 'transfer_initiated';
  createdAt: number;
}
const asiacellSessions = new Map<string, AsiacellSession>();

// Cleanup old customer sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of asiacellSessions.entries()) {
    if (now - s.createdAt > 15 * 60 * 1000) {
      asiacellSessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

async function getStorePhone(): Promise<string> {
  try {
    const result = await db.execute("SELECT asiacellPhone FROM rx_site_settings WHERE id = 'main'");
    if (result.rows.length > 0 && result.rows[0].asiacellPhone) {
      return String(result.rows[0].asiacellPhone);
    }
  } catch (e) {}
  return process.env.ASIACELL_STORE_PHONE || "07700000000";
}

async function getExchangeRate(): Promise<number> {
  try {
    const result = await db.execute("SELECT asiacellRate FROM rx_site_settings WHERE id = 'main'");
    if (result.rows.length > 0 && result.rows[0].asiacellRate) {
      return Number(result.rows[0].asiacellRate);
    }
  } catch (e) {}
  return Number(process.env.ASIACELL_EXCHANGE_RATE) || 350.0;
}

// REST Endpoints:
app.get("/api/asiacell/admin/status", (req, res) => {
  res.json({
    authenticated: adminSession.authenticated,
    phone: adminSession.phone,
  });
});

app.post("/api/asiacell/admin/login", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!/^07\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'رقم هاتف آسياسيل غير صالح. يجب أن يبدأ بـ 07 ويتكون من 11 رقمًا' });
    }

    const deviceId = crypto.randomUUID();

    const r = await fetch(`${AC_API}/api/v1/login?lang=ar`, {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Deviceid': deviceId },
      body: JSON.stringify({ captchaCode: '', username: cleanPhone }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Admin] OTP Sent for ${cleanPhone}:`, JSON.stringify(data));

    const pidMatch = (data.nextUrl || '').match(/PID=([^&]+)/);
    const pid = pidMatch ? pidMatch[1] : '';

    adminSession.phone = cleanPhone;
    adminSession.deviceId = deviceId;
    adminSession.pid = pid;
    adminSession.authenticated = false;

    res.json({ success: true, message: data.message || 'OTP sent' });
  } catch (err: any) {
    console.error('[Asiacell Admin Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/admin/verify", async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || !adminSession.phone) {
      return res.status(400).json({ error: 'بيانات الجلسة غير صالحة، يرجى إعادة محاولة تسجيل الدخول' });
    }

    const r = await fetch(`${AC_API}/api/v1/smsvalidation?lang=ar`, {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Deviceid': adminSession.deviceId },
      body: JSON.stringify({ PID: adminSession.pid, passcode: otp }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Admin] OTP verify:`, JSON.stringify(data));

    if (data.access_token) {
      adminSession.accessToken = data.access_token;
      adminSession.authenticated = true;
      console.log(`[Asiacell Admin] Authenticated successfully for ${adminSession.phone}`);
      res.json({ success: true, message: 'تم تفعيل بوابة آسياسيل للمشرف بنجاح' });
    } else {
      res.json({ success: false, message: data.message || 'رمز التحقق OTP خاطئ' });
    }
  } catch (err: any) {
    console.error('[Asiacell Admin Verify Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/admin/logout", (req, res) => {
  adminSession = { phone: '', deviceId: '', accessToken: '', pid: '', authenticated: false };
  res.json({ success: true });
});

async function checkRecordsAndCredit() {
  if (!adminSession.authenticated || !adminSession.accessToken) {
    return { checked: false, reason: 'Admin not authenticated' };
  }

  try {
    const headers = {
      ...BASE_HEADERS,
      'Deviceid': adminSession.deviceId,
      'Authorization': `Bearer ${adminSession.accessToken}`,
      'X-Screen-Type': 'MOBILE',
    };

    const r = await fetch(`${AC_API}/api/v1/cdr/detail?type=sms&page=1&limit=50&lang=ar&theme=avocado`, {
      headers,
    });
    const data: any = await r.json();

    console.log(`[Asiacell Records] Fetched ${Array.isArray(data?.data) ? data.data.length : 0} records`);

    if (!data?.data || !Array.isArray(data.data)) {
      if (data?.status === 401 || data?.message?.includes('unauthorized')) {
        adminSession.authenticated = false;
        console.log('[Asiacell Records] Token expired, admin needs to re-authenticate');
      }
      return { checked: true, processed: 0, error: 'No records data' };
    }

    let processed = 0;
    const rate = await getExchangeRate();

    for (const record of data.data) {
      const recordId = record.id || record.transactionId || `${record.date}_${record.otherParty}`;
      if (processedTransfers.has(recordId)) continue;

      const msg = record.message || record.description || record.text || '';
      const sender = record.otherParty || record.from || record.number || '';

      const amountMatch = msg.match(/(\d+)/);
      const isTransfer = msg.includes('تحويل') || msg.includes('رصيد') || msg.includes('transfer') || msg.includes('balance');

      if (isTransfer && amountMatch && sender) {
        const amountIQD = parseInt(amountMatch[1]);
        const creditAmount = Math.floor((amountIQD / rate) * 100) / 100;

        if (creditAmount > 0) {
          const cleanSender = sender.replace(/[^0-9]/g, '');
          
          const userQuery = await db.execute({
            sql: `SELECT * FROM rx_users WHERE id LIKE ? OR instr(id, ?) > 0 OR name LIKE ?`,
            args: [`%${cleanSender}%`, cleanSender, `%${cleanSender}%`]
          });

          if (userQuery.rows.length > 0) {
            const targetUser = userQuery.rows[0];
            const newBal = Number(targetUser.balance) + creditAmount;
            
            await db.execute({
              sql: "UPDATE rx_users SET balance = ? WHERE id = ?",
              args: [newBal, String(targetUser.id)]
            });

            const txnId = `TXN-AC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await db.execute({
              sql: `INSERT INTO rx_transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                txnId,
                `شحن رصيد المحفظة عبر آسياسيل (${amountIQD} $)`,
                String(targetUser.name || 'مجهول'),
                creditAmount,
                'مكتمل',
                new Date().toISOString().split('T')[0],
                'bg-[#E91E63]',
                '',
                0.0,
                creditAmount
              ]
            });

            console.log(`[Asiacell Records] Auto-credited $${creditAmount} (IQD ${amountIQD}) to ${targetUser.name} from ${sender}`);
            processed++;
          }
        }
        processedTransfers.add(recordId);
      }
    }

    return { checked: true, processed, total: data.data.length };
  } catch (err: any) {
    console.error('[Asiacell Records] Error:', err.message);
    return { checked: false, error: err.message };
  }
}

setInterval(() => {
  if (adminSession.authenticated) {
    checkRecordsAndCredit().catch(() => {});
  }
}, 45 * 1000);

app.post("/api/asiacell/login", async (req, res) => {
  try {
    const { phone, userId } = req.body;
    if (!phone || !userId) {
      return res.status(400).json({ error: 'رقم الهاتف والـ ID الخاص بالمستخدم مطلوبان' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!/^07\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'رقم غير صالح. يجب أن يبدأ بـ 07 ويتكون من 11 رقماً' });
    }

    const deviceId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    const r = await fetch(`${AC_API}/api/v1/login?lang=ar`, {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Deviceid': deviceId },
      body: JSON.stringify({ captchaCode: '', username: cleanPhone }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Client] Login requested for ${cleanPhone}:`, JSON.stringify(data));

    const pidMatch = (data.nextUrl || '').match(/PID=([^&]+)/);
    const pid = pidMatch ? pidMatch[1] : '';

    asiacellSessions.set(sessionId, {
      phone: cleanPhone,
      deviceId,
      userId,
      pid,
      accessToken: null,
      username: '',
      amount: 0,
      step: 'otp_sent',
      createdAt: Date.now(),
    });

    res.json({ success: true, sessionId, message: data.message || 'تم إرسال رمز التحقق OTP بنجاح' });
  } catch (err: any) {
    console.error('[Asiacell Client Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/verify-otp", async (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    const session = asiacellSessions.get(sessionId);
    if (!session) {
      return res.status(400).json({ error: 'منتهية صلاحية الجلسة، يرجى إعادة المحاولة' });
    }

    const r = await fetch(`${AC_API}/api/v1/smsvalidation?lang=ar`, {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Deviceid': session.deviceId },
      body: JSON.stringify({ PID: session.pid, passcode: otp }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Client] OTP Verified for ${session.phone}:`, JSON.stringify(data));

    if (data.access_token) {
      session.accessToken = data.access_token;
      session.step = 'authenticated';
      asiacellSessions.set(sessionId, session);
      res.json({ success: true, message: 'تم التحقق من الحساب بنجاح' });
    } else {
      res.json({ success: false, message: data.message || 'رمز OTP غير صالح' });
    }
  } catch (err: any) {
    console.error('[Asiacell Client Verify Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/topup", async (req, res) => {
  try {
    const { sessionId, voucher, username } = req.body;
    const session = asiacellSessions.get(sessionId);
    
    if (!session) {
      return res.status(400).json({ error: 'منتهية جلسة تسجيل الدخول، يرجى البدء من جديد' });
    }
    if (!voucher || voucher.trim().length < 4) {
      return res.status(400).json({ error: 'رقم كارت التعبئة مطلوب' });
    }
    if (!username) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب لتعبئة محفظته' });
    }

    const effectiveToken = session.accessToken || adminSession.accessToken;
    const effectiveDeviceId = session.deviceId || adminSession.deviceId;

    if (!effectiveToken) {
      return res.status(400).json({ error: 'بوابة شحن كروت آسياسيل غير متصلة حالياً، يرجى مراجعة الدعم الفني' });
    }

    const userQuery = await db.execute({
      sql: "SELECT * FROM rx_users WHERE id = ? OR name = ? OR email = ?",
      args: [username.trim(), username.trim(), username.trim()]
    });

    let targetUser;
    if (userQuery.rows.length === 0) {
      const fallbackId = `user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackName = username.includes('@') ? username.split('@')[0] : username.trim();
      const joinDate = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: "INSERT INTO rx_users (id, name, email, balance, joinDate, status, avatarLetter) VALUES (?, ?, ?, 0.0, ?, 'نشط', ?)",
        args: [fallbackId, fallbackName, username.trim().includes('@') ? username.trim() : `${fallbackId}@rixon.com`, joinDate, fallbackName.charAt(0)]
      });
      console.log(`[Auto Register] Created new user ${fallbackName} during top-up.`);
      const newQuery = await db.execute({
        sql: "SELECT * FROM rx_users WHERE id = ?",
        args: [fallbackId]
      });
      targetUser = newQuery.rows[0];
    } else {
      targetUser = userQuery.rows[0];
    }

    const authHeaders = {
      'Host': 'odpapp.asiacell.com',
      'Cache-Control': 'no-cache',
      'Deviceid': effectiveDeviceId,
      'X-Os-Version': '9',
      'X-Device-Type': '[Android][google][G011A 9][P][HMS][4.2.1:90000263]',
      'X-Odp-App-Version': '4.2.1',
      'X-From-App': 'odp',
      'X-Odp-Channel': 'mobile',
      'X-Screen-Type': 'MOBILE',
      'Authorization': `Bearer ${effectiveToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'okhttp/5.0.0-alpha.2',
      'Connection': 'keep-alive',
    };

    console.log(`[Asiacell Card Recharge] Charging to admin card...`);

    const topupRes = await fetch(`${AC_API}/api/v1/top-up?lang=ar&theme=avocado`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        msisdn: '',
        rechargeType: 1,
        voucher: voucher.trim(),
      }),
    });
    const topupData: any = await topupRes.json();
    console.log(`[Asiacell TopUp Res]:`, JSON.stringify(topupData));

    if (!topupData.success) {
      return res.json({ success: false, message: topupData.message || 'فشل شحن كارت تعبئة الرصيد. تأكد من صحة الرمز' });
    }

    let finalAmount = 0;
    if (topupData.analyticData?.params?.['Recharge Amount']) {
      finalAmount = Math.floor(Number(topupData.analyticData.params['Recharge Amount']));
    } else if (topupData.data?.amount) {
      finalAmount = parseInt(topupData.data.amount);
    } else if (topupData.amount) {
      finalAmount = parseInt(topupData.amount);
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.json({ success: false, message: 'تم تفعيل كرت الشحن لكن لم يستطع النظام رصد قيمته، تواصل مع المشرف فوراً' });
    }

    const creditAmount = finalAmount;

    if (creditAmount > 0) {
      const newBal = Number(targetUser.balance) + creditAmount;
      await db.execute({
        sql: "UPDATE rx_users SET balance = ? WHERE id = ?",
        args: [newBal, String(targetUser.id)]
      });

      const txnId = `TXN-AC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: `INSERT INTO rx_transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          txnId,
          `شحن كارت تعبئة آسياسيل (${finalAmount} $)`,
          String(targetUser.name || 'مجهول'),
          creditAmount,
          'مكتمل',
          new Date().toISOString().split('T')[0],
          'bg-[#E91E63]',
          '',
          0.0,
          creditAmount
        ]
      });

      console.log(`[Asiacell Card Recharge] Charged ${finalAmount} IQD. Added ${creditAmount} to ${targetUser.name}`);
    }

    asiacellSessions.delete(sessionId);

    res.json({
      success: true,
      amountIQD: finalAmount,
      credited: creditAmount,
      message: `تم شحن كود التعبئة بنجاح! تم إضافة ${creditAmount} $ إلى رصيدك.`
    });
  } catch (err: any) {
    console.error('[Asiacell Card TopUp Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/transfer", async (req, res) => {
  try {
    const { sessionId, amount, username } = req.body;
    const session = asiacellSessions.get(sessionId);

    if (!session || !session.accessToken) {
      return res.status(400).json({ error: 'منتهية جلسة تسجيل الدخول، يرجى البدء من جديد' });
    }

    const amountIQD = parseInt(amount);
    if (!amountIQD || amountIQD < 250) {
      return res.status(400).json({ error: 'الحد الأدنى لتحويل الرصيد هو 250 دينار عراقي' });
    }

    if (!username) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const userQuery = await db.execute({
      sql: "SELECT * FROM rx_users WHERE id = ? OR name = ? OR email = ?",
      args: [username.trim(), username.trim(), username.trim()]
    });

    let targetUser;
    if (userQuery.rows.length === 0) {
      const fallbackId = `user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackName = username.includes('@') ? username.split('@')[0] : username.trim();
      const joinDate = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: "INSERT INTO rx_users (id, name, email, balance, joinDate, status, avatarLetter) VALUES (?, ?, ?, 0.0, ?, 'نشط', ?)",
        args: [fallbackId, fallbackName, username.trim().includes('@') ? username.trim() : `${fallbackId}@rixon.com`, joinDate, fallbackName.charAt(0)]
      });
      console.log(`[Auto Register] Created new user ${fallbackName} during transfer.`);
      const newQuery = await db.execute({
        sql: "SELECT * FROM rx_users WHERE id = ?",
        args: [fallbackId]
      });
      targetUser = newQuery.rows[0];
    } else {
      targetUser = userQuery.rows[0];
    }
    const storePhone = await getStorePhone();
    
    if (!storePhone || storePhone === '07700000000') {
      return res.status(400).json({ error: 'رقم هاتف المتجر المستلم لم يتم تهيئته بعد، تواصل مع المشرف' });
    }

    const authHeaders = {
      ...BASE_HEADERS,
      'Deviceid': session.deviceId,
      'Authorization': `Bearer ${session.accessToken}`,
      'X-Screen-Type': 'MOBILE',
    };

    console.log(`[Asiacell Credit Transfer] Transferring ${amountIQD} IQD from ${session.phone} to store phone ${storePhone}`);

    const r = await fetch(`${AC_API}/api/v1/credit-transfer/start?lang=ar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: amountIQD,
        receiverMsisdn: storePhone,
      }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Credit Transfer Start Res]:`, JSON.stringify(data));

    if (!data.success) {
      return res.json({ success: false, message: data.message || 'فشلت عملية تحويل الرصيد، يرجى التأكد من توفر الرصيد الكافي بهاتفك' });
    }

    session.amount = amountIQD;
    session.username = username.trim();
    session.transferPid = data.PID || '';
    session.step = 'transfer_initiated';
    asiacellSessions.set(sessionId, session);

    res.json({
      success: true,
      message: data.message || 'تم إرسال رمز تأكيد تحويل الرصيد OTP إلى هاتفك'
    });
  } catch (err: any) {
    console.error('[Asiacell Transfer Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/confirm", async (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    const session = asiacellSessions.get(sessionId);

    if (!session || session.step !== 'transfer_initiated') {
      return res.status(400).json({ error: 'الجلسة منتهية أو لم يتم بدأ تحويل الرصيد' });
    }

    const authHeaders = {
      ...BASE_HEADERS,
      'Deviceid': session.deviceId,
      'Authorization': `Bearer ${session.accessToken}`,
      'X-Screen-Type': 'MOBILE',
    };

    const r = await fetch(`${AC_API}/api/v1/credit-transfer/do-transfer?lang=ar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ PID: session.transferPid, passcode: otp }),
    });
    const data: any = await r.json();

    console.log(`[Asiacell Credit Transfer Do Res]:`, JSON.stringify(data));

    const creditAmount = session.amount;

    let transactionCompleted = false;
    let finalMessage = 'تم تحويل الرصيد بنجاح!';

    if (data.success || data.message?.includes('نجاح') || data.message?.includes('تمت')) {
      transactionCompleted = true;
    } else {
      transactionCompleted = !!data.success;
      finalMessage = data.message || 'فشل رمز تأكيد التحويل';
    }

    if (!transactionCompleted) {
      return res.json({ success: false, message: finalMessage });
    }

    const userQuery = await db.execute({
      sql: "SELECT * FROM rx_users WHERE id = ? OR name = ? OR email = ?",
      args: [session.username, session.username, session.username]
    });

    if (userQuery.rows.length > 0) {
      const targetUser = userQuery.rows[0];
      const newBal = Number(targetUser.balance) + creditAmount;
      
      await db.execute({
        sql: "UPDATE rx_users SET balance = ? WHERE id = ?",
        args: [newBal, String(targetUser.id)]
      });

      const txnId = `TXN-AC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.execute({
        sql: `INSERT INTO rx_transactions (id, productName, customerName, price, status, date, iconBg, imageUrl, store_share, vendor_share)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          txnId,
          `تحويل رصيد آسياسيل (${session.amount} $)`,
          String(targetUser.name || 'مجهول'),
          creditAmount,
          'مكتمل',
          new Date().toISOString().split('T')[0],
          'bg-[#E91E63]',
          '',
          0.0,
          creditAmount
        ]
      });

      console.log(`[Asiacell] Successfully processed and added ${creditAmount} to ${targetUser.name}`);
    }

    asiacellSessions.delete(sessionId);

    res.json({
      success: true,
      credited: creditAmount,
      amountIQD: session.amount,
      message: `تم التحويل بنجاح! تمت إضافة ${creditAmount} $ إلى رصيد محفظتك الرقمية.`
    });
  } catch (err: any) {
    console.error('[Asiacell Transfer Confirm Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asiacell/balance", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = asiacellSessions.get(sessionId);
    if (!session || !session.accessToken) {
      return res.status(400).json({ error: 'منتهية جلسة تسجيل الدخول، يرجى البدء من جديد' });
    }

    const r = await fetch(`${AC_API}/api/v5/avocado/home?lang=ar&theme=avocado`, {
      headers: {
        ...BASE_HEADERS,
        'Deviceid': session.deviceId,
        'Authorization': `Bearer ${session.accessToken}`,
        'X-Screen-Type': 'MOBILE',
      },
    });
    const data: any = await r.json();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================

app.post("/api/messages", async (req, res) => {
  try {
    const { sender, senderName, text, userId, image, replyToId, replyToText } = req.body;
    const msgId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Store user message
    await db.execute({
      sql: "INSERT INTO rx_messages (id, sender, senderName, text, timestamp, userId, image, isRead, replyToId, replyToText) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      args: [msgId, sender, senderName, text || '', timestamp, userId || senderName, image || '', replyToId || null, replyToText || null]
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

    const replyId = `msg-${Date.now()}-reply`;
    const replyTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Store reply in db as unread for the user (isRead = 0)
    await db.execute({
      sql: "INSERT INTO rx_messages (id, sender, senderName, text, timestamp, userId, image, isRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
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
