import type { ReactNode } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { getPlatformName } from '@/lib/platform'
import { buildWhatsappUrl, DEFAULT_UPGRADE_MESSAGE } from '@/lib/whatsapp'
import { LandingHeader } from './LandingHeader'

// Marketing landing styled with the PortfolioHub design system (DESIGN.md):
// Apple-inspired, one blue accent family, alternating light/dark full-bleed
// sections, Inter / Cairo / Six Caps type, flat 18px cards with hairline
// borders and hover-only shadows. All copy, prices, links and section order
// are preserved — decorative emoji-only icons were already replaced by
// Feather-style line icons.
export async function LandingPage({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang !== 'en'
  const dir = ar ? 'rtl' : 'ltr'
  const name = await getPlatformName().catch(() => 'PortfolioHub')

  const [plans, settings] = await Promise.all([
    prisma.plan
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { priceEgp: true, durationDays: true },
      })
      .catch(() => [] as Array<{ priceEgp: number; durationDays: number | null }>),
    getSettings(['contact.whatsapp', 'contact.facebook', 'contact.instagram', 'contact.linkedin', 'contact.twitter'] as never[])
      .catch(() => ({} as Record<string, unknown>)),
  ])
  const monthly = plans.find((p) => (p.durationDays ?? 0) === 30)
  const annual = plans.find((p) => (p.durationDays ?? 0) === 365)
  const monthlyPrice = monthly?.priceEgp ?? 150
  const annualPrice = annual?.priceEgp ?? 1000

  const waNumber = typeof settings['contact.whatsapp'] === 'string' ? (settings['contact.whatsapp'] as string) : ''
  const waHref =
    buildWhatsappUrl(waNumber, DEFAULT_UPGRADE_MESSAGE) ?? '/profile/subscription'
  const waTarget = waHref.startsWith('http') ? '_blank' : undefined
  const socials = [
    { key: 'contact.facebook', label: 'Facebook', href: settings['contact.facebook'] },
    { key: 'contact.instagram', label: 'Instagram', href: settings['contact.instagram'] },
    { key: 'contact.linkedin', label: 'LinkedIn', href: settings['contact.linkedin'] },
    { key: 'contact.twitter', label: 'X', href: settings['contact.twitter'] },
  ].filter((s) => typeof s.href === 'string' && (s.href as string).trim() !== '') as Array<{ key: string; label: string; href: string }>

  const t = {
    navFeatures: ar ? 'المزايا' : 'Features',
    navHow: ar ? 'ازاي بيشتغل' : 'How it works',
    navPlans: ar ? 'الأسعار' : 'Pricing',
    login: ar ? 'تسجيل الدخول' : 'Log in',
    navStart: ar ? 'ابدأ مجاناً' : 'Start free',
    startFree: ar ? 'ابدأ مجاناً الآن' : 'Start free now',
    liveDemo: ar ? 'شوف مثال حي' : 'See a live example',
    proofLine: ar ? 'انضم لـ +500 فريلانسر مصري بيثقوا في PortfolioHub' : 'Join 500+ Egyptian freelancers who trust PortfolioHub',
    featuresTitle: ar ? 'ليه PortfolioHub؟' : 'Why PortfolioHub?',
    howTitle: ar ? 'ازاي بيشتغل؟' : 'How does it work?',
    pricingTitle: ar ? 'الأسعار' : 'Pricing',
    testiTitle: ar ? 'بيقولوا إيه عنا' : 'What they say',
    finalTitle: ar ? 'مستنى إيه؟ ابني بورتفوليو ينطق بشغلك النهارده' : 'What are you waiting for? Build a portfolio that speaks for your work today',
    finalCta: ar ? 'ابدأ مجاناً — مش محتاج كريدت كارد' : 'Start free — no credit card needed',
  }

  const features = ar
    ? [
        { icon: 'rocket', title: 'نشر فوري', body: 'خلال دقائق بورتفوليو كامل على النت' },
        { icon: 'palette', title: 'تصميم احترافي', body: 'قوالب عصرية بتليق على شغلك' },
        { icon: 'devices', title: 'يتفتح على أي جهاز', body: 'موبايل، تابلت، ديسكتوب' },
        { icon: 'lock', title: 'بياناتك محمية', body: 'سيرفرات آمنة وبياناتك معاك' },
        { icon: 'pencil', title: 'سهل التعديل', body: 'غيّر أي حاجة بكليكة من غير كود' },
        { icon: 'stats', title: 'شوف إحصائياتك', body: 'اعرف مين بيزور بورتفوليو ده' },
      ]
    : [
        { icon: 'rocket', title: 'Instant publish', body: 'A full portfolio online in minutes' },
        { icon: 'palette', title: 'Pro design', body: 'Modern templates that fit your work' },
        { icon: 'devices', title: 'Any device', body: 'Mobile, tablet, desktop' },
        { icon: 'lock', title: 'Protected data', body: 'Secure servers, your data stays yours' },
        { icon: 'pencil', title: 'Easy editing', body: 'Change anything in one click, no code' },
        { icon: 'stats', title: 'See your stats', body: 'Know who visits your portfolio' },
      ]

  const steps = ar
    ? [
        { n: '1', title: 'سجل حسابك مجاناً', body: 'في 30 ثانية' },
        { n: '2', title: 'اضيف شغلك وبياناتك', body: 'بيلدر بالسحب والإفلات' },
        { n: '3', title: 'انشر وشارك لينكك', body: 'النشر بكليكة واحدة' },
      ]
    : [
        { n: '1', title: 'Register free', body: 'In 30 seconds' },
        { n: '2', title: 'Add your work', body: 'Drag-and-drop builder' },
        { n: '3', title: 'Publish & share', body: 'One-click publish' },
      ]

  const testimonials = ar
    ? [
        { quote: 'PortfolioHub غيّر طريقة تقديمي للكلايينتس بشكل جنوني', name: 'أحمد محمد', role: 'مصمم جرافيك' },
        { quote: 'عملت بورتفوليو في نص ساعة وبدأت أجيب شغل من LinkedIn', name: 'سارة خالد', role: 'كريتور محتوى' },
        { quote: 'أخيراً حاجة بالعربي وسهلة وتليق على أي فريلانسر', name: 'عمر حسن', role: 'مطور ويب' },
      ]
    : [
        { quote: 'PortfolioHub changed how I present myself to clients', name: 'Ahmed M.', role: 'Graphic designer' },
        { quote: 'Built a portfolio in half an hour and started getting work', name: 'Sara K.', role: 'Content creator' },
        { quote: 'Finally something in Arabic, easy and fitting', name: 'Omar H.', role: 'Web developer' },
      ]

  const freePlanItems = ar ? ['Hero', 'About', 'المشاريع', 'الفوتر'] : ['Hero', 'About', 'Projects', 'Footer']
  const proPlanItems = ar
    ? ['Experience', 'Skills', 'Services', 'آراء العملاء', 'صفحات المشاريع', 'الإحصائيات']
    : ['Experience', 'Skills', 'Services', 'Testimonials', 'Project pages', 'Analytics']
  const annualPlanItems = ar ? ['كل مزايا الباقة الشهرية', 'دفعة واحدة في السنة'] : ['All monthly benefits', 'One yearly payment']

  return (
    <div dir={dir} lang={ar ? 'ar' : 'en'} className="ph-landing">
      <style>{`
        .ph-landing{
          --c-canvas:#ffffff;--c-canvas-alt:#f5f5f7;--c-tile1:#272729;--c-tile2:#2a2a2c;
          --c-ink:#1d1d1f;--c-ink-muted:#7a7a7a;--c-hairline:#e0e0e0;--c-divider:#f0f0f0;
          --c-accent:#0066cc;--c-accent-focus:#0071e3;--c-on-dark:#ffffff;--c-accent-on-dark:#2997ff;
          --c-on-primary:#ffffff;--c-card-hover:#f0f0f2;
          --c-glass:rgba(255,255,255,.86);--c-glass-solid:rgba(255,255,255,.97);
          --sp-xs:8px;--sp-sm:16px;--sp-md:24px;--sp-lg:32px;--sp-xl:48px;--sp-2xl:64px;
          --sp-3xl:80px;--sp-4xl:100px;--sp-6xl:180px;
          --f-primary:'Inter',system-ui,-apple-system,sans-serif;
          --f-display:'Six Caps',sans-serif;
          position:relative;isolation:isolate;min-height:100vh;overflow-x:hidden;
          background:var(--c-canvas);color:var(--c-ink);line-height:1.47;
          font-family:var(--f-primary);
        }
        html[lang='ar'] .ph-landing,html[dir='rtl'] .ph-landing{
          --f-primary:'Cairo','Inter',system-ui,-apple-system,sans-serif;line-height:1.65;
        }
        .dark .ph-landing,[data-theme='dark'] .ph-landing{
          --c-canvas:#0e0e10;--c-canvas-alt:#1a1a1d;--c-tile1:#141417;--c-tile2:#1e1e21;
          --c-ink:#f5f5f7;--c-ink-muted:#a1a1a6;--c-hairline:#3a3a3c;--c-divider:#2a2a2c;
          --c-accent:#2997ff;--c-accent-focus:#4aa3ff;--c-card-hover:#232326;
          --c-glass:rgba(18,18,20,.86);--c-glass-solid:rgba(18,18,20,.97);
        }
        .ph-landing a{color:inherit;text-decoration:none;}
        .ph-landing ul{list-style:none;margin:0;padding:0;}
        .ph-landing p{margin:0;}
        .ph-landing h1,.ph-landing h2,.ph-landing h3{margin:0;}
        .ph-landing svg{display:block;flex:none;}
        .ph-landing ::selection{background:rgba(0,102,204,.18);}
        .ph-container{width:100%;max-width:1320px;margin:0 auto;padding:0 var(--sp-xl);}

        /* ── Header ───────────────────────────────────────────── */
        .ph-header{position:fixed;top:0;inset-inline:0;z-index:1000;
          background:transparent;border-bottom:1px solid transparent;
          transition:background .4s,border-color .4s;}
        .ph-header.scrolled{
          background:var(--c-glass);
          -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
          border-bottom-color:var(--c-divider);}
        .ph-header-inner{display:flex;align-items:center;gap:var(--sp-sm);padding:var(--sp-sm) 0;position:relative;z-index:2;}
        .ph-brand{font-size:16px;font-weight:600;letter-spacing:-0.02em;color:var(--c-ink);}
        html[dir='rtl'] .ph-brand{letter-spacing:0;}
        .ph-nav{display:flex;align-items:center;gap:var(--sp-md);}
        .ph-nav a{font-size:13px;font-weight:500;letter-spacing:-0.01em;color:var(--c-ink-muted);transition:color .3s;}
        .ph-nav a:hover{color:var(--c-accent);}
        html[dir='rtl'] .ph-nav a{letter-spacing:0;}
        .ph-header-actions{display:flex;align-items:center;gap:var(--sp-xs);margin-inline-start:auto;}
        .ph-header-link{font-size:13px;font-weight:600;color:var(--c-ink-muted);padding:8px 4px;transition:color .25s;}
        .ph-header-link:hover{color:var(--c-ink);}

        /* Hamburger + overlay menu (DESIGN.md §5.12, ≤767px) */
        .ph-ham{display:none;width:44px;height:44px;border:none;background:none;cursor:pointer;
          flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0;}
        .ph-ham span{display:block;width:22px;height:2px;border-radius:2px;background:var(--c-ink);
          transition:transform .3s ease,opacity .3s ease;}
        .ph-header.menu-open .ph-ham span:nth-child(1){transform:translateY(7px) rotate(45deg);}
        .ph-header.menu-open .ph-ham span:nth-child(2){opacity:0;}
        .ph-header.menu-open .ph-ham span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
        .ph-menu{position:fixed;inset:0;z-index:1;background:var(--c-glass-solid);
          -webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-lg);
          opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s ease;
          direction:inherit;}
        .ph-header.menu-open .ph-menu{opacity:1;visibility:visible;}
        .ph-menu a{font-size:28px;font-weight:600;letter-spacing:-0.03em;color:var(--c-ink);position:relative;}
        html[dir='rtl'] .ph-menu a{letter-spacing:0;}
        .ph-menu a::after{content:'';position:absolute;inset-inline-start:0;bottom:-6px;width:100%;
          height:2px;background:var(--c-accent);transform:scaleX(0);transform-origin:var(--hx,left);
          transition:transform .3s ease;}
        html[dir='rtl'] .ph-menu a::after{--hx:right;}
        .ph-menu a:hover::after{transform:scaleX(1);}
        .ph-menu .ph-menu-cta{color:var(--c-accent);}

        /* ── Buttons ──────────────────────────────────────────── */
        .ph-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
          padding:14px 32px;font-size:15px;font-weight:600;letter-spacing:-0.01em;
          border-radius:12px;border:none;cursor:pointer;font-family:inherit;
          transition:background .3s,transform .2s,box-shadow .3s,border-color .3s,color .3s;}
        html[dir='rtl'] .ph-btn{letter-spacing:0;}
        .ph-btn-sm{padding:10px 20px;font-size:14px;}
        .ph-btn-primary{background:var(--c-accent);color:var(--c-on-primary);}
        .ph-btn-primary:hover{background:var(--c-accent-focus);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,102,204,.25);}
        .ph-btn-primary:active{transform:translateY(0);}
        .ph-btn-ghost{background:none;color:var(--c-ink);border:1px solid var(--c-hairline);}
        .ph-btn-ghost:hover{border-color:var(--c-accent);color:var(--c-accent);transform:translateY(-2px);}
        .ph-btn-ghost:active{transform:translateY(0);}
        .ph-dark .ph-btn-ghost{color:var(--c-on-dark);border-color:rgba(255,255,255,.28);}
        .ph-dark .ph-btn-ghost:hover{border-color:var(--c-accent-on-dark);color:var(--c-accent-on-dark);}
        .ph-btn svg{transition:transform .3s ease;}
        .ph-btn:hover svg.ph-arrow{transform:translateX(3px);}
        html[dir='rtl'] .ph-btn:hover svg.ph-arrow{transform:translateX(-3px) scaleX(-1);}

        /* ── Sections ─────────────────────────────────────────── */
        .ph-sec{padding:var(--sp-3xl) 0;}
        .ph-dark{background:var(--c-tile1);color:var(--c-on-dark);}
        .ph-sec-head{margin-bottom:var(--sp-lg);}
        .ph-num{display:block;font-family:var(--f-display);font-size:clamp(36px,4vw,64px);
          line-height:1;letter-spacing:.02em;color:var(--c-accent);direction:ltr;margin-bottom:var(--sp-sm);}
        .ph-dark .ph-num{color:var(--c-accent-on-dark);}
        .ph-title{font-size:clamp(28px,4vw,52px);font-weight:600;line-height:1.15;letter-spacing:-0.02em;}
        html[lang='ar'] .ph-title,html[dir='rtl'] .ph-title{letter-spacing:0;line-height:1.3;}
        .ph-dark .ph-title{color:var(--c-on-dark);}
        .ph-center{text-align:center;}
        .ph-center .ph-title{margin-inline:auto;max-width:700px;}

        /* ── Hero ─────────────────────────────────────────────── */
        .ph-hero{position:relative;min-height:100vh;display:flex;align-items:center;
          padding:var(--sp-6xl) 0 var(--sp-3xl);overflow:hidden;background:var(--c-canvas);}
        .ph-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
        .ph-orb-1{width:500px;height:500px;background:var(--c-accent);opacity:.15;top:-15%;left:-8%;animation:phFloat 25s ease-in-out infinite;}
        .ph-orb-2{width:400px;height:400px;background:#4a9eff;opacity:.15;bottom:-12%;right:-6%;animation:phFloat 30s ease-in-out infinite reverse;}
        .ph-orb-3{width:300px;height:300px;background:var(--c-accent);opacity:.08;top:40%;right:20%;animation:phFloat 20s ease-in-out infinite 5s;}
        @keyframes phFloat{
          25%{transform:translate(40px,-60px) scale(1.08);}
          50%{transform:translate(-20px,30px) scale(.95);}
          75%{transform:translate(50px,40px) scale(1.05);}
        }
        .ph-hero-inner{position:relative;z-index:1;text-align:center;}
        .ph-hero-title{font-size:clamp(38px,7vw,92px);font-weight:600;line-height:1.07;letter-spacing:-0.02em;max-width:16ch;margin-inline:auto;}
        html[lang='ar'] .ph-hero-title,html[dir='rtl'] .ph-hero-title{letter-spacing:0;line-height:1.25;max-width:22ch;}
        .ph-hero-sub{font-size:clamp(14px,1.2vw,20px);color:var(--c-ink-muted);line-height:1.6;max-width:56ch;margin:var(--sp-md) auto 0;}
        .ph-hero-ctas{display:flex;flex-wrap:wrap;gap:var(--sp-sm);justify-content:center;margin-top:var(--sp-xl);}

        /* ── Proof strip ──────────────────────────────────────── */
        .ph-proof{border-block:1px solid var(--c-divider);}
        .ph-proof-inner{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:var(--sp-md);padding:var(--sp-lg) 0;}
        .ph-avatars{display:flex;}
        .ph-avatars span{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--c-on-primary);border:2px solid var(--c-canvas);}
        .ph-avatars span+span{margin-inline-start:-10px;}
        .ph-proof-line{font-size:14px;font-weight:500;color:var(--c-ink-muted);}

        /* ── Grids & cards ────────────────────────────────────── */
        .ph-grid{display:grid;gap:var(--sp-md);}
        .ph-grid-3{grid-template-columns:repeat(3,1fr);}
        .ph-card{background:var(--c-canvas-alt);border:1px solid var(--c-divider);border-radius:18px;
          padding:var(--sp-xl);display:flex;flex-direction:column;
          transition:transform .3s,background .3s,border-color .3s;}
        .ph-card:hover{transform:translateY(-4px);background:var(--c-card-hover);border-color:var(--c-hairline);}
        .ph-card:active{transform:scale(.98);}
        .ph-card h3{font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.02em;margin:0 0 var(--sp-sm);}
        html[dir='rtl'] .ph-card h3{letter-spacing:0;}
        .ph-card p{font-size:14px;color:var(--c-ink-muted);line-height:1.7;}
        .ph-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
          background:rgba(0,102,204,.1);color:var(--c-accent);margin-bottom:var(--sp-md);}
        .dark .ph-icon{background:rgba(41,151,255,.12);}
        .ph-dark .ph-card{background:var(--c-tile2);border-color:rgba(255,255,255,.08);}
        .ph-dark .ph-card:hover{background:#323234;border-color:var(--c-accent-on-dark);}
        .dark .ph-dark .ph-card:hover{background:#28282b;}
        .ph-dark .ph-card h3{color:var(--c-on-dark);}
        .ph-dark .ph-card p{color:rgba(255,255,255,.75);}
        .ph-dark .ph-icon{background:rgba(41,151,255,.15);color:var(--c-accent-on-dark);}
        .ph-step-num{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
          font-family:var(--f-display);font-size:26px;line-height:1;letter-spacing:.02em;
          background:rgba(41,151,255,.15);color:var(--c-accent-on-dark);margin-bottom:var(--sp-md);}

        /* ── Pricing ──────────────────────────────────────────── */
        .ph-price{background:var(--c-canvas-alt);border:1px solid var(--c-divider);border-radius:18px;
          padding:var(--sp-xl);display:flex;flex-direction:column;position:relative;
          transition:transform .3s,border-color .3s,box-shadow .3s;}
        .ph-price:hover{transform:translateY(-4px);}
        .ph-price.featured{border-color:var(--c-accent);}
        .ph-price.featured:hover{box-shadow:0 8px 24px rgba(0,102,204,.18);}
        .ph-badge{position:absolute;top:-12px;inset-inline-start:var(--sp-md);padding:5px 12px;border-radius:9999px;
          font-size:11px;font-weight:600;letter-spacing:.02em;background:var(--c-accent);color:var(--c-on-primary);}
        .ph-price h3{font-size:19px;font-weight:600;letter-spacing:-0.02em;}
        html[dir='rtl'] .ph-price h3{letter-spacing:0;}
        .ph-price-sub{font-size:13px;color:var(--c-ink-muted);margin-top:4px;}
        .ph-amount{margin-top:var(--sp-md);font-size:40px;font-weight:600;letter-spacing:-0.03em;line-height:1.2;color:var(--c-accent);}
        html[dir='rtl'] .ph-amount{letter-spacing:0;}
        .ph-amount small{font-size:13px;font-weight:400;color:var(--c-ink-muted);margin-inline-start:6px;}
        .ph-save{margin-top:var(--sp-sm);align-self:flex-start;padding:5px 12px;border-radius:9999px;
          font-size:11px;font-weight:600;color:#1f7a3d;background:rgba(48,209,88,.12);border:1px solid rgba(48,209,88,.3);}
        .dark .ph-save{color:#7ee2a0;}
        .ph-feats{margin-top:var(--sp-md);display:grid;gap:12px;flex:1;}
        .ph-feats li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--c-ink-muted);line-height:1.6;}
        .ph-feats li svg{margin-top:3px;color:var(--c-accent);}
        .ph-price .ph-btn{margin-top:var(--sp-md);width:100%;}

        /* ── Testimonials ─────────────────────────────────────── */
        .ph-quote{background:var(--c-tile2);border:1px solid rgba(255,255,255,.08);border-radius:18px;
          padding:var(--sp-xl);display:flex;flex-direction:column;gap:var(--sp-md);
          transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease;}
        .ph-quote:hover{transform:translateY(-4px);border-color:var(--c-accent-on-dark);box-shadow:0 20px 48px rgba(0,0,0,.35);}
        .ph-quote blockquote{margin:0;font-size:15px;line-height:1.85;color:rgba(255,255,255,.75);}
        .ph-quote figcaption{display:flex;align-items:center;gap:12px;margin-top:auto;}
        .ph-quote-avatar{width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--c-on-primary);}
        .ph-quote-name{display:block;font-size:14px;font-weight:600;color:var(--c-on-dark);}
        .ph-quote-role{display:block;font-size:12px;color:rgba(255,255,255,.6);}

        /* ── Final CTA ────────────────────────────────────────── */
        .ph-cta-btns{margin-top:var(--sp-xl);display:flex;justify-content:center;}

        /* ── Footer ───────────────────────────────────────────── */
        .ph-footer{background:var(--c-canvas-alt);border-top:1px solid var(--c-divider);padding:var(--sp-4xl) 0 0;}
        .ph-footer-top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:var(--sp-3xl);}
        .ph-footer-brand{max-width:34ch;}
        .ph-footer-logo{font-size:18px;font-weight:600;letter-spacing:-0.02em;color:var(--c-ink);}
        html[dir='rtl'] .ph-footer-logo{letter-spacing:0;}
        .ph-footer-brand p{margin-top:var(--sp-md);font-size:14px;color:var(--c-ink-muted);line-height:1.7;}
        .ph-footer-nav{display:flex;flex-wrap:wrap;gap:var(--sp-lg);}
        .ph-footer-nav a{font-size:14px;color:var(--c-ink-muted);transition:color .25s;}
        .ph-footer-nav a:hover{color:var(--c-accent);}
        .ph-socials{display:flex;gap:10px;}
        .ph-socials a{width:38px;height:38px;display:flex;align-items:center;justify-content:center;
          border:1px solid var(--c-divider);border-radius:10px;font-size:13px;font-weight:600;color:var(--c-ink-muted);
          transition:background .3s,color .3s,border-color .3s,transform .3s;}
        .ph-socials a:hover{background:var(--c-accent);color:var(--c-on-primary);border-color:var(--c-accent);}
        .ph-footer-bottom{margin-top:var(--sp-4xl);padding:var(--sp-lg) 0;border-top:1px solid var(--c-divider);
          font-size:12px;color:var(--c-ink-muted);}

        /* ── WhatsApp float (physical right, both directions) ─── */
        .ph-whatsapp{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;z-index:99;
          background:var(--c-accent);color:var(--c-on-primary);
          transition:transform .2s,background .2s;}
        .ph-whatsapp:hover{background:var(--c-accent-focus);transform:scale(1.05);}
        .ph-whatsapp:active{transform:scale(.95);}

        /* ── Reveal (visible by default; scroll-driven when supported) ── */
        .ph-landing [data-reveal]{opacity:1;transform:none;}
        @keyframes phReveal{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
        @supports (animation-timeline:view()){
          @media (prefers-reduced-motion:no-preference){
            .ph-landing [data-reveal]{animation:phReveal linear both;animation-timeline:view();animation-range:entry 0% cover 30%;}
          }
        }

        @media (max-width:1024px){
          .ph-container{padding:0 var(--sp-lg);}
          .ph-hero{padding:var(--sp-6xl) 0 var(--sp-3xl);}
        }
        @media (max-width:767px){
          .ph-container{padding:0 var(--sp-md);}
          .ph-nav{display:none;}
          .ph-header-link{display:none;}
          .ph-ham{display:flex;}
          .ph-hero{padding:140px 0 64px;min-height:auto;}
          .ph-grid-3{grid-template-columns:1fr;}
          .ph-footer-top{gap:var(--sp-xl);}
          .ph-whatsapp{bottom:80px;right:16px;width:50px;height:50px;}
        }
        @media (max-width:479px){
          .ph-hero{padding:120px 0 40px;}
          .ph-hero-title{font-size:38px;}
          .ph-title{font-size:22px;}
          .ph-num{font-size:48px;}
          .ph-card,.ph-price,.ph-quote{padding:var(--sp-lg);}
          .ph-hero-ctas,.ph-cta-btns{flex-direction:column;align-items:stretch;}
          .ph-hero-ctas .ph-btn,.ph-cta-btns .ph-btn{width:100%;padding:14px 28px;}
          .ph-footer-top{flex-direction:column;}
        }
      `}</style>

      {/* Header */}
      <LandingHeader
        name={name}
        ar={ar}
        labels={{
          features: t.navFeatures,
          how: t.navHow,
          plans: t.navPlans,
          login: t.login,
          start: t.navStart,
        }}
      />

      <main>
        {/* 1. Hero */}
        <section className="ph-hero">
          <span className="ph-orb ph-orb-1" aria-hidden="true" />
          <span className="ph-orb ph-orb-2" aria-hidden="true" />
          <span className="ph-orb ph-orb-3" aria-hidden="true" />
          <div className="ph-container">
            <div className="ph-hero-inner">
              <div data-reveal>
                <h1 className="ph-hero-title">
                  {ar ? 'احبس الأنظار من أول نظرة على بورتفوليو ينطق بموهبتك' : 'Stop scrollers with a portfolio that speaks your talent'}
                </h1>
                <p className="ph-hero-sub">
                  {ar ? 'اعمل بورتفوليو احترافي في دقائق وانشره مجاناً على النت' : 'Build a professional portfolio in minutes and publish it free online'}
                </p>
                <div className="ph-hero-ctas">
                  <Link href="/register" className="ph-btn ph-btn-primary">
                    {t.startFree}
                    <ForwardArrow />
                  </Link>
                  <Link href="/u/bousla" className="ph-btn ph-btn-ghost">{t.liveDemo}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Social proof */}
        <section className="ph-proof">
          <div className="ph-container">
            <div className="ph-proof-inner" data-reveal>
              <div className="ph-avatars" aria-hidden="true">
                {['أ', 'م', 'س', 'ح', 'ع'].map((ch, i) => (
                  <span key={i} style={{ backgroundColor: ['#0066cc', '#2997ff', '#4a9eff', '#0071e3', '#5aa9ff'][i] }}>
                    {ch}
                  </span>
                ))}
              </div>
              <p className="ph-proof-line">{t.proofLine}</p>
            </div>
          </div>
        </section>

        {/* 3. Features — light */}
        <section id="features" className="ph-sec">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">01</span>
              <h2 className="ph-title">{t.featuresTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3">
              {features.map((f) => (
                <div key={f.title} className="ph-card" data-reveal>
                  <span className="ph-icon">{featureIcons[f.icon]}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. How it works — dark */}
        <section id="how" className="ph-sec ph-dark">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">02</span>
              <h2 className="ph-title">{t.howTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3">
              {steps.map((s) => (
                <div key={s.title} className="ph-card" data-reveal>
                  <span className="ph-step-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Pricing — light */}
        <section id="plans" className="ph-sec">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">03</span>
              <h2 className="ph-title">{t.pricingTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3">
              {/* Free */}
              <div className="ph-price" data-reveal>
                <h3>{ar ? 'مجاني' : 'Free'}</h3>
                <p className="ph-price-sub">{ar ? 'مجاني للأبد' : 'Free forever'}</p>
                <p className="ph-amount">0 <small>{ar ? 'جنيه' : 'EGP'}</small></p>
                <ul className="ph-feats">
                  {freePlanItems.map((x) => (
                    <li key={x}><Check />{x}</li>
                  ))}
                </ul>
                <Link href="/register" className="ph-btn ph-btn-primary ph-btn-sm">{ar ? 'ابدأ مجاناً' : 'Start free'}</Link>
              </div>

              {/* Monthly — most popular */}
              <div className="ph-price featured" data-reveal>
                <span className="ph-badge">{ar ? 'الأكثر طلباً' : 'Most popular'}</span>
                <h3>{ar ? 'شهري Pro' : 'Monthly Pro'}</h3>
                <p className="ph-price-sub">{ar ? 'كل المزايا' : 'All features'}</p>
                <p className="ph-amount">{monthlyPrice} <small>{ar ? 'جنيه/شهر' : 'EGP/mo'}</small></p>
                <ul className="ph-feats">
                  {proPlanItems.map((x) => (
                    <li key={x}><Check />{x}</li>
                  ))}
                </ul>
                <a href={waHref} target={waTarget} rel={waTarget ? 'noreferrer' : undefined} className="ph-btn ph-btn-primary ph-btn-sm">
                  {ar ? 'اشترك عبر واتساب' : 'Subscribe via WhatsApp'}
                </a>
              </div>

              {/* Annual */}
              <div className="ph-price" data-reveal>
                <h3>{ar ? 'سنوي Pro' : 'Annual Pro'}</h3>
                <p className="ph-price-sub">{ar ? 'نفس مزايا الشهري' : 'Same as monthly'}</p>
                <p className="ph-amount">{annualPrice} <small>{ar ? 'جنيه/سنة' : 'EGP/yr'}</small></p>
                <span className="ph-save">{ar ? 'وفّر 800 جنيه' : 'Save 800 EGP'}</span>
                <ul className="ph-feats">
                  {annualPlanItems.map((x) => (
                    <li key={x}><Check />{x}</li>
                  ))}
                </ul>
                <a href={waHref} target={waTarget} rel={waTarget ? 'noreferrer' : undefined} className="ph-btn ph-btn-ghost ph-btn-sm">
                  {ar ? 'اشترك عبر واتساب' : 'Subscribe via WhatsApp'}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Testimonials — dark */}
        <section className="ph-sec ph-dark">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">04</span>
              <h2 className="ph-title">{t.testiTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3">
              {testimonials.map((tc, i) => (
                <figure key={tc.name} className="ph-quote" data-reveal>
                  <blockquote>“{tc.quote}”</blockquote>
                  <figcaption>
                    <span className="ph-quote-avatar" style={{ backgroundColor: ['#0066cc', '#2997ff', '#4a9eff'][i % 3] }}>
                      {tc.name.trim().charAt(0)}
                    </span>
                    <span>
                      <span className="ph-quote-name">{tc.name}</span>
                      <span className="ph-quote-role">{tc.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Final CTA — light, centered */}
        <section className="ph-sec ph-center" data-reveal>
          <div className="ph-container">
            <span className="ph-num">05</span>
            <h2 className="ph-title">{t.finalTitle}</h2>
            <div className="ph-cta-btns">
              <Link href="/register" className="ph-btn ph-btn-primary">
                {t.finalCta}
                <ForwardArrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="ph-footer">
        <div className="ph-container">
          <div className="ph-footer-top">
            <div className="ph-footer-brand">
              <span className="ph-footer-logo">{name}</span>
              <p>{ar ? 'بورتفوليو احترافي في دقائق' : 'A professional portfolio in minutes'}</p>
            </div>
            <nav className="ph-footer-nav" aria-label={ar ? 'روابط' : 'Links'}>
              <a href="#features">{ar ? 'المزايا' : 'Features'}</a>
              <a href="#plans">{ar ? 'الأسعار' : 'Pricing'}</a>
              <a href="/login">{ar ? 'تواصل معنا' : 'Contact'}</a>
            </nav>
            <div className="ph-socials">
              {socials.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  {s.label.charAt(0)}
                </a>
              ))}
            </div>
          </div>
          <p className="ph-footer-bottom">© 2026 · {name} · {ar ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
        </div>
      </footer>

      {waHref.startsWith('http') && (
        <a href={waHref} target="_blank" rel="noreferrer" className="ph-whatsapp" aria-label="WhatsApp">
          <WhatsApp />
        </a>
      )}
    </div>
  )
}

// ── Feather-style line icons (stroke 2, currentColor) ───────────────
const stroke = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function ForwardArrow() {
  return (
    <svg className="ph-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function WhatsApp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

const featureIcons: Record<string, ReactNode> = {
  rocket: (
    <svg {...stroke} aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  palette: (
    <svg {...stroke} aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.66h2c3.05 0 5.56-2.5 5.56-5.56C21.97 6.01 17.46 2 12 2z" />
    </svg>
  ),
  devices: (
    <svg {...stroke} aria-hidden="true">
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
      <path d="M10 19v-3.96" />
      <path d="M7 19h5" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
    </svg>
  ),
  lock: (
    <svg {...stroke} aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  pencil: (
    <svg {...stroke} aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  ),
  stats: (
    <svg {...stroke} aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
}
