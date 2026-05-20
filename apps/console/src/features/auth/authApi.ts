import type {
  ApiError,
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
  })
}

export async function signup(input: SignupInput): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/signup", {
    method: "POST",
    body: input,
    includeCsrf: false,
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
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(options.includeCsrf ? { "x-csrf-token": readCookie("eudora_csrf_token") ?? "" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw ApiRequestError.from(await toApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiRequestError"
  }

  static from(error: ApiError): ApiRequestError {
    return new ApiRequestError(error.status, error.message)
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = response.statusText || "Request failed"

  try {
    const body = (await response.json()) as { message?: string | string[] }
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message

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
