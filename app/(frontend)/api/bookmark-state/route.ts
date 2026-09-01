import { NextResponse } from 'next/server'

import { loadMemberLibraryState } from '@/app/_data/load-library-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = await loadMemberLibraryState()
  return NextResponse.json(state, { headers: { 'Cache-Control': 'private, no-store' } })
}
