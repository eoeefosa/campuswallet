import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params
  const dim = sizeParam === 'icon-192' ? 192 : 512
  const maskable = sizeParam === 'icon-maskable'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: maskable ? '#16a34a' : '#f0fdf4',
          borderRadius: maskable ? '0px' : `${dim * 0.18}px`,
          fontSize: dim * 0.55,
        }}
      >
        💰
      </div>
    ),
    { width: dim, height: dim }
  )
}
