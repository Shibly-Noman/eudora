export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ListQuery = {
  search?: string
  page?: number
  pageSize?: number
}

export function toQueryString(query: ListQuery = {}): string {
  const params = new URLSearchParams()

  if (query.search) {
    params.set("search", query.search)
  }
  if (query.page) {
    params.set("page", String(query.page))
  }
  if (query.pageSize) {
    params.set("pageSize", String(query.pageSize))
  }

  const value = params.toString()
  return value ? `?${value}` : ""
}
