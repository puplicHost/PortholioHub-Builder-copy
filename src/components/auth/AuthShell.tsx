import type { ReactNode } from 'react'
import Link from 'next/link'

// Minimal, Apple-inspired auth shell (DESIGN.md): soft canvas, three floating
// blur orbs, a single flat panel with a hairline border and one blue accent.
// Presentation only — the forms keep their own logic, i18n keys and routing.
export function AuthShell({
  brand,
  heading,
  subtitle,
  children,
  footer,
}: {
  brand: string
  heading: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="auth-root">
      <style>{`
        .auth-root{
          --c-page:#f5f5f7;--c-panel:#ffffff;--c-ink:#1d1d1f;--c-muted:#7a7a7a;
          --c-border:#e0e0e0;--c-input:#f5f5f7;--c-accent:#0066cc;--c-accent-focus:#0071e3;--c-on-primary:#ffffff;
          --f-primary:'Inter',system-ui,-apple-system,sans-serif;
          position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;
          padding:var(--sp-md,24px);overflow:hidden;background:var(--c-page);color:var(--c-ink);
          font-family:var(--f-primary);line-height:1.47;
        }
        html[lang='ar'] .auth-root,html[dir='rtl'] .auth-root{
          --f-primary:'Cairo','Inter',system-ui,-apple-system,sans-serif;line-height:1.55;
        }
        .dark .auth-root,[data-theme='dark'] .auth-root{
          --c-page:#0e0e10;--c-panel:#1a1a1d;--c-ink:#f5f5f7;--c-muted:#a1a1a6;
          --c-border:#3a3a3c;--c-input:#1e1e21;--c-accent:#2997ff;--c-accent-focus:#4aa3ff;
        }
        .auth-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
        .auth-orb-1{width:420px;height:420px;background:var(--c-accent);opacity:.14;top:-16%;left:-10%;animation:authFloat 26s ease-in-out infinite;}
        .auth-orb-2{width:360px;height:360px;background:#4a9eff;opacity:.14;bottom:-14%;right:-8%;animation:authFloat 30s ease-in-out infinite reverse;}
        .auth-orb-3{width:260px;height:260px;background:var(--c-accent);opacity:.08;top:42%;right:18%;animation:authFloat 20s ease-in-out infinite 4s;}
        @keyframes authFloat{
          25%{transform:translate(36px,-52px) scale(1.08);}
          50%{transform:translate(-18px,26px) scale(.95);}
          75%{transform:translate(44px,34px) scale(1.05);}
        }
        .auth-card{position:relative;z-index:1;width:100%;max-width:400px;padding:40px 36px;
          background:var(--c-panel);border:1px solid var(--c-border);border-radius:20px;
          box-shadow:0 24px 64px rgba(0,0,0,.08);}
        .dark .auth-card{box-shadow:0 24px 64px rgba(0,0,0,.4);}
        .auth-brand{display:inline-block;font-size:15px;font-weight:600;letter-spacing:-0.02em;color:var(--c-ink);}
        html[dir='rtl'] .auth-brand{letter-spacing:0;}
        .auth-head{margin-top:20px;}
        .auth-title{font-size:22px;font-weight:600;letter-spacing:-0.02em;line-height:1.25;color:var(--c-ink);margin:0;}
        html[dir='rtl'] .auth-title{letter-spacing:0;line-height:1.35;}
        .auth-sub{margin:6px 0 0;font-size:14px;color:var(--c-muted);line-height:1.6;}
        .auth-form{margin-top:24px;display:flex;flex-direction:column;gap:16px;}
        .auth-field{display:flex;flex-direction:column;gap:6px;}
        .auth-label{font-size:13px;font-weight:500;color:var(--c-muted);}
        .auth-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid var(--c-border);
          background:var(--c-input);color:var(--c-ink);font-size:14px;font-family:inherit;
          transition:border-color .2s,background .2s;outline:none;}
        .auth-input:focus{border-color:var(--c-accent);}
        .auth-input::placeholder{color:var(--c-muted);opacity:.6;}
        .auth-error{margin:0;font-size:13px;color:var(--c-danger,#dc2626);}
        .dark .auth-error{color:#f87171;}
        .auth-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;
          padding:13px 24px;margin-top:4px;font-size:15px;font-weight:600;letter-spacing:-0.01em;
          color:var(--c-on-primary);background:var(--c-accent);border:none;border-radius:12px;
          font-family:inherit;cursor:pointer;transition:background .3s,transform .2s,box-shadow .3s;}
        html[dir='rtl'] .auth-btn{letter-spacing:0;}
        .auth-btn:hover:not(:disabled){background:var(--c-accent-focus);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,102,204,.25);}
        .auth-btn:active:not(:disabled){transform:translateY(0);}
        .auth-btn:disabled{opacity:.5;cursor:default;}
        .auth-foot{margin:20px 0 0;text-align:center;font-size:14px;color:var(--c-muted);}
        .auth-foot a{font-weight:600;color:var(--c-accent);}
        .auth-foot a:hover{text-decoration:underline;}
      `}</style>

      <span className="auth-orb auth-orb-1" aria-hidden="true" />
      <span className="auth-orb auth-orb-2" aria-hidden="true" />
      <span className="auth-orb auth-orb-3" aria-hidden="true" />

      <div className="auth-card">
        <Link href="/" className="auth-brand">{brand}</Link>
        <div className="auth-head">
          <h1 className="auth-title">{heading}</h1>
          <p className="auth-sub">{subtitle}</p>
        </div>
        {children}
        <p className="auth-foot">{footer}</p>
      </div>
    </div>
  )
}
