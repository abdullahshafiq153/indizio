import { NextResponse } from 'next/server'

import { loadEditorialViewer } from '@/app/_data/editorial-viewer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const viewer = await loadEditorialViewer()
  return NextResponse.json(viewer, { headers: { 'Cache-Control': 'private, no-store' } })
}
