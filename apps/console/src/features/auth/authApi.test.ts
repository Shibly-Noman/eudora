import { afterEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "./authApi"

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("unwraps successful API envelope responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            code: "REQUEST_SUCCESS",
            message: "Request successful",
            data: { id: "user_1", email: "person@example.com" },
            meta: {
              requestId: "req_1",
              timestamp: "2026-05-21T00:00:00.000Z",
              version: "v1",
              path: "/auth/me",
              method: "GET",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    )

    await expect(
      apiFetch<{ id: string; email: string }>("/auth/me", {
        method: "GET",
        includeCsrf: false,
      })
    ).resolves.toEqual({ id: "user_1", email: "person@example.com" })
  })

  it("normalizes paginated API envelope responses to list helpers' expected shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            code: "REQUEST_SUCCESS",
            message: "Request successful",
            data: [{ id: "campus_1", code: "MAIN" }],
            meta: {
              requestId: "req_campuses",
              timestamp: "2026-05-21T00:00:00.000Z",
              version: "v1",
              path: "/campuses",
              method: "GET",
              pagination: {
                page: 2,
                pageSize: 10,
                totalItems: 21,
                totalPages: 3,
                hasNext: true,
                hasPrev: true,
              },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    )

    await expect(
      apiFetch<{ items: Array<{ id: string; code: string }>; total: number; page: number; pageSize: number }>("/campuses", {
        method: "GET",
        includeCsrf: false,
      })
    ).resolves.toEqual({
      items: [{ id: "campus_1", code: "MAIN" }],
      total: 21,
      page: 2,
      pageSize: 10,
    })
  })

  it("keeps backward compatibility with raw JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "user_1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    )

    await expect(
      apiFetch<{ id: string }>("/health", {
        method: "GET",
        includeCsrf: false,
      })
    ).resolves.toEqual({ id: "user_1" })
  })

  it("maps API envelope errors to ApiRequestError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            code: "FORBIDDEN",
            message: "Missing required permission",
            errors: [{ code: "FORBIDDEN", message: "Missing required permission" }],
            meta: {
              requestId: "req_forbidden",
              timestamp: "2026-05-21T00:00:00.000Z",
              version: "v1",
              path: "/users",
              method: "GET",
            },
          }),
          { status: 403, headers: { "content-type": "application/json" } }
        )
      )
    )

    await expect(
      apiFetch("/users", {
        method: "GET",
        includeCsrf: false,
      })
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "Missing required permission",
      requestId: "req_forbidden",
    })
  })

  it("refreshes once and retries concurrent requests after 401 responses", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = requestPath(input)
      const callCountForPath = fetchMock.mock.calls.filter(([calledInput]) => {
        return requestPath(calledInput) === path
      }).length

      if (path === "/auth/refresh") {
        return jsonResponse({
          success: true,
          code: "REQUEST_SUCCESS",
          message: "Request successful",
          data: { id: "user_1" },
          meta: {
            requestId: "req_refresh",
            timestamp: "2026-05-21T00:00:00.000Z",
            version: "v1",
            path: "/auth/refresh",
            method: "POST",
          },
        })
      }

      if (callCountForPath === 1) {
        return jsonResponse(
          {
            success: false,
            code: "UNAUTHORIZED",
            message: "Token expired",
            meta: {
              requestId: `req_${path}`,
              timestamp: "2026-05-21T00:00:00.000Z",
              version: "v1",
              path,
              method: "GET",
            },
          },
          401
        )
      }

      return jsonResponse({
        success: true,
        code: "REQUEST_SUCCESS",
        message: "Request successful",
        data: { path, recovered: true },
        meta: {
          requestId: `req_retry_${path}`,
          timestamp: "2026-05-21T00:00:00.000Z",
          version: "v1",
          path,
          method: "GET",
        },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      Promise.all([
        apiFetch<{ path: string; recovered: boolean }>("/users", {
          method: "GET",
          includeCsrf: false,
        }),
        apiFetch<{ path: string; recovered: boolean }>("/families", {
          method: "GET",
          includeCsrf: false,
        }),
      ])
    ).resolves.toEqual([
      { path: "/users", recovered: true },
      { path: "/families", recovered: true },
    ])

    const refreshCalls = fetchMock.mock.calls.filter(([input]) => requestPath(input) === "/auth/refresh")
    expect(refreshCalls).toHaveLength(1)
  })

  it("does not recursively refresh the refresh endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Refresh session is not active",
          meta: {
            requestId: "req_refresh_failed",
            timestamp: "2026-05-21T00:00:00.000Z",
            version: "v1",
            path: "/auth/refresh",
            method: "POST",
          },
        },
        401
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      apiFetch("/auth/refresh", {
        method: "POST",
        includeCsrf: false,
        skipAuthRefresh: true,
      })
    ).rejects.toMatchObject({
      status: 401,
      message: "Refresh session is not active",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns undefined for empty 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(
      apiFetch<void>("/auth/logout", {
        method: "POST",
        includeCsrf: true,
      })
    ).resolves.toBeUndefined()
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function requestPath(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return new URL(input).pathname
  }

  if (input instanceof URL) {
    return input.pathname
  }

  return new URL(input.url).pathname
}
