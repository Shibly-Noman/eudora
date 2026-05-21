import assert from "node:assert/strict";
import test from "node:test";

import {
  createApiClient,
  createEducationSmokePayloads,
  runEducationSmoke
} from "./education-smoke.mjs";

test("createApiClient stores cookies and sends CSRF headers on unsafe requests", async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: "http://api.test",
    fetchImpl: async (url, init = {}) => {
      const path = new URL(url).pathname;
      calls.push({
        path,
        method: init.method ?? "GET",
        headers: Object.fromEntries(new Headers(init.headers).entries())
      });

      if (path === "/auth/login") {
        return jsonResponse(
          { success: true, data: { id: "user_1", email: "admin@example.com" } },
          {
            cookies: [
              "eudora_access_token=access-value; Path=/; HttpOnly; SameSite=Lax",
              "eudora_refresh_token=refresh-value; Path=/auth; HttpOnly; SameSite=Lax",
              "eudora_csrf_token=csrf-value; Path=/; SameSite=Lax"
            ]
          }
        );
      }

      assert.equal(path, "/campuses");
      assert.equal(init.method, "POST");
      assert.match(calls.at(-1).headers.cookie, /eudora_access_token=access-value/);
      assert.match(calls.at(-1).headers.cookie, /eudora_csrf_token=csrf-value/);
      assert.equal(calls.at(-1).headers["x-csrf-token"], "csrf-value");

      return jsonResponse({ success: true, data: { id: "campus_1" } }, { status: 201 });
    }
  });

  await client.login({ email: "admin@example.com", password: "AdminPass123!" });
  const campus = await client.post("/campuses", { code: "MAIN", name: "Main Campus" });

  assert.equal(campus.id, "campus_1");
});

test("createEducationSmokePayloads builds a realistic unique school-family bundle", () => {
  const payloads = createEducationSmokePayloads("abc123");

  assert.equal(payloads.campus.code, "SMK-ABC123");
  assert.equal(payloads.program.code, "PRIMARY-ABC123");
  assert.equal(payloads.family.family.familyCode, "FAM-ABC123");
  assert.equal(payloads.family.guardian.email, "guardian.abc123@example.edu");
  assert.equal(payloads.family.relationship.hasPortalAccess, true);
});

test("runEducationSmoke exercises staff setup, guardian login, portal update, and roster", async () => {
  const calls = [];
  const responses = {
    "POST /auth/login admin@example.com": {
      data: { id: "admin_1", email: "admin@example.com", mustChangePassword: false },
      cookies: [
        "eudora_access_token=admin-access; Path=/; HttpOnly; SameSite=Lax",
        "eudora_refresh_token=admin-refresh; Path=/auth; HttpOnly; SameSite=Lax",
        "eudora_csrf_token=admin-csrf; Path=/; SameSite=Lax"
      ]
    },
    "GET /auth/me": {
      data: {
        id: "admin_1",
        permissions: [
          "education.manageStructure",
          "families.create",
          "families.read",
          "guardians.update",
          "users.create",
          "students.read",
          "enrollments.manage"
        ]
      }
    },
    "POST /campuses": { data: { id: "campus_1" }, status: 201 },
    "POST /programs": { data: { id: "program_1" }, status: 201 },
    "POST /academic-years": { data: { id: "year_1" }, status: 201 },
    "POST /terms": { data: { id: "term_1" }, status: 201 },
    "POST /class-sections": { data: { id: "section_1" }, status: 201 },
    "POST /course-classes": { data: { id: "course_1" }, status: 201 },
    "POST /families/wizard": {
      data: {
        family: { id: "family_1", familyCode: "FAM-ABC123" },
        guardian: { id: "guardian_1", email: "guardian.abc123@example.edu" },
        student: { id: "student_1", studentNumber: "STU-ABC123" },
        primaryPlacement: { id: "placement_1" }
      },
      status: 201
    },
    "POST /guardians/guardian_1/create-login": {
      data: {
        guardianId: "guardian_1",
        userId: "guardian_user_1",
        email: "guardian.abc123@example.edu",
        temporaryPassword: "TempPass123!",
        mustChangePassword: true
      },
      status: 201
    },
    "PUT /students/student_1/primary-placement": { data: { id: "placement_2" } },
    "POST /students/student_1/course-enrollments": { data: { id: "enrollment_1" }, status: 201 },
    "GET /families/family_1": {
      data: {
        id: "family_1",
        guardians: [{ id: "guardian_1", portalStatus: "linked_portal_active" }],
        students: [{ id: "student_1" }]
      }
    },
    "GET /students/student_1": {
      data: {
        id: "student_1",
        primaryPlacements: [{ id: "placement_2" }],
        courseEnrollments: [{ id: "enrollment_1" }]
      }
    },
    "GET /class-sections/section_1/roster": {
      data: {
        id: "section_1",
        students: [{ id: "student_1" }]
      }
    },
    "POST /auth/login guardian.abc123@example.edu": {
      data: {
        id: "guardian_user_1",
        email: "guardian.abc123@example.edu",
        mustChangePassword: true
      },
      cookies: [
        "eudora_access_token=guardian-access; Path=/; HttpOnly; SameSite=Lax",
        "eudora_refresh_token=guardian-refresh; Path=/auth; HttpOnly; SameSite=Lax",
        "eudora_csrf_token=guardian-csrf; Path=/; SameSite=Lax"
      ]
    },
    "POST /auth/change-password": {
      data: {
        id: "guardian_user_1",
        email: "guardian.abc123@example.edu",
        mustChangePassword: false
      }
    },
    "GET /family-portal/me": [
      {
        data: {
          guardian: { id: "guardian_1", email: "guardian.abc123@example.edu", phone: "+1-555-0198" },
          families: [{ id: "family_1" }],
          students: [{ id: "student_1" }]
        }
      },
      {
        data: {
          guardian: { id: "guardian_1", email: "guardian.abc123@example.edu", phone: "+1-555-0199" },
          families: [{ id: "family_1" }],
          students: [{ id: "student_1" }]
        }
      }
    ],
    "PATCH /family-portal/me/contact": {
      data: {
        id: "guardian_1",
        email: "guardian.abc123@example.edu",
        phone: "+1-555-0199"
      }
    }
  };

  const routeCounts = new Map();
  const result = await runEducationSmoke({
    baseUrl: "http://api.test",
    superadminEmail: "admin@example.com",
    superadminPassword: "AdminPass123!",
    runId: "abc123",
    logger: () => {},
    fetchImpl: async (url, init = {}) => {
      const method = init.method ?? "GET";
      const path = new URL(url).pathname;
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      const key = path === "/auth/login" ? `${method} ${path} ${body.email}` : `${method} ${path}`;
      const routeCount = routeCounts.get(key) ?? 0;
      const routeResponse = responses[key];
      const response = Array.isArray(routeResponse) ? routeResponse[routeCount] : routeResponse;
      routeCounts.set(key, routeCount + 1);
      calls.push({ method, path, body, headers: Object.fromEntries(new Headers(init.headers).entries()) });

      assert.ok(response, `Unexpected request: ${key}`);
      return jsonResponse(
        { success: true, data: response.data },
        { status: response.status ?? 200, cookies: response.cookies ?? [] }
      );
    }
  });

  assert.equal(result.family.id, "family_1");
  assert.equal(result.guardianLogin.email, "guardian.abc123@example.edu");
  assert.equal(result.guardianPassword, "GuardianPass123!");
  assert.equal(result.portal.students.length, 1);
  assert.deepEqual(
    calls.map((call) => `${call.method} ${call.path}`),
    [
      "POST /auth/login",
      "GET /auth/me",
      "POST /campuses",
      "POST /programs",
      "POST /academic-years",
      "POST /terms",
      "POST /class-sections",
      "POST /course-classes",
      "POST /families/wizard",
      "POST /guardians/guardian_1/create-login",
      "PUT /students/student_1/primary-placement",
      "POST /students/student_1/course-enrollments",
      "GET /families/family_1",
      "GET /students/student_1",
      "GET /class-sections/section_1/roster",
      "POST /auth/login",
      "POST /auth/change-password",
      "GET /family-portal/me",
      "PATCH /family-portal/me/contact",
      "GET /family-portal/me"
    ]
  );
});

function jsonResponse(body, { status = 200, cookies = [] } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    headers: {
      get(name) {
        return name.toLowerCase() === "set-cookie" ? cookies.join(", ") : null;
      },
      getSetCookie() {
        return cookies;
      }
    },
    async text() {
      return JSON.stringify(body);
    }
  };
}
