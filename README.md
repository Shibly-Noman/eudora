# Eudora Next Phase Development Plan

This document is the working plan for the next phase of Eudora. The current education foundation already covers authentication/RBAC, education structure, families, guardians, students, enrollments, and a guardian portal. The next phase strengthens the Student module first, then builds toward learning plans, goals, rubrics, and assessment.

## Direction

Eudora should treat the student workspace as the center of academic and developmental tracking.

The domain boundaries are:

- `StudentsModule` owns student profile read/update workflows and the student workspace API.
- `FamiliesModule` owns households, guardians, and guardian-student relationships.
- `EnrollmentsModule` owns primary placement and course enrollment actions.
- Future learning-plan and assessment features attach to the student workspace.
- Rubric templates belong to a reusable template/catalog area, not directly under a student.

For now, student creation stays inside family workflows. Standalone student creation can be added later for admissions, imports, or registrar workflows.

## Phase 1: Student Module Backend Cleanup

Goal: make `StudentProfile` a first-class backend module without changing the public API routes.

Implement a dedicated `StudentsModule`:

```text
apps/api/src/students/
  students.module.ts
  students.controller.ts
  students.service.ts
  students.dto.ts
  students.service.test.ts
```

Move these routes out of the family controller:

```text
GET /students
GET /students/:id
PATCH /students/:id
```

Move these behaviors into `StudentsService`:

- list/search/paginate student profiles
- compose student detail with family links, guardian links, placement history, and course enrollments
- update core student profile fields
- record `students.updated` audit events

Keep these workflows in the family module:

- `POST /families/wizard`
- `POST /families/:id/students`
- `POST /families/:id/guardians`
- `PATCH /guardian-student-relationships/:id`

Keep these workflows in the enrollments module:

- `PUT /students/:studentId/primary-placement`
- `POST /students/:studentId/course-enrollments`

## Phase 2: Student Workspace Shape

Goal: make the student detail experience ready for learning plans and assessment.

The student workspace should be organized around tabs:

- Overview: identity, status, student number, DOB, gender
- Academic: active placement, placement history, course enrollments
- Family and Guardians: households, guardians, responsibility flags, portal access
- Learning Profile: strengths, needs, support notes, active plan summary
- Activity: student-related audit/history events

The first UI pass can keep the existing `/students/:id` route and reorganize the current page into these tabs. A separate Learning Plan page can come later when the model becomes larger.

## Phase 3: Learning Plan Foundation

Goal: add a student-centered container for individualized support and developmental tracking.

Recommended model direction:

```text
StudentLearningPlan
StudentLearningGoal
```

Rules for v1:

- one active learning plan per student
- goal progress is manually judged by staff
- Eudora can later calculate suggested progress from linked rubric item ratings
- guardians only see goal summaries that staff explicitly mark as guardian-visible
- raw notes, internal evidence, and assessment entries stay internal by default

Learning goals should support:

- title
- description
- domain or tags
- priority
- status
- staff-only notes
- guardian-visible summary
- manual progress status

## Phase 4: Rubric Template Catalog

Goal: define reusable rubric templates separately from student-assigned rubrics.

Rubric templates are reusable school assets:

```text
RubricTemplate
RubricItemTemplate
RatingScale
RatingScaleLevel
```

Rubric templates are not always under a student. They become student-specific only after assignment.

Example:

```text
RubricTemplate: Morning Routine Rubric
RubricItemTemplate:
  - Unpacks bag independently
  - Prepares desk materials
  - Starts first activity
```

When assigned to a student, Eudora copies the template into a student-owned rubric:

```text
StudentRubric
StudentRubricItem
StudentRubricProgressEntry
```

This snapshot behavior keeps each student's plan stable even if the reusable template changes later.

## Phase 5: Goals and Rubrics Integration

Goal: use Option C, where goals and rubric items are separate but linkable.

The model should support:

```text
StudentLearningGoal
StudentRubricItem
StudentRubricItemGoalLink
```

This lets one rubric item support one or more goals.

Example:

```text
Rubric item:
Uses words or signals to request help.

Linked goals:
- Improve communication
- Increase classroom independence
```

For v1:

- progress entries are recorded against rubric items
- goal progress remains manually set by staff
- linked rubric ratings provide evidence
- Eudora may later suggest goal progress from linked rubric ratings

## Phase 6: Goal and Rubric Template Assignment

Goal: let staff combine reusable goal templates and rubric templates when assigning a plan to a student.

Template assets should be reusable separately:

```text
GoalTemplateSet
GoalTemplate

RubricTemplate
RubricItemTemplate
```

When assigning to a student:

1. Staff selects one or more goal template sets.
2. Staff selects a rubric template.
3. Eudora copies goals and rubric items into the student plan.
4. Eudora suggests links by matching domains or tags.
5. Staff reviews and adjusts suggested links before saving.

This keeps templates modular and avoids forcing every learning plan template to bundle one fixed rubric.

## Phase 7: Guardian Visibility

Goal: expose helpful learning progress to guardians without leaking internal notes.

Guardian portal v1 should show goal summaries only:

```text
Goal: Build classroom independence
Summary: Mina is becoming more confident with morning routines.
Next step: Continue using a visual checklist.
```

Do not show by default:

- raw assessment evidence
- internal staff notes
- unpublished progress entries
- every rubric rating

Later, Eudora can add published report snapshots for more polished guardian communication.

## Validation Plan

Backend validation:

- `StudentsModule` routes preserve current `/students` API behavior.
- family workflows still create students.
- enrollment workflows still attach placement and course enrollment records.
- student detail still returns family, guardian, placement, and course enrollment context.
- future learning-plan tables are added only after the Student module is clean.

Frontend validation:

- existing student list and detail pages continue to work after backend extraction.
- student detail can be reorganized into tabs without changing the route.
- learning profile tab can be added before full rubric/assessment implementation.

Generation and checks:

```text
corepack pnpm --filter @eudora/api test
corepack pnpm --filter @eudora/api typecheck
corepack pnpm openapi:generate
corepack pnpm api-client:generate
corepack pnpm api-client:check
```

## Build Order

Recommended order for the next phase:

1. Extract dedicated backend `StudentsModule`.
2. Reorganize student workspace into tabs.
3. Add learning profile foundation.
4. Add learning plan and goal records.
5. Add rubric template catalog.
6. Add student-assigned rubrics.
7. Add goal-rubric links.
8. Add progress entries.
9. Add guardian-visible goal summaries.
10. Later: suggested progress calculation and published report snapshots.
