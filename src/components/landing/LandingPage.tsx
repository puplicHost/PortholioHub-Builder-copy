'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { LandingHeader } from './LandingHeader'

// Marketing landing, rebuilt on the reference design system (local/index.html):
// Apple-inspired, one blue accent family, alternating light/dark full-bleed
// sections, Inter / Cairo / Six Caps type, flat 18px cards with hairline
// borders and hover-only shadows.
//
// Interactive shell (client): AR/EN language pill, sun/moon theme toggle
// (scoped to the `.landing-page` wrapper via `data-theme`), glass header on
// scroll, IntersectionObserver scroll reveal, and a 4-tab mobile bottom nav.
// All Arabic copy, prices, links and section order are preserved.

export type LandingSocial = { label: string; href: string }

export type LandingPageProps = {
  lang: 'ar' | 'en'
  name?: string
  /** Platform WhatsApp number (digits or international format). '' ⇒ hidden. */
  whatsapp?: string
  monthlyPrice?: number
  annualPrice?: number
  socials?: LandingSocial[]
}

const LANG_KEY = 'ph_lang'
const THEME_KEY = 'theme'
const EXAMPLE_HREF = '/u/bousla'

export function LandingPage({
  lang: initialLang,
  name = 'PortfolioHub',
  whatsapp = '',
  monthlyPrice,
  annualPrice,
  socials = [],
}: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const [lang, setLang] = useState<'ar' | 'en'>(initialLang === 'en' ? 'en' : 'ar')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [prices, setPrices] = useState<{ monthly?: number; annual?: number }>({
    monthly: monthlyPrice,
    annual: annualPrice,
  })
  const [activeTab, setActiveTab] = useState('home')

  const ar = lang !== 'en'
  const dir = ar ? 'rtl' : 'ltr'

  /* ── Language: restore from localStorage, mirror the URL default ───── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved === 'ar' || saved === 'en') setLang(saved)
    } catch { /* ignore */ }
  }, [])

  const changeLang = useCallback((next: 'ar' | 'en') => {
    setLang(next)
    try { localStorage.setItem(LANG_KEY, next) } catch { /* ignore */ }
  }, [])

  /* ── Theme: restore from localStorage → prefers-color-scheme ───────── */
  useEffect(() => {
    let next: 'light' | 'dark' = 'light'
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark' || saved === 'light') {
        next = saved
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        next = 'dark'
      }
    } catch { /* ignore */ }
    setTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  /* ── Prices: hydrate from the public endpoint when not server-supplied
        (keeps the /en route — which passes only `lang` — in sync with the
        plan rows). No-op on `/`, where page.tsx already passes both. ──── */
  useEffect(() => {
    if (monthlyPrice !== undefined && annualPrice !== undefined) return
    let cancelled = false
    fetch('/api/public/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: Array<{ priceEgp: number; durationDays: number | null }> } | null) => {
        if (cancelled || !data?.items) return
        const m = data.items.find((i) => (i.durationDays ?? 0) === 30)?.priceEgp
        const a = data.items.find((i) => (i.durationDays ?? 0) === 365)?.priceEgp
        setPrices((p) => ({ monthly: p.monthly ?? m, annual: p.annual ?? a }))
      })
      .catch(() => { /* keep defaults */ })
    return () => { cancelled = true }
  }, [monthlyPrice, annualPrice])

  /* ── Scroll reveal (IntersectionObserver) ──────────────────────────── */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [lang])

  /* ── Mobile bottom nav: auto-active on scroll ──────────────────────── */
  useEffect(() => {
    const ids = ['home', 'features', 'how', 'plans', 'faq', 'cta']
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0 || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveTab(e.target.id) })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [lang])

  /* ── Copy (unchanged from the previous landing) ────────────────────── */
  const t = {
    navFeatures: ar ? 'المزايا' : 'Features',
    navHow: ar ? 'ازاي بيشتغل' : 'How it works',
    navPlans: ar ? 'الأسعار' : 'Pricing',
    navFaq: ar ? 'أسئلة شائعة' : 'FAQ',
    login: ar ? 'تسجيل الدخول' : 'Log in',
    navStart: ar ? 'ابدأ مجاناً' : 'Start free',
    startFree: ar ? 'ابدأ مجاناً' : 'Start free',
    seeExample: ar ? 'شوف مثال حي' : 'See a live example',
    heroTitle: ar
      ? <>بورتفوليو بالعربي تعمله بنفسك في دقائق — من غير كود</>
      : <>Your Arabic-first portfolio, built in minutes — no code</>,
    featuresTitle: ar ? 'ليه PortfolioHub؟' : 'Why PortfolioHub?',
    howTitle: ar ? 'ازاي بيشتغل؟' : 'How does it work?',
    howNote: ar ? 'تقدر تبدأ وتوقف وترجع تكمل وقت ما تحب.' : 'Start, pause, and come back whenever you like.',
    howCta: ar ? 'ابدأ الخطوة 1' : 'Start step 1',
    pricingTitle: ar ? 'الأسعار' : 'Pricing',
    faqTitle: ar ? 'أسئلة شائعة' : 'FAQ',
    finalTitle: ar
      ? 'بورتفوليو بتاعك ممكن يكون أونلاين قبل ما تخلص القهوة'
      : 'Your portfolio could be online before you finish your coffee',
    finalCta: ar ? 'ابدأ مجاناً — من غير كريدت كارد' : 'Start free — no credit card',
    support: ar ? 'محتاج مساعدة؟ كلمنا على واتساب' : 'Need help? Message us on WhatsApp',
    subscribe: ar ? 'اشترك الآن' : 'Subscribe now',
    navHome: ar ? 'الرئيسية' : 'Home',
    navContact: ar ? 'تواصل' : 'Contact',
  }

  const features: Array<{ icon: string; title: ReactNode; body: ReactNode }> = ar
    ? [
        { icon: 'rtl', title: <>عربي و<bdi>RTL</bdi> من أول حرف لآخر حرف</>, body: 'بورتفوليو بالعربي بيتقرا مظبوط، والأرقام والكلام الإنجليزي مش بيلخبطوا الشكل.' },
        { icon: 'stats', title: 'اعرف مين بيبص على شغلك', body: 'إحصائيات بسيطة تقولك كام واحد فتح بورتفوليو، وأنهي شغلة الناس بتقف عندها.' },
        { icon: 'rocket', title: 'بورتفوليو أونلاين النهارده مش الأسبوع الجاي', body: 'تضيف شغلك وتنشر بنفسك في دقائق، من غير ما تستنى حد.' },
        { icon: 'palette', title: 'شغلك يبان مرتب من غير مصمم', body: 'قوالب عصرية جاهزة، وتعدّل أي حاجة بكليكة من غير كود.' },
        { icon: 'devices', title: 'يتفتح مظبوط على أي جهاز', body: 'موبايل، تابلت، أو كمبيوتر.' },
        { icon: 'lock', title: 'شغلك محفوظ معاك', body: 'حسابك وبياناتك على سيرفرات آمنة.' },
      ]
    : [
        { icon: 'rtl', title: <>Real Arabic and <bdi>RTL</bdi>, start to finish</>, body: 'Your Arabic portfolio reads correctly — numbers and English words do not break the layout.' },
        { icon: 'stats', title: 'Know who is looking at your work', body: 'Simple stats show how many people opened your portfolio and which piece they stop on.' },
        { icon: 'rocket', title: 'Online today, not next week', body: 'Add your work and publish it yourself in minutes — no waiting on anyone.' },
        { icon: 'palette', title: 'Look sorted without a designer', body: 'Ready-made modern templates, and you edit anything in one click, no code.' },
        { icon: 'devices', title: 'Looks right on any device', body: 'Mobile, tablet, or desktop.' },
        { icon: 'lock', title: 'Your work stays safe', body: 'Your account and data live on secure servers.' },
      ]

  const steps = ar
    ? [
        { n: '1', title: 'سجل حسابك مجاناً', body: 'في 30 ثانية، من غير كريدت كارد.' },
        { n: '2', title: 'اضيف شغلك وبياناتك', body: 'من غير كود — بالسحب والإفلات.' },
        { n: '3', title: 'انشر وشارك لينكك', body: 'النشر بكليكة واحدة، وتبعت اللينك للكلاينتس.' },
      ]
    : [
        { n: '1', title: 'Register free', body: 'In 30 seconds, no credit card.' },
        { n: '2', title: 'Add your work and details', body: 'No code — drag and drop.' },
        { n: '3', title: 'Publish and share your link', body: 'One-click publish, then send the link to clients.' },
      ]

  const faqs: Array<{ q: ReactNode; a: ReactNode }> = ar
    ? [
        {
          q: <>هل فعلاً مجاني؟ وإيه الفرق بين المجاني و<bdi>Pro</bdi>؟</>,
          a: <>أيوه، التسجيل والنشر مجاني للأبد. المجاني فيه <bdi>Hero</bdi> (الواجهة الرئيسية) و<bdi>About</bdi> (نبذة عنك) والمشاريع والفوتر. الـ<bdi>Pro</bdi> يفتح الخبرات والمهارات والخدمات وآراء العملاء، وكمان إحصائيات الزيارات.</>,
        },
        {
          q: 'أقدر أعدّل بورتفوليو بعد ما أنشره؟',
          a: 'أيوه، تعدّل وتضيف من البيلدر في أي وقت — مش محتاج تعمل حساب جديد ولا تنشر من الأول.',
        },
        {
          q: 'أقدر أعدّل من الموبايل؟',
          a: 'أيوه، الموقع والبيلدر بيتفتحوا على متصفح الموبايل وتقدر تعدّل من عليه. بس لو بتضيف صور كتير، الكمبيوتر أسرع.',
        },
        {
          q: <>إزاي بشترك في <bdi>Pro</bdi> وإزاي بلغي؟</>,
          a: <>اضغط «اشترك الآن»، هتفتحلك رسالة واتساب جاهزة، نرد عليك ونفعّل حسابك بعد التأكيد. ولو حبيت تلغي، تقدر تلغي من حسابك في أي وقت، والوصول بيفضل لحد آخر المدة المدفوعة.</>,
        },
        {
          q: 'لو واجهت مشكلة بتواصل مع مين؟',
          a: 'كلمنا على واتساب من الزرار اللي في الصفحة أو من الفوتر، وبنرد بنفسنا.',
        },
      ]
    : [
        {
          q: <>Is it really free? What is the difference between Free and <bdi>Pro</bdi>?</>,
          a: <>Yes — signing up and publishing are free forever. Free includes <bdi>Hero</bdi>, <bdi>About</bdi>, Projects and the Footer. <bdi>Pro</bdi> unlocks Experience, Skills, Services and client testimonials, plus visit analytics.</>,
        },
        {
          q: 'Can I edit my portfolio after publishing?',
          a: 'Yes — edit and add from the builder whenever you like. No new account, no republishing from scratch.',
        },
        {
          q: 'Can I edit from my phone?',
          a: 'Yes — the site and the builder open in a mobile browser and you can edit from there. If you are adding lots of photos, a computer is faster.',
        },
        {
          q: <>How do I subscribe to <bdi>Pro</bdi>, and how do I cancel?</>,
          a: <>Tap “Subscribe now” and a ready WhatsApp message opens; we reply and activate your account after confirming. To cancel, you can cancel from your account at any time, and access stays until the end of the paid period.</>,
        },
        {
          q: 'If I run into a problem, who do I talk to?',
          a: 'Message us on WhatsApp from the button on the page or the footer — we answer ourselves.',
        },
      ]

  const freePlanItems: ReactNode[] = ar
    ? [<><bdi>Hero</bdi> (الواجهة الرئيسية)</>, <><bdi>About</bdi> (نبذة عنك)</>, 'المشاريع', 'الفوتر']
    : ['Hero', 'About', 'Projects', 'Footer']
  const proPlanItems: ReactNode[] = ar
    ? [
        <><bdi>Experience</bdi> (خبراتك)</>,
        <><bdi>Skills</bdi> (مهاراتك)</>,
        <><bdi>Services</bdi> (خدماتك)</>,
        'آراء العملاء جوه بورتفوليو',
        'صفحة لكل مشروع تعرضه',
        'إحصائيات الزيارات',
      ]
    : ['Experience', 'Skills', 'Services', 'Client testimonials inside your portfolio', 'A page for every project', 'Visit analytics']
  const annualPlanItems: ReactNode[] = ar
    ? ['كل مزايا الباقة الشهرية', 'دفعة واحدة في السنة، من غير تجديد كل شهر']
    : ['All monthly benefits', 'One yearly payment — no monthly renewal']

  /* ── WhatsApp links from the platform setting ──────────────────────── */
  // The number is stored in local Egyptian format (01098453187);
  // getWhatsAppLink normalizes it to the international digits wa.me needs
  // (201098453187) and returns null when no number is configured.
  const supportMessage = ar
    ? 'مرحباً، عايز أسأل عن PortfolioHub'
    : 'Hi, I have a question about PortfolioHub'
  const buildWa = (msg: string) => getWhatsAppLink(whatsapp, msg) ?? '/profile/subscription'
  const subscribeMessage = (price: number, period: 'monthly' | 'annual') =>
    ar
      ? `أهلاً، عايز أشترك في باقة Pro ${period === 'monthly' ? 'الشهرية' : 'السنوية'} (${price} جنيه) على PortfolioHub.`
      : `Hello, I'd like to subscribe to the ${period} Pro plan (${price} EGP) on PortfolioHub.`
  const supportHref = getWhatsAppLink(whatsapp, supportMessage)
  const hasWhatsapp = !!supportHref
  const contactHref = supportHref ?? '#plans'

  const monthly = prices.monthly ?? 150
  const annual = prices.annual ?? 1000
  const monthlyWaHref = buildWa(subscribeMessage(monthly, 'monthly'))
  const annualWaHref = buildWa(subscribeMessage(annual, 'annual'))

  const tabItems = [
    { id: 'home', label: t.navHome, icon: <HomeIcon />, href: '#home' },
    { id: 'features', label: t.navFeatures, icon: <StarIcon />, href: '#features' },
    { id: 'plans', label: t.navPlans, icon: <TagIcon />, href: '#plans' },
    { id: 'contact', label: t.navContact, icon: <WhatsApp />, href: contactHref, external: hasWhatsapp },
  ]

  return (
    <div
      ref={rootRef}
      dir={dir}
      lang={lang}
      data-theme={theme}
      className="landing-page ph-landing"
    >
      <style>{CSS}</style>
      {/* No-JS fallback: keep every revealed section visible. */}
      <noscript>
        <style>{`.landing-page [data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <LandingHeader
        name={name}
        ar={ar}
        lang={lang}
        theme={theme}
        onLang={changeLang}
        onTheme={toggleTheme}
        labels={{
          features: t.navFeatures,
          how: t.navHow,
          plans: t.navPlans,
          faq: t.navFaq,
          login: t.login,
          start: t.navStart,
        }}
      />

      <main>
        {/* 1. Hero */}
        <section id="home" className="ph-hero" aria-label="Hero">
          <span className="ph-orb ph-orb-1" aria-hidden="true" />
          <span className="ph-orb ph-orb-2" aria-hidden="true" />
          <span className="ph-orb ph-orb-3" aria-hidden="true" />
          <div className="ph-container">
            <div className="ph-hero-inner">
              <h1 className="ph-hero-title" data-reveal>{t.heroTitle}</h1>
              <div className="ph-hero-ctas" data-reveal>
                <Link href="/register" className="ph-btn ph-btn-primary">
                  {t.startFree}
                  <ForwardArrow />
                </Link>
                <Link href={EXAMPLE_HREF} className="ph-btn ph-btn-ghost">
                  {t.seeExample}
                  <ForwardArrow />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Features — light */}
        <section id="features" className="ph-sec">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">01</span>
              <h2 className="ph-title">{t.featuresTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3">
              {features.map((f) => (
                <div key={f.icon} className="ph-card" data-reveal>
                  <span className="ph-icon">{featureIcons[f.icon]}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How it works — dark */}
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
            <p className="ph-how-note" data-reveal>{t.howNote}</p>
            <div className="ph-how-cta" data-reveal>
              <Link href="/register" className="ph-btn ph-btn-primary">
                {t.howCta}
                <ForwardArrow />
              </Link>
            </div>
          </div>
        </section>

        {/* 4. Pricing — light */}
        <section id="plans" className="ph-sec">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">03</span>
              <h2 className="ph-title">{t.pricingTitle}</h2>
            </div>
            <div className="ph-grid ph-grid-3 ph-grid-price">
              {/* Free */}
              <div className="ph-price" data-reveal>
                <h3>{ar ? 'مجاني' : 'Free'}</h3>
                <p className="ph-price-sub">{ar ? 'تنشر بورتفوليو كامل من غير ما تدفع حاجة.' : 'Publish a full portfolio without paying a thing.'}</p>
                <p className="ph-amount">0 <small>{ar ? 'جنيه' : 'EGP'}</small></p>
                <ul className="ph-feats">
                  {freePlanItems.map((x, i) => (
                    <li key={i}><Check /><span>{x}</span></li>
                  ))}
                </ul>
                <Link href="/register" className="ph-btn ph-btn-ghost ph-btn-sm">{t.startFree}</Link>
              </div>

              {/* Monthly — best to start (featured) */}
              <div className="ph-price featured" data-reveal>
                <span className="ph-badge">{ar ? 'الأنسب للبداية' : 'Best to start with'}</span>
                <h3>{ar ? 'شهري Pro' : 'Monthly Pro'}</h3>
                <p className="ph-price-sub">{ar ? 'للي عايز يعرض شغله بالتفصيل ويفهم زواره' : 'Show your work in detail — and know your visitors.'}</p>
                <p className="ph-amount">{monthly} <small>{ar ? 'جنيه/شهر' : 'EGP/mo'}</small></p>
                <ul className="ph-feats">
                  {proPlanItems.map((x, i) => (
                    <li key={i}><Check /><span>{x}</span></li>
                  ))}
                </ul>
                <a href={monthlyWaHref} target={hasWhatsapp ? '_blank' : undefined} rel={hasWhatsapp ? 'noreferrer' : undefined} className="ph-btn ph-btn-primary ph-btn-sm">
                  {t.subscribe}
                </a>
              </div>

              {/* Annual */}
              <div className="ph-price" data-reveal>
                <h3>{ar ? 'سنوي Pro' : 'Annual Pro'}</h3>
                <p className="ph-price-sub">
                  {ar
                    ? <>{annual} جنيه في السنة بدل <s>{monthly * 12}</s></>
                    : <>{annual} EGP/year instead of <s>{monthly * 12}</s></>}
                </p>
                <p className="ph-amount">
                  {annual} <small>{ar ? 'جنيه/سنة' : 'EGP/yr'}</small>
                  <span className="ph-save">
                    {ar ? `وفّر ${monthly * 12 - annual} جنيه` : `Save ${monthly * 12 - annual} EGP`}
                  </span>
                </p>
                <ul className="ph-feats">
                  {annualPlanItems.map((x, i) => (
                    <li key={i}><Check /><span>{x}</span></li>
                  ))}
                </ul>
                <a href={annualWaHref} target={hasWhatsapp ? '_blank' : undefined} rel={hasWhatsapp ? 'noreferrer' : undefined} className="ph-btn ph-btn-ghost ph-btn-sm">
                  {t.subscribe}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Custom portfolio banner — light (between pricing and FAQ) */}
        <section className="ph-custom-sec">
          <div className="ph-container">
            <div className="ph-custom" data-reveal>
              <div className="ph-custom-lead">
                <span className="ph-custom-label">{ar ? 'بورتفوليو مخصص' : 'Custom portfolio'}</span>
                <h2 className="ph-custom-title">{ar ? 'عايز بورتفوليو متصمم على مقاسك؟' : 'Want a portfolio designed just for you?'}</h2>
              </div>
              <div className="ph-custom-action">
                <p className="ph-custom-desc">
                  {ar
                    ? 'لو القوالب الجاهزة مش شبهك، نصمملك بورتفوليو بشخصيتك وطريقة عرض شغلك بالظبط. احكيلنا اللي في دماغك ونبدأ منه.'
                    : 'If ready-made templates do not feel like you, we design a portfolio around your personality and exactly how you present your work. Tell us what you have in mind and we start from there.'}
                </p>
                <a href="https://portholiohub.pages.dev/" target="_blank" rel="noreferrer" className="ph-btn ph-btn-ghost ph-btn-sm">
                  {ar ? 'اطلب تصميم مخصص' : 'Request a custom design'}
                  <ForwardArrow />
                </a>
                <p className="ph-custom-more">
                  <a href="https://portholiohub.pages.dev/" target="_blank" rel="noreferrer">
                    {ar ? 'شوف أمثلة من شغلنا الأول' : 'See examples of our earlier work'}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ — dark */}
        <section id="faq" className="ph-sec ph-dark">
          <div className="ph-container">
            <div className="ph-sec-head" data-reveal>
              <span className="ph-num">04</span>
              <h2 className="ph-title">{t.faqTitle}</h2>
            </div>
            <div className="ph-faq">
              {faqs.map((f, i) => (
                <details key={i} data-reveal>
                  <summary><span className="ph-faq-q">{f.q}</span></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Final CTA — light, centered */}
        <section id="cta" className="ph-sec ph-center" data-reveal>
          <div className="ph-container">
            <span className="ph-num">05</span>
            <h2 className="ph-title">{t.finalTitle}</h2>
            <div className="ph-cta-btns">
              <Link href="/register" className="ph-btn ph-btn-primary">
                {t.finalCta}
                <ForwardArrow />
              </Link>
            </div>
            {supportHref && (
              <p className="ph-support">
                <a href={supportHref} target="_blank" rel="noreferrer">{t.support}</a>
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="ph-footer">
        <div className="ph-container">
          <div className="ph-footer-top">
            <div className="ph-footer-brand">
              <span className="ph-footer-logo">{name}</span>
              <p>{ar ? 'بورتفوليو احترافي بالعربي، جاهز في دقائق ومن غير كود.' : 'A professional portfolio, ready in minutes — no code.'}</p>
              {socials.length > 0 && (
                <div className="ph-socials">
                  {socials.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                      {socialIcons[s.label] ?? s.label.charAt(0)}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <nav className="ph-footer-cols" aria-label={ar ? 'روابط الفوتر' : 'Footer links'}>
              <div className="ph-footer-col">
                <h4>{ar ? 'المنتج' : 'Product'}</h4>
                <a href="#features">{t.navFeatures}</a>
                <a href="#how">{t.navHow}</a>
                <a href="#plans">{t.navPlans}</a>
                <a href="#faq">{t.navFaq}</a>
              </div>
              <div className="ph-footer-col">
                <h4>{ar ? 'الحساب والدعم' : 'Account & support'}</h4>
                <a href="/register">{t.startFree}</a>
                <a href="/login">{t.login}</a>
                {supportHref ? (
                  <a href={supportHref} target="_blank" rel="noreferrer">{ar ? 'دعم واتساب' : 'WhatsApp support'}</a>
                ) : (
                  <a href="/login">{ar ? 'تواصل معنا' : 'Contact'}</a>
                )}
              </div>
            </nav>
          </div>
          <div className="ph-footer-bottom">
            <span>© 2026 · {name}</span>
            <span>{ar ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
          </div>
        </div>
      </footer>

      {supportHref && (
        <a href={buildWa(supportMessage)} target="_blank" rel="noreferrer" className="ph-whatsapp" aria-label="WhatsApp">
          <WhatsApp />
        </a>
      )}

      {/* Mobile bottom nav (≤767px) — 4 tabs, IntersectionObserver active */}
      <nav className="ph-bottom-nav" aria-label={ar ? 'تنقل رئيسي' : 'Main navigation'}>
        {tabItems.map((tab) => {
          const isActive = tab.external ? false : activeTab === tab.id
          return (
            <a
              key={tab.id}
              href={tab.href}
              target={tab.external ? '_blank' : undefined}
              rel={tab.external ? 'noreferrer' : undefined}
              className={`ph-bottom-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Layout — scoped to `.landing-page`; design tokens live in globals.css.
   ══════════════════════════════════════════════════════════════════════ */
const CSS = `
.landing-page{position:relative;isolation:isolate;min-height:100vh;overflow-x:hidden;
  background:var(--canvas);color:var(--ink);font-family:var(--font-primary);line-height:1.47;
  -webkit-font-smoothing:antialiased;}
.landing-page a{color:inherit;text-decoration:none;}
.landing-page ul{list-style:none;margin:0;padding:0;}
.landing-page p{margin:0;}
.landing-page h1,.landing-page h2,.landing-page h3,.landing-page h4{margin:0;font-weight:600;}
.landing-page svg{display:block;flex:none;}
.landing-page ::selection{background:rgba(0,102,204,.18);}
.landing-page :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
.ph-container{width:100%;max-width:1320px;margin:0 auto;padding:0 var(--space-xl);}

/* ── Header ─────────────────────────────────────────────────────────── */
.ph-header{position:fixed;top:0;inset-inline:0;z-index:1000;background:transparent;
  border-bottom:1px solid transparent;transition:background .4s,border-color .4s;}
.ph-header.scrolled{background:var(--glass);
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-bottom-color:var(--divider);}
.landing-page .ph-header-inner{display:flex;align-items:center;gap:var(--space-sm);
  padding-block:var(--space-sm);position:relative;z-index:2;}
.ph-brand{font-size:16px;font-weight:600;letter-spacing:-0.02em;color:var(--ink);}
html[dir='rtl'] .ph-brand{letter-spacing:0;}
.ph-nav{display:flex;align-items:center;gap:var(--space-md);margin-inline:auto;}
.ph-nav a{font-size:13px;font-weight:500;letter-spacing:-0.01em;color:var(--ink-muted);transition:color .3s;}
.ph-nav a:hover,.ph-nav a.active{color:var(--accent);}
html[dir='rtl'] .ph-nav a{letter-spacing:0;}
.ph-header-actions{display:flex;align-items:center;gap:var(--space-xs);margin-inline-start:auto;}
.ph-header-link{font-size:13px;font-weight:600;color:var(--ink-muted);padding:8px 4px;transition:color .25s;}
.ph-header-link:hover{color:var(--ink);}

/* Language pill */
.ph-lang{display:flex;align-items:center;border:1px solid var(--hairline);border-radius:9999px;
  padding:3px;gap:2px;background:var(--canvas);}
.ph-lang button{border:none;background:none;cursor:pointer;font-family:var(--font-primary);
  font-size:11px;font-weight:600;letter-spacing:.03em;color:var(--ink-muted);
  padding:5px 11px;border-radius:9999px;min-height:28px;
  transition:color .25s,background .25s;-webkit-tap-highlight-color:transparent;}
.ph-lang button:hover{color:var(--ink);}
.ph-lang button.active{background:var(--accent);color:var(--on-primary);}
html[dir='rtl'] .ph-lang button{letter-spacing:0;}

/* Theme toggle */
.ph-theme{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:none;
  border:1px solid var(--hairline);border-radius:50%;cursor:pointer;color:var(--ink-muted);
  transition:color .3s,border-color .3s,background .3s;-webkit-tap-highlight-color:transparent;}
.ph-theme:hover{color:var(--accent);border-color:var(--accent);}
.ph-theme svg{transition:transform .3s;}
.ph-theme:hover svg{transform:rotate(20deg);}

/* Hamburger + overlay menu (≤767px) */
.ph-ham{display:none;width:44px;height:44px;border:none;background:none;cursor:pointer;
  flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0;}
.ph-ham span{display:block;width:22px;height:2px;border-radius:2px;background:var(--ink);
  transition:transform .3s ease,opacity .3s ease;}
.ph-header.menu-open .ph-ham span:nth-child(1){transform:translateY(7px) rotate(45deg);}
.ph-header.menu-open .ph-ham span:nth-child(2){opacity:0;}
.ph-header.menu-open .ph-ham span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
.ph-menu{position:fixed;inset:0;z-index:1;background:var(--glass-solid);
  -webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-lg);
  opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s ease;direction:inherit;}
.ph-header.menu-open .ph-menu{opacity:1;visibility:visible;}
.ph-menu a{font-size:28px;font-weight:600;letter-spacing:-0.03em;color:var(--ink);position:relative;}
html[dir='rtl'] .ph-menu a{letter-spacing:0;}
.ph-menu a::after{content:'';position:absolute;inset-inline-start:0;bottom:-6px;width:100%;
  height:2px;background:var(--accent);transform:scaleX(0);transform-origin:var(--hx,left);
  transition:transform .3s ease;}
html[dir='rtl'] .ph-menu a::after{--hx:right;}
.ph-menu a:hover::after{transform:scaleX(1);}
.ph-menu .ph-menu-cta{color:var(--accent);}

/* ── Buttons ────────────────────────────────────────────────────────── */
.ph-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:14px 32px;font-size:15px;font-weight:600;letter-spacing:-0.01em;
  border-radius:12px;border:none;cursor:pointer;font-family:inherit;
  transition:background .3s,transform .2s,box-shadow .3s,border-color .3s,color .3s;}
html[dir='rtl'] .ph-btn{letter-spacing:0;}
.ph-btn-sm{padding:10px 20px;font-size:14px;}
.ph-btn-primary{background:var(--accent);color:var(--on-primary);}
.ph-btn-primary:hover{background:var(--accent-focus);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,102,204,.25);}
.ph-btn-primary:active{transform:translateY(0);}
.ph-btn-ghost{background:none;color:var(--ink);border:1px solid var(--hairline);}
.ph-btn-ghost:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-2px);}
.ph-btn-ghost:active{transform:translateY(0);}
.ph-dark .ph-btn-ghost{color:var(--on-dark);border-color:rgba(255,255,255,.28);}
.ph-dark .ph-btn-ghost:hover{border-color:var(--accent-on-dark);color:var(--accent-on-dark);}
.ph-btn svg{transition:transform .3s ease;}
html[dir='rtl'] .ph-btn svg.ph-arrow{transform:scaleX(-1);}
.ph-btn:hover svg.ph-arrow{transform:translateX(3px);}
html[dir='rtl'] .ph-btn:hover svg.ph-arrow{transform:translateX(-3px) scaleX(-1);}
.ph-btn,.ph-header-link,.ph-ham,.ph-nav a,.ph-menu a,.ph-footer-col a,.ph-socials a,.ph-whatsapp,.ph-lang button,.ph-theme,.ph-bottom-item{touch-action:manipulation;}

/* ── Sections ───────────────────────────────────────────────────────── */
.ph-sec{padding:var(--space-3xl) 0;scroll-margin-top:96px;}
.ph-dark{background:var(--tile-1);color:var(--on-dark);}
.ph-sec-head{margin-bottom:var(--space-lg);}
.ph-num{display:block;font-family:var(--font-display);font-size:clamp(36px,4vw,64px);
  line-height:1;letter-spacing:.02em;color:var(--accent);direction:ltr;text-align:start;margin-bottom:var(--space-sm);}
html[dir='rtl'] .ph-num{text-align:right;}
.ph-center .ph-num{text-align:center;}
.ph-dark .ph-num{color:var(--accent-on-dark);}
.ph-title{font-size:clamp(28px,4vw,52px);font-weight:600;line-height:1.15;letter-spacing:-0.02em;}
html[lang='ar'] .ph-title,html[dir='rtl'] .ph-title{letter-spacing:0;line-height:1.3;}
.ph-dark .ph-title{color:var(--on-dark);}
.ph-center{text-align:center;}
.ph-center .ph-title{margin-inline:auto;max-width:700px;}

/* ── Hero ───────────────────────────────────────────────────────────── */
.ph-hero{position:relative;min-height:100vh;display:flex;align-items:center;
  padding:var(--space-6xl) 0 var(--space-3xl);overflow:hidden;background:var(--canvas);}
.ph-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
.ph-orb-1{width:500px;height:500px;background:var(--accent);opacity:.15;top:-15%;left:-8%;animation:phFloat 25s ease-in-out infinite;}
.ph-orb-2{width:400px;height:400px;background:#4a9eff;opacity:.15;bottom:-12%;right:-6%;animation:phFloat 30s ease-in-out infinite reverse;}
.ph-orb-3{width:300px;height:300px;background:var(--accent);opacity:.08;top:40%;right:20%;animation:phFloat 20s ease-in-out infinite 5s;}
@keyframes phFloat{
  25%{transform:translate(40px,-60px) scale(1.08);}
  50%{transform:translate(-20px,30px) scale(.95);}
  75%{transform:translate(50px,40px) scale(1.05);}
}
.ph-hero-inner{position:relative;z-index:1;text-align:center;}
.ph-hero-title{font-size:clamp(38px,7vw,92px);font-weight:600;line-height:1.07;letter-spacing:-0.02em;max-width:16ch;margin-inline:auto;text-wrap:balance;}
html[lang='ar'] .ph-hero-title,html[dir='rtl'] .ph-hero-title{letter-spacing:0;line-height:1.25;max-width:22ch;}
.ph-hero-ctas{display:flex;flex-wrap:wrap;gap:var(--space-sm);justify-content:center;margin-top:40px;}

/* ── Grids & cards ──────────────────────────────────────────────────── */
.ph-grid{display:grid;gap:var(--space-md);}
.ph-grid-3{grid-template-columns:repeat(3,1fr);}
.ph-card{background:var(--canvas-alt);border:1px solid var(--divider);border-radius:18px;
  padding:var(--space-lg);display:flex;flex-direction:column;
  transition:transform .3s,background .3s,border-color .3s,box-shadow .3s;}
.ph-card:hover{transform:translateY(-4px);background:var(--card-hover);border-color:var(--hairline);
  box-shadow:0 12px 32px rgba(15,23,42,.08);}
.landing-page[data-theme='dark'] .ph-card:hover{box-shadow:0 12px 32px rgba(0,0,0,.45);}
.ph-card:active{transform:scale(.98);}
.ph-card h3{font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.02em;margin:0 0 var(--space-sm);}
html[dir='rtl'] .ph-card h3{letter-spacing:0;}
.ph-card p{font-size:15px;color:var(--ink-muted);line-height:1.7;}
.ph-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  background:rgba(0,102,204,.1);color:var(--accent);margin-bottom:var(--space-md);
  transition:transform .35s cubic-bezier(.21,.47,.32,.98),background .3s;}
.ph-card:hover .ph-icon{transform:scale(1.08) rotate(-5deg);}
.landing-page[data-theme='dark'] .ph-icon{background:rgba(41,151,255,.12);}
.ph-dark .ph-card{background:var(--tile-2);border-color:rgba(255,255,255,.08);}
.ph-dark .ph-card:hover{background:var(--tile-hover);border-color:var(--accent-on-dark);}
.ph-dark .ph-card h3{color:var(--on-dark);}
.ph-dark .ph-card p{color:rgba(255,255,255,.75);}
.ph-dark .ph-icon{background:rgba(41,151,255,.15);color:var(--accent-on-dark);}
.ph-step-num{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-family:var(--font-display);font-size:26px;line-height:1;letter-spacing:.02em;
  background:rgba(41,151,255,.15);color:var(--accent-on-dark);margin-bottom:var(--space-md);
  transition:transform .35s cubic-bezier(.21,.47,.32,.98),background .3s;}
.ph-card:hover .ph-step-num{transform:translateY(-2px) scale(1.06);}

/* ── Pricing ────────────────────────────────────────────────────────── */
.ph-price{background:var(--canvas-alt);border:1px solid var(--divider);border-radius:18px;
  padding:var(--space-lg);display:flex;flex-direction:column;position:relative;
  transition:transform .3s,border-color .3s,box-shadow .3s;}
.ph-price:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(15,23,42,.08);}
.landing-page[data-theme='dark'] .ph-price:hover{box-shadow:0 12px 32px rgba(0,0,0,.45);}
.ph-price.featured{border-color:var(--accent);}
.ph-price.featured:hover{box-shadow:0 8px 24px rgba(0,102,204,.18);}
.ph-badge{position:absolute;top:-12px;inset-inline-start:var(--space-md);padding:5px 12px;border-radius:9999px;
  font-size:11px;font-weight:600;letter-spacing:.02em;white-space:nowrap;background:var(--accent);color:var(--on-primary);}
.ph-price h3{font-size:19px;font-weight:600;letter-spacing:-0.02em;min-height:1.3em;}
html[dir='rtl'] .ph-price h3{letter-spacing:0;}
.ph-price-sub{font-size:13px;color:var(--ink-muted);line-height:1.5;min-height:3em;margin-top:4px;}
.ph-price-sub s{opacity:.65;}
.ph-amount{margin-top:var(--space-md);font-size:40px;font-weight:600;letter-spacing:-0.03em;line-height:1.2;color:var(--accent);}
html[dir='rtl'] .ph-amount{letter-spacing:0;}
.ph-amount small{font-size:13px;font-weight:400;color:var(--ink-muted);margin-inline-start:6px;}
.ph-save{display:inline-flex;align-items:center;margin-inline-start:10px;vertical-align:middle;
  padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;
  color:#1f7a3d;background:rgba(48,209,88,.12);border:1px solid rgba(48,209,88,.3);}
.landing-page[data-theme='dark'] .ph-save{color:#7ee2a0;}
.ph-feats{margin-top:var(--space-md);margin-bottom:var(--space-md);display:grid;gap:12px;}
.ph-feats li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink-muted);line-height:1.6;}
.ph-feats li svg{margin-top:3px;color:var(--accent);}
.ph-price .ph-btn{margin-top:auto;width:100%;}

/* ── Custom portfolio banner ────────────────────────────────────────── */
.ph-custom-sec{padding:0 0 var(--space-4xl);}
.ph-custom{display:flex;align-items:center;justify-content:space-between;gap:var(--space-2xl);
  background:var(--canvas-alt);border:1px solid var(--accent);border-radius:18px;
  padding:var(--space-xl) var(--space-2xl);box-shadow:0 6px 24px rgba(15,23,42,.05);}
.landing-page[data-theme='dark'] .ph-custom{box-shadow:0 6px 24px rgba(0,0,0,.35);}
.ph-custom-lead{flex:1 1 0;min-width:0;}
.ph-custom-label{display:block;font-size:14px;font-weight:600;color:var(--accent);
  letter-spacing:.02em;margin-bottom:var(--space-xs);}
html[dir='rtl'] .ph-custom-label{letter-spacing:0;}
.ph-custom-title{font-size:clamp(24px,2.8vw,38px);font-weight:600;line-height:1.2;letter-spacing:-0.02em;}
html[lang='ar'] .ph-custom-title,html[dir='rtl'] .ph-custom-title{letter-spacing:0;line-height:1.35;}
.ph-custom-action{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-md);}
.ph-custom-desc{font-size:15px;color:var(--ink-muted);line-height:1.7;}
.ph-custom-more{font-size:13px;color:var(--ink-muted);}
.ph-custom-more a{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;}
.ph-custom-more a:hover{color:var(--accent-focus);}

/* ── FAQ (native <details>) ─────────────────────────────────────────── */
.ph-faq{display:grid;gap:12px;}
.ph-faq details{background:var(--tile-2);border:1px solid rgba(255,255,255,.08);border-radius:14px;
  padding:var(--space-md) var(--space-lg);transition:border-color .3s;}
.ph-faq details:hover{border-color:rgba(255,255,255,.18);}
.ph-faq details[open]{border-color:var(--accent-on-dark);}
.ph-faq summary{display:flex;align-items:center;gap:16px;cursor:pointer;font-size:16px;font-weight:600;color:var(--on-dark);list-style:none;}
.ph-faq summary::-webkit-details-marker{display:none;}
.ph-faq-q{flex:1;text-align:start;min-width:0;}
.ph-faq summary::after{content:'+';flex:none;font-size:20px;line-height:1;color:var(--accent-on-dark);transition:transform .25s ease;}
.ph-faq details[open] summary::after{transform:rotate(45deg);}
.ph-faq p{margin-top:12px;font-size:14px;color:rgba(255,255,255,.75);line-height:1.85;}

/* ── Notes / support lines ──────────────────────────────────────────── */
.ph-how-note{margin-top:var(--space-lg);font-size:14px;color:rgba(255,255,255,.72);}
.ph-how-cta{margin-top:var(--space-lg);}
.ph-support{margin-top:var(--space-md);font-size:14px;color:var(--ink-muted);}
.ph-support a{color:var(--accent);font-weight:600;}
.ph-support a:hover{text-decoration:underline;}

/* ── Final CTA ──────────────────────────────────────────────────────── */
.ph-cta-btns{margin-top:var(--space-xl);display:flex;justify-content:center;}

/* ── Footer ─────────────────────────────────────────────────────────── */
.ph-footer{background:var(--canvas-alt);border-top:1px solid var(--divider);padding:var(--space-4xl) 0 var(--space-xl);}
.ph-footer-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:var(--space-2xl);}
.ph-footer-brand{max-width:36ch;display:flex;flex-direction:column;align-items:flex-start;}
.ph-footer-logo{font-size:18px;font-weight:600;letter-spacing:-0.02em;color:var(--ink);}
html[dir='rtl'] .ph-footer-logo{letter-spacing:0;}
.ph-footer-brand p{margin-top:var(--space-sm);font-size:14px;color:var(--ink-muted);line-height:1.7;}
.ph-footer-cols{display:flex;flex-wrap:wrap;gap:var(--space-2xl);}
.ph-footer-col{display:flex;flex-direction:column;gap:10px;min-width:150px;}
.ph-footer-col h4{margin:0;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);}
html[dir='rtl'] .ph-footer-col h4{letter-spacing:0;text-transform:none;font-size:13px;}
.ph-footer-col a{font-size:14px;color:var(--ink-muted);transition:color .25s;width:fit-content;}
.ph-footer-col a:hover{color:var(--accent);}
.ph-socials{display:flex;gap:10px;margin-top:var(--space-md);}
.ph-socials a{width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  border:1px solid var(--divider);border-radius:10px;color:var(--ink-muted);
  transition:background .3s,color .3s,border-color .3s,transform .3s;}
.ph-socials a svg{width:18px;height:18px;}
.ph-socials a:hover{background:var(--accent);color:var(--on-primary);border-color:var(--accent);transform:translateY(-2px);}
.ph-footer-bottom{margin-top:var(--space-3xl);padding-top:var(--space-lg);border-top:1px solid var(--divider);
  display:flex;flex-wrap:wrap;gap:var(--space-xs);justify-content:space-between;font-size:12px;color:var(--ink-muted);}

/* ── WhatsApp float (physical right, both directions) ───────────────── */
.ph-whatsapp{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;z-index:99;
  background:var(--accent);color:var(--on-primary);transition:transform .2s,background .2s;}
.ph-whatsapp:hover{background:var(--accent-focus);transform:scale(1.05);}
.ph-whatsapp:active{transform:scale(.95);}

/* ── Mobile bottom nav (hidden ≥768px) ──────────────────────────────── */
.ph-bottom-nav{display:none;position:fixed;bottom:0;inset-inline:0;z-index:100;height:64px;
  padding-bottom:env(safe-area-inset-bottom,0);background:var(--glass-bottom);
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
  border-top:1px solid var(--hairline);justify-content:space-around;align-items:center;}
.ph-bottom-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  flex:1;font-size:10px;letter-spacing:-0.01em;color:var(--ink-muted);min-height:44px;position:relative;
  transition:color .2s;-webkit-tap-highlight-color:transparent;}
.ph-bottom-item svg{width:22px;height:22px;transition:transform .2s ease;}
.ph-bottom-item.active{color:var(--accent);}
.ph-bottom-item.active svg{transform:scale(1.1);}
.ph-bottom-item.active::before{content:'';position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  width:24px;height:3px;background:var(--accent);border-radius:0 0 3px 3px;}
.ph-bottom-item:active{opacity:.6;}
html[dir='rtl'] .ph-bottom-item{letter-spacing:0;}

/* ── Scroll reveal (IntersectionObserver adds .is-visible) ──────────── */
.landing-page [data-reveal]{opacity:0;transform:translateY(20px);
  transition:opacity .7s cubic-bezier(.21,.47,.32,.98),transform .7s cubic-bezier(.21,.47,.32,.98);}
.landing-page [data-reveal].is-visible{opacity:1;transform:translateY(0);}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(1){transition-delay:0ms;}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(2){transition-delay:70ms;}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(3){transition-delay:140ms;}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(4){transition-delay:210ms;}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(5){transition-delay:280ms;}
.landing-page .ph-grid > [data-reveal].is-visible:nth-child(6){transition-delay:350ms;}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width:1024px){
  .ph-container{padding:0 var(--space-lg);}
  .ph-custom{flex-direction:column;align-items:stretch;gap:var(--space-lg);padding:var(--space-xl) var(--space-lg);}
  .ph-custom-action{align-items:stretch;}
  .ph-custom-action .ph-btn{width:100%;}
}
@media (max-width:767px){
  .landing-page{padding-bottom:64px;}
  .ph-container{padding:0 var(--space-md);}
  .ph-nav{display:none;}
  .ph-header-link{display:none;}
  .ph-header-cta{display:none;}
  .ph-ham{display:flex;}
  .ph-hero{padding:140px 0 64px;min-height:auto;}
  .ph-grid{gap:var(--space-sm);}
  .ph-grid-3{grid-template-columns:repeat(2,minmax(0,1fr));}
  .ph-grid-price{grid-template-columns:1fr;}
  .ph-card{padding:var(--space-sm);border-radius:14px;}
  .ph-card h3{font-size:16px;line-height:1.4;margin-bottom:10px;}
  .ph-card p{font-size:13.5px;line-height:1.6;}
  .ph-icon{width:38px;height:38px;border-radius:11px;margin-bottom:12px;}
  .ph-icon svg{width:19px;height:19px;}
  .ph-step-num{width:38px;height:38px;border-radius:11px;font-size:23px;margin-bottom:12px;}
  .ph-price{padding:var(--space-md);border-radius:16px;}
  .ph-price h3{font-size:18px;min-height:auto;}
  .ph-price-sub{font-size:13px;min-height:auto;}
  .ph-amount{font-size:36px;}
  .ph-feats li{font-size:14px;}
  .ph-faq summary{font-size:16.5px;}
  .ph-faq p{font-size:15px;}
  .ph-footer-bottom{font-size:13px;}
  .ph-custom-desc{font-size:15px;}
  .ph-btn,.ph-btn-sm{min-height:44px;}
  .ph-socials a{width:44px;height:44px;}
  .ph-footer-cols{gap:var(--space-xl);}
  .ph-footer-col{min-width:140px;}
  .ph-footer-col a{padding:8px 0;}
  .ph-whatsapp{bottom:80px;right:16px;width:50px;height:50px;}
  .ph-bottom-nav{display:flex;}
}
@media (max-width:479px){
  .ph-hero{padding:120px 0 40px;}
  .ph-hero-title{font-size:34px;}
  .ph-title{font-size:25px;}
  .ph-num{font-size:48px;}
  .ph-card,.ph-price{padding:16px;}
  .ph-hero-ctas,.ph-cta-btns{flex-direction:column;align-items:stretch;}
  .ph-hero-ctas .ph-btn,.ph-cta-btns .ph-btn{width:100%;padding:14px 28px;}
  .ph-footer-top{flex-direction:column;}
  .ph-footer-brand{max-width:none;}
  .ph-footer-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-lg);width:100%;}
}
@media (prefers-reduced-motion:reduce){
  .ph-orb{animation:none;}
  .landing-page [data-reveal]{opacity:1;transform:none;transition:none;}
}
`

/* ── Icons ─────────────────────────────────────────────────────────── */
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

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

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

const featureIcons: Record<string, ReactNode> = {
  rtl: (
    <svg {...stroke} aria-hidden="true">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
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
  stats: (
    <svg {...stroke} aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
}

const socialIcons: Record<string, ReactNode> = {
  Facebook: (
    <svg {...stroke} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Instagram: (
    <svg {...stroke} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  LinkedIn: (
    <svg {...stroke} aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  X: (
    <svg {...stroke} aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  ),
}
