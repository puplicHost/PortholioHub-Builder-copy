# Gap Analysis — الكود المنسوخ مقابل خطة PortfolioHub-Builder (Docs/)

> المصدر: الكود الفعلي المنسوخ من MarketOS إلى `PortholioHub-Builder-copy/` مقابل `PortholioHub-Builder/Docs/` (02، 04، 05، phases 05/06/07/10/11/12/13).
> الستاك النهائي المعتمد لهذا المشروع: **Next.js (React) + Supabase**. مجلد `_legacy-backend-reference/` مرجع قراءة فقط وسيُستبدل بالكامل.

## 1) ملخص ما تم نسخه (القائمة النهائية)

**البيلدر (المحرر):**
- `src/app/profile/builder/page.tsx` — Server Component + بوابة `requireUser` + `emailVerified` + `getOrCreateProfile`
- `src/app/profile/builder/BuilderClient.tsx` (~2786 سطر) — الواجهة الرئيسية split-pane + undo/redo + dnd-kit
- `src/app/profile/builder/LivePreview.tsx` — تغليف `ClassicTemplate` مع `dir` حسب اللغة
- `src/app/profile/builder/SectionManager.tsx` — ترتيب/إظهار الأقسام
- `src/app/profile/builder/ThemeSettings.tsx` — ألوان/خطوط + رفع أفاتار
- `src/app/profile/builder/ProjectManager.tsx` — إدارة `ProjectPage` كبطاقات وعناصر
- `src/app/profile/builder/WorkspacePickerModal.tsx` — ربط عناصر الـ workspace (تشابك، انظر §3)
- `src/app/profile/builder/TestimonialsEditor.tsx`
- `src/app/profile/builder/analytics/page.tsx` + `src/components/portfolio/analytics/*` (5 ملفات)
- `src/app/profile/builder/verify-required/page.tsx` + `VerifyRequiredCard.tsx`

**الأوتبوت (العام):**
- `src/app/u/[username]/page.tsx` — صفحة البورتفوليو العامة + `generateMetadata` + `TrackBeacon`
- `src/app/u/[username]/projects/[slug]/page.tsx` + `ProjectPageView.tsx` — صفحة المشروع
- `src/components/portfolio/templates/ClassicTemplate.tsx` (~1019 سطر) — التمبلت الوحيد (يُستخدم في المحرر والعام معًا)
- `src/components/portfolio/TestimonialsSlider.tsx` + `src/components/portfolio/TrackBeacon.tsx`

**اعتماديات مشتركة (ضرورية فقط، مثبتة بالـ imports):**
- `src/components/ui/Button.tsx`, `Input.tsx`, `Toast.tsx`, `Card.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`
- `src/components/I18nProvider.tsx`, `ThemeProvider.tsx`, `PlatformProvider.tsx`
- `src/lib/prisma.ts`, `auth.ts`, `guards.ts`, `cloudinary.ts` (`uploadToCloudinary`), `contact.ts`, `upload.ts`, `urls.ts`, `platform.ts`, `i18n/{server,dictionary,phrases}.ts`, `lib/hooks/useMounted.ts`, `lib/hooks/useStoredState.ts`, `hooks/useAutosave.ts`, `types/{index,roles}.ts`
- `src/app/{layout.tsx,globals.css,error.tsx,loading.tsx,not-found.tsx,sitemap.ts,robots.ts}`, `src/middleware.ts` (يشمل subdomain rewrite لـ `/u/`)
- كونفيج: `package.json` (مرجع كامل)، `tsconfig.json`, `next.config.ts` (standalone)، `postcss.config.mjs` (Tailwind v4)، `eslint.config.mjs`, `.env.example`, `next-env.d.ts`, `vitest.config.ts`

**باك إند قديم (حي + مرجع):**
- حي في `src/`: `src/lib/actions/portfolio.ts`, `src/lib/actions/resend-verification.ts`, `src/lib/portfolio.ts`, `src/app/api/portfolio/track/route.ts`
- نسخة مرجعية في `_legacy-backend-reference/` (نفس الملفات + `prisma/schema.prisma` الكامل + `PORTFOLIO_BUILDER_PLAN.md` + `Portfolio_Builder_PRD.md` + `Docs/PORTFOLIO_BUILDER_COMPLETE_REPORT.md` + `docs/portfolio-*.md`)
- نموذج البيانات المنقول فعليًا: `User`, `UserProfile`, `ProfilePage`, `PageSection`, `ProjectPage`, `ProjectItem`, `Testimonial`, `Service`, `PortfolioViewEvent`, `MediaFile` (+ `User/Session/Profile` للدخول)

## 2) تأكيدات
- **المشروع الأصلي لم يُمس إطلاقًا**: كل العمليات عليه كانت قراءة (`read/glob/grep/cp FROM`). فحص `git status` في MarketOS أظهر فقط مجلد `Docs/` غير متتبع مسبقًا — لا تعديل/حذف/إضافة.
- **الحالة التشغيلية للنسخة**: تحقق استاتيكي فقط — كل `from '@/...'` في `src/` محلول لملف موجود **ما عدا** لا شيء متبقٍ (بعد استكمال `lib/actions/*` و`api/portfolio/track` في `src/`). **لم يُنفَّذ `npm install`/`build`/`dev` إطلاقًا** (يتطلب موافقة صريحة حسب سياسة التحقق). التشغيل المحلي متوقع أن يعمل بعد `npm install` + توفير `DATABASE_URL/DIRECT_URL` + `prisma generate`، مع ملاحظة التشابك في §3.

## 3) اعتماديات مشكوك فيها (تشابك مع المشروع الكبير)
| الاعتمادية | المشكلة | الاقتراح |
|---|---|---|
| `WorkspacePickerModal` + `getAdminWorkspaceContent()` | يقرأ `Workspace`, `Strategy`, `PlanningDocument`, `Content`, `Media` — جداول خارج نطاق البورتفوليو | **فصل**: استبداله بـ `MediaPicker` على Supabase Storage (Phase 4)؛ إبقاء الحالي كمرجع فقط |
| `requirePortfolioAdmin()` | يشترط ملكية/إدارة workspace — لا معنى له في مشروع مستقل | **استبدال**: صلاحية `role=USER` عادية + شرط الاشتراك `canPublish` حسب الخطة |
| `uploadToCloudinary` + `Media/MediaFile` | رفع Cloudinary + سكيمة محلية — الخطة تريد `Media` بملكية مستخدم + `storageKey` عشوائي | **استبدال**: Supabase Storage + جدول `Media` الجديد |
| `I18nProvider/dictionary/phrases` + `PlatformProvider/getPlatformName` | قاموس المنصة الكبيرة واسم MarketOS مسرّب في `layout/metadata` | **تنظيف**: قاموس ar/en خاص بالبورتفوليو + اسم PortfolioHub |
| `middleware.ts` (admin redirects + subdomain) + `sitemap.ts` (sharedLinks فقط) + `layout.tsx` (providers المنصة) | منطق خاص بـ MarketOS | **إعادة كتابة جزئية**: إبقاء الهيكل، حذف مسارات MarketOS، وsitemap للبروتفوليوهات المرئية فقط |

## 4) جدول الفجوة الكامل

### A — Sitemap/Journeys (Docs/02)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| `/` Landing | لا | غير موجود إطلاقًا — يُبنى من الصفر (Phase 8) |
| `/login` `/register` (موبايل+باسورد) | جزئيًا | موجود auth إيميل+باسورد + sessions/JWT + verify-email؛ لا تسجيل بالموبايل ولا `mustChangePassword` ولا reset للأدمن |
| `/u/:username` | جزئيًا | موجودة وتعمل بـ `ClassicTemplate` + metadata؛ بلا gating اشتراك/حالة/إخفاء إداري، وترجع `pages/sections/projectPages` بدل `publishedDoc` فقط |
| `/u/:username/projects/:slug` | جزئيًا | موجودة + `ProjectPageView` + metadata؛ نفس نواقص الـ gating أعلاه |
| `/terms` `/privacy` | لا (في النسخة) | موجودة في الأصل لكنها خاصة MarketOS — تحتاج نسخًا محايدة أو محتوى أدمن |
| `/sitemap.xml` `/robots.txt` للبروتفوليوهات | لا | الحالي: sitemap لـ `SharedLink` فقط، وrobots يسمح `/share` ويمنع `/content /calendar /settings` — يجب إعادة بنائهما للبروتفوليوهات المرئية فقط |
| `/app` نظرة عامة (اشتراك+حالة+متبقي) | لا | غير موجود |
| `/app/builder` | جزئيًا | موجود على `/profile/builder` (وليس `/app/builder`)، ثنائي الألواح لا ثلاثي، بلا `draftVersion`/تعارض 409، بلا Publish/Unpublish حقيقي |
| `/app/subscription` (طلب واتساب + سجل) | لا | غير موجود |
| `/app/notifications`, `/app/settings` | لا | غير موجود (الإعدادات مبعثرة داخل البيلدر: username/لغة/استهلاك جزئي) |
| `/admin/*` كاملًا | لا | غير موجود إطلاقًا في النسخة (مقصود — يُبنى لاحقًا) |
| Journeys (اشتراك واتساب→تفعيل→نشر→grace→انتهاء→نسيان باسورد) | لا | لا `SubscriptionRequest` ولا `graceEndsAt` ولا `dedupeKey` ولا reset مؤقت |

### B — Database (Docs/04 + Revisions + Round 2)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| `User` (phone unique, role, status, mustChangePassword, locale) | جزئيًا | الموجود: `email` unique + `passwordHash` + `isAdmin` + `emailVerified` — بلا phone/status/mustChangePassword/locale |
| `Session` (tokenHash, remember, lastSeenAt, ua, ip) | جزئيًا | الموجود: `token` + `expiresAt` فقط |
| `Plan` (name{i18n}, priceEgp, durationDays, limits{...}, isActive, sortOrder) | جزئيًا | الموجود: `priceEgp/priceEgpAnnual/workspaceLimit/postsPerMonth/storageMb/trialDays/features` — بلا `durationDays` ولا `limits.templates/cvTools/customDomain/hideBadge` |
| `SubscriptionRequest` (code, PENDING, partial-unique) | لا | غير موجود |
| `Subscription` (startsAt/endsAt/graceEndsAt/canceledAt/planSnapshot/requestId) | جزئيًا | الموجود: `status/startedAt/expiresAt/trial/gracePeriodEndsAt/paymentProvider` — بلا `graceEndsAt` لقطة ولا `planSnapshot` ولا `requestId` |
| `Payment` (manual, subscriptionId unique, confirmedBy) | جزئيًا | الموجود: provider/orderId/amount/status/metadata — دفع Paymob/Firebase سياق مختلف |
| `Portfolio` (username unique, DRAFT/PUBLISHED, adminHidden+Reason, draftDoc/publishedDoc/schemaVersion) | جزئيًا | الموجود: `UserProfile(username unique)` + `ProfilePage(home)` + `PageSection` + `ProjectPage/ProjectItem` + `Testimonial/Service` — **وثيقة JSON مفككة relationally بدل `draftDoc/publishedDoc`**؛ بلا status/adminHidden/schemaVersion |
| `Media` (kind/mime/storageKey/thumbKey/orphanedAt) | جزئيًا | الموجود: `Media(cloudinaryId/url/workspaceId)` + `MediaFile(path/publicUrl/purpose)` — بلا `storageKey` عشوائي ولا `thumbKey` ولا سياسة يتيم 7 أيام |
| `Notification` (type/title{ar,en}/dedupeKey/readAt) | جزئيًا | الموجود: `type/title/body/link/isRead` (نص واحد لا مترجم، بلا dedupeKey) |
| `DeviceToken` / `PlatformSetting` / `AuditLog` | جزئيًا/لا | `FcmToken` موجود (يقابل DeviceToken)؛ `SystemSetting(key/value)` يقابل PlatformSetting جزئيًا؛ `AdminAuditLog/AdminUserNote` موجودة بصيغة MarketOS لا `AuditLog` الخطة |
| `RateLimitBucket` | لا | غير موجود (الموجود throttle ذاكرة فقط في `track/route.ts`: 60/min لكل IP) |
| `DailyVisit` + `VisitDedup` (تراكمي+dedupe hash) | لا | البديل الموجود: `PortfolioViewEvent` صف-لكل-حدث (page/project/whatsapp + country/language/referrer) — نموذج مختلف كليًا |
| `LandingContent` (singleton sections/socialLinks) | لا | غير موجود |
| `CvImportJob` / `CvExportJob` | لا | غير موجود |
| حالة الاشتراك المحسوبة (NONE/ACTIVE/GRACE/EXPIRED/SUSPENDED) | لا | غير موجودة — البيلدر يفحص ملكية workspace بدل الاشتراك |

### C — API/Backend (Docs/05)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| شكل موحد `{code,message,fields?}` + Zod + Pagination إلزامي | لا | لا Zod في البورتفوليو؛ لا pagination في أي endpoint بورتفوليو |
| Auth (register/login/logout/me/change-password بالموبايل) | جزئيًا | إيميل+باسورد فقط؛ لا `/api/auth/*` موبايل ولا remember ولا change-password إجباري |
| `/api/me/**` (profile/subscription/plans/requests/notifications/devices) | لا | غير موجود |
| Builder (`GET portfolio`, `PUT draft expectedVersion→409`, `POST publish/unpublish`, `PATCH username`, `username-available`, uploads/media CRUD) | جزئيًا | الموجود Server Actions: `getOrCreateProfile/updatePortfolio/create-update-deleteProjectPage/getAdminWorkspaceContent/getPortfolioAnalytics` + `POST /api/portfolio/track` — بلا versioning/409، بلا publish/unpublish حقيقي، بلا username-available، والرفع Cloudinary مباشر |
| Public (`GET /api/public/u/:username`, `.../projects/:slug`, contact settings, uploads key) | جزئيًا | لا API عام إطلاقًا — الصفحات تقرأ Prisma مباشرة بلا gating؛ لا contact-settings عام |
| Admin (`dashboard/users/requests/subscriptions/payments/plans/portfolios/notifications/settings/audit-log`) | لا | غير موجود في النسخة |
| Approve transaction + scheduled (lifecycle/media-cleanup/session-cleanup) | لا | غير موجود |

### D — Phase 5 Builder (المحرر + Renderer)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| وثيقة Zod `.strict()` + `schemaVersion:1` + نص عادي فقط + حدود (30 قسم/50 مشروع/60 عنصر) | لا | لا schema إطلاقًا — `content/settings/appearance` حرة `Json`؛ لا حدود أعداد/أطوال موحدة |
| أنواع الأقسام الكاملة (hero/about/skills/experience/services/projects/gallery/files/testimonials/contact/footer/custom) | جزئيًا | الموجود: hero/about/experience/skills/services/projects/testimonials/footer (contact هُجّر إلى footer). **الناقص: `gallery` (certificates/copies)، `files` (video-script)، `contact` المستقل، `custom`** |
| `Project {slug unique, cover, tags, links, galleryIds, visible}` | جزئيًا | الموجود: `ProjectPage(title/slug/description/coverImage/tags/gallery/displayMode/backButton)` + `ProjectItem(workspace_* /external_*)` — بلا `visible` ولا `galleryMediaIds` حقيقية |
| تحقق مرجعي mediaId (مانع IDOR) → 422 | لا | لا تحقق ملكية إطلاقًا |
| حدود الخطة عند Publish + استهلاك معروض | لا | لا حدود ولا `getEffectiveLimits` |
| Draft/Published + `draftVersion` + مؤشر تغييرات + Unpublish يحتفظ | لا | حفظ واحد مباشر (`updatePortfolio`) يغيّر المنشور فورًا؛ لا نسختين ولا مؤشر فرق |
| شروط النشر (username+hero.name+قسم ظاهر+اشتراك) | جزئيًا | username فريد (slugify بسيط) + زر Publish شكلي؛ بلا فحص hero/اشتراك/أقسام |
| username (regex 3-30 + محجوز + 409 سباق + تحذير تغيير) | جزئيًا | slugify + clash-check بسيط؛ بلا regex صارم ولا قائمة محجوزة ولا 409 سباق |
| وثيقة افتراضية فارغة + placeholders لا تُحفظ + `isSectionEmpty` | جزئيًا | تُنشأ 8 أقسام افتراضية **بمحتوى مترجم جاهز** (عكس المطلوب)؛ لا إخفاء للفارغ في العام |
| خطوط محلية (Cairo/Tajawal/Poppins/Inter) + presets (ocean+3+custom) + تحذير تباين | جزئيًا | `font: inter/playfair/mono/satoshi` + `theme: minimal/dark/warm/bold/soft/glass` + ألوان حرة — ليست presets الخطة ولا خطوطها |
| أيقونات build-time (لا CDN) | نعم | `lucide-react` محلية + Google Fonts (Cairo Play عبر `@import` — تُنقل محليًا لاحقًا) |
| Renderer Basel (nav+hero مائل+about+stats+skills bars+projects+files+contact+footer) بوضعي view/edit | جزئيًا | `ClassicTemplate` واحد يغطي hero/about/skills/experience/services/projects/testimonials/footer + وضعا `view` ضمني و`edit` عبر `LivePreview` — بلا `data-block-id`/outline/toolbar عائمة على البلوك ولا `ProjectPage` كمكوّن renderer |
| State (doc/selection/history≥50+دمج 800ms/dirty/saveStatus) + autosave 1.5s + طابور + backoff + beforeunload + مودال 409 | جزئيًا | Undo/Redo + dnd-kit (سحب + كيبورد جزئي عبر `sortableKeyboardCoordinates`) + حفظ (يدوي/تلقائي حسب الزر)؛ بلا history موثق 50 ولا دمج 800ms ولا طابور/backoff ولا مودال تعارض |
| Top bar (undo/redo/حفظ/publish/معاينة جهاز/عرض الصفحة/شارة) | جزئيًا | موجودة داخل `BuilderClient` (Undo/Redo/حفظ/Publish/موبايل-ديسكتوب/عرض حي) — بلا تبديل Tablet صريح ولا شارة Draft/Published حقيقية |
| Left (صفحات+أقسام: سحب+كيبورد+تكرار+حذف+إضافة) | جزئيًا | سحب dnd + إظهار/إخفاء + إضافة/حذف؛ التكرار والكيبورد الكامل ناقصان؛ لا فهرس أنواع مقيدة بالخطة |
| Center (renderer edit + تحرير مباشر `EditableText` + toolbar عائمة) | جزئيًا | معاينة حية داخل `LivePreview`؛ التحرير من اللوحات لا مباشر على الـ canvas؛ بلا toolbar عائمة |
| Right (القسم/التصميم/الإعدادات + MediaPicker) | جزئيًا | تبويبات داخلية (Theme/Sections/Projects/Testimonials)؛ بلا تبويب تصميم (preset/meta-SEO) ولا `MediaPicker` (يوجد `WorkspacePickerModal` بدلًا منه) |
| موبايل (drawer/bottom-sheet بلا scroll أفقي) | جزئيًا | تصميم متجاوب (Monitor/Smartphone toggle)؛ بلا drawer/sheet صريحين |
| أمان (لا v-html + XSS + allowlist روابط) | جزئيًا | لا `v-html`؛ لكن بلا فحص XSS صريح ولا allowlist (`https/http/mailto/tel`) موثقة |
| i18n المحرر ar/en + معاينة RTL/LTR حسب `contentLocale` | جزئيًا | محتوى ثنائي `ar/en` + `dir` حسب `defaultLanguage` + `I18nProvider`؛ واجهة المحرر نفسها ليست كاملة ar/en |

### E — Phase 6 Public (Routes + SEO + Gating)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| شروط الظهور (PUBLISHED ∧ !adminHidden ∧ ACTIVE ∧ اشتراك) → 404 موحدة | لا | لا شروط إطلاقًا — أي `username` بصفحة `home` يظهر |
| API يرجع `publishedDoc` فقط (بلا phone/userId/draft) | لا | لا API؛ والصفحة تمرر كامل `profile` (بما فيه `contactLinks/appearance/localized`) للـ Client Component |
| لغة/اتجاه من `contentLocale` | جزئيًا | `defaultLanguage` + `colorMode` من `appearance`؛ `lang/dir` على مستوى المكوّن لا `<html>` |
| كاش SSR/ISR قصير + 404 بلا كاش طويل | لا | `force-dynamic` في الـ layout؛ بلا `s-maxage`/ISR |
| `noindex` لغير المتاح | لا | غير موجود |
| SEO (title/description/canonical مطلق/og/twitter/og:locale/lang-dir/JSON-LD Person+escape) | جزئيًا | `generateMetadata(title/description)` فقط؛ بلا canonical وog:image مطلق وJSON-LD و`og:locale` |
| `/sitemap.xml` (مرئي فقط) + `/robots.txt` (allow /u، disallow /app /admin /api) | لا | sitemap الحالي `SharedLink` فقط؛ robots خاص MarketOS |
| أداء (thumbs/srcset/lazy/hero أولوية/swap) | جزئيًا | صور عادية + `TestimonialsSlider` بـ portal؛ بلا `srcset`/thumbs موثقة |
| زر «عرض الصفحة» بحالة (منشور/غير متاح) | جزئيًا | زر View Live موجود يفتح `/u/username` دائمًا بلا حالة |
| معايير القبول (جدول ظهور/SSR curl/lang/username كبير/slug/XSS/Lighthouse) | لا | لم تُطبق — تحتاج بناءً من الصفر على الـ gating الجديد |

### F — Phase 7 Admin (غير موجود إطلاقًا — يُبنى من الصفر)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| Dashboard بأرقام حقيقية + بطاقات روابط + آخر طلبات/اشتراكات | لا | — |
| Portfolios (بحث/فلاتر + hide/unhide بسبب + Audit + إشعار مالك) | لا | — |
| Audit UI (فلاتر + درج meta بلا أسرار) | لا | — |
| Settings الكاملة + DataTable + sidebar قابل للطي + i18n-lint + axe + EXPLAIN | لا | — |

### G — Phase 10 Templates/Theming
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| عقد تمبلت موحد + `basel/` + تمبلت ثانٍ يغطي كل الأقسام | لا | تمبلت واحد `ClassicTemplate` بلا عقد ولا `meta/isPremium` |
| قيد `limits.templates` → 403 (لا 422) + عدم تغيير القالب عند انتهاء الاشتراك | لا | لا قيد إطلاقًا |
| تبويب «القالب» (thumbnails/قفل/ترقية/معاينة) + ألوان/خط/أفاتار للجميع | جزئيًا | الألوان/الخط/الأفاتار متاحة للجميع فعليًا (جيد)؛ بلا تبويب قوالب ولا قفل/ترقية |
| Badge «Powered by» للمجاني (معاينة+عام، لا edit) | لا | غير موجود |
| XSS/allowlist على التمبلت الثاني + موبايل 2/صف | لا | — |

### H — Phase 11 Analytics
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| `recordVisit` تراكمي (`DailyVisit` + `VisitDedup` hash، بعد الاستجابة، يتجاهل المالك، فشل صامت) | جزئيًا | الموجود: `POST /api/portfolio/track` + `TrackBeacon` (keepalive/sessionStorage dedupe لكل tab) + `PortfolioViewEvent` لكل حدث — **نموذج مختلف**: صف لكل حدث لا تراكمي، وdedupe لكل session-tab لا hash يومي، ويحتسب المالك |
| `GET /api/me/analytics` مقيد (إجمالي + 30 يوم + مشاريع) | جزئيًا | الموجود: `getPortfolioAnalytics()` (Server Action لا endpoint) بمقاييس أغنى (allTime/7d/30d/prev/project/whatsapp/daily/projects/countries) + `AnalyticsDashboard` برسوم بيانية — يتجاوز v1 المطلوب (أرقام فقط) لكن على النموذج القديم |
| بطاقة `/app` + تنظيف `VisitDedup` (>يومين) | لا/جزئيًا | البطاقة في `/profile/builder/analytics` لا `/app`؛ لا مهمة تنظيف |
| معايير القبول (dedupe يومي/يوم تالٍ/مالك/IDOR/1000→صف واحد/تنظيف/ar-en) | جزئيًا | الـ dedupe الحالي session-tab فقط؛ الباقي يُعاد تصميمه على `DailyVisit` |

### I — Phase 12 CV Import/Export (مدفوع)
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| `CvImportJob/CvExportJob` + queue + استخراج PDF/DOCX + heuristic + مراجعة قبل الحفظ + قيد `cvTools` → 403 | لا | غير موجود إطلاقًا |
| تصدير ATS (نص قابل للتحديد، بلا جداول/أعمدة/صور، خط قياسي) كـ `Media` + حذف CV الأصلي بعد 24h | لا | غير موجود |

### J — Phase 13 Landing CMS + Phase 8 Landing
| الميزة/المتطلب | موجودة؟ | ملاحظات |
|---|---|---|
| `LandingContent` + `GET /api/public/landing` + `PUT /api/admin/landing` + إدارة أقسام `{ar,en}` + `socialLinks` مغلقة + صور عبر MediaPicker + ربط `/` وfooter وواتساب | لا | غير موجود إطلاقًا — يُبنى من الصفر |

## 5) النسب المطلوبة
- **البورتفوليو بيلدر الحالي يغطي ~62% من متطلبات Phase 5 (Builder)، و ~45% من متطلبات Phase 6 (Public Pages).**
- (الأدمن بانل والـ Landing غير موجودين إطلاقًا في الكود القديم — 0% — وسيُبنيان من الصفر بنفس روح التصميم أدناه.)

> منهجية التقدير: Phase 5 حُسبت على 17 معيار قبول (مكتمل ≈ 6، جزئي ≈ 9، مفقود ≈ 2)؛ Phase 6 على 12 معيارًا (مكتمل ≈ 2، جزئي ≈ 5، مفقود ≈ 5). الجزئي حُسب بنصف وزن.

## 6) Design Language المستخرج من الكود الفعلي (مرجع الأدمن + Landing لاحقًا)
- **الألوان** (`globals.css :root`): navy عميق `#272729` + navy وسط `#2a2a2c` كنصوص/أسطح داكنة؛ **الأساسي أزرق `#0066cc`** (مسمى `ph-gold` تاريخيًا) + hover `#0071e3`؛ الداكن `#2997ff`. الخلفيات: فاتح `#f5f5f7` و`#FFFFFF`، حدود `#e0e0e0`، نص ثانوي `#7a7a7a`. نجاح `#16A34A`، خطر `#DC2626`. الوضع الداكن: صفحة `#0e0e10`، سطح `#18181b/#1f1f23`، حدود `#333336`، نص `#f5f5f7`.
- **الخطوط**: `Inter` (لاتيني) + `Space Grotesk` للعناوين + **`Cairo Play` للعربي** (`font-arabic`) — عناوين RTL بوزن 900، وinputs RTL ما عدا email/password/url/tel تبقى LTR.
- **الشكل**: زوايا `4/8/12/16/20/full`؛ `Input` بارتفاع `h-12` وزاوية `14px` وخلفية surface و`focus:ring` بالأساسي؛ `Button` بارتفاع `36px(sm)/42px(md)` بخمسة variants (primary أزرق solid، secondary بحدود، ghost، danger/success بتدرج 10%). ظلال ناعمة navy بشفافية 6-10%. `focus-visible` بـ outline أساسي. حركة `stagger` (صعود 20px خلال 0.55s بتأخير 70ms لكل عنصر).
- **روح البيلدر/الأوتبوت**: لوحة فاتحة ببطاقات `glass-card` بيضاء، شريط علوي بأزرار Undo/Redo وحالة حفظ وزر Publish بارز أزرق، تبويبات يسار (Theme/Sections/Projects)، معاينة حية يمين داخل `LivePreview`، زر واتساب عائم في العام (`whatsapp_click` يُتتبع)، سلايدر توصيات بـ lightbox، وتبديل لغة `ar/en` ووضع `light/dark` داخل الصفحة العامة نفسها.

## 7) توصيات المرحلة القادمة (مبنية على الموجود فعليًا)
1. **تثبيت الأساس**: `npm install` + `.env` (Supabase URL/anon/service + `DATABASE_URL` مؤقت) + `prisma generate` — ثم **استبدال Prisma/Postgres بـ Supabase** (Auth/DB/Storage) ونقل `UserProfile/ProfilePage/PageSection/ProjectPage/*` إلى سكيمة `Portfolio(draftDoc/publishedDoc)` الجديدة؛ `_legacy-backend-reference` للقراءة فقط.
2. **فك التشابك أولًا**: حذف شرط `requirePortfolioAdmin(workspace)` → صلاحية مستخدم عادي؛ استبدال `WorkspacePickerModal` بـ `MediaPicker`؛ استبدال Cloudinary بـ Supabase Storage؛ تنظيف `I18nProvider/PlatformProvider/middleware/sitemap/robots/layout` من بقايا MarketOS.
3. **إكمال Phase 5**: إضافة Zod `.strict()` + `draftVersion` و409 + Publish/Unpublish حقيقي + قائمة username المحجوزة + الأقسام الناقصة (`gallery/files/contact/custom`) + `EditableText` + toolbar عائمة + تبويب تصميم (preset/meta-SEO).
4. **إكمال Phase 6**: بوابة ظهور + `publishedDoc` فقط + SEO كامل (canonical/og/JSON-LD) + sitemap/robots للبروتفوليوهات + كاش قصير + صفحة 404 موحدة.
5. **تقليص `package.json`**: إزالة ما لا يخص البورتفوليو (FullCalendar، Tiptap، Firebase، ioredis، resend، jose/jsonwebtoken حسب الحاجة) والإبقاء على (`next/react`, `dnd-kit/*`, `lucide-react`, `next-themes`, `@prisma/client` مؤقتًا حتى اكتمال Supabase، `tailwindcss`).
6. **ثم بالترتيب**: Analytics على `DailyVisit` → Templates (تمبلت ثانٍ + badge) → CV → Admin → Landing/CMS — كلها بنفس الـ Design Language أعلاه.
