# Eudora

Lean TypeScript full-stack monorepo scaffold using Corepack, pnpm, Turborepo, Next.js, NestJS, Prisma, PostgreSQL, and Docker Compose.

## Requirements

- Node.js 24.15.0
- Corepack
- Docker with Compose

## Setup

For the usual local development loop, run PostgreSQL in Docker and run the apps on your machine:

```bash
corepack pnpm install
corepack pnpm dev:setup
corepack pnpm dev
```

The API runs on `http://localhost:3001`, Swagger UI is available at `http://localhost:3001/docs`, and the minimal web shell runs on `http://localhost:3000`.

## Docker App Runtime

To run PostgreSQL, the API, and the web shell together in Docker:

```bash
corepack pnpm docker:start
```

Useful Docker shortcuts:

```bash
corepack pnpm docker:ps
corepack pnpm docker:logs
corepack pnpm docker:stop
```

The Docker app runtime exposes the same ports: web on `http://localhost:3000`, API health on `http://localhost:3001/health`, and Swagger UI on `http://localhost:3001/docs`.



I’m using the writing-plans skill to create the implementation plan.

**Recommended Implementation Plan**
Build this as a **thin end-to-end EducationOS slice**, not as isolated tables.

**Phase 1: Domain Schema**
Add Prisma models:

- `Campus`
- `Program`
- `AcademicYear`
- `Term`
- `ClassSection`
- `CourseClass`
- `Family`
- `GuardianProfile`
- `StudentProfile`
- `FamilyGuardian`
- `FamilyStudent`
- `GuardianStudentRelationship`
- `StudentPrimaryPlacement`
- `StudentCourseEnrollment`

Add enums:

- `EducationRecordStatus`: `active`, `inactive`, `archived`
- `StudentStatus`: `prospective`, `active`, `withdrawn`, `graduated`, `archived`
- `GuardianRelationshipType`: `mother`, `father`, `guardian`, `grandparent`, `sponsor`, `other`
- `EnrollmentStatus`: `active`, `completed`, `withdrawn`, `dropped`

Key constraints:

- Student can have optional `userId`.
- Guardian can have optional `userId`.
- One active primary placement per student per academic year.
- Multiple course enrollments allowed.

**Phase 2: Permissions**
Seed immutable permissions:

```ts
education.read
education.manageStructure

families.read
families.create
families.update

students.read
students.create
students.update

guardians.read
guardians.create
guardians.update

enrollments.read
enrollments.manage

familyPortal.read
```

Superadmin gets all. Later we can create school staff roles like `Registrar`, `Campus Admin`, `Teacher`, `Guardian`.

**Phase 3: API Modules**
Create API modules:

```text
education-structure
  campuses
  programs
  academic-years
  terms
  class-sections
  course-classes

families
  families
  guardians
  students
  guardian-student relationships

enrollments
  primary placements
  course enrollments

family-portal
  read-only guardian-scoped views
```

Initial endpoints:

```text
GET/POST/PATCH /campuses
GET/POST/PATCH /programs
GET/POST/PATCH /academic-years
GET/POST/PATCH /class-sections
GET/POST/PATCH /course-classes

GET/POST/PATCH /families
GET/POST/PATCH /guardians
GET/POST/PATCH /students

POST /families/:id/guardians
POST /families/:id/students
POST /students/:id/guardians

POST /students/:id/primary-placement
POST /students/:id/course-enrollments

GET /family-portal/me
```

**Phase 4: Admin Console**
Add dashboard navigation group: **Education**.

First admin pages:

```text
/education/campuses
/education/programs
/education/academic-years
/education/classes
/families
/students
```

Admin workflow:

1. Create campus.
2. Create program.
3. Create academic year.
4. Create class section.
5. Create family.
6. Add guardian.
7. Add student.
8. Link guardian to student with responsibility flags.
9. Assign student primary placement.
10. Optionally enroll student in course classes.

**Phase 5: Guardian Portal**
Guardian logs in using existing auth.

Read-only page:

```text
/my-family
```

Shows:

- family household info
- linked guardians
- linked students
- each student’s primary class/section
- optional course enrollments
- guardian’s own responsibility flags

Important: guardian portal endpoints must not trust frontend filters. API scopes by `request.user.id -> GuardianProfile -> relationships`.

**Phase 6: Testing**
Backend tests first:

- schema relationship behavior
- create/list/update campus/program/classes
- create family with guardians/students
- assign guardian-student responsibilities
- assign primary placement
- prevent duplicate active primary placement
- guardian portal returns only linked family data

Frontend tests:

- permission route metadata
- education navigation visibility
- slices for family/student/education structure state

**Phase 7: OpenAPI + Docker**
After backend endpoints:

```text
openapi:generate
api-client:generate
api-client:check
```

Then verify Docker:

```text
docker compose up -d --build api console
```

**Build Order I Recommend**
1. DB schema + permissions.
2. Education structure API.
3. Family/student/guardian API.
4. Enrollment API.
5. Console admin screens.
6. Guardian portal read-only screen.
7. Polish validations and search/filtering.

That order gives us usable value early without overbuilding admissions, billing, attendance, grades, or documents yet. Those become later modules once this core identity and placement layer is stable.