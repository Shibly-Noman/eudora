#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const ACCESS_TOKEN_COOKIE = "eudora_access_token";
const CSRF_TOKEN_COOKIE = "eudora_csrf_token";
const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_SUPERADMIN_EMAIL = "admin@example.com";
const DEFAULT_SUPERADMIN_PASSWORD = "AdminPass123!";
const DEFAULT_GUARDIAN_PASSWORD = "GuardianPass123!";
const REQUIRED_STAFF_PERMISSIONS = [
  "education.manageStructure",
  "families.create",
  "families.read",
  "guardians.update",
  "users.create",
  "students.read",
  "enrollments.manage"
];

export class ApiSmokeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiSmokeError";
    this.details = details;
  }
}

export function createCookieJar() {
  const cookies = new Map();

  return {
    setFromHeaders(headers) {
      for (const header of readSetCookieHeaders(headers)) {
        const firstSegment = header.split(";")[0] ?? "";
        const separatorIndex = firstSegment.indexOf("=");

        if (separatorIndex <= 0) {
          continue;
        }

        const name = firstSegment.slice(0, separatorIndex).trim();
        const value = firstSegment.slice(separatorIndex + 1).trim();

        if (name && value) {
          cookies.set(name, value);
        }
      }
    },
    header() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
    get(name) {
      return cookies.get(name);
    },
    has(name) {
      return cookies.has(name);
    }
  };
}

export function createApiClient({ baseUrl = DEFAULT_API_URL, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new ApiSmokeError("No fetch implementation is available");
  }

  const jar = createCookieJar();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  async function request(method, path, body) {
    const headers = new Headers({
      accept: "application/json"
    });
    const cookieHeader = jar.header();

    if (body !== undefined) {
      headers.set("content-type", "application/json");
    }

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    if (requiresCsrf(method)) {
      const csrfToken = jar.get(CSRF_TOKEN_COOKIE);
      if (csrfToken) {
        headers.set("x-csrf-token", csrfToken);
      }
    }

    const response = await fetchImpl(new URL(path, normalizedBaseUrl), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    jar.setFromHeaders(response.headers);

    const parsedBody = await readJsonBody(response);
    if (!response.ok) {
      throw new ApiSmokeError(`${method} ${path} failed: ${getErrorMessage(parsedBody, response.statusText)}`, {
        method,
        path,
        status: response.status,
        body: parsedBody
      });
    }

    return unwrapApiBody(parsedBody);
  }

  return {
    jar,
    get(path) {
      return request("GET", path);
    },
    post(path, body) {
      return request("POST", path, body);
    },
    put(path, body) {
      return request("PUT", path, body);
    },
    patch(path, body) {
      return request("PATCH", path, body);
    },
    login(input) {
      return request("POST", "/auth/login", input);
    },
    changePassword(input) {
      return request("POST", "/auth/change-password", input);
    }
  };
}

export function createEducationSmokePayloads(runId = createRunId()) {
  const normalizedRunId = normalizeRunId(runId);
  const upperRunId = normalizedRunId.toUpperCase();
  const guardianEmail = `guardian.${normalizedRunId}@example.edu`;

  return {
    runId: normalizedRunId,
    dates: {
      yearStartsOn: "2026-08-01",
      yearEndsOn: "2027-06-30",
      termEndsOn: "2026-12-15",
      placementStartsOn: "2026-08-01"
    },
    campus: {
      code: `SMK-${upperRunId}`,
      name: `Smoke Campus ${upperRunId}`,
      phone: "+1-555-0100",
      email: `campus.${normalizedRunId}@example.edu`
    },
    program: {
      code: `PRIMARY-${upperRunId}`,
      name: `Primary Program ${upperRunId}`,
      description: "Smoke-tested primary education program"
    },
    academicYear: {
      code: `AY-${upperRunId}`,
      name: `Academic Year ${upperRunId}`,
      startsOn: "2026-08-01",
      endsOn: "2027-06-30",
      isActive: true
    },
    term: {
      code: `T1-${upperRunId}`,
      name: `Term 1 ${upperRunId}`,
      startsOn: "2026-08-01",
      endsOn: "2026-12-15"
    },
    classSection: {
      code: `G1A-${upperRunId}`,
      name: `Grade 1 A ${upperRunId}`,
      capacity: 24
    },
    courseClass: {
      code: `LIT-${upperRunId}`,
      name: `Literacy Lab ${upperRunId}`,
      capacity: 24
    },
    family: {
      family: {
        familyCode: `FAM-${upperRunId}`,
        displayName: `Ahmed Family ${upperRunId}`,
        primaryEmail: guardianEmail,
        primaryPhone: "+1-555-0198"
      },
      guardian: {
        firstName: "Nadia",
        lastName: `Ahmed ${upperRunId}`,
        email: guardianEmail,
        phone: "+1-555-0198"
      },
      student: {
        studentNumber: `STU-${upperRunId}`,
        firstName: "Mina",
        lastName: `Ahmed ${upperRunId}`,
        dateOfBirth: "2019-04-15",
        gender: "female"
      },
      relationship: {
        relationshipType: "mother",
        isPrimaryContact: true,
        isEmergencyContact: true,
        isPickupAuthorized: true,
        isBillingResponsible: true,
        hasPortalAccess: true,
        canApproveRequests: true
      }
    },
    guardianContactUpdate: {
      phone: "+1-555-0199"
    }
  };
}

export async function runEducationSmoke({
  baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_URL,
  superadminEmail = process.env.SMOKE_SUPERADMIN_EMAIL ?? process.env.SEED_SUPERADMIN_EMAIL ?? DEFAULT_SUPERADMIN_EMAIL,
  superadminPassword = process.env.SMOKE_SUPERADMIN_PASSWORD ??
    process.env.SEED_SUPERADMIN_PASSWORD ??
    DEFAULT_SUPERADMIN_PASSWORD,
  guardianPassword = process.env.SMOKE_GUARDIAN_PASSWORD ?? DEFAULT_GUARDIAN_PASSWORD,
  runId = createRunId(),
  logger = console.log,
  fetchImpl = globalThis.fetch
} = {}) {
  const payloads = createEducationSmokePayloads(runId);
  const log = typeof logger === "function" ? logger : () => {};
  const staffClient = createApiClient({ baseUrl, fetchImpl });

  log(`education-smoke: logging in staff user ${superadminEmail}`);
  await staffClient.login({ email: superadminEmail, password: superadminPassword });
  assertCookie(staffClient.jar, ACCESS_TOKEN_COOKIE, "Staff login did not set an access-token cookie");
  assertCookie(staffClient.jar, CSRF_TOKEN_COOKIE, "Staff login did not set a CSRF cookie");

  const staffUser = await staffClient.get("/auth/me");
  ensurePermissions(staffUser.permissions, REQUIRED_STAFF_PERMISSIONS);

  log(`education-smoke: creating academic structure ${payloads.runId}`);
  const campus = await staffClient.post("/campuses", payloads.campus);
  const program = await staffClient.post("/programs", {
    ...payloads.program,
    campusId: campus.id
  });
  const academicYear = await staffClient.post("/academic-years", payloads.academicYear);
  const term = await staffClient.post("/terms", {
    ...payloads.term,
    academicYearId: academicYear.id
  });
  const classSection = await staffClient.post("/class-sections", {
    ...payloads.classSection,
    campusId: campus.id,
    programId: program.id,
    academicYearId: academicYear.id,
    termId: term.id
  });
  const courseClass = await staffClient.post("/course-classes", {
    ...payloads.courseClass,
    campusId: campus.id,
    programId: program.id,
    academicYearId: academicYear.id,
    termId: term.id
  });

  log(`education-smoke: creating family/student/guardian bundle ${payloads.family.family.familyCode}`);
  const familyBundle = await staffClient.post("/families/wizard", {
    ...payloads.family,
    primaryPlacement: {
      classSectionId: classSection.id,
      academicYearId: academicYear.id,
      startsOn: payloads.dates.placementStartsOn
    }
  });
  const guardianLogin = await staffClient.post(`/guardians/${familyBundle.guardian.id}/create-login`, {});
  const replacementPlacement = await staffClient.put(`/students/${familyBundle.student.id}/primary-placement`, {
    classSectionId: classSection.id,
    academicYearId: academicYear.id,
    startsOn: payloads.dates.placementStartsOn,
    replaceExisting: true
  });
  const courseEnrollment = await staffClient.post(`/students/${familyBundle.student.id}/course-enrollments`, {
    courseClassId: courseClass.id,
    enrolledOn: payloads.dates.placementStartsOn
  });

  const familyDetail = await staffClient.get(`/families/${familyBundle.family.id}`);
  const studentDetail = await staffClient.get(`/students/${familyBundle.student.id}`);
  const roster = await staffClient.get(`/class-sections/${classSection.id}/roster`);

  assertStudentInRoster(roster, familyBundle.student.id);
  assertStudentDetail(studentDetail, replacementPlacement.id, courseEnrollment.id);
  assertGuardianPortalLinked(familyDetail, familyBundle.guardian.id);

  log(`education-smoke: logging in guardian ${guardianLogin.email}`);
  const guardianClient = createApiClient({ baseUrl, fetchImpl });
  const guardianUser = await guardianClient.login({
    email: guardianLogin.email,
    password: guardianLogin.temporaryPassword
  });

  if (guardianUser.mustChangePassword) {
    await guardianClient.changePassword({
      currentPassword: guardianLogin.temporaryPassword,
      newPassword: guardianPassword
    });
  }

  const portalBeforeUpdate = await guardianClient.get("/family-portal/me");
  assertPortalContainsStudent(portalBeforeUpdate, familyBundle.student.id);

  const updatedContact = await guardianClient.patch("/family-portal/me/contact", payloads.guardianContactUpdate);
  const portal = await guardianClient.get("/family-portal/me");
  assertPortalContact(portal, updatedContact);

  log("education-smoke: completed");

  return {
    runId: payloads.runId,
    staffUser,
    campus,
    program,
    academicYear,
    term,
    classSection,
    courseClass,
    family: familyBundle.family,
    guardian: familyBundle.guardian,
    student: familyBundle.student,
    guardianLogin,
    guardianPassword,
    replacementPlacement,
    courseEnrollment,
    familyDetail,
    studentDetail,
    roster,
    portal,
    updatedContact
  };
}

function ensurePermissions(permissions, required) {
  if (!Array.isArray(permissions)) {
    throw new ApiSmokeError("/auth/me did not return a permissions array");
  }

  const missingPermissions = required.filter((permission) => !permissions.includes(permission));

  if (missingPermissions.length > 0) {
    throw new ApiSmokeError(`Staff user is missing required permissions: ${missingPermissions.join(", ")}`);
  }
}

function assertCookie(jar, name, message) {
  if (!jar.has(name)) {
    throw new ApiSmokeError(message);
  }
}

function assertStudentInRoster(roster, studentId) {
  if (!Array.isArray(roster?.students) || !roster.students.some((student) => student.id === studentId)) {
    throw new ApiSmokeError("Class roster did not include the smoke student", { roster, studentId });
  }
}

function assertStudentDetail(studentDetail, placementId, courseEnrollmentId) {
  const placementFound = Array.isArray(studentDetail?.primaryPlacements)
    ? studentDetail.primaryPlacements.some((placement) => placement.id === placementId)
    : false;
  const enrollmentFound = Array.isArray(studentDetail?.courseEnrollments)
    ? studentDetail.courseEnrollments.some((enrollment) => enrollment.id === courseEnrollmentId)
    : false;

  if (!placementFound || !enrollmentFound) {
    throw new ApiSmokeError("Student detail did not include expected placement and course enrollment", {
      studentDetail,
      placementId,
      courseEnrollmentId
    });
  }
}

function assertGuardianPortalLinked(familyDetail, guardianId) {
  const guardian = Array.isArray(familyDetail?.guardians)
    ? familyDetail.guardians.find((item) => item.id === guardianId)
    : undefined;

  if (!guardian || guardian.portalStatus !== "linked_portal_active") {
    throw new ApiSmokeError("Family detail did not show an active guardian portal link", {
      familyDetail,
      guardianId
    });
  }
}

function assertPortalContainsStudent(portal, studentId) {
  if (!Array.isArray(portal?.students) || !portal.students.some((student) => student.id === studentId)) {
    throw new ApiSmokeError("Guardian portal did not include the linked smoke student", { portal, studentId });
  }
}

function assertPortalContact(portal, updatedContact) {
  if (portal?.guardian?.phone !== updatedContact?.phone) {
    throw new ApiSmokeError("Guardian portal did not reflect the updated contact phone", {
      portalGuardian: portal?.guardian,
      updatedContact
    });
  }
}

function requiresCsrf(method) {
  return !new Set(["GET", "HEAD", "OPTIONS"]).has(method.toUpperCase());
}

function readSetCookieHeaders(headers) {
  if (!headers) {
    return [];
  }

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const rawHeader = typeof headers.get === "function" ? headers.get("set-cookie") : null;
  return rawHeader ? splitSetCookieHeader(rawHeader) : [];
}

function splitSetCookieHeader(header) {
  const cookies = [];
  let start = 0;

  for (let index = 0; index < header.length; index += 1) {
    if (header[index] !== ",") {
      continue;
    }

    const nextSegment = header.slice(index + 1).trimStart();
    if (/^[^=;,\s]+=/u.test(nextSegment)) {
      cookies.push(header.slice(start, index).trim());
      start = index + 1;
    }
  }

  cookies.push(header.slice(start).trim());
  return cookies.filter(Boolean);
}

async function readJsonBody(response) {
  const rawBody = typeof response.text === "function" ? await response.text() : "";

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new ApiSmokeError("API response was not valid JSON", {
      status: response.status,
      rawBody,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function unwrapApiBody(body) {
  if (body && typeof body === "object" && body.success === true && "data" in body) {
    return body.data;
  }

  return body;
}

function getErrorMessage(body, fallback) {
  if (body && typeof body === "object" && typeof body.message === "string") {
    return body.message;
  }

  return fallback || "Request failed";
}

function createRunId() {
  return `sm${Date.now().toString(36)}`;
}

function normalizeRunId(runId) {
  const value = String(runId)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "")
    .slice(0, 18);

  return value || createRunId();
}

const modulePath = fileURLToPath(import.meta.url);
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (executedPath && path.resolve(modulePath) === executedPath) {
  runEducationSmoke()
    .then((result) => {
      console.log(
        JSON.stringify(
          {
            runId: result.runId,
            campus: result.campus.code,
            family: result.family.familyCode,
            guardianLoginEmail: result.guardianLogin.email,
            guardianPassword: result.guardianPassword,
            student: result.student.studentNumber,
            classSection: result.classSection.code,
            courseClass: result.courseClass.code
          },
          null,
          2
        )
      );
    })
    .catch((error) => {
      console.error(error instanceof ApiSmokeError ? error.message : error);
      if (error instanceof ApiSmokeError && error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
      process.exitCode = 1;
    });
}
