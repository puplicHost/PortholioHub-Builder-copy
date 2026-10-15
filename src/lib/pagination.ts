// Server-side pagination helper (plan AGENT-RULES: page, pageSize<=100, meta).
export const MAX_PAGE_SIZE = 100
export const DEFAULT_PAGE_SIZE = 20

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function parsePagination(searchParams: URLSearchParams): { page: number; pageSize: number; skip: number; take: number } {
  const rawPage = Number(searchParams.get('page') || '1')
  const rawSize = Number(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE))
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const pageSize = Number.isFinite(rawSize) && rawSize > 0
    ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function buildMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
