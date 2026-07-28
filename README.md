# متجر ريكسون الرقمي R3XON

منصة متكاملة لبيع الاشتراكات والخدمات الرقمية والحسابات المميزة — React 19 + Vite + Express + Turso/LibSQL مع محفظة رصيد، بوابة شحن آسياسيل، دعم فني مباشر، ولوحة تحكم إدارية شاملة.

## التشغيل

```bash
npm install
npm run dev        # http://localhost:3000 (قاعدة البيانات تُنشأ وتُبذر تلقائياً)
```

## أدوات التطوير والاختبار

| الأمر | الوصف |
|---|---|
| `npm run typecheck` | فحص أنواع TypeScript |
| `npm run lint:eslint` | كشف الأخطاء المنطقية وهُواة React |
| `npm test` | اختبارات الوحدة (vitest) |
| `npm run test:smoke` | 41 فحصاً حياً لكل نقاط الـ API |
| `npm run test:e2e` | رحلات المستخدم الحرجة بمتصفح Chromium حقيقي |
| `npm run screenshot` | لقطات شاشة آلية لكل صفحات التطبيق |
| `npm run doctor` | تشخيص البيئة كاملة بضغطة واحدة |

📖 التفاصيل الكاملة في [DEVELOPMENT.md](./DEVELOPMENT.md)
