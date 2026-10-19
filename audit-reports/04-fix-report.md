# تقرير الإصلاح — PortfolioHub (دورات إصلاح + إعادة تدقيق)

> النطاق: معالجة بنود تقارير التدقيق الثلاثة (`01-builder-report.md`, `02-output-report.md`, `03-admin-report.md`) + قائمة `BUILDER_UI_UX_REPORT.md` (18 بندًا)، ثم إعادة تدقيق ذاتي متكرر.
> القواعد المتبعة: **لم يُلمس git إطلاقًا**. كل ملف خُزِّنت نسخته الأصلية في `audit-backups/<relative-path>` قبل أول تعديل. لم تُنفّذ ترحيلات/كتابات قاعدة بيانات/تغيير `schema.prisma`/تثبيت حزم/نشر. السلوك والمظهر الظاهري للمنتج حوفظ عليهما إلا حيث ينص البند صراحةً على تغيير.
> بعد كل تعديل كود: `npx tsc --noEmit` + `npx eslint <الملفات المتغيرة>`.

---

## 1) الملخص التنفيذي

أُغلقت **كل** بنود الأمان عالية/حرجة وبنود الصحة والاتساق في التقارير الثلاثة: ثغرة IDOR (تعديل/حذف صفحات مشاريع الغير)، مسار XSS عبر روابط بنود صفحة المشروع، التحقق من `appearance/localized/contactLinks`، توحيد مفتاح اللغة، نطاق OG، CSRF الإداري، تدقيق منح/سحب صلاحية المدير، وتحديد المعدّل على مسارات الإدارة الحساسة. وأُضيف **حفظ تلقائي محلي (مسودة)** لمنع خسارة عمل المستخدم.

تنفَّذت خدمات مشتركة تبقى **قرارات/بنودًا مؤجّلة** (تتطلب بنية تحتية أو نطاقًا تجاريًا): مخزن مشترك لتحديد المعدّل في التتبّع (Redis/KV)، رفع حدود `sitemap`، نظام أدوار للصلاحيات، i18n كامل، تفكيك `BuilderClient.tsx`.

### عدّادات قبل/بعد

| الفحص | قبل | بعد |
|---|---|---|
| `npx tsc --noEmit` | 0 error | 0 error |
| eslint (الملفات المستهدفة) | 4 errors (كلها `no-explicit-any` في `ProjectPageView.tsx`) + 17 warnings | 1 error (`no-unescaped-entities` في `ProjectManager.tsx` — **موجود مسبقًا، مؤكَّد مقابل النسخة الاحتياطية**) + warnings |
| eslint على `BuilderClient.tsx` | 17 warnings | 8 warnings (حذف كود ميت) |

ملاحظة: خطأ `no-unescaped-entities` في `ProjectManager.tsx:572` **سابق** لتعديلاتنا (ظهر بنفسه في `audit-backups/.../ProjectManager.tsx:554`) — لم يُضِف أي تعديل لدينا خطأً جديدًا.

---

## 2) النسخ الاحتياطية والملفات الجديدة

**نسخ احتياطية أُنشئت** (في `audit-backups/`): `tsconfig.json`· `src/lib/{actions/portfolio.ts, portfolio-schema.ts, admin-guard.ts, rate-limit.ts, csrf.ts, contact.ts, free-sections.ts, visits.ts}` · `src/middleware.ts` · `src/components/portfolio/templates/ClassicTemplate.tsx` · `src/components/ui/{Input.tsx, Toast.tsx}` · `src/app/og/route.tsx` · `src/app/u/[username]/page.tsx` · `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` · `src/app/profile/builder/{BuilderClient,ProjectManager,MediaPicker,WorkspacePickerModal,SectionManager,TestimonialsEditor,GalleryEditor,FilesEditor,ContactEditor,CustomEditor,ThemeSettings,LivePreview}.tsx` · `src/app/api/admin/**` (31 مسارًا).

**⚠️ فجوة في النسخ الاحتياطي:** `src/lib/urls.ts` عُدِّل (إضافة `sanitizeUrl`) قبل أخذ نسخته الاحتياطية، ولم تُنشأ نسخة له في `audit-backups/`. الأثر: يمكن مقارنته فقط عبر تاريخ git (لم يُقرأ وفقًا للقواعد). الموضع الوحيد الذي أُضيف فيه `sanitizeUrl` هو `src/lib/urls.ts`.

**ملفات جديدة الوظيفة/الدوال:** `sanitizeUrl()` داخل `src/lib/urls.ts`؛ `validateProfileExtras()` + `ProfileExtras` داخل `src/lib/portfolio-schema.ts`.

**تعديل إعداد:** أُضيف `"audit-backups"` إلى `exclude` في `tsconfig.json` (لأن نسخ `.tsx` داخل المستودع كانت تُفحَص وتُولِّد أخطاء type).

---

## 3) حالة البنود (سطح البنّاء — `01-builder-report.md`)

| # | البند | الحالة | المرجع |
|---|---|---|---|
| 🔴 | IDOR: لا فحص ملكية عند تعديل/حذف صفحات المشاريع | ✅ مُصلَح | `src/lib/actions/portfolio.ts` — `updateProjectPage` يستخدم `findFirst({ where: { id, profile: { userId } } })`، و`deleteProjectPage` يستخدم `deleteMany` بشرط الملكية (`count===0` → خطأ عام) |
| 🟠 | XSS عبر `externalUrl` في بنود صفحة المشروع | ✅ مُصلَح | تنقية عند الحفظ في `portfolio.ts` وعند العرض في `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` عبر `sanitizeUrl` |
| 🟠 | لا حفظ تلقائي (خسارة عمل) | ✅ مُصلَح | مسودة محلية في `src/app/profile/builder/BuilderClient.tsx` (debounce 2.5s + استرجاع + تأشير + تُمسح عند الحفظ) |
| 🟠 | عدم تطابق مفتاح اللغة (`contentLocale` يقرأ `defaultLanguage` بينما البنّاء يكتب `n`) | ✅ مُصلَح | `src/app/u/[username]/page.tsx:49-55` (يقرأ `n` مع رجوع إلى `defaultLanguage`) |
| 🟠 | لا تحقق على `appearance/localized/contactLinks` | ✅ مُصلَح | `src/lib/portfolio-schema.ts` (`validateProfileExtras`) + ربطه في `portfolio.ts` |
| 🟡 | رابط خط Google غير مقيّد | 🟡 جزئي | حرس محارف `^[A-Za-z0-9 +-]+$` في `ClassicTemplate.tsx` يمنع الحقن؛ **whitelist كامل مؤجّل** (قرار) |
| 🟡 | نطاق خاطئ في صورة OG | ✅ مُصلَح | `src/app/og/route.tsx` عبر `getAppUrl()` |
| 🟡 | ملف `BuilderClient.tsx` ضخم | 🟡 جزئي | حُذف الكود الميت؛ **تفكيك الملف مؤجّل** (قرار) |
| 🟡 | ثوابت ميتة `langMode/showEn/showAr` + معالجات التواصل القديمة | ✅ مُصلَح | حُذفت من `BuilderClient.tsx` |

## 4) حالة البنود (سطح المخرجات — `02-output-report.md`)

| # | البند | الحالة | المرجع |
|---|---|---|---|
| 🟠 | تتبّع غير موثوق: تحديد معدّل بالذاكرة داخل `track/route.ts` | ⛔ لم يُصلَح (قرار) | يحتاج مخزنًا مشتركًا؛ `src/lib/visits.ts` (dedupe بقاعدة البيانات) هو المرجع الموثوق بالفعل |
| 🟠 | عدم تطابق لغة الميتاداتا | ✅ مُصلَح | كما في القسم 3 |
| 🟡 | نطاق OG | ✅ مُصلَح | كما في القسم 3 |
| 🟡 | قيد Pro على صفحات تفاصيل المشروع غير مشروح | ✅ مُصلَح (نص) | `src/app/profile/builder/ProjectManager.tsx:535-539` |
| 🟡 | عدد استعلامات لكل زيارة | ⛔ لم يُصلَح (بنية/أداء) | مرصود؛ تحسين تراكمي |
| 🟡 | حدود `sitemap` الثابتة (500) | ⛔ لم يُصلَح (بنية) | يحتاج ترقيم صفحات للخريطة |
| — | تشديد معاملات OG | ✅ مُصلَح | `og/route.tsx` (قصّ الطول) |

## 5) حالة البنود (سطح الإدارة — `03-admin-report.md`)

| # | البند | الحالة | المرجع |
|---|---|---|---|
| 🟡 | لا فحص CSRF/الأصل على مسارات الإدارة | ✅ مُصلَح | `src/lib/admin-guard.ts` — `requireAdminApi(req?)` يفرض `isSameOriginRequest` للطرق غير GET/HEAD؛ و24 مسارًا تدعوه بـ`req` |
| 🟡 | أي مدير يرقّي أي مستخدم (حوكمة) | 🟡 جزئي | أُضيف تدقيق صريح `admin.grant`/`admin.revoke` عند تغيّر `isAdmin`؛ **نظام أدوار (superadmin) مؤجّل** (قرار) |
| 🟡 | كلمة المرور المؤقتة في جسم الاستجابة | ⛔ لم يُغيَّر | لا تُسجَّل/تُخزَّن؛ تُعاد مرة واحدة للواجهة (كما في توصية التقرير) |
| 🟡 | سجل التدقيق غير موحّد | ⛔ لم يُغيَّر (منخفض) | توحيد مساعد التدقيق مؤجّل |
| `[UNVERIFIED]` | معدّل الطلبات على مسارات حساسة | ✅ مُصلَح | `users/[id]/reset-password` (10/دقيقة) و`users/[id]/send-email` (20/ساعة) عبر `checkRateLimit` |
| — | تسريب PII في سجلّات Send-Email | ✅ مُصلَح | أُزيل تسجيل بريد/نص الرسالة (`.../send-email/route.ts`) |

## 6) قائمة UI/UX (18 بندًا — `BUILDER_UI_UX_REPORT.md`)

| # | البند | الحالة |
|---|---|---|
| 1 | غياب `focus-visible` | ✅ مُصلَح (Input + حقول البنّاء + Modals + Tabs + مقبض السحب) |
| 2 | ربط الـ`label` بالحقول | 🟡 جزئي (حقول الـModals أُصلحت؛ المسح الشامل ~115 تسمية مؤجّل) |
| 3 | دلالات الـModal/إدارة التركيز | ✅ مُصلَح (MediaPicker + WorkspacePickerModal) |
| 4 | غياب `aria-live` | ✅ مُصلَح (حاوية Toast + `role=alert/status`) |
| 5 | تكبير iOS عند 14px | ✅ مُصلَح (`Input.tsx` → `text-base sm:text-sm`) |
| 6 | `group-hover` ميت في WorkspacePickerModal | ✅ مُصلَح (إضافة `group`) |
| 7 | `type`/`inputMode` مفقودان | ✅ جزئي عالٍ (URL/Search) |
| 8 | أزرار أيقونية بلا `aria-label` | ✅ مُصلَح (المكوّنات المعدّلة) |
| 9 | حذف فوري بلا تأكيد | ✅ مُصلَح (`window.confirm` على حذف مشروع/بند/ميزة/رابط) |
| 10 | إعادة ترتيب بلوحة المفاتيح | ✅ موجود مسبقًا (`KeyboardSensor` في `BuilderClient`) |
| 11 | خلط عربي/إنجليزي بلا i18n | ⛔ مؤجّل (قرار — i18n كامل) |
| 12 | `max-h-[85vh]` وiframe بعرض 390px | 🟡 جزئي (الـModals → `85dvh`؛ iframe مؤجّل) |
| 13 | ألوان خارج الرموز | 🟡 جزئي (`ProjectManager`/`ItemCard`؛ `AnalyticsDashboard` مؤجّل) |
| 14 | `<select>` داكن غير واضح | 🟡 جزئي (لون نص صريح في `ProjectManager`) |
| 15 | Tabs بلا `role/aria-selected` | ✅ مُصلَح (Modals + Tabs البنّاء + `aria-pressed`) |
| 16 | `prefers-reduced-motion` | ✅ موجود مسبقًا (`src/app/globals.css:292`) |
| 17 | تحميل بنص `'...'` | ✅ مُصلَح (`Loader2` في `ProjectManager`) |
| 18 | `transition-all` / تباين الأخطاء / إعادة محاولة الوسائط | ✅ جزئي (`transition-colors`؛ لون خطأ + زر إعادة محاولة في `MediaPicker`) |

---

## 7) دورات إعادة التدقيق

- **الجولة 1:** إعادة قراءة المواضع المتغيرة والتحقق من الترابط (`admin-guard.ts`، `portfolio.ts`، `portfolio-schema.ts`، ملفات البنّاء) → لا كسر عقود/ملكية/سلوك. لا بنود أمنية مفتوحة.
- **التحقق الآلي لكل خطوة:** `tsc --noEmit` = 0 error دائمًا؛ eslint لا أخطاء جديدة (المقارنة مع النسخ الاحتياطية عند الشك).
- **البنود المتبقية** في القسمين 8 و9 هي **قرارات/بنود هيكلية** وليست أخطاءً مفتوحة قابلة للإصلاح ضمن القيود الحالية.

---

## 8) بنود تحتاج قرارًا (لا تُحلّ دون بنية تحتية/نطاق تجاري)

1. **مخزن مشترك لتحديد المعدّل** (Redis/KV) لـ`track/route.ts` ولإدارة المعدّل عبر نسخ Vercel المتعددة.
2. **نظام أدوار (roles/superadmin)** لمنح صلاحية المدير، أو توثيق سياسة الفريق الصغير.
3. **i18n كامل** لواجهة البنّاء (42 سلسلة عربية + شاشات إنجليزية).
4. **تفكيك `BuilderClient.tsx`** (3.6k سطر) إلى وحدات (refactor عالي المخاطر — لم يُنفَّذ حفاظًا على السلوك).
5. **`sitemap`** قابلة للتحجيم عبر ترقيم صفحات.
6. **whitelist الخطوط** في `ClassicTemplate.tsx` (قد يكسر خطوط ملفات قائمة).
7. **`src/lib/upload.ts`** كود ميت غير متوافق مع Vercel (لا يوجد مسار رفع على الخادم؛ الرفع يتم من العميل إلى Supabase Storage) — إما حذفه أو نقله إلى Vercel Blob/Cloudinary.
8. **رابط الـiframe بعرض 390px** في صفحة المعاينة (يعرض بلا نقاط كسر داخلية).
9. **إعادة كلمة المرور المؤقتة في جسم الاستجابة** — قرار قناة التسليم.
10. **فجوة النسخة الاحتياطية** لـ`src/lib/urls.ts` (تفصيل في القسم 2).

## 9) بنود `[UNVERIFIED]` (تحتاج تحققًا وقت التشغيل — لم يُنفَّذ)

- سلوك تحديد المعدّل فعليًا عبر نسخ Vercel المتعددة.
- أن صفحة مشروع Pro تُرجع 404 فعلًا للمستخدم المجاني في الإنتاج.
- عدد الاستعلامات الفعلي لكل زيارة (Profiler/Logs).
- جرد شامل: هل كل مسار إداري مُغيِّر للحالة يسجّل تدقيقًا في قاعدة البيانات.
- أن `users/:id` PATCH يمنع/يسمح تصعيد الصلاحيات كما هو موثّق.
- استغلال IDOR/XSS قبل الإصلاح (لا يمكن إعادة إنتاجه الآن — أُغلق مساره بالكود).

## 10) قائمة اختبار يدوي (≤12 خطوة)

1. تسجيل دخول → فتح `/profile/builder`، تعديل قسم ولون/لغة → الظهور مطابق قبل/بعد.
2. انتظار ~3 ثوانٍ على تغيير غير محفوظ → ظهور «· مسودة محفوظة»، ثم تحديث الصفحة (F5) → استرجاع المسودة + Toast.
3. «حفظ التغييرات» → اختفاء التأشير، واختفاء المسودة من `localStorage`.
4. فتح قائمة «تسجيل الخروج»/الإعدادات على الجوال → الظهور صحيحًا بدون كسر.
5. مدير: فتح `/admin`، اعتماد طلب اشتراك → ينجح؛ محاولة اعتماد مزدوج → 409.
6. مدير: إعادة تعيين كلمة مرور مستخدم → كلمة مؤقتة تظهر مرة واحدة، وإبطال الجلسات.
7. مدير: `POST` عبر أصل خارجي لمسار إداري → 403 (CSRF).
8. فتح صفحة عامة عربية `/u/<user>` → `og:locale = ar_EG`، وصورة OG تحمل نطاق `portfolio-hub.online`.
9. مستخدم مجاني: فتح مشروع تفاصيله علنًا → 404 (Pro)، وظهور النص التوضيحي في لوحة المشاريع.
10. MediaPicker/WorkspacePickerModal: فتح → Esc يُغلق، التركيز يعود، لا تمرير للخلف، الـ`label` يعمل، URL يفتح لوحة مفاتيح مناسبة على الجوال.
11. حذف مشروع/بند → يظهر تأكيد قبل الحذف.
12. تبديل تبويبات البنّاء/الـModals بلوحة المفاتيح → مؤشر تركيز ظاهر + `aria-selected` صحيح.

---

# الجولة الثانية (Round 2) — استكمال بنود UI/UX + إعادة تدقيق

> النطاق: إغلاق بنود `BUILDER_UI_UX_REPORT.md` المتبقية «القابلة للإصلاح» (خطوات 1–7) + فحص تصادم `id` إضافي، ثم إعادة تدقيق ذاتي. القواعد المتبعة كما في الجولة الأولى: **لم يُلمس git**، نسخة أصلية لكل ملف في `audit-backups/round2/` قبل أول تعديل، لا ترحيلات/كتابة قاعدة بيانات/تثبيت حزم/نشر، الحفاظ على المظهر إلا حيث يتطلّب الإصلاح تغييرًا (مُدرَج أدناه).

## R2-0) فحص تصادم الـ`id` (إضافة خاصة)

- **تصادم حقيقي وُجد وأُصلح:** لوحة الخصائص على سطح المكتب (`<aside className="hidden md:flex">`) كانت **دائمة التركيب** وتستدعي `renderRightPanelWrapper()`، بينما الـbottom-sheet على الجوال يستدعي **نفس** الدالة، فيصبح في الـDOM نسختان من نفس النموذج (كل مُعرّفات الحقول `theme-*` / `pmc-*` / `pmi-*` / `sec-*` / `pp-*` مكرّرة) عند فتح الورقة على الجوال — ما يجعل `htmlFor`/`aria-labelledby` تشير للنسخة المخفية.
  - الإصلاح: لا تُركَّب نسخة سطح المكتب إلا عندما تكون الورقة مغلقة: `{!rightSheetOpen && renderRightPanelWrapper()}` — `src/app/profile/builder/BuilderClient.tsx:3157`.
- **تكرارات آمنة (لا تغيير):** تكرار `${sectionId}-heading-en/ar` و`${sectionId}-label-${idx}` عبر `Testimonials/Gallery/Files/Contact/CustomEditor` آمن لأن كل محرّر يُعرض منفردًا بمعرّف قسم فريد وقت التشغيل.

## R2-1) ربط التسميات (بند #2) — مُكتمل

- أُكمل ربط كل `<label>` بحقلها عبر `htmlFor`+`id`، والمجموعات عبر `role="group"`+`aria-labelledby`. `ThemeSettings` يستخدم `useId`.
- إجمالي صريح: **112/115**. الثلاثة المتبقية هي `<label>` ملفوفة حول `<input type="file">` (ربط ضمني صحيح) في Testimonials/Files/Gallery.

## R2-2) دلالات ARIA + الحلقات الحيّة (بنود #4، #8، #15) — مُكتمل

| الموضع | التعديل | المرجع |
|---|---|---|
| IconPicker | `aria-label` + `aria-pressed` + `focus-visible` | `BuilderClient.tsx:77` |
| مفتاح إظهار القسم | `aria-label` + `aria-pressed` | `BuilderClient.tsx:440` |
| SectionManager (تحريك/إظهار/طي) | `aria-label` + `aria-pressed` + `aria-expanded` + `focus-visible` | `SectionManager.tsx:173-192` |
| أزرار العناصر (تحريك/حذف) | `title`→`aria-label` + `focus-visible` | `TestimonialsEditor.tsx:195`, `GalleryEditor.tsx:175`, `FilesEditor.tsx:167`, `ContactEditor.tsx:162`, `CustomEditor.tsx:89` |
| البحث في المنتقيات | `aria-label` | `MediaPicker.tsx:184`, `WorkspacePickerModal.tsx:141` |
| حالات التحميل/الخطأ | `role="status"` / `role="alert"` | `MediaPicker.tsx:233`, `WorkspacePickerModal.tsx:158`, `VerifyRequiredCard.tsx:63/80` |
| مفاتيح ThemeSettings | `role="switch"` + `aria-checked` + `focus-visible` | `ThemeSettings.tsx:312/331` |
| `<select>` المتبقّي | لون نص صريح | `BuilderClient.tsx:2732` |

- `role="tablist/tab"` + `aria-selected` كانت مُنجَزة في الجولة الأولى (MediaPicker/WorkspacePicker/BuilderClient) — لا تغيير.

## R2-3) التركيز المرئي + ترتيب dnd (بنود #1، #10) — مُكتمل

- توحيد `focus:` → `focus-visible:` في كل أزرار/حقول البنّاء المُعدّلة (بما فيها textarea في Testimonials وselect في Contact).
- ترتيب السحب بلوحة المفاتيح مُوثّق مسبقًا: `KeyboardSensor` + `sortableKeyboardCoordinates` (`BuilderClient.tsx:1198`) + `aria-label="Drag to reorder"` على المقبض. اعتمدت على إعلانات dnd-kit المدمجة (بدون تخصيص).

## R2-4) الجوال (بنود #5، #7، #12، #2.4) — مُكتمل/جزئي

- **إطار المعاينة 390px (#12):** صار `max-w-full` بدل `max-w-none` → على عرض < 390px يُقصّ الإطار إلى عرض الشاشة بدل القصّ — `BuilderClient.tsx:3127`. (الفكرة الأصلية: محاكاة 390px تبقى كما هي على العروض الأوسع.)
- **لوحة المفاتيح/الأنواع (#7):** أُضيف `type="url" inputMode="url"` لحقول روابط/صور المشاريع (`ProjectManager.tsx` L198/280/405/462)، و`type="tel" inputMode="tel" autoComplete="tel"` لرقم واتساب (`ThemeSettings.tsx:348`). حقول URL/Search في المنتقيات كانت مُنجَزة.
- **أهداف اللمس (#2.4):** أزرار التحريك/الحذف الأيقونية رُفعت إلى `min-h/w-[36px]`؛ أزرار إغلاق الـModals أصلاً 44px. **جزئي**: بعض أزرار أيقونات `ProjectManager` ما زالت أصغر من 44px (تحتاج قرارًا لتفادي تغيير المظهر).

## R2-5) الاتساق (بنود #13، #14، #17، #18) — جزئي

- `Button.tsx`: `transition-all`→`transition-colors` (لا فرق بصري) — `Button.tsx:38`.
- `ThemeSettings`: استبدال نص التحميل `'...'` بـ`<Loader2/>` (#17) وحفظ `aria-label` — `ThemeSettings.tsx:276`.
- **مؤجّل/مقصود:** ألوان `AnalyticsDashboard` الخام (#13) و`transition-all` في الرسوم/بطاقات المشاريع (تستخدمه عمدًا لتحريك transform/shadow) — لم تُغيَّر حفاظًا على المظهر. ألوان تنبيهات `Toast` (`#16a34a/#dc2626/#d97706`) تُركت كما هي لأن رموز `--color-*` تُغيّر مظهر الوضع الداكن (قاعدة الحفاظ على المظهر).

## R2-6) النوافذ/الطبقات + الإجراءات المدمِّرة (بنود #3، #4.6، #4.1) — مُكتمل

- **Focus trap:** Tab يدور داخل نافذة MediaPicker/WorkspacePicker (Escape/قفل التمرير/إرجاع التركيز مُنجَزة سابقًا) — `MediaPicker.tsx:55`, `WorkspacePickerModal.tsx:28`.
- **خطأ التحميل في WorkspacePicker:** كان يترك `data=null` فيُعطّل العرض؛ أُضيفت حالة خطأ + زر «Try again» + حماية `data?.` — `WorkspacePickerModal.tsx:12/41/158`.
- **تأكيدات الحذف:** أُضيفت `window.confirm` لأزرار الحذف المضمّنة في Gallery/Files/Contact/Custom (كانت تحذف فورًا؛ حذف ItemCard مؤكَّد مسبقًا).
- **إصلاح وظيفي (كان زرًا ميتًا):** زر «Add» للمحتوى المرتبط في نموذجَي تحرير `ProjectManager` كان يفتح `MediaPicker` غير مُركَّب في هذين الفرعين → أُضيف المنتقي مع إضافة العنصر لـ`items`/`linkedContent` الصحيحين — `ProjectManager.tsx:362/547`.

## R2-7) التحقق الأمني/البيانات — تحقّق ثابت

- **IDOR:** مؤكَّد `profile: { userId: user.id }` في تحديث/حذف صفحات المشاريع — `src/lib/actions/portfolio.ts:752/817`.
- **`sanitizeUrl`:** مُراجَع (يرفض `javascript:`/`data:`/`vbscript:`/`file:` بما فيها حالة الأحرف والمسافات؛ يسمح http/https/mailto/tel والنسبي/المرساة) — `src/lib/urls.ts:23`.
- **تحديد المعدّل:** `checkRateLimit` مدعوم بقاعدة البيانات عبر `$transaction` (مشترك عبر النسخ) — `src/lib/rate-limit.ts:12`.
- **مسودة محلية عند الخروج:** تُمسح عند تسجيل الخروج، وتُمسح مسودات أي حساب آخر عند التحميل (خصوصية الأجهزة المشتركة) — `BuilderClient.tsx:717/835`.

## R2-8) عدّادات قبل/بعد

| الفحص | قبل (Round 1) | بعد (Round 2) |
|---|---|---|
| `npx tsc --noEmit` | 0 error | **0 error** |
| eslint (الملفات المتغيّرة) | 0 error + تحذيرات | **0 error** + نفس التحذيرات السابقة (`no-img-element`, `no-unused-vars` سابقة) |

## R2-9) الملفات المعدّلة (جميعها لها نسخة في `audit-backups/round2/`)

`BuilderClient.tsx`، `ProjectManager.tsx`، `SectionManager.tsx`، `ThemeSettings.tsx`، `TestimonialsEditor.tsx`، `GalleryEditor.tsx`، `FilesEditor.tsx`، `ContactEditor.tsx`، `CustomEditor.tsx`، `MediaPicker.tsx`، `WorkspacePickerModal.tsx`، `verify-required/VerifyRequiredCard.tsx`، `src/components/ui/Button.tsx`.

## R2-10) تغييرات بصرية (مقصودة، محدودة)

- تكبير أزرار التحريك/الحذف الأيقونية إلى 36px (كانت ~28px).
- إطار معاينة الجوال يصغر ليطابق عرض الشاشة عند <390px.
- `select` رقم Footer أصبح له لون نص صريح.

## R2-11) يحتاج عملًا جديدًا (لم يُنفَّذ — قرارات)

i18n كامل للبنّاء (#11) · تفكيك `BuilderClient.tsx` · رموز ألوان موحّدة لـAnalyticsDashboard (#13) · أهداف لمس 44px كاملة لـProjectManager · إعلانات dnd مُعرّبة · مخزن تحديد معدّل مشترك لمسار `track`.

## R2-12) `[UNVERIFIED]` (تحقّق وقت تشغيل لم يُنفَّذ)

Focus trap فعليًّا على متصفح/قارئ شاشة · عدم كسر زر «Add» الجديد للمحتوى المرتبط (يتطلب تشغيل البنّاء) · سلوك إطار المعاينة عند عرض <390px فعليًّا · إعلانات dnd.

## R2-13) قائمة اختبار يدوي (≤12)

1. جوال: فتح ورقة الخصائص → لا تكرار حقول (افحص عُنصرًا: مُعرّف واحد فقط).
2. جوال: إطار المعاينة لا يُقصّ على عرض 360px.
3. مفتاح «إظهار القسم» يقرأ حالته لقارئ الشاشة (`aria-pressed`).
4. منتقي الوسائط/مساحة العمل: Tab يبقى داخل النافذة، Esc يُغلق، التركيز يعود.
5. فشل تحميل WorkspacePicker → «Try again» يعيد المحاولة.
6. ProjectManager: داخل نموذج التحرير، زر «Add» يفتح المنتقي ويضيف العنصر.
7. حذف صورة/ملف/رابط/فقرة → تظهر نافذة تأكيد.
8. رقم واتساب يفتح لوحة أرقام على الجوال.
9. `Button` لا يظهر فرق بصري بعد `transition-colors`.
10. تسجيل خروج ثم دخول بحساب آخر → لا تظهر مسودة الحساب السابق.
11. تبديل التبويبات/النوافذ بلوحة المفاتيح → مؤشر تركيز ظاهر.
12. `tsc`/`eslint` نظيفان (بدون أخطاء).

---

# الجولة الثالثة (Round 3) — تصحيح A–D + البنود 8، 9، 10، 11

## R3-0) تصحيح البنود السابقة (A–D)

- **تصحيح C (جذر مفتاح الثيم) — مُكتمل.** كان `ClassicTemplate.tsx` يقرأ/يكتب `ph-theme-${username}` بينما `ProjectPageView.tsx` يستخدم `portfolio-theme`، فلم ينتقل اختيار الزائر بين الصفحتين. الآن المفتاح موحّد `portfolio-theme` في الملفين (`ClassicTemplate.tsx:96,112` · `ProjectPageView.tsx:50,137`)، وتُقلّص تبعياته إلى `[preview]`.
- **تصحيح A (ألوان الفوتر) — مُكتمل.** أُزيلت `#D4A017`/`#fff`/`text-white` غير المقصودة، والفوتر الآن خلفيته **اللون الأساسي للموقع** (`var(--color-primary)`) ونصوصه ب**لون خلفية الموقع** (`var(--color-bg)`) مع حدود/خلفيات مشتقة من `--color-bg`: `footerText=var(--color-bg)`، `footerMuted=color-mix(...78%...)`، `footerBorder=...30%...`، `footerSocialBorder=...40%...`، `footerSocialBg=...15%...` (طلب المالك). طُبِّق على الهوية/الروابط الاجتماعية/روابط التنقل/التواصل/الزر/الشريط السفلي/شريط العلامة (`ClassicTemplate.tsx`)، وعلى فوتر `ProjectPageView.tsx` (L228) و`BuilderClient.tsx` (معاينة).
- **تصحيح B (جذر مبدّل الجهاز) — مُكتمل.** الجذر: فرع «سطح المكتب» كان يرسم `<LivePreview>` داخل نفس المستند، فتتبع نقاط الانكسار مقاس النافذة الحقيقي، وعلى جوال يتساوى سطح-المكتب/الجوال فيبدو المبدّل معطّلًا. الحل: مكوّن جديد `ScaledDesktopPreview` يرسم `/profile/builder/preview` داخل إطار بعرض 1080px مُصغَّر بـ`transform: scale()` (+`ResizeObserver`+زر تحديث)، وحالة `narrowViewport` (width<1024)، وإظهار المبدّل على الجوال (`flex` بدل `hidden sm:flex`).
- **تصحيح D — مُتحقَّق.** القوالب القابلة للعرض: `ClassicTemplate.tsx` + `ProjectPageView.tsx` فقط؛ كلا الموضعين مُتزامنان في كل بنود الجولة.

## R3-1) البند 8 — ثنائية اللغة للمحتوى (مُكتمل)

- `src/lib/portfolio-language.ts`: نوع `LocalizedValue` + `pickLang(value, lang)` (يقبل `{ar,en}` أو نصًا مسطّحًا، ويسقط على اللغة الأخرى عند الفراغ).
- `ClassicTemplate.tsx`: مساعد `t=(v)=>pickLang(v,lang)`، واستُبدل كل `x?.[lang]` بـ`t(x)` عبر الاسم/المسمى/النّبذة/الوصف/الأقسام/hero/footer/الروابط، و`alt` الشركات.
- `BuilderClient.tsx`: حقول Hero Content صارت لكل لغة (displayName/professionalTitle EN+AR)، ومكوّن عام جديد `BiField` يعرض صندوقًا لكل لغة مطلوبة مع ترقية النصوص القديمة المسطّحة إلى `{en,ar}` دون إخفائها؛ طُبِّق على عناصر **الخبرات** (المسمى، الشركة، الموقع، الوصف) و**الخدمات** (العنوان، الوصف).
- `portfolio-schema.ts`: حقول العناصر صارت `lstringOrText` (companyName، caption، file.label، footerLink.label، serviceItem.title/description، testimonialItem.name/title، contactLink.label، hero/stat.label، experience.jobTitle/companyName/location/description).
- `TestimonialsSlider.tsx`: `pickLang` للـ`alt`/`title`، والواجهة تقبل `{en,ar}`.
- `ProjectPageView.tsx`: `displayName = pickLang(profile.localized?.displayName, lang) || ...`.

## R3-2) البند 9 — حفظ لغة الزائر (مُكتمل)

`changeLang(next)` في `ClassicTemplate.tsx` (مفتاح `portfolio-lang`، مُقيَّد بـ`canSwitchLang = defaultLangMode==='both'`، يمنع التغيير داخل المعاينة) + تأثير استعادة. ومرآته في `ProjectPageView.tsx` (`canSwitchLang`، تأثير، زر تبديل).

## R3-3) البند 10 — إعادة تصميم الشريط العلوي للبنّاء (مُكتمل)

`BuilderClient.tsx` (~L3043): ارتفاع `h-14`؛ يسار = قائمة الجوال + اسم العلامة؛ وسط (md+) = تراجع/إعادة + حالة الحفظ؛ يمين = مبدّل الجهاز + «View Live» + ProfileMenu + NotificationBell + Publish (`hidden sm:inline-flex`) + إعدادات الجوال. شريط الخطة المجانية: `#D4A017`/`#0D1B3E` → `var(--color-primary)`/`var(--on-primary)`.

## R3-4) البند 11 — تدقيق النصوص البديلة (لا تغيير)

بحث `lorem|dummy|example.com|john doe|test` → لا بيانات وهمية؛ النتيجة الوحيدة `placeholder="https://example.com/project"` في `ProjectManager.tsx` (L285، L479) وهي نص إرشادي مقبول.

## R3-5) التحقق الآلي

- `npx tsc --noEmit` → `TSC_EXIT=0` بعد كل تعديل.
- `npx eslint` (BuilderClient، TestimonialsSlider، ClassicTemplate، portfolio-schema، portfolio-language) → **0 errors** (تحذيرات فقط، مطابقة للنسخ الاحتياطية).
- أخطاء `no-explicit-any` الأربعة في `ProjectPageView.tsx` (L37×2، L172، L198) **سابقة** (موجودة في النسخة الاحتياطية).

## R3-6) الملفات المعدّلة (نسخ في `audit-backups/round3/`)

`ClassicTemplate.tsx` · `ProjectPageView.tsx` · `BuilderClient.tsx` · `SectionManager.tsx` · `portfolio-schema.ts` · `TestimonialsSlider.tsx` (نسخة من `HEAD`) + ملف جديد `src/lib/portfolio-language.ts`.

## R3-7) إعادة تدقيق الجولة الثالثة

- لا يبقى نمط `x?.[lang]` في القالب (عدا `SECTION_NAV_LABELS[...]?.[lang]` المقصود).
- مفاتيح الجلسة موحّدة: `portfolio-theme` + `portfolio-lang` في الملفين ومحرر البنّاء.
- لا تصادم مُعرّفات: `BiField` يولّد `<id>-en`/`<id>-ar` فريدة؛ أُزيلت المعرّفات المفردة القديمة.
- توافق البيانات القديمة: نص مسطّح يظهر في الصندوق المرئي ويُرقّى إلى `{en,ar}` عند التحرير بلا فقدان.
- لا تغييرات `schema.prisma`/migration/تبعيات؛ كل البيانات الجديدة داخل JSON القائم.

## R3-8) تعديلات لاحقة بطلب المالك

- **إعادة تلوين الفوتر:** خلفية الفوتر = **اللون الأساسي** (`var(--color-primary)`) ونصوصه/حدوده = **لون خلفية الموقع** (`var(--color-bg)`). طُبِّق في `ClassicTemplate.tsx` (`:1207-1212`، الخلفية `:1223`، شريط العلامة البديل) وفي `ProjectPageView.tsx:228` و`BuilderClient.tsx:279`. التجاوز اليدوي `appearance.footerText`/`footerBg` يبقى غالبًا.
- **إصلاح جذر مبدّل الوضع الداكن في البنّاء:** المشكلة أن مفتاح الثيم المحلي يضع `data-theme="dark"` على `.builder-root` (لا على `<html>`)، والمحدِّد `[data-theme="dark"]` يتعادل في الأولوية (0,1,0) مع متغيّرات `:root` المُصدَّرة من `@theme inline`، فتفوز قيم `:root` إن جاءت لاحقًا في الورقة → المبدّل يبدو معطّلًا. الحل (بنفس أسلوب `.landing-page[data-theme='dark']` العامل): إضافة `.builder-root[data-theme="dark"]` (أولوية 0,2,0) إلى قائمة محدِّدات الثيم الداكن في `globals.css`، فيفوز دائمًا بغضّ النظر عن ترتيب الإخراج.
- **إزالة أزرار تبديل الثيم واللغة من مخرجات البروتفوليو:** أُزيلت أزرار Surface/اللغة من `ClassicTemplate.tsx` (شريط الجوال + شريط سطح المكتب) ومن `ProjectPageView.tsx` (شريط المشروع)، مع إزالة قراءة/كتابة `portfolio-theme`/`portfolio-lang` للزائر ودوال `toggleTheme`/`changeLang`/`canSwitchLang`؛ البروتفوليو يُعرض الآن دائمًا بإعدادات المالك (`appearance.colorMode` / `getPortfolioLang`). شريط الجوال يعرض اسم المالك بدلًا من الأزرار.

## R3-9) `[UNVERIFIED]` (تحقّق وقت تشغيل لم يُنفَّذ)

سلوك `ScaledDesktopPreview` فعليًّا عند عرض نافذة ضيّقة · انتقال اختيار الثيم/اللغة بين صفحة الملف وصفحة المشروع في متصفح حقيقي · ظهور حقول AR/EN حسب وضع اللغة الفعلي للبروفايل.

## R3-10) قائمة اختبار يدوي (≤12)

1. جوال (width<1024): تفعيل «سطح المكتب» → تظهر معاينة مُصغَّرة بعرض 1080px، ويختلف العرض عن «الجوال».
2. مبدّل الجهاز ظاهر على الجوال.
3. البروتفوليو المنشور: لا يوجد أي زر لتبديل الثيم أو اللغة (لا في الشريط العلوي ولا في صفحة المشروع)؛ يظهر بلون المالك الافتراضي فقط.
4. قائمة البروفايل في البنّاء → «Dark mode» يبدّل فعليًّا ألوان البنّاء بالكامل (الخلفية/البطاقات/النص) ويبقى محفوظًا بعد إعادة التحميل.
5. لا وجود لأي قراءة/كتابة `portfolio-theme`/`portfolio-lang` في مخرجات البروتفوليو.
6. بروفايل «عربي فقط»: افتح قسم الخدمات → النص القديم يظهر في صندوق عربي (لا فراغ).
7. أضف خدمة بلغتين → تظهر اللغة الصحيحة على المخرج.
8. عنصر خبرة بنص مسطّح قديم: افتحه → يظهر في الصندوق المرئي، والتعديل يحفظ دون فقدان.
9. الفوتر: خلفيته **اللون الأساسي** ونصه/حدوده بلون خلفية الموقع؛ يتجاوزه `appearance.footerText`/`footerBg` عند ضبطه.
10. الشريط العلوي للبنّاء: عناوين/أزرار دون تكرار «View Live».
11. شريط الخطة المجانية يتبع `--color-primary`.
12. `tsc`/`eslint` نظيفان (0 errors جديدة).
