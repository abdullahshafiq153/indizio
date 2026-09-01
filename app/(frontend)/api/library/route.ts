import { NextRequest, NextResponse } from 'next/server'

import { loadPublicLibraryPage } from '@/app/_data/load-library-data'

export const revalidate = 300

function list(value: string | null) {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) || []
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const requestedSort = params.get('sort')
  const sort: 'featured' | 'az' | 'newest' = requestedSort === 'az' || requestedSort === 'newest' ? requestedSort : 'featured'
  const result = await loadPublicLibraryPage({
    page: Number(params.get('page') || 1),
    limit: Number(params.get('limit') || 12),
    query: params.get('query') || '',
    industries: list(params.get('industries')),
    tags: list(params.get('tags')),
    sort,
    websiteIDs: list(params.get('websiteIDs')),
  })

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' },
  })
}
