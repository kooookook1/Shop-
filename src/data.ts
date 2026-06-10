import { Product, User, Order, Transaction, Message } from './types';

export const initialProducts: Product[] = [
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
    features: [
      'الوصول السريع والخاص خلال أوقات الذروة',
      'إتاحة موديلات GPT-4 و GPT-4o المتقدمة',
      'تحليل البيانات المتقدم البرمجي وتصفح الإنترنت',
      'صناعة الصور الاحترافية عبر DALL-E 3',
      'دعم فني أولوي وأسرع استجابة'
    ],
    gradientClass: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 50%, #4c1d95 100%)'
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
    features: [
      'باقة ULTRA HD و 4K المتميزة لجميع الأفلام والمسلسلات',
      'ملف خاص بك محمي برمز مرور من اختيارك',
      'تشغيل غير محدود على مختلف شاشات اللاب توب والتلفاز والجوال',
      'التحميل متاح للمشاهدة بدون إنترنت على أي جهاز',
      'ضمان ذهبي ممتد طوال فترة الاشتراك'
    ],
    gradientClass: 'linear-gradient(135deg, #111827 0%, #7f1d1d 100%)'
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
    features: [
      'استماع بدون إعلانات نهائياً',
      'تحميل وتنزيل الأغاني والبودكاست للمشاهدة دون اتصال',
      'جودة صوت فائقة النقاء وعالية الدقة (حتى 320kbps)',
      'تشغيل غير المحدود وتخطي مرن للأغاني',
      'فولدر خاص بك متوافق مع حسابك الأصلي'
    ]
  },
  {
    id: 'prod-applemusic',
    name: 'Apple Music',
    category: 'entertainment',
    price: 49.99,
    originalPrice: 59.00,
    period: 'اشتراك عائلي',
    stock: 40,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL6EejQSWGbPYwLfPiN11NrgTrwzEidZrX9SK6lftsYK56rEuZUpb3W7qUR1pa3pEb4eB-Ei7Qm_UCNEjYMwTsmrdW24XlY-1660qfLfIaLVDAzpk7tP6BirTkbEM514I3V_C0PQpE5S0Ik1fiF733rmv0MlC4ItbjZqBIqhrDz3o3U4CBWDiQIYcGFjUJZrPoTE_ZfFKXMsQWBYNUNawAGkVJFyRVz84kCkjocJ9bqNt37NHZOJQ12rMQMAl3Ewqivjf0iiYqyUuD',
    iconName: 'music',
    rating: 4.6,
    reviewsCount: 130,
    features: [
      'مكتبة موسيقية ضخمة بدون إعلانات مزعجة',
      'ميزة Spatial Audio وصوت Dolby Atmos المجسم ثلاثي الأبعاد',
      'متابعة ومزامنة الكلمات مع الأغنية فورياً',
      'تحميل أكثر من 100 ألف أغنية لمكتبتك المباشرة'
    ]
  },
  {
    id: 'prod-discord',
    name: 'Discord Nitro',
    category: 'games',
    price: 15.99,
    originalPrice: 20.00,
    period: 'اشتراك لمدة شهر',
    stock: 120,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB859Zowy1tQ4rX77__NwUZMaWXW3jD4cYT9OL1-0ELh_fw0trkfUNC8WV4I4GbjIz3Oj8WWTZa4-_QQW836p9Urfc290pCpeBgSVQpQMwo-_w7-1AT3GLv621wFnhwEROsub2P3cTlfHUox0R4bXB5K3X0HguqLu5yg_jfHlVkVfUe7S_aUVt6pQEKeq89z4rF1XzhLz6DzmwqVNscDAq0gmnmqBX5mcnVg7z5cq1BseI_33xeQlw_dcqgITxLza0LpdeGgm-_9NSi',
    iconName: 'activity',
    rating: 4.9,
    reviewsCount: 412,
    features: [
      '2 بوست سيرفر مجاني لترقية خادمك المفضل',
      'إمكانية إرسال ملفات ضخمة بحجم يصل لـ 500 ميجا بايت',
      'استخدام الإيموجيات والستيكرات المتحركة في كل مكان',
      'شعار النيترو المميز على بروفايلك الخاص',
      'مستوى جودة بث فيديو خارقة تصل لـ 4K و 60FPS'
    ]
  },
  {
    id: 'prod-adobe',
    name: 'Adobe Creative Cloud',
    category: 'productivity',
    price: 199.99,
    originalPrice: 250.00,
    period: 'اشتراك لمدة شهر كامل',
    stock: 10,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCxJY6X1pf9FgA5X5MGzRhe31chUqOl_mhvfCaYWySMmuwl4WI9v1NEC84jNdAe3aQkn0VAPKZ5OMmjPU4JouekfZkWwjLWugmO8WkcxJbtHqmq3hPSjOKW4zHgF5yd6ShSUWyuB-S1dEDJWUC3bm50S3S6bi2jnTofMpoEq8x-G3etNoKrTllSYAz_JbqBiDAN80ZMdUGPTl7qyO7evHebNlhbc1xA-0QwVJUFn9s8X0RFQFZgcHrjUuzHMhS7VXpYoQuP1cWxjLF',
    iconName: 'layout',
    rating: 4.8,
    reviewsCount: 154,
    features: [
      'صلاحية كاملة لأكثر من 20 تطبيق تصميم احترافي (Photoshop, Illustrator, Premiere, etc.)',
      'شامل ميزات وموديلات الذكاء الاصطناعي التوليدي Adobe Firefly',
      'مساحة تخزين سحابية ضخمة بمقدار 100 جيجا بايت',
      'تحديثات فورية للأدوات مباشرة من أدوبي لابتوب/بيسي',
      'تفعيل رسمي بريدك الإلكتروني والاسم الشخصي'
    ]
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
    features: [
      'تغيير نغمة رنين الإشعارات وصوت التنبيه الحصري مخصصاً لـ VIP',
      'دبوس محادثة صديقك المفضل وتثبيته في صدارة المحادثات دائماً #1',
      'أيقونة وخلفية بروفايل مذهلة وحصرية لأعضاء Snapchat+ وبادج مميز',
      'معرفة من أعاد مشاهدة ستوري السناب الخاص بك بدقة تامة',
      'استخدام أداة الذكاء الاصطناعي My AI المتطورة في أي وقت'
    ]
  },
  {
    id: 'prod-tiktok',
    name: 'زيادة متابعين تيك توك 1,000',
    category: 'productivity',
    price: 29.99,
    originalPrice: 40.00,
    period: '1,000 متابع حقيقي',
    stock: 1000,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoYm4uM1XuytaiNsfvEvUi5m9XnaAa7MmvoXl1RYfgLQWTbc6zhqxooUYjvd8b-rbdkjPIH7L17maA7iOG0pJ070LQgt-vOTKYZv8LEu-RFigiQT8YBehC4aWiUPGoMwkVsCa8TTKLDY3edU6DR1A1UDW-sCA2tRZi_hLKet_L31P1B6raFbEZ4NUBwEgtKhyC0Pq_qE9aVp4aBEesV6zO97NPtfQv4ctKg_U8RxDWmNGfpnXC7z4mZdBuxe8fiYt8tF-miy-oOPjq',
    iconName: 'user-plus',
    rating: 4.9,
    reviewsCount: 650,
    features: [
      'ارسال 1,000 متابع في غضون ساعات قليلة فقط',
      'متابعين آمنين على حسابك 100% وبدون سحب نهائياً',
      'لا نحتاج لطلب كلمة السر الخاصة بك، فقط رابط بروفايل الحساب!',
      'دعم وضمان تعويض في حال انخفاض العدد لمدة شهر كامل'
    ]
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
    features: [
      'شحن رسمي وفوري مباشر عبر الايدي (ID)',
      'توفير الكود وتفعيله فورياً عبر موقع Midasbuy الرسمي لـ PUBG MOBILE',
      'متاح لإجمالي المبيعات والبطولات وتفعيل الرويال باس فوراً',
      'دعم وضمان شحن رسمي موثوق مائة بالمائة'
    ]
  },
  {
    id: 'prod-stc',
    name: 'كود STC سوا ستار بلس',
    category: 'productivity',
    price: 230.00,
    period: 'باقة شحن',
    stock: 5,
    iconName: 'smartphone',
    rating: 4.8,
    reviewsCount: 30,
    features: [
      'توفير رصيد فوري وسريع بقيمة الباقة شحن رسمي لشرائح سوا',
      'باقة تشمل مكالمات وإنترنت اللامحدود داخل الشبكة',
      'كود التفعيل يصل فورياً في تفاصيل الطلب الخاص بك'
    ]
  },
  {
    id: 'prod-canva',
    name: 'اشتراك كانفا برو',
    category: 'productivity',
    price: 49.99,
    period: 'باقة سنوية',
    stock: 30,
    iconName: 'palette',
    rating: 4.7,
    reviewsCount: 140,
    features: [
      'باقة تصميم Canva Pro كاملة الخصائص والميزات الاحترافية',
      'تحميل قوالب وتصاميم اللامحدودة والتصميم بصيغ فائقة الدقة',
      'إزالة خلفيات الصور ومقاطع الفيديو بنقرة واحدة فائقة الاحترافية'
    ]
  },
  {
    id: 'prod-vpn',
    name: 'اشتراك VPN خاص سريع',
    category: 'productivity',
    price: 29.95,
    period: 'باقة شهرية',
    stock: 10,
    iconName: 'shield',
    rating: 4.6,
    reviewsCount: 88,
    features: [
      'خادم سيرفر فائق السرعة والأمان لتصفح آمن وسري',
      'فك حظر جميع المواقع والتطبيقات وحماية الخصوصية الرقمية',
      'تطبيق متوافق مع كافة أنظمة تشغيل أبل وأندرويد وويندوز'
    ]
  }
];

export const initialUsers: User[] = [
  {
    id: 'user-ahmed',
    name: 'أحمد علي',
    email: 'ahmed_client@gmail.com',
    balance: 1200.00,
    joinDate: '2024-05-15',
    status: 'VIP',
    avatarLetter: 'أ'
  },
  {
    id: 'user-fatima',
    name: 'فاطمة حسن',
    email: 'fatty_hasan@gmail.com',
    balance: 540.00,
    joinDate: '2024-04-12',
    status: 'نشط',
    avatarLetter: 'ف'
  },
  {
    id: 'user-mohammad',
    name: 'محمد خالد',
    email: 'mr.khaled@outlook.com',
    balance: 0.00,
    joinDate: '2024-05-20',
    status: 'محظور',
    avatarLetter: 'م'
  },
  {
    id: 'user-sara',
    name: 'سارة محمود',
    email: 'sara_design@snap.com',
    balance: 890.00,
    joinDate: '2024-05-05',
    status: 'نشط',
    avatarLetter: 'س'
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ord-10492',
    productId: 'prod-canva',
    productName: 'اشتراك متجر ريكسون بلس سنوي',
    price: 209.00,
    date: '2026-06-01',
    status: 'تم تسليم الطلب',
    credentials: {
      username: 'ahmed_user',
      password: 'P@ssw0rd123!'
    },
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQMS-MCsnBq2NZUQcwC7gUDv88fD7U68h2HKCXHXMOZFVX45TZL6Kw1EbMw67RCyZv2bXlGK8uD5A7OqefZ4O7e0-cvupQFg-cZQZUU3RjVa1LnDfBmwbatssWdWV0RNfx8RYEjd7mgUie25R9sdbKGAc3RXka9hG2FSQfkRg1F3gWsUs3WerEd9U-6InQUPocm3PbKxjPfvcAUHVnO-5CYRqZqe7XLGHg_hxcp_irCM6WIpsqCmfyrVfzDmDAPh8LEV3bdLLLwCPX'
  },
  {
    id: 'ord-10490',
    productId: 'prod-pubg',
    productName: 'شحن شدات ببجي 660UC',
    price: 45.00,
    date: '12/05/2024',
    status: 'مكتمل',
    credentials: {
      code: 'TR-623V4-PUBG-UC660'
    },
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDOSlnh8_DPFEpa-9U-o7j8A3KJE0PX-N1_Cv5_qO-VWn-gGvaByaflsoqHrh0m7YqJJP8_savJuHifuxTTHztb8xSFmC_Lfm1WOt0vIRXy6FoPHjjYb_kl534Im_VX-0-m3MLNIdnxu2oGeO9Yf9xA3u-DyU4y3hcDjzRMyyWcm8alN9ssrQ1VafKDmckIxzl29R8IGAhf-IFwiK_xY_cLWR3cGA1kCHnKmjVB47Zq-FqFV4-kvON1h1RtP6RX08K0FEKDzMg6mkb'
  },
  {
    id: 'ord-10488',
    productId: 'prod-netflix',
    productName: 'اشتراك نتفلكس 4K شهر',
    price: 29.00,
    date: '01/05/2024',
    status: 'منتهي',
    credentials: {
      username: 'netflix_premium_user',
      password: 'MyPasswordNetflix'
    },
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRrWN0OaAv3gwd72tYj-1BOoOJ3uXRPZcH1sAbCILFWFZfypJEcJN7enzKsz9b1C6BYynIVhtunsooZzGVivAE7GaAjYqF8uaBfTVSt2F_qYsFlE9Ap4kikFyPi0HdEvkuCfHIYY_dQXkc5XfxEB7-h8r7D6FWsMyUvTAyqovUoVdj-2SG5P4c-1GKeZ4F5sb_BaPnJ7Ix0yZAnMz1NPpazvt6UCOI7jAYS6Zy-tQczBSocWsnAVRVz71FhdzWacfjJ9YocmnMYA5U'
  }
];

export const initialTransactions: Transaction[] = [
  {
    id: 'TXN-1011',
    productName: 'اشتراك تيك توك بلس',
    customerName: 'أحمد علي',
    price: 50.00,
    status: 'مكتمل',
    date: '2026-06-09',
    iconBg: 'bg-black',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoYm4uM1XuytaiNsfvEvUi5m9XnaAa7MmvoXl1RYfgLQWTbc6zhqxooUYjvd8b-rbdkjPIH7L17maA7iOG0pJ070LQgt-vOTKYZv8LEu-RFigiQT8YBehC4aWiUPGoMwkVsCa8TTKLDY3edU6DR1A1UDW-sCA2tRZi_hLKet_L31P1B6raFbEZ4NUBwEgtKhyC0Pq_qE9aVp4aBEesV6zO97NPtfQv4ctKg_U8RxDWmNGfpnXC7z4mZdBuxe8fiYt8tF-miy-oOPjq'
  },
  {
    id: 'TXN-1012',
    productName: 'خدمات سناب شات',
    customerName: 'سارة محمد',
    price: 120.00,
    status: 'قيد الانتظار',
    date: '2026-06-08',
    iconBg: 'bg-yellow-400',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQMS-MCsnBq2NZUQcwC7gUDv88fD7U68h2HKCXHXMOZFVX45TZL6Kw1EbMw67RCyZv2bXlGK8uD5A7OqefZ4O7e0-cvupQFg-cZQZUU3RjVa1LnDfBmwbatssWdWV0RNfx8RYEjd7mgUie25R9sdbKGAc3RXka9hG2FSQfkRg1F3gWsUs3WerEd9U-6InQUPocm3PbKxjPfvcAUHVnO-5CYRqZqe7XLGHg_hxcp_irCM6WIpsqCmfyrVfzDmDAPh8LEV3bdLLLwCPX'
  },
  {
    id: 'TXN-1013',
    productName: 'بطاقة STC شحن',
    customerName: 'خالد عمر',
    price: 200.00,
    status: 'ملغى',
    date: '2026-06-07',
    iconBg: 'bg-indigo-600'
  },
  {
    id: 'TXN-1014',
    productName: 'اشتراك شاهد VIP',
    customerName: 'منى عبدالله',
    price: 35.00,
    status: 'مكتمل',
    date: '2026-06-06',
    iconBg: 'bg-emerald-400',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk3ua0v_ixK1cjQpuX2zx381_jDisEgkTyqTd62PcpvJpbjq4Z4ExkQKeNnBfiXZY_juu5AVDPYLVfqneva8GUBkxZNFT33ZkhrHDrHtBfbhOCjmqU4iawoFyT5oe5jo2ArhNB7yASsaUG8Wm-jVs2CZI59_6b-BM76FGIYiDYCbExvfSqV1GzcU5-Q6id1wtuXssIvMyzmZZg3fHZpX0Y4J7VuU6Upz8yaNEPng7kMY_QJpKO4gv6mRtqIVzCWhVMVOLDce5pp86w'
  }
];

export const initialMessages: Message[] = [
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
    senderName: 'أحمد',
    text: 'أهلاً بك خالد، لدي استفسار حول كيفية استلام حسابي المشترك لـ ChatGPT Plus وتفعيله؟',
    timestamp: '9:31 AM'
  },
  {
    id: 'msg-3',
    sender: 'agent',
    senderName: 'خالد العمري',
    text: 'يسعدني إجابتك أخي أحمد. بمجرد تأكيد الدفع والطلب، سيظهر الحساب تلقائياً في صفحة "طلباتي" بالاسم والرقم السري معاً لتسجيل الدخول الفوري دون انتظار!',
    timestamp: '9:32 AM'
  }
];
