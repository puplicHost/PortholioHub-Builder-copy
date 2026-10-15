# تقرير تقني شامل: ميزة "البروفايل الشخصي" (Portfolio Profile)

> التقرير يستند إلى قراءة كاملة لملفات الميزة المصدرية في المشروع، ولا يتضمن أي تعديل على الكود المصدري.

## 1. نظرة عامة

ميزة **البروفايل الشخصي** تتيح للمستخدم (سواءً كان مالك حساب أو عضوًا في مساحة عمل) إنشاء صفحة عامة تبرز شخصيته المهنية، خبراته، ومشاريعه. تتميز الميزة بالنقاط التالية:

- **محرر بخطوات (Multi-step Builder):** واجهة توفر 8 خطوات (Hero، About، Projects، Skills، Experience، Education، Contact، Appearance) مع حفظ تلقائي.
- **قوالب عرض (Templates):** ثلاثة قوالب قابلة للتبديل (Classic Dark، Minimal Light، Arabic Pro).
- **ثنائية اللغة (RTL/LTR):** دعم اللغتين العربية والإنجليزية مع بنية `LString { ar, en }` لكل حقل نصي.
- **معاينة حية:** معاينة فورية عبر `sessionStorage` وiframe دون الحاجة للحفظ.
- **استيراد من CV:** رفع ملف `.docx` واستخراج المهارات وروابط التواصل تلقائيًا.
- **حماية بكلمة مرور:** إمكانية قفل الصفحة العامة بكلمة مرور مشفرة (bcrypt).
- **بطاقات عامة:** روابط تواصل قابلة للتطبيع الآمن، وإحصائيات، ورسائل خدمة وتوصيات.

---

## 2. خريطة ملفات الميزة (File Map)

```
prisma/
└── schema.prisma                         # نماذج UserProfile / PortfolioItem / Testimonial / Service (السطر 850-920)

src/
├── components/profile/                   # محرر البروفايل
│   ├── CVImportButton.tsx                # زر استيراد CV من .docx مع نافذة النتيجة
│   ├── standalone/
│   │   ├── ProfileBuilder.tsx            # جذر المحرر (client) — 788 سطر
│   │   ├── ProfilePreview.tsx            # المعاينة الداخلية (غير القوالب)
│   │   ├── PublicPreview.tsx             # المعاينة الحية عبر iframe
│   │   ├── ProfileStepper.tsx            # شريط خطوات التنقل
│   │   ├── ImageUpload.tsx               # رفع صورة (سحابية أو رابط URL)
│   │   ├── SafeImage.tsx                 # صورة آمنة مع fallback
│   │   ├── livePreview.ts                 # تحويل حالة المحرر إلى LiveDraft
│   │   ├── types.ts                       # ProfileFormState + profileToState
│   │   ├── i18n.ts                        # أدوات LString
│   │   ├── social.ts                      # حقول السوشيال ميديا
│   │   ├── stats.ts                       # قائمة أيقونات الإحصائيات
│   │   ├── controls.tsx                   # عناصر إدخال مشتركة (SectionCard, TagInput...)
│   │   └── steps/                         # خطوات المحرر
│   │       ├── HeroStep.tsx               # الاسم / العنوان / الموقع / السيرة / الصورة / سوشيال
│   │       ├── AboutStep.tsx              # نبذة + إحصائيات (Stats)
│   │       ├── ProjectsStep.tsx           # المشاريع مع نافذة Drawer
│   │       ├── SkillsStep.tsx             # المهارات + اقتراحات
│   │       ├── ExperienceStep.tsx         # الخبرات المهنية
│   │       ├── EducationStep.tsx          # التعليم
│   │       └── ContactStep.tsx            # روابط التواصل
│   └── steps/
│       └── AppearanceStep.tsx             # اختيار القالب + الألوان + اللغة/الوضع
│
├── app/
│   ├── api/profile/
│   │   ├── route.ts                       # GET / POST / PATCH
│   │   ├── import-cv/route.ts             # تحليل ملف .docx
│   │   └── unlock/route.ts                # فتح البروفايل المحمي بكلمة مرور
│   └── u/                                 # الصفحات العامة
│       ├── [username]/page.tsx            # صفحة البروفايل العامة (server)
│       ├── [username]/PasswordGate.tsx    # بوابة إدخال كلمة المرور
│       └── preview/
│           ├── [template]/page.tsx        # معاينة قالب تجريبي (Demo)
│           └── live/page.tsx              # معاينة حية (client, iframe)
│       └── [username]/templates/
│           ├── types.ts                   # TemplateProps + DEMO_PROFILE
│           ├── ClassicDark.tsx            # قالب داكن كلاسيكي (862 سطر)
│           ├── MinimalLight.tsx           # قالب فاتح مبسط (721 سطر)
│           ├── ArabicPro.tsx              # قالب عربي احترافي (525 سطر)
│           ├── theme.ts                   # resolvePalette + paletteCss + contrastForeground
│           └── i18n.ts                    # pick / pickArr للقوالب
│
└── lib/
    └── portfolio.ts                       # الأنواع + دوال قراءة/حفظ البروفايل (527 سطر)
```

---

## 3. نموذج قاعدة البيانات (الـ Schema)

يوجد بالفعل جدول `UserProfile` (سطر 850 في `schema.prisma`)، بالإضافة إلى 3 جداول مرتبطة:

| النموذج | الجدول الفعلي | الحقول الرئيسية |
|---|---|---|
| `UserProfile` | `user_profiles` | `id`, `userId` (unique → User), `username` (unique), `displayName`, `bio`, `avatarUrl`, `professionalTitle`, `location`, `skills String[]`, `experience Json?`, `education Json?`, `projects Json?`, `contactLinks Json?`, `appearance Json?`, `localized Json?`, `createdAt`, `updatedAt` |
| `PortfolioItem` | `portfolio_items` | `id`, `profileId`, `contentId` (→ Content), `sortOrder` — بعرض `@@unique([profileId, contentId])` |
| `Testimonial` | `testimonials` | `id`, `profileId`, `author`, `role?`, `body`, `sortOrder` |
| `Service` | `services` | `id`, `profileId`, `title`, `description?`, `price?`, `sortOrder` |

**ملاحظات مهمة حول الداتا:**
- الحقول `experience` و `education` و `projects` و `contactLinks` مخزّنة بصيغة JSON (`Json?`) وليست جداول منفصلة، وتُشرح/تُحوَّل إلى أنواع TypeScript عبر دوال في `src/lib/portfolio.ts`.
- بنية الترجمة تُخزَّن في عمود `localized Json?` بصيغة `{ field: { ar, en } }`، بينما تبقى أعمدة `displayName`, `bio`, `professionalTitle`, `location`, `skills` كمزامنة/احتياطية لعناصر العربية القديمة.
- `appearance Json?` يحمل إعدادات القالب والألوان ونطاق الأقسام، ويُضاف إليه `sections` (قائمة `{ key, visible }`) و `passwordHash` و `isPublic` عند الحاجة.

---

## 4. مسارات الـ API

### 4.1 `POST/GET /api/profile` — `src/app/api/profile/route.ts`
- **GET:** يتحقق من الهوية (`getCurrentUser`)، يعيد البروفايل عبر `getOrCreateProfile` (ينشئ تلقائيًا إن لم يوجد مع توليد username فريد)، ويعيد `{ profile, isPro: true }`.
- **POST:** مشابه للـ GET لكن بالكود `201`.
- **PATCH:** المسار الأهم:
  1. **Step 1:** يحدّث الحقول القياسية:
     - من `localized`: يقرأ `displayName`, `bio` (محدود 2000 حرف), `professionalTitle` (120 حرف), `location` (120), `skills` (حد 50), ويطابقها مع الأعمدة العربية القديمة.
     - يدعم أيضاً الحقول المباشرة (`body.displayName`, `avatarUrl`...).
  2. `experience`, `education`, `projects`, `contactLinks` تُخزَّن كـ JSON بعد التطبيع (تواريخ، `current`، tags، `relatedContent`).
  3. **username:** يُمرر عبر `slugify`، يُشترط أن يكون طوله 3–30، ويُتحقق من عدم التضارب بين المستخدمين.
  4. **appearance:** يُطبَّق تنقية صارمة على `sections` — يسمح فقط بـ 7 مفاتيح صالحة، ويُجبر `hero` و`contact` على `visible: true` دائمًا.
  5. **Step 2 (transaction):** يتعامل مع العلاقات المتداخلة عبر `deleteMany` + `createMany` داخل `$transaction`:
     - `portfolioItemIds` → يُصفي المعرفات المتاحة فعليًا فقط (محتوى مملوك أو عضو مقبول، غير محذوف) ثم يعيد إنشاء `PortfolioItem`.
     - `testimonials` و `services` → حذف وإعادة إنشاء بترتيب `sortOrder`.
  6. **توافق خاص:** حماية بروفايل المحرر من مسح `PortfolioItem` — لا يُلمس `portfolioItemIds` إلا عندما يديرها "Content Library" صراحةً.

### 4.2 `POST /api/profile/import-cv` — `src/app/api/profile/import-cv/route.ts`
- يقبل `FormData` مع ملف `cv` بامتداد `.docx` وبحد أقصى 10MB.
- يستخرج `word/document.xml` من ملف ZIP (**بدون أي تبعيات خارجية**) عبر فحص رؤوس ZIP يدويًا و `inflateRawSync` من `zlib`.
- ينظّف النص (إزالة الوسوم، تحويل `&amp;`...)، ثم يستخرج بالنمط:
  - **email** (Regex), **phone**, **LinkedIn**, **Instagram**.
  - **skills:** يبحث عن عناوين (skills/مهارات/القدرات...) ويجمع السطور حتى عنوان قسم آخر, مفصولة بفواصل، مع حد أقصى 30 مهارة.
- يعيد `extracted`, `fullText` (لنسخ يدوي), و `confidence` لكل حقل.

### 4.3 `POST /api/profile/unlock` — `src/app/api/profile/unlock/route.ts`
- يقرأ `{ username, password }`، يبحث عن البروفايل، يستخرج `appearance.passwordHash`.
- يفحص عبر `bcrypt.compare`، وعند النجاح يضبط كوكي `portfolio_unlocked_<username>=1` بـ `httpOnly`, يصل لمدة 24 ساعة, `sameSite: lax`, آمن في مرحلة الإنتاج.

---

## 5. المحرر: التخطيط والخطوات (Editor Layout & Steps)

`ProfileBuilder.tsx` هو جذر المحرر (مكوّن client). هيكله:

- **تخطيط ثلاثي قابل لإعادة التحجيم:** لوحة يسرى (خطوات، عرض 340–520px) + منطقة محتوى مركزية + لوحة يمين للمعاينة (عرض 220–300px)، مع مقابض سحب `startResize`.
- **شريط خطوات `ProfileStepper`:** 8 خطوات مع مؤشرات إكمال (√) وخطوط فاصلة، ويُبنى ديناميكيًا من `appearance.sections` عبر `buildStepsFromAppearance` (الخطوة `hero` و`contact` و`appearance` مطلوبة دائمًا).
- **قائمة الأقسام (ALL_SECTIONS):** `hero`(مطلوب), `about`, `projects`, `skills`, `experience`, `education`, `contact`(مطلوب), `appearance`.

### خطوات المحرر:
| الخطوة | الملف | المحتوى |
|---|---|---|
| Hero | `HeroStep.tsx` | الاسم، المسمى، username (مع تحقّق من 3–30 وslug)، الموقع، الصورة (ImageUpload)، bio، روابط السوشيال + زر بريد |
| About | `AboutStep.tsx` | نبذة + قائمة إحصائيات (رقم/وصف/أيقونة) قابلة للترتيب والإضافة والحذف |
| Projects | `ProjectsStep.tsx` | قائمة مشاريع عبر Drawer: عنوان/صورة/وصف/رابط/وسوم، مع إعادة ترتيب |
| Skills | `SkillsStep.tsx` | مهارات فردية + اقتراحات عربية/إنجليزية جاهزة |
| Experience | `ExperienceStep.tsx` | خبرات مع `current`، تواريخ، ترتيب |
| Education | `EducationStep.tsx` | مؤهلات تعليمية مشابهة |
| Contact | `ContactStep.tsx` | روابط تواصل قابلة للترتيب + أزرار نوع مسبقة + تطبيع URL عند الفقدان |
| Appearance | `AppearanceStep.tsx` | اختيار القالب + ألوان Light/Dark كاملة + لغة/وضع العرض الافتراضي |

### الحفظ التلقائي (Autosave):
- عند أي تغيير للـ `state` (عدا أول تشغيل) يُخزَّن في `queued.current` ثم يُؤجل الحفظ عبر `setTimeout(700ms)`.
- حلقة `persist` تعالج القيم المتراكمة تباعًا (مفتاح `saving` يمنع التنافس)، تُرسل `PATCH /api/profile` مع حقول `localized` و `appearance.sections` مبنية من الخطوات الحالية، وتحدّث `SaveStatus` (`saving/saved/error`).

### المعاينة:
- **`ProfilePreview`** (داخلي غير القالب) — عرض تقريبي بمقاسات `desktop/tablet/mobile` مع بطاقات مشاريع وإحصائيات.
- **`PublicPreview`** — يعرض iframe إلى `/u/preview/live?lang&theme`؛ البيانات تُمرَّر عبر `sessionStorage` (مفتاح `marketos-live-draft:v1`) مع debounce 250ms، وبدون أي بيانات في الـ URL. وهو يعطّل عندما يكون البروفايل محميًّا بكلمة مرور أو خاصًا.
- **`/u/preview/live`** — يقرأ `sessionStorage`، يبني `TemplateProps` عبر `liveDraftToTemplateProps`، ويعرض القالب المحدد.

---

## 6. القوالب (Templates)

جميع القوالب مكوّنات client تستقبل `TemplateProps` (ثلاثة قوالب):
1. **ClassicDark.tsx** (862 سطر): داكن وحديث، split-radial hero، بطاقات، لوحة top bar.
2. **MinimalLight.tsx** (721 سطر): نظيف فاتح، gradient hero، CTA على شكل حبوب.
3. **ArabicPro.tsx** (525 سطر): عربي احترافي، وضع RTL، accent بنفسجي `#522f95` الافتراضي.

**معالجة البيانات المشتركة في القوالب:**
- `pick(lang, LString)` و `pickArr(lang, array)` لاختيار اللغة الصحيحة (تفضيل EN عند `lang==='en'`, وإلا العربية ثم الاحتياطي).
- `resolvePalette(appearance, theme)` + `paletteCss()` في `theme.ts` تبني نظام ألوان CSS variables مع:
  - `contrastForeground(hex)` يحسب تلقائيًا لون نص مقروء (فاتح/داكن) وفق صيغة luminance الموزونة (WCAG-aware).
  - لكل وضع (Light/Dark) 6 ألوان: `primary, bg, surface, card, text, muted`.
- `hideBadge` يعمل فقط عندما يكون `isPro` صحيحًا (إخفاء شارة المنتج).

**تبديل اللغة والوضع** يتم داخل القالب عبر `useState` (lang/theme) مع قيمة افتراضية من الخادم.

**قوالب تجريبية (Demo):**
- `/u/preview/[template]` يعرض قالبًا مع `DEMO_PROFILE`/`DEMO_APPEARANCE` (في `types.ts`) لمعاينة سريعة قبل الحفظ.
- `DEMO_PROFILE` يتضمن اسم "نرمين سعيد" وخبرات وتعليم وخدمات بألوان تجريبية.

---

## 7. الصفحة العامة (`/u/[username]`)

`page.tsx` (سيرفر، `force-dynamic`):
1. يبحث عن البروفايل بالـ username (عبر `findUnique` + تضمين `user.subscriptions`, `portfolioItems→content`, `testimonials`, `services`).
2. إذا لم يوجد أو `appearance.isPublic === false` → `notFound()`.
3. **تجاوز ألوان اختياري:** من `?colors=` (عبر query string) — يتم قبول 12 مفتاح لوحة فقط مع التحقق من أنها ألوان hex صالحة (لا تسريب لبيانات المستخدم).
4. **فحص Pro:** `isPro = subscriptions[0].plan.name === 'pro'`.
5. **حماية بكلمة مرور:** إن وُجد `appearance.passwordHash` ولم تكن الكوكي `portfolio_unlocked_<username>` صحيحة → عرض `PasswordGate`.
6. **الأقسام الظاهرة:** `visibleSections` تُبنى من `appearance.sections` (مع إجبار hero أولاً وcontact أخيرًا)، ويُضاف `testimonials`/`services` تلقائيًا إن وُجدت بيانات ولم تُدرج صراحةً.
7. يبني `TemplateProps` ويوزّع إلى القالب المناسب حسب `appearance.template` (الافتراضي `classic-dark`).

**PasswordGate.tsx:** نموذج إدخال كلمة مرور، يرسل `POST /api/profile/unlock`، وعند النجاح يعيد تحميل الصفحة.

---

## 8. الترجمة (i18n) وبنية LString

- **`LString`:** كائن `{ ar: string; en: string }`.
- دوال التحويل في `lib/portfolio.ts`:
  - `toLString(value)` / `toLStringArray(value)`: ترحيل القيم القديمة (string أو string[]) إلى البنية الموضعية الجديدة.
  - `pickLString(lang, v)` / `pickLStringArray(lang, v)`: اختيار اللغة الصحيحة مع احتياطي.
- **في المحرر:** `editorLang` (`'ar'|'en'`) يحدد أي جزء من `LString` يُحرَّر؛ عند الحفظ، يُرسل كامل `localized` (كلا اللغتين).
- **في القوالب:** `pick`/`pickArr` تعمل على `profile.localized` مع الرجوع للأعمدة القديمة.
- يوجد شريط مؤشر "ترجمة" `translationProgress` يُحسب من اكتمال حقول `EN`.

---

## 9. تدفق البيانات (Data Flow)

```
[شاشة المحرر ProfileBuilder]
   │  (تعديل state)
   ▼
[ProfileFormState] ─── autosave 700ms ──▶ PATCH /api/profile ──▶ prisma.userProfile.upsert + $transaction
   │
   └─▶ buildLiveDraft(state) ── sessionStorage ──▶ /u/preview/live ──▶ TemplateProps ──▶ القالب
                                                                        (حفظ = /u/<username>)

[استيراد CV]  رفع .docx ──▶ POST /api/profile/import-cv ──▶ {extracted(skills, contactLinks)} ──▶ handleCVImport ──▶ تحديث state
[حماية]       POST /api/profile/unlock ──▶ set cookie portfolio_unlocked_<username> ──▶ إعادة تحميل
```

---

## 10. ملاحظات للمطوّرين / أمور يجب معرفتها

1. **نظام القوالب مستقل عن `ProfilePreview`:** `ProfilePreview` عرض تقريبي في المحرر، بينما القوالب الثلاثة (ClassicDark/MinimalLight/ArabicPro) هي ما يظهر للجمهور ورمزها الحقيقي للعرض. أي تعديل يُراد ظهوره عامًا يجب تعديل القوالب.
2. **الألوان تُخزَّن مرتين:** في `appearance.light*`/`dark*` (الأساسية) بالإضافة إلى `accent`/`accentColor` (لتوافق قديم) ويبقيهما `AppearanceStep.setPrimary` متزامنين.
3. **قاعدة لا تُمس:** PATCH لا يتعامل مع `portfolioItemIds` عندما يُرسله المحرر (حتى لا يمسح عناصر Content Library) — فقط الاستدعاءات الخارجية المخصصة تديرها.
4. **أمان المعاينة:** تُستخدم `sessionStorage` للمعاينة الحية وليس الـ URL؛ إعداد `canIframe = username && isPublic && !passwordHash` يمنع المعاينة عند الحماية.
5. **حدود الاشتراك (Free/Pro):** حاليًا كل ميزة متاحة للجميع — `GET/POST /api/profile` يعيدان `isPro: true` دائمًا، وبالتالي `hideBadge` متاح. القيود القديمة (`FREE_PORTFOLIO_ITEM_LIMIT = 999`, `FREE_CONTACT_LINK_LIMIT = 99`) موجودة لكنها عمليًا بلا أثر حاليًا، ولا يوجد تفعيل تحقق من الاشتراك على مستوى PATCH.
6. **الحماية بكلمة مرور:** آمنة لأن التخزين عبر bcrypt، لكن فحص `passwordHash` موجود فقط في الصفحة العامة وليس في API المحرر.
7. **مشاريع `relatedContent`:** حقل اختياري ربما يربط المشاريع بمحتوى Content Library — يُرحَّل لكنه لا يُستفاد منه في القوالب حاليًا.
8. **البناء الآمن للـ username:** يمر عبر `slugify` مع فحص التضارب؛ المُدخلات تُقتصر على 3–30 حرفًا لاتينيًا.
9. **ترحيل البيانات القديمة:** `parseProfileExperience/Education/Projects` و `toLString/Array` تضمن تشغيل القوالب على بيانات مخزنة قبل إدخال التدويل.
10. **ملاحظة بنية/أداء:** صفحة `/u/[username]` تؤدي 4+ استعلامات Prisma (UserProfile + subscriptions + portfolioItems + testimonials + services) بشكل متسلسل/تضمينيّ — مناسب حاليًا وقد يحتاج تبسيطًا عند التوسع.

---

*انتهى التقرير. أُعدّ بناءً على الكود المصدري الحالي دون أي تعديل.*
