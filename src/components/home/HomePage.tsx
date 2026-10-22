'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { getWhatsAppLink } from '@/lib/whatsapp'

const EXAMPLE_HREF = '/u/bousla'
const CUSTOM_URL = 'https://portholiohub.pages.dev/'

export type HomePageProps = {
  name?: string
  whatsapp?: string
  monthlyPrice?: number
  annualPrice?: number
}

export function HomePage({
  name = 'PortfolioHub',
  whatsapp = '',
  monthlyPrice = 150,
  annualPrice = 1000,
}: HomePageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal],[data-stagger]'))
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const bar = progressRef.current
    if (!bar) return
    let raf = 0
    const update = () => {
      raf = 0
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      bar.style.width = `${progress}%`
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        setScrolled(window.scrollY > 20)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (!link) return
      const href = link.getAttribute('href') ?? ''
      if (href === '#' || href.length < 2) return
      const target = document.getElementById(href.slice(1))
      if (target) {
        e.preventDefault()
        const top = target.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [])

  const save = monthlyPrice * 12 - annualPrice
  const supportMessage = 'مرحباً، عايز أسأل عن PortfolioHub'
  const buildWa = (msg: string) => getWhatsAppLink(whatsapp, msg) ?? '/profile/subscription'
  const hasWhatsapp = !!getWhatsAppLink(whatsapp, supportMessage)
  const subscribeMessage = (price: number, period: 'monthly' | 'annual') =>
    `أهلاً، عايز أشترك في باقة Pro ${period === 'monthly' ? 'الشهرية' : 'السنوية'} (${price} جنيه) على PortfolioHub.`
  const monthlyWaHref = buildWa(subscribeMessage(monthlyPrice, 'monthly'))
  const annualWaHref = buildWa(subscribeMessage(annualPrice, 'annual'))
  const floatWaHref = getWhatsAppLink('201223789179', supportMessage) ?? '/profile/subscription'
  const waTargetAttrs = {
    target: hasWhatsapp ? '_blank' : undefined,
    rel: hasWhatsapp ? 'noreferrer' : undefined,
  }

  const chats = [
    { icon: 'chat', text: 'عميل جديد: ممكن تبعتلي نماذج من شغلك؟', time: 'دلوقتي' },
    { icon: 'schedule', text: 'أنت: لحظة، هجمعهم من الواتساب والدرايف...', time: '+30 دقيقة' },
    { icon: 'attach_file', text: 'أنت: بعت 3 ملفات مختلفة بترتيب مختلف', time: '+1 ساعة' },
    { icon: 'cancel', text: 'العميل: قرأ أول صفحة بس ومشى', time: '+3 دقايق' },
  ]

  const features: Array<{ icon: string; title: ReactNode; body: ReactNode }> = [
    {
      icon: 'language',
      title: (
        <>
          عربي و<bdi>RTL</bdi> من أول حرف لآخر حرف
        </>
      ),
      body: 'بورتفوليو بيتقرا مظبوط من اليمين للشمال — مفيش لخبطة في الأرقام ولا الكلام الإنجليزي، شكله احترافي زي أي موقع أجنبي.',
    },
    {
      icon: 'analytics',
      title: 'اعرف مين بيبص على شغلك',
      body: 'مش بس بتبني بورتفوليو — بتفهم برضه: كام واحد فتحه، أنهي شغلة وقفوا عندها أكتر، وأنى بتوصل لعملاء جداد. قراراتك تبقى مبنية على بيانات مش تخمين.',
    },
    {
      icon: 'bolt',
      title: 'بورتفوليو أونلاين النهارده، مش الأسبوع الجاي',
      body: `ضيف شغلك وانشره بنفسك في دقائق. مفيش انتظار ديزاينر، مفيش تراجع، مفيش "ابعتلي التعديلات بكرة". كل حاجة بيدك.`,
    },
    {
      icon: 'palette',
      title: 'شغلك يبان احترافي من غير مصمم',
      body: 'قوالب عصرية جاهزة، عدّل أي حاجة بكليكة من غير كود. الشكل النهائي يليق بيك وبسعر شغلك.',
    },
    {
      icon: 'devices',
      title: 'يفتح مظبوط على أي جهاز',
      body: 'عميلك ممكن يفتح اللينك من الموبايل في الطريق أو من اللابتوب في المكتب — الشكل يفضل محترم ومتجاوب مع كل شاشة.',
    },
    {
      icon: 'lock',
      title: 'شغلك محفوظ معاك',
      body: 'حسابك وبياناتك على سيرفرات آمنة. بورتفوليو بتاعك مبيختفيش لو ضاع موبايلك أو فرمت لابتوبك — كل حاجة سحابية ومحفوظة.',
    },
  ]

  const steps = [
    { n: '1', title: 'سجل حسابك مجاناً', body: 'في 30 ثانية، من غير كريدت كارد، من غير التزام. اكتب إيميلك وابدأ على طول.' },
    { n: '2', title: 'ضيف شغلك وبياناتك', body: 'بيلدر بالسحب والإفلات — حط المشاريع، اكتب نبذة عنك، اختار اللي يناسبك. من غير كود خالص.' },
    { n: '3', title: 'انشر وشارك لينك واحد', body: 'النشر بكليكة واحدة. تبعت اللينك لأي عميل فيرسال واتساب أو إيميل — وهو يفتح بورتفوليو بتاعك كامل.' },
  ]

  const freeFeats: ReactNode[] = [
    <>
      <bdi>Hero</bdi> (الواجهة الرئيسية)
    </>,
    <>
      <bdi>About</bdi> (نبذة عنك)
    </>,
    'المشاريع',
    'الفوتر',
  ]

  const proFeats: ReactNode[] = [
    'كل مزايا الباقة المجانية',
    <>
      <bdi>Experience</bdi> (خبراتك)
    </>,
    <>
      <bdi>Skills</bdi> (مهاراتك)
    </>,
    <>
      <bdi>Services</bdi> (خدماتك)
    </>,
    'آراء العملاء جوه البورتفوليو',
    'صفحة لكل مشروع تعرضه',
    'إحصائيات الزيارات',
  ]

  const annualFeats: ReactNode[] = [
    'كل مزايا الباقة الشهرية',
    'دفعة واحدة في السنة',
    'من غير تجديد كل شهر',
    `توفير ${save} جنيه`,
  ]

  const faqs: Array<{ q: ReactNode; a: ReactNode }> = [
    {
      q: (
        <>
          هل فعلاً مجاني؟ وإيه الفرق بين المجاني و<bdi>Pro</bdi>؟
        </>
      ),
      a: (
        <>
          أيوة، التسجيل والنشر مجاني للأبد. الباقة المجانية فيها الواجهة الرئيسية، نبذة عنك، المشاريع، والفوتر — كفاية للي بادئ. الـ<bdi>Pro</bdi> بيفتحلك الخبرات، المهارات، الخدمات، آراء العملاء، صفحة لكل مشروع، وإحصائيات الزيارات — لما تكون جاهز تتوسع.
        </>
      ),
    },
    {
      q: 'أقدر أعدّل بورتفوليو بعد ما أنشره؟',
      a: 'طبعاً، ده نقطة قوة. تقدر تعدّل وتضيف من البيلدر في أي وقت — مش محتاج حساب جديد ولا نشر من الأول. البورتفوليو بيفضل حي وكأنك بتحدّث موقعك الشخصي.',
    },
    {
      q: 'أقدر أعدّل من الموبايل؟',
      a: 'أيوة، البيلدر بيفتح على متصفح الموبايل وتقدر تعدّل من عليه. بس لو هتضيف صور كتير أو مشاريع جديدة، اللابتوب أسرع وأريح.',
    },
    {
      q: (
        <>
          إزاي أشترك في <bdi>Pro</bdi> وإزاي ألغي؟
        </>
      ),
      a: `اضغط "اشترك الآن"، هتفتح رسالة واتساب جاهزة، نرد عليك ونفعّل حسابك بعد التأكيد. ولو حبيت تلغي، تقدر من حسابك في أي وقت — والوصول بيفضل شغال لحد آخر مدة مدفوعة.`,
    },
    {
      q: 'لو واجهت مشكلة بتواصل مع مين؟',
      a: 'كلمنا على واتساب من الزرار اللي في الصفحة أو من الفوتر. بنرد بنفسنا مش بوت — لأن كل صاحب شغل بيستاهل رد حقيقي.',
    },
  ]

  return (
    <div ref={rootRef} dir="rtl" lang="ar" className="ph-home">
      <style>{CSS}</style>
      <noscript>
        <style>{`.ph-home [data-reveal],.ph-home [data-stagger]>*{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />

      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="التنقل الرئيسي">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <img className="ph-logo" src="/favicon.png" alt="" aria-hidden="true" />
            <bdi>{name}</bdi>
          </Link>
          <div className="nav-links">
            <a href="#features">المزايا</a>
            <a href="#how">ازاي بيشتغل</a>
            <a href="#pricing">الأسعار</a>
            <a href="#faq">أسئلة شائعة</a>
          </div>
          <div className="nav-ctas">
            <Link href="/login" className="btn btn-secondary btn-sm">تسجيل الدخول</Link>
            <Link href="/register" className="btn btn-primary btn-sm">ابدأ مجاناً</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero" id="home" aria-label="مقدمة">
          <div className="container">
            <div className="hero-inner">
              <span className="hero-badge">
                <Mi name="bolt" />
                بيلدر بورتفوليو بالعربي — جديد كليًا
              </span>
              <h1>
                <span className="h1-line">شغلك يستاهل يتبص فيه صح —</span>
                <span className="h1-line accent">بورتفوليو احترافي بالعربي تعمله بنفسك</span>
              </h1>
              <p className="sub">بيلدر بورتفوليو بالسحب والإفلات — من غير كود، من غير ديزاينر، من غير انتظار. سيب لينك واحد بس لأي عميل بدل ما تبعت ملفات متفرقة كل مرة.</p>
              <div className="hero-cta">
                <Link href="/register" className="btn btn-primary">ابدأ مجاناً — من غير كريدت كارد</Link>
                <Link href={EXAMPLE_HREF} className="btn btn-secondary">
                  شوف مثال حي
                  <Mi name="arrow_back" />
                </Link>
              </div>
              <p className="hero-note">جاهز في دقائق — أونلاين قبل ما تخلص قهوتك ☕</p>
              <div className="hero-video-wrap">
                <div className="video-toolbar">
                  <span className="video-dot red" aria-hidden="true" />
                  <span className="video-dot yellow" aria-hidden="true" />
                  <span className="video-dot green" aria-hidden="true" />
                  <span className="video-url" dir="ltr">portfolio-hub.online/your-name</span>
                </div>
                <div className="video-frame">
                  <iframe
                    src="https://www.youtube.com/embed/elTwZYJrDZg?rel=0&modestbranding=1&playsinline=1"
                    title="PortfolioHub - ابنِ بورتفوليو احترافي بالعربي"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section problem" data-reveal>
          <div className="container problem-grid">
            <div className="problem-text" data-reveal="slide-right">
              <span className="eyebrow">المشكلة الحقيقية</span>
              <h2 className="section-title">{`كل عميل بيسألك "وريني شغلك" — وبتقعد ساعة بتجمع ملفات.`}</h2>
              <p>ملف من واتساب، صورة من درايف، سكرين شوت قديم في معرض الصور... النتيجة؟ كل عميل بياخد <span className="accent">نسخة مختلفة منك</span>، وصورتك بتبقى عشوائية.</p>
              <p>عملاء كتير بيحكموا عليك من أول 10 ثواني. لو فتحوا ملف مبعثر ومش منظم، هيسكروا ويمشوا — حتى لو شغلك ممتاز من جوه.</p>
              <div className="solution-box">المفروض يكون عندك مكان واحد. بورتفوليو واحد، بلينك واحد، يبعت لأي عميل في ثانية. ده اللي بنوفرهولك.</div>
            </div>
            <div className="problem-visual" data-reveal="slide-left">
              <div className="chat-list">
                {chats.map((c) => (
                  <div key={c.time} className="chat-card">
                    <Mi name={c.icon} />
                    <span className="chat-text">{c.text}</span>
                    <span className="chat-time">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section features" data-reveal>
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">ليه {name}؟</span>
              <h2 className="section-title">كل اللي محتاجه عشان تبني حضورك المهني</h2>
              <p className="section-sub">مش بس بورتفوليو — أداة كاملة بتساعدك تعرض شغلك وتفهم برضه إزاي الناس بتبص عليه.</p>
            </div>
            <div className="features-grid" data-stagger>
              {features.map((f) => (
                <div key={f.icon} className="feature-card">
                  <span className="feature-icon"><Mi name={f.icon} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section how" data-reveal>
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">ازاي بيشتغل؟</span>
              <h2 className="section-title">3 خطوات وبورتفوليوك أونلاين</h2>
              <p className="section-sub">مفيش تعقيد، مفيش انتظار — كل حاجة بيدك من البداية للنهاية.</p>
            </div>
            <div className="steps" data-stagger>
              {steps.map((s) => (
                <div key={s.n} className="step-card">
                  <span className="step-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
            <p className="steps-note">💡 تقدر تبدأ وتوقف وترجع تكمل وقت ما تحب — البورتفوليو بيتحدث في أي وقت من غير ما تعمل حساب جديد.</p>
          </div>
        </section>

        <section id="pricing" className="section pricing" data-reveal>
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">الأسعار</span>
              <h2 className="section-title">ابدأ مجاناً، اتوسع لما تكون جاهز</h2>
              <p className="section-sub">مفيش رسوم خفية، مفيش التزام — تدفع بس لما تشوف قيمة حقيقية.</p>
            </div>
            <div className="pricing-grid" data-stagger>
              <div className="pricing-card">
                <h3>مجاني</h3>
                <p className="plan-desc">ابدأ من غير ما تدفع حاجة — للأبد</p>
                <div className="price-row">
                  <span className="price-num">0</span>
                  <span className="price-unit">ج.م / للأبد</span>
                </div>
                <ul className="pricing-feats">
                  {freeFeats.map((x, i) => (
                    <li key={i}><Mi name="check" /><span>{x}</span></li>
                  ))}
                </ul>
                <Link href="/register" className="btn btn-secondary">ابدأ مجاناً</Link>
                <p className="plan-audience">مناسب للي لسه بادئ وعايز يبني أول بورتفوليو ليه</p>
              </div>

              <div className="pricing-card featured">
                <span className="plan-badge">الأكثر اختياراً</span>
                <h3>شهري <bdi>Pro</bdi></h3>
                <p className="plan-desc">للي عايز يعرض شغله بالتفصيل ويفهم زواره</p>
                <div className="price-row">
                  <span className="price-num">{monthlyPrice}</span>
                  <span className="price-unit">ج.م / شهري</span>
                </div>
                <ul className="pricing-feats">
                  {proFeats.map((x, i) => (
                    <li key={i}><Mi name="check" /><span>{x}</span></li>
                  ))}
                </ul>
                <a href={monthlyWaHref} {...waTargetAttrs} className="btn btn-primary">اشترك الآن</a>
                <p className="plan-audience">مناسب لفريلانسر شغال وعايز يرفع سعره</p>
              </div>

              <div className="pricing-card">
                <h3>سنوي <bdi>Pro</bdi></h3>
                <p className="plan-desc">ادفع مرة واحدة ووفّر {save} جنيه</p>
                <p className="old-price"><s>{monthlyPrice * 12} ج.م</s></p>
                <div className="price-row">
                  <span className="price-num">{annualPrice}</span>
                  <span className="price-unit">ج.م / سنوي</span>
                </div>
                <span className="save-tag">وفّر {save} جنيه</span>
                <ul className="pricing-feats">
                  {annualFeats.map((x, i) => (
                    <li key={i}><Mi name="check" /><span>{x}</span></li>
                  ))}
                </ul>
                <a href={annualWaHref} {...waTargetAttrs} className="btn btn-secondary">اشترك سنوياً</a>
                <p className="plan-audience">مناسب للي قرر يبني حضوره المهني بجدية</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section custom" data-reveal="scale">
          <div className="container">
            <div className="custom-box">
              <div className="custom-lead">
                <span className="eyebrow">تصميم مخصص</span>
                <h2 className="section-title">القوالب الجاهزة مش شبهك؟</h2>
                <p className="section-sub">نصمملك بورتفوليو بشخصيتك وطريقة عرض شغلك بالظبط. نحكيلنا اللي في دماغك — ألوان، ترتيب، أسلوب — وننفذهالك بشكل احترافي متكامل.</p>
              </div>
              <a href={CUSTOM_URL} target="_blank" rel="noreferrer" className="btn btn-primary custom-cta">
                اطلب تصميم مخصص
                <Mi name="arrow_back" />
              </a>
            </div>
          </div>
        </section>

        <section id="faq" className="section faq" data-reveal>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">أسئلة شائعة</h2>
            </div>
            <div className="faq-list" data-stagger>
              {faqs.map((f, i) => (
                <details key={i} className="faq-item" open={i === 0 ? true : undefined}>
                  <summary><span className="faq-q">{f.q}</span></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta" data-reveal>
          <div className="container">
            <h2>بورتفوليو احترافي ممكن يبقى أونلاين قبل ما تخلص القهوة</h2>
            <p className="sub">ابدأ دلوقتي مجاناً — من غير كريدت كارد، من غير التزام.</p>
            <Link href="/register" className="btn btn-primary">ابدأ مجاناً دلوقتي</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand brand-footer">
                <img className="ph-logo" src="/favicon.png" alt="" aria-hidden="true" />
                <bdi>{name}</bdi>
              </span>
              <p>بورتفوليو احترافي بالعربي — جاهز في دقائق، من غير كود. أداة عربياتنا اللي بتحل مشكلة تشتت الشغل عند كل كاتب فريلانسر.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/profile.php?id=61591188372137" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك">
                  <FacebookIcon />
                </a>
                <a href="https://www.instagram.com/portfoli0hub/" target="_blank" rel="noopener noreferrer" aria-label="إنستغرام">
                  <InstagramIcon />
                </a>
                <a href="https://www.linkedin.com/company/portfoliohubb/" target="_blank" rel="noopener noreferrer" aria-label="لينكدإن">
                  <LinkedInIcon />
                </a>
                <a href="https://wa.me/201223789179" target="_blank" rel="noopener noreferrer" aria-label="واتساب">
                  <WhatsAppIcon />
                </a>
              </div>
            </div>
            <nav className="footer-col" aria-label="المنتج">
              <h4>المنتج</h4>
              <a href="#features">المزايا</a>
              <a href="#how">ازاي بيشتغل</a>
              <a href="#pricing">الأسعار</a>
              <a href="#faq">أسئلة شائعة</a>
            </nav>
            <nav className="footer-col" aria-label="الحساب والدعم">
              <h4>الحساب والدعم</h4>
              <Link href="/register">ابدأ مجاناً</Link>
              <Link href="/login">تسجيل الدخول</Link>
              <a href={buildWa(supportMessage)} {...waTargetAttrs}>دعم واتساب</a>
            </nav>
          </div>
          <div className="footer-bottom">
            © 2026 · <bdi>{name}</bdi> — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>

      <a href={floatWaHref} target="_blank" rel="noreferrer" className="wa-float" aria-label="واتساب">
        <WhatsAppIcon />
      </a>
    </div>
  )
}

function Mi({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-icons-outlined${className ? ` ${className}` : ''}`} aria-hidden="true">
      {name}
    </span>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const CSS = `
.ph-home{
  --ph-gold:#06c;
  --ph-gold-light:#0071e3;
  --ph-gold-overlay-15:rgba(0,102,204,.1);
  --ph-gray-light:#f5f5f7;
  --ph-gray-mid:#e0e0e0;
  --ph-gray-text:#7a7a7a;
  --ph-navy-deep:#272729;
  --ph-navy-mid:#2a2a2c;
  --ph-white:#fff;
  --ph-accent-on-dark:#2997ff;
  --canvas:#f5f5f7;
  --canvas-alt:#fff;
  --card:#fff;
  --card-hover:#f0f0f2;
  --border:#e0e0e0;
  --text-primary:#18181b;
  --text-secondary:#4a4a4a;
  --text-muted:#7a7a7a;
  --danger:#dc2626;
  --success:#16a34a;
  --warning:#d97706;
  --font-display:'Space Grotesk','Cairo',sans-serif;
  --font-arabic:'Cairo','Tajawal','Noto Sans Arabic',sans-serif;
  --font-sans:'Inter','Cairo',sans-serif;
  --font-num:'Space Grotesk','Inter',monospace;
  --radius-sm:8px;
  --radius-md:12px;
  --radius-lg:16px;
  --radius-xl:20px;
  --radius-2xl:24px;
  --radius-3xl:32px;
  --shadow-sm:0 1px 2px rgba(0,0,0,.04),0 1px 1px rgba(0,0,0,.02);
  --shadow-md:0 4px 12px rgba(0,0,0,.06),0 2px 4px rgba(0,0,0,.04);
  --shadow-lg:0 12px 32px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.04);
  --shadow-blue:0 8px 24px rgba(0,102,204,.18);

  direction:rtl;
  min-height:100vh;
  background:var(--ph-gray-light);
  color:var(--text-primary);
  font-family:var(--font-arabic);
  font-size:16px;
  line-height:1.7;
  -webkit-font-smoothing:antialiased;
}
.ph-home a{color:inherit;text-decoration:none;}
.ph-home ul{margin:0;padding:0;list-style:none;}
.ph-home p{margin:0;}
.ph-home h1,.ph-home h2,.ph-home h3,.ph-home h4{margin:0;}

.ph-home .scroll-progress{position:fixed;top:0;right:0;height:3px;width:0%;
  background:linear-gradient(90deg,var(--ph-gold) 0%,var(--ph-gold-light) 50%,var(--ph-accent-on-dark) 100%);
  z-index:9999;box-shadow:0 0 12px rgba(0,102,204,.5);transition:width .1s ease-out;pointer-events:none;}

.ph-home .navbar{position:sticky;top:0;z-index:1000;
  background:rgba(245,245,247,.85);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(0,0,0,.04);
  animation:phNavDown .6s cubic-bezier(.16,1,.3,1);
  transition:background .3s,box-shadow .3s;}
.ph-home .navbar.scrolled{box-shadow:0 4px 24px rgba(0,0,0,.06);background:rgba(245,245,247,.92);}
.ph-home .nav-inner{display:flex;align-items:center;gap:16px;max-width:1160px;margin:0 auto;padding:12px 24px;}
.ph-home .brand{display:inline-flex;align-items:center;gap:10px;
  font-family:var(--font-num);font-weight:700;font-size:19px;color:var(--text-primary);letter-spacing:-.01em;}
.ph-home .ph-logo{width:34px;height:34px;border-radius:10px;flex:none;
  display:block;object-fit:cover;box-shadow:var(--shadow-blue);}
.ph-home .nav-links{display:flex;align-items:center;gap:26px;margin-inline:auto;}
.ph-home .nav-links a{font-size:15px;font-weight:600;color:var(--text-secondary);transition:color .25s;}
.ph-home .nav-links a:hover{color:var(--ph-gold);}
.ph-home .nav-ctas{display:flex;align-items:center;gap:10px;margin-inline-start:auto;}

.ph-home .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:14px 28px;border-radius:var(--radius-md);font-family:var(--font-arabic);
  font-size:15px;font-weight:700;line-height:1.4;cursor:pointer;border:none;white-space:nowrap;
  transition:background .3s,color .3s,border-color .3s,transform .2s,box-shadow .3s;}
.ph-home .btn-sm{padding:10px 18px;font-size:14px;}
.ph-home .btn-primary{background:var(--ph-gold);color:var(--ph-white);box-shadow:var(--shadow-blue);}
.ph-home .btn-primary:hover{background:var(--ph-gold-light);transform:translateY(-2px);}
.ph-home .btn-primary:active{transform:translateY(0);}
.ph-home .btn-secondary{background:var(--card);color:var(--text-primary);border:1.5px solid var(--border);box-shadow:none;}
.ph-home .btn-secondary:hover{border-color:var(--ph-gold);color:var(--ph-gold);transform:translateY(-2px);}
.ph-home .btn-secondary:active{transform:translateY(0);}
.ph-home .btn .material-icons-outlined{font-size:18px;}

.ph-home .hero{position:relative;overflow:hidden;padding:96px 0 112px;
  background:
    radial-gradient(920px 420px at 12% -80px,var(--ph-gold-overlay-15),transparent 62%),
    radial-gradient(920px 420px at 88% -80px,var(--ph-gold-overlay-15),transparent 62%),
    linear-gradient(180deg,var(--ph-white) 0%,var(--ph-gray-light) 78%);}
.ph-home .hero-inner{max-width:1000px;margin:0 auto;display:flex;flex-direction:column;align-items:center;text-align:center;}
.ph-home .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:9999px;
  background:var(--ph-white);border:1px solid var(--border);box-shadow:var(--shadow-sm);
  font-size:14px;font-weight:600;color:var(--text-secondary);
  animation:phFadeUp .9s cubic-bezier(.16,1,.3,1) .1s backwards;}
.ph-home .hero-badge .material-icons-outlined{font-size:18px;color:var(--ph-gold);
  animation:phPulse 2s ease-in-out infinite;}
.ph-home .hero h1{margin:24px 0 0;font-family:var(--font-arabic);font-size:52px;font-weight:800;
  line-height:1.28;color:var(--text-primary);
  animation:phFadeUp .9s cubic-bezier(.16,1,.3,1) .2s backwards;}
.ph-home .hero h1 .h1-line{display:block;}
.ph-home .hero h1 .accent{color:var(--ph-gold);}
.ph-home .hero .sub{margin:20px 0 0;max-width:660px;font-size:18px;line-height:1.9;color:var(--text-muted);
  animation:phFadeUp .9s cubic-bezier(.16,1,.3,1) .35s backwards;}
.ph-home .hero-cta{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:14px;margin-top:32px;
  animation:phFadeUp .9s cubic-bezier(.16,1,.3,1) .5s backwards;}
.ph-home .hero-cta .btn{padding:16px 32px;}
.ph-home .hero-note{margin:18px 0 0;font-size:14px;color:var(--text-muted);
  animation:phFadeUp .9s cubic-bezier(.16,1,.3,1) .65s backwards;}
.ph-home .hero-video-wrap{width:100%;max-width:1000px;margin:56px auto 0;padding:6px;
  background:var(--card);border:1px solid var(--border);border-radius:var(--radius-2xl);
  box-shadow:0 24px 64px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.06);
  animation:phVideoIn 1.1s cubic-bezier(.16,1,.3,1) .7s backwards;}
.ph-home .video-toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;
  direction:ltr;background:var(--ph-gray-mid);border-radius:var(--radius-md) var(--radius-md) 0 0;}
.ph-home .video-dot{width:11px;height:11px;border-radius:50%;flex:none;}
.ph-home .video-dot.red{background:#ff5f57;}
.ph-home .video-dot.yellow{background:#febc2e;}
.ph-home .video-dot.green{background:#28c840;}
.ph-home .video-url{flex:1;max-width:460px;margin-inline:auto;direction:ltr;text-align:center;
  background:var(--ph-white);border-radius:8px;padding:6px 14px;overflow:hidden;
  font-family:var(--font-num);font-size:13px;color:var(--text-muted);
  white-space:nowrap;text-overflow:ellipsis;}
.ph-home .video-frame{position:relative;padding-top:56.25%;background:#000;
  border-radius:0 0 var(--radius-md) var(--radius-md);overflow:hidden;}
.ph-home .video-frame iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}

.ph-home .container{width:100%;max-width:1160px;margin:0 auto;padding:0 24px;}
.ph-home .section{padding:100px 0;scroll-margin-top:80px;}
.ph-home .section-header{text-align:center;margin-bottom:56px;}
.ph-home .eyebrow{display:block;font-size:14px;font-weight:700;color:var(--ph-gold);margin-bottom:12px;}
.ph-home .section-title{font-family:var(--font-arabic);font-size:40px;font-weight:800;
  line-height:1.35;color:var(--text-primary);}
.ph-home .section-sub{max-width:660px;margin:16px auto 0;font-size:17px;line-height:1.85;color:var(--text-muted);}
.ph-home .accent{color:var(--ph-gold);}

.ph-home .problem{background:var(--canvas-alt);}
.ph-home .problem-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:64px;align-items:center;}
.ph-home .problem-text .section-title{font-size:34px;margin-bottom:20px;}
.ph-home .problem-text p{font-size:16px;line-height:1.9;color:var(--text-secondary);margin-bottom:14px;}
.ph-home .problem-text .eyebrow{margin-bottom:10px;}
.ph-home .solution-box{margin-top:24px;padding:18px 20px;border-radius:var(--radius-md);
  border-inline-start:4px solid var(--ph-gold);
  background:var(--ph-gold-overlay-15);
  font-size:16px;font-weight:600;line-height:1.9;color:var(--text-primary);}
.ph-home .chat-list{display:flex;flex-direction:column;gap:14px;}
.ph-home .chat-card{display:flex;align-items:flex-start;gap:12px;
  background:var(--ph-gray-light);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:14px 16px;box-shadow:var(--shadow-sm);transition:transform .3s,box-shadow .3s,background .3s;}
.ph-home .chat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);background:var(--card-hover);}
.ph-home .chat-card > .material-icons-outlined{font-size:20px;color:var(--danger);flex:none;margin-top:3px;}
.ph-home .chat-text{flex:1;min-width:0;font-size:14.5px;font-weight:500;line-height:1.75;color:var(--text-primary);}
.ph-home .chat-time{flex:none;font-size:12px;color:var(--text-muted);margin-top:3px;}

.ph-home .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.ph-home .feature-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:28px;transition:transform .3s,box-shadow .3s,border-color .3s;}
.ph-home .feature-card:hover{transform:translateY(-4px);border-color:var(--ph-gold);box-shadow:var(--shadow-md);}
.ph-home .feature-icon{display:flex;align-items:center;justify-content:center;
  width:46px;height:46px;border-radius:var(--radius-md);
  background:var(--ph-gold-overlay-15);color:var(--ph-gold);margin-bottom:18px;}
.ph-home .feature-icon .material-icons-outlined{font-size:22px;}
.ph-home .feature-card h3{font-size:18px;font-weight:700;line-height:1.55;color:var(--text-primary);margin-bottom:10px;}
.ph-home .feature-card p{font-size:14.5px;line-height:1.85;color:var(--text-muted);}

.ph-home .how{background:var(--ph-navy-deep);color:var(--ph-white);}
.ph-home .how .eyebrow{color:var(--ph-accent-on-dark);}
.ph-home .how .section-title{color:var(--ph-white);}
.ph-home .how .section-sub{color:rgba(255,255,255,.75);}
.ph-home .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.ph-home .step-card{background:var(--ph-navy-mid);border:1px solid rgba(255,255,255,.08);
  border-radius:var(--radius-lg);padding:28px;transition:transform .3s,border-color .3s,box-shadow .3s;}
.ph-home .step-card:hover{transform:translateY(-4px);border-color:var(--ph-accent-on-dark);}
.ph-home .step-num{display:flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:var(--radius-md);margin-bottom:18px;
  font-family:var(--font-num);font-size:20px;font-weight:700;line-height:1;
  background:rgba(41,151,255,.14);color:var(--ph-accent-on-dark);}
.ph-home .step-card h3{font-size:18px;font-weight:700;color:var(--ph-white);margin-bottom:10px;}
.ph-home .step-card p{font-size:14.5px;line-height:1.85;color:rgba(255,255,255,.75);}
.ph-home .steps-note{max-width:720px;margin:40px auto 0;padding:16px 20px;
  border-radius:var(--radius-md);text-align:center;font-size:14.5px;line-height:1.85;
  background:rgba(41,151,255,.08);border:1px solid rgba(41,151,255,.25);color:rgba(255,255,255,.85);}

.ph-home .pricing{background:var(--canvas-alt);}
.ph-home .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:stretch;}
.ph-home .pricing-card{position:relative;display:flex;flex-direction:column;
  background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius-lg);
  padding:32px 28px;transition:transform .3s,box-shadow .3s,border-color .3s;}
.ph-home .pricing-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);}
.ph-home .pricing-card h3{font-size:18px;font-weight:700;color:var(--text-primary);}
.ph-home .plan-desc{margin-top:6px;font-size:13.5px;line-height:1.7;color:var(--text-muted);}
.ph-home .price-row{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;margin-top:18px;}
.ph-home .price-num{font-family:var(--font-num);font-size:48px;font-weight:700;line-height:1.1;
  letter-spacing:-.02em;color:var(--text-primary);}
.ph-home .price-unit{font-size:14px;font-weight:600;color:var(--text-muted);}
.ph-home .old-price{margin-top:14px;font-size:15px;color:var(--text-muted);}
.ph-home .old-price s{text-decoration-line:line-through;}
.ph-home .save-tag{display:inline-flex;align-self:flex-start;align-items:center;gap:6px;margin-top:12px;
  padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700;
  color:var(--success);background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.3);}
.ph-home .pricing-feats{display:flex;flex-direction:column;gap:12px;margin:22px 0;}
.ph-home .pricing-feats li{display:flex;align-items:flex-start;gap:10px;
  font-size:14px;line-height:1.7;color:var(--text-secondary);}
.ph-home .pricing-feats .material-icons-outlined{font-size:18px;color:var(--ph-gold);flex:none;margin-top:3px;}
.ph-home .pricing-card .btn{margin-top:auto;width:100%;}
.ph-home .plan-audience{margin-top:14px;font-size:12.5px;line-height:1.75;text-align:center;color:var(--text-muted);}
.ph-home .pricing-card.featured{border:2px solid var(--ph-gold);box-shadow:var(--shadow-blue);
  animation:phFeaturedFloat 4s ease-in-out infinite;}
.ph-home .pricing-card.featured:hover{box-shadow:0 16px 40px rgba(0,102,204,.25);}
.ph-home .plan-badge{position:absolute;top:-14px;left:0;right:0;margin-inline:auto;width:max-content;
  padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:700;white-space:nowrap;
  background:var(--ph-gold);color:var(--ph-white);box-shadow:var(--shadow-blue);}

.ph-home .custom .custom-box{display:flex;align-items:center;justify-content:space-between;gap:40px;
  background:var(--ph-white);border:1px solid rgba(0,102,204,.2);border-radius:var(--radius-3xl);
  padding:48px 56px;box-shadow:0 6px 24px rgba(0,102,204,.08);}
.ph-home .custom .custom-lead .section-title{font-size:32px;}
.ph-home .custom .section-sub{margin-inline:0;font-size:16px;}
.ph-home .custom-cta{flex:none;}

.ph-home .faq-list{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px;}
.ph-home .faq-item{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:0 24px;transition:border-color .3s,box-shadow .3s;}
.ph-home .faq-item:hover{border-color:rgba(0,102,204,.35);}
.ph-home .faq-item[open]{border-color:var(--ph-gold);box-shadow:var(--shadow-sm);}
.ph-home .faq-item summary{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:18px 0;cursor:pointer;list-style:none;font-size:16.5px;font-weight:700;color:var(--text-primary);}
.ph-home .faq-item summary::-webkit-details-marker{display:none;}
.ph-home .faq-item summary::after{content:'+';flex:none;font-family:var(--font-num);font-size:22px;
  line-height:1;color:var(--ph-gold);transition:transform .25s ease;}
.ph-home .faq-item[open] summary::after{transform:rotate(45deg);}
.ph-home .faq-item p{padding-bottom:20px;font-size:14.5px;line-height:1.9;color:var(--text-muted);}

.ph-home .final-cta{background:var(--ph-navy-deep);color:var(--ph-white);text-align:center;padding:96px 0;}
.ph-home .final-cta h2{font-family:var(--font-arabic);font-size:36px;font-weight:800;line-height:1.4;color:var(--ph-white);max-width:720px;margin:0 auto;}
.ph-home .final-cta .sub{margin:16px auto 0;max-width:560px;font-size:17px;line-height:1.85;color:rgba(255,255,255,.75);}
.ph-home .final-cta .btn{margin-top:32px;padding:16px 32px;}

.ph-home .footer{background:var(--canvas-alt);border-top:1px solid var(--border);padding:64px 0 32px;}
.ph-home .footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:48px;}
.ph-home .brand-footer{margin-bottom:14px;}
.ph-home .footer-brand p{max-width:420px;font-size:14px;line-height:1.9;color:var(--text-muted);}
.ph-home .footer-social{display:flex;align-items:center;gap:12px;margin-top:20px;}
.ph-home .footer-social a{display:inline-flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:12px;flex:none;
  background:var(--ph-gray-light);border:1px solid var(--border);color:var(--text-secondary);
  transition:color .25s,border-color .25s,transform .2s,box-shadow .3s;}
.ph-home .footer-social a:hover{color:var(--ph-gold);border-color:var(--ph-gold);
  transform:translateY(-2px);box-shadow:var(--shadow-blue);}
.ph-home .footer-social svg{width:20px;height:20px;}
.ph-home .footer-col h4{font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:14px;}
.ph-home .footer-col a{display:block;width:fit-content;padding:6px 0;font-size:14px;color:var(--text-muted);transition:color .25s;}
.ph-home .footer-col a:hover{color:var(--ph-gold);}
.ph-home .footer-bottom{margin-top:48px;padding-top:24px;border-top:1px solid var(--border);
  text-align:center;font-size:13px;color:var(--text-muted);}

.ph-home .wa-float{position:fixed;bottom:24px;right:24px;z-index:99;
  width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:var(--ph-gold);color:var(--ph-white);box-shadow:var(--shadow-blue);
  transition:transform .2s,background .2s;}
.ph-home .wa-float:hover{background:var(--ph-gold-light);transform:scale(1.06);}
.ph-home .wa-float:active{transform:scale(.95);}

.ph-home [data-reveal]{opacity:0;transform:translateY(40px);
  transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);
  will-change:opacity,transform;}
.ph-home [data-reveal="slide-right"]{transform:translateX(40px);}
.ph-home [data-reveal="slide-left"]{transform:translateX(-40px);}
.ph-home [data-reveal="scale"]{transform:scale(.92);}
.ph-home [data-reveal].is-visible{opacity:1;transform:none;}

.ph-home [data-stagger] > *{opacity:0;transform:translateY(30px);
  transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);
  will-change:opacity,transform;}
.ph-home [data-stagger].is-visible > *:nth-child(1){transition-delay:.05s;}
.ph-home [data-stagger].is-visible > *:nth-child(2){transition-delay:.15s;}
.ph-home [data-stagger].is-visible > *:nth-child(3){transition-delay:.25s;}
.ph-home [data-stagger].is-visible > *:nth-child(4){transition-delay:.35s;}
.ph-home [data-stagger].is-visible > *:nth-child(5){transition-delay:.45s;}
.ph-home [data-stagger].is-visible > *:nth-child(6){transition-delay:.55s;}
.ph-home [data-stagger].is-visible > *:not(.pricing-card.featured){opacity:1 !important;transform:translateY(0) !important;}
.ph-home [data-stagger].is-visible > .pricing-card.featured{opacity:1 !important;}

@keyframes phFadeUp{
  from{opacity:0;transform:translateY(24px);}
  to{opacity:1;transform:translateY(0);}
}
@keyframes phVideoIn{
  from{opacity:0;transform:translateY(50px) scale(.96);}
  to{opacity:1;transform:translateY(0) scale(1);}
}
@keyframes phNavDown{
  from{transform:translateY(-100%);opacity:0;}
  to{transform:translateY(0);opacity:1;}
}
@keyframes phPulse{
  0%,100%{transform:scale(1);opacity:1;}
  50%{transform:scale(1.15);opacity:.7;}
}
@keyframes phFeaturedFloat{
  0%,100%{transform:translateY(-8px);}
  50%{transform:translateY(-12px);}
}

@media (prefers-reduced-motion:reduce){
  .ph-home *,.ph-home *::before,.ph-home *::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
  }
  .ph-home [data-reveal],.ph-home [data-stagger] > *{
    opacity:1 !important;transform:none !important;
  }
}

@media (max-width:960px){
  .ph-home .nav-links{display:none;}
  .ph-home .nav-inner{padding:12px 20px;}
  .ph-home .hero{padding:56px 0 72px;}
  .ph-home .hero h1{font-size:40px;}
  .ph-home .section{padding:72px 0;}
  .ph-home .section-title{font-size:32px;}
  .ph-home .problem-grid{grid-template-columns:1fr;gap:40px;}
  .ph-home .problem-text .section-title{font-size:30px;}
  .ph-home .features-grid{grid-template-columns:repeat(2,1fr);gap:16px;}
  .ph-home .steps{grid-template-columns:1fr;}
  .ph-home .pricing-grid{grid-template-columns:1fr;max-width:480px;margin:0 auto;}
  .ph-home .custom .custom-box{flex-direction:column;align-items:stretch;gap:24px;padding:32px 28px;border-radius:var(--radius-2xl);}
  .ph-home .custom .custom-cta{justify-content:center;}
  .ph-home .final-cta h2{font-size:30px;}
  .ph-home .footer-grid{grid-template-columns:repeat(2,1fr);}
  .ph-home .footer-brand{grid-column:1 / -1;}
}

@media (max-width:600px){
  .ph-home .container{padding:0 16px;}
  .ph-home .nav-inner{padding:10px 16px;gap:10px;}
  .ph-home .brand{font-size:17px;}
  .ph-home .ph-logo{width:28px;height:28px;border-radius:8px;}
  .ph-home .navbar .btn-secondary{display:none;}
  .ph-home .navbar .btn{padding:10px 16px;font-size:14px;}
  .ph-home .hero{padding:40px 0 56px;}
  .ph-home .hero h1{font-size:30px;line-height:1.2;}
  .ph-home .hero .sub{font-size:16px;}
  .ph-home .hero-cta{flex-direction:column;align-items:stretch;}
  .ph-home .hero-cta .btn{width:100%;}
  .ph-home .hero-video-wrap{margin-top:40px;border-radius:16px;}
  .ph-home .video-toolbar{padding:8px 12px;gap:6px;}
  .ph-home .video-url{font-size:11px;padding:5px 10px;}
  .ph-home .section{padding:56px 0;}
  .ph-home .section-header{margin-bottom:36px;}
  .ph-home .section-title{font-size:24px;}
  .ph-home .section-sub{font-size:15px;}
  .ph-home .problem-text .section-title{font-size:24px;}
  .ph-home .problem-text p{font-size:15px;}
  .ph-home .chat-text{font-size:13.5px;}
  .ph-home .features-grid{grid-template-columns:1fr;}
  .ph-home .feature-card{padding:22px 20px;}
  .ph-home .feature-card h3{font-size:16.5px;}
  .ph-home .step-card{padding:22px 20px;}
  .ph-home .pricing-card{padding:28px 22px;}
  .ph-home .price-num{font-size:40px;}
  .ph-home .final-cta{padding:64px 0;}
  .ph-home .final-cta h2{font-size:24px;}
  .ph-home .final-cta .sub{font-size:15px;}
  .ph-home .footer-grid{grid-template-columns:1fr;gap:32px;}
  .ph-home .footer-bottom{font-size:12px;}
  .ph-home .wa-float{bottom:16px;right:16px;width:48px;height:48px;}
}

@media (max-width:360px){
  .ph-home .hero h1{font-size:26px;}
  .ph-home .hero .sub{font-size:15px;}
  .ph-home .section-title{font-size:22px;}
  .ph-home .problem-text .section-title{font-size:22px;}
  .ph-home .price-num{font-size:36px;}
}
`
