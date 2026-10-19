import { ImageResponse } from 'next/og'
import { getAppUrl } from '@/lib/urls'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // Clamp both params so an oversized/hostile query string cannot blow up
  // the image render (values are rendered as text — React escapes them).
  const title = (searchParams.get('title') || 'PortfolioHub').slice(0, 100)
  const subtitle = (searchParams.get('subtitle') || 'ابني بورتفوليو احترافي بنفسك').slice(0, 160)
  let footerHost = 'portfolio-hub.online'
  try {
    footerHost = new URL(getAppUrl()).host
  } catch {
    // keep the default host
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0D1B3E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div style={{
          color: '#D4A017',
          fontSize: '28px',
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '2px',
        }}>
          PortfolioHub
        </div>
        <div style={{
          color: 'white',
          fontSize: '60px',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '20px',
        }}>
          {title}
        </div>
        <div style={{
          color: '#94a3b8',
          fontSize: '28px',
          textAlign: 'center',
        }}>
          {subtitle}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '40px',
          color: '#D4A017',
          fontSize: '18px',
        }}>
          {footerHost}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
