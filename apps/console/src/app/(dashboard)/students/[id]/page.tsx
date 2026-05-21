"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, RefreshCw, Save } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchClassSections, fetchCourseClasses } from "@/features/education/educationSlice"
import { createCourseEnrollment, fetchStudentDetail, replacePrimaryPlacement, updateStudent } from "@/features/students/studentsSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

type StudentForm = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
}

const emptyStudent: StudentForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>()
  const studentId = params.id
  const dispatch = useAppDispatch()
  const { selectedStudent, status, saving, error } = useAppSelector((state) => state.studentProfiles)
  const { classSections, courseClasses } = useAppSelector((state) => state.education)
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudent)
  const [placementForm, setPlacementForm] = useState({
    classSectionId: "none",
    startsOn: new Date().toISOString().slice(0, 10),
    replaceExisting: true,
  })
  const [courseForm, setCourseForm] = useState({
    courseClassId: "none",
    enrolledOn: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (studentId) {
      void dispatch(fetchStudentDetail(studentId))
    }
    void dispatch(fetchClassSections())
    void dispatch(fetchCourseClasses())
  }, [dispatch, studentId])

  useEffect(() => {
    if (!selectedStudent) return

    setStudentForm({
      firstName: selectedStudent.firstName,
      lastName: selectedStudent.lastName,
      dateOfBirth: selectedStudent.dateOfBirth ? selectedStudent.dateOfBirth.slice(0, 10) : "",
      gender: selectedStudent.gender ?? "",
    })
  }, [selectedStudent])

  const selectedClassSection = useMemo(
    () => classSections.find((section) => section.id === placementForm.classSectionId),
    [classSections, placementForm.classSectionId]
  )

  async function saveStudent() {
    if (!selectedStudent) return

    try {
      await dispatch(
        updateStudent({
          studentId: selectedStudent.id,
          input: {
            firstName: studentForm.firstName,
            lastName: studentForm.lastName,
            dateOfBirth: studentForm.dateOfBirth || null,
            gender: studentForm.gender || null,
          },
        })
      ).unwrap()
    } catch {
      return undefined
    }
  }

  async function assignPlacement() {
    if (!selectedStudent || !selectedClassSection) return

    try {
      await dispatch(
        replacePrimaryPlacement({
          studentId: selectedStudent.id,
          input: {
            classSectionId: selectedClassSection.id,
            academicYearId: selectedClassSection.academicYearId,
            startsOn: placementForm.startsOn,
            replaceExisting: placementForm.replaceExisting,
          },
        })
      ).unwrap()
      await dispatch(fetchStudentDetail(selectedStudent.id)).unwrap()
    } catch {
      return undefined
    }
  }

  async function addCourseEnrollment() {
    if (!selectedStudent || courseForm.courseClassId === "none") return

    try {
      await dispatch(
        createCourseEnrollment({
          studentId: selectedStudent.id,
          input: {
            courseClassId: courseForm.courseClassId,
            enrolledOn: courseForm.enrolledOn,
          },
        })
      ).unwrap()
      await dispatch(fetchStudentDetail(selectedStudent.id)).unwrap()
    } catch {
      return undefined
    }
  }

  if (!selectedStudent) {
    return (
      <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
        <PageHeader onRefresh={() => studentId && void dispatch(fetchStudentDetail(studentId))} />
        <p className="text-muted-foreground text-sm">{status === "loading" ? "Loading student..." : (error ?? "Student not found.")}</p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <PageHeader onRefresh={() => void dispatch(fetchStudentDetail(selectedStudent.id))} />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField label="First name" value={studentForm.firstName} onChange={(value) => setStudentForm((current) => ({ ...current, firstName: value }))} />
          <TextField label="Last name" value={studentForm.lastName} onChange={(value) => setStudentForm((current) => ({ ...current, lastName: value }))} />
          <TextField label="Date of birth" type="date" value={studentForm.dateOfBirth} onChange={(value) => setStudentForm((current) => ({ ...current, dateOfBirth: value }))} />
          <TextField label="Gender" value={studentForm.gender} onChange={(value) => setStudentForm((current) => ({ ...current, gender: value }))} />
        </div>
        <div className="grid content-start gap-3">
          <SummaryItem label="Student number" value={selectedStudent.studentNumber} />
          <SummaryItem label="Status" value={selectedStudent.status ?? "active"} />
          <Button type="button" onClick={() => void saveStudent()} disabled={saving || !studentForm.firstName || !studentForm.lastName}>
            <Save className="size-4" />
            Save student
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border p-4">
          <h2 className="text-base font-semibold">Primary placement</h2>
          <div className="space-y-2">
            <Label>Class section</Label>
            <Select value={placementForm.classSectionId} onValueChange={(value) => setPlacementForm((current) => ({ ...current, classSectionId: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select class</SelectItem>
                {classSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.code} - {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField label="Starts on" type="date" value={placementForm.startsOn} onChange={(value) => setPlacementForm((current) => ({ ...current, startsOn: value }))} />
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Checkbox checked={placementForm.replaceExisting} onCheckedChange={(value) => setPlacementForm((current) => ({ ...current, replaceExisting: value === true }))} />
            <span>Replace active placement for the same academic year</span>
          </label>
          <Button type="button" onClick={() => void assignPlacement()} disabled={saving || !selectedClassSection}>
            <Plus className="size-4" />
            Assign placement
          </Button>
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <h2 className="text-base font-semibold">Course enrollment</h2>
          <div className="space-y-2">
            <Label>Course class</Label>
            <Select value={courseForm.courseClassId} onValueChange={(value) => setCourseForm((current) => ({ ...current, courseClassId: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select course</SelectItem>
                {courseClasses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField label="Enrolled on" type="date" value={courseForm.enrolledOn} onChange={(value) => setCourseForm((current) => ({ ...current, enrolledOn: value }))} />
          <Button type="button" onClick={() => void addCourseEnrollment()} disabled={saving || courseForm.courseClassId === "none"}>
            <Plus className="size-4" />
            Add course
          </Button>
        </div>
      </section>

      <section className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Household</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedStudent.families.map((family) => (
              <TableRow key={family.id}>
                <TableCell>
                  <Link className="font-medium hover:underline" href={`/families/${family.id}`}>
                    {family.displayName}
                  </Link>
                  <div className="text-muted-foreground text-sm">{family.familyCode}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {family.isPrimaryHousehold ? <Badge>Primary</Badge> : null}
                    {family.livesWithFamily ? <Badge variant="outline">Lives here</Badge> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guardian</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Portal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedStudent.guardians.map((relationship) => (
              <TableRow key={relationship.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {relationship.guardian.firstName} {relationship.guardian.lastName}
                    </span>
                    <span className="text-muted-foreground text-sm">{relationship.guardian.email ?? "No email"}</span>
                  </div>
                </TableCell>
                <TableCell>{relationship.relationshipType ?? "guardian"}</TableCell>
                <TableCell>{relationship.hasPortalAccess ? <Badge>Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <HistoryTable
          title="Placement history"
          empty="No placement records."
          rows={selectedStudent.primaryPlacements.map((placement) => ({
            id: placement.id,
            label: placement.classSection ? `${placement.classSection.code} - ${placement.classSection.name}` : (placement.classSectionId ?? "Class section"),
            status: placement.status,
            date: placement.startsOn,
          }))}
        />
        <HistoryTable
          title="Course enrollments"
          empty="No course enrollments."
          rows={selectedStudent.courseEnrollments.map((enrollment) => ({
            id: enrollment.id,
            label: enrollment.courseClass ? `${enrollment.courseClass.code} - ${enrollment.courseClass.name}` : (enrollment.courseClassId ?? "Course class"),
            status: enrollment.status,
            date: enrollment.enrolledOn,
          }))}
        />
      </section>
    </div>
  )
}

function PageHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Student workspace</h1>
        <p className="text-muted-foreground text-sm">Manage profile, family links, placement, and enrollments.</p>
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="size-4" />
        <span className="sr-only">Refresh student</span>
      </Button>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function HistoryTable({
  title,
  empty,
  rows,
}: {
  title: string
  empty: string
  rows: Array<{ id: string; label: string; status: string; date: string }>
}) {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-20 text-center" colSpan={3}>
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
