export interface ApiResponse<T> {
  data: T
  meta?: ApiMeta
  error?: null
}

export interface ApiError {
  statusCode: number
  statusMessage: string
  message: string
}

export interface ApiMeta {
  total?: number
  page?: number
  perPage?: number
  nextCursor?: string | null
  prevCursor?: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: ApiMeta
}
