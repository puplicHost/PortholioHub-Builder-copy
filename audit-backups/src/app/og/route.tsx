import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'PortfolioHub'
  const subtitle = searchParams.get('subtitle') ?? 'ابني بورتفوليو احترافي بنفسك'

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
          portholiohub.pages.dev
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
