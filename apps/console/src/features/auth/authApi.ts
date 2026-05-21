import type {
  ApiError,
  ApiErrorDetail,
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  PublicUser,
  SignupInput,
} from "./authTypes"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export async function login(input: LoginInput): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/login", {
    method: "POST",
    body: input,
    includeCsrf: false,
    skipAuthRefresh: true,
  })
}

export async function signup(input: SignupInput): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/signup", {
    method: "POST",
    body: input,
    includeCsrf: false,
    skipAuthRefresh: true,
  })
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me", {
    method: "GET",
    includeCsrf: false,
  })
}

export async function refreshSession(): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/refresh", {
    method: "POST",
    includeCsrf: false,
    skipAuthRefresh: true,
  })
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
    includeCsrf: true,
  })
}

export async function changePassword(input: ChangePasswordInput): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/change-password", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

type ApiFetchOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  includeCsrf: boolean
  skipAuthRefresh?: boolean
}

let refreshRequest: Promise<void> | null = null

export async function apiFetch<T>(path: string, options: ApiFetchOptions): Promise<T> {
  let response = await requestApi(path, options)

  if (response.status === 401 && shouldAttemptRefresh(path, options)) {
    await refreshAccessToken()
    response = await requestApi(path, {
      ...options,
      skipAuthRefresh: true,
    })
  }

  if (!response.ok) {
    throw ApiRequestError.from(await toApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json()) as unknown
  return isSuccessEnvelope<T>(body) ? unwrapSuccessEnvelope<T>(body) : (body as T)
}

function requestApi(path: string, options: ApiFetchOptions): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: options.method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(options.includeCsrf ? { "x-csrf-token": readCookie("eudora_csrf_token") ?? "" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

function shouldAttemptRefresh(path: string, options: ApiFetchOptions): boolean {
  return !options.skipAuthRefresh && path !== "/auth/refresh" && path !== "/auth/login" && path !== "/auth/signup"
}

async function refreshAccessToken(): Promise<void> {
  refreshRequest ??= refreshSession()
    .then(() => undefined)
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly errors?: ApiErrorDetail[],
    readonly requestId?: string
  ) {
    super(message)
    this.name = "ApiRequestError"
  }

  static from(error: ApiError): ApiRequestError {
    return new ApiRequestError(error.status, error.message, error.code, error.errors, error.requestId)
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiRequestError) {
    return toSerializableApiError(error)
  }

  if (isApiErrorLike(error)) {
    return toSerializableApiError(error)
  }

  return {
    status: 0,
    message: "Network request failed",
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = response.statusText || "Request failed"

  try {
    const body = (await response.json()) as unknown

    if (isErrorEnvelope(body)) {
      return {
        status: response.status,
        code: body.code,
        message: body.message,
        ...(body.errors ? { errors: body.errors } : {}),
        ...(body.meta?.requestId ? { requestId: body.meta.requestId } : {}),
      }
    }

    const message = getLegacyErrorMessage(body)

    return {
      status: response.status,
      message: message ?? fallback,
    }
  } catch {
    return {
      status: response.status,
      message: fallback,
    }
  }
}

function toSerializableApiError(error: ApiError): ApiError {
  return {
    status: error.status,
    message: error.message,
    ...(error.code ? { code: error.code } : {}),
    ...(error.errors ? { errors: error.errors } : {}),
    ...(error.requestId ? { requestId: error.requestId } : {}),
  }
}

type ApiSuccessEnvelope<T> = {
  success: true
  data: T
  meta?: {
    pagination?: ApiPaginationMeta
  }
}

type ApiPaginationMeta = {
  page: number
  pageSize: number
  totalItems: number
}

type ApiErrorEnvelope = {
  success: false
  code: string
  message: string
  errors?: ApiErrorDetail[]
  meta?: {
    requestId?: string
  }
}

function isSuccessEnvelope<T>(body: unknown): body is ApiSuccessEnvelope<T> {
  return isRecord(body) && body.success === true && "data" in body
}

function unwrapSuccessEnvelope<T>(body: ApiSuccessEnvelope<unknown>): T {
  const pagination = body.meta?.pagination

  if (pagination && Array.isArray(body.data)) {
    return {
      items: body.data,
      total: pagination.totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
    } as T
  }

  return body.data as T
}

function isErrorEnvelope(body: unknown): body is ApiErrorEnvelope {
  return (
    isRecord(body) &&
    body.success === false &&
    typeof body.code === "string" &&
    typeof body.message === "string" &&
    (body.errors === undefined || isApiErrorDetails(body.errors)) &&
    (body.meta === undefined || isRecord(body.meta))
  )
}

function isApiErrorLike(value: unknown): value is ApiError {
  return isRecord(value) && typeof value.status === "number" && typeof value.message === "string"
}

function isApiErrorDetails(value: unknown): value is ApiErrorDetail[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.code === "string" &&
        typeof item.message === "string" &&
        (item.field === undefined || typeof item.field === "string")
    )
  )
}

function getLegacyErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined
  }

  const message = body.message
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined
  }

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=")
}
