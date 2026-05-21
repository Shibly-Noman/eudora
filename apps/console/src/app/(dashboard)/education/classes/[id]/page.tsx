"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchClassSectionRoster } from "@/features/education/educationSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function ClassRosterPage() {
  const params = useParams<{ id: string }>()
  const classSectionId = params.id
  const dispatch = useAppDispatch()
  const { selectedRoster, status, error } = useAppSelector((state) => state.education)

  useEffect(() => {
    if (classSectionId) {
      void dispatch(fetchClassSectionRoster(classSectionId))
    }
  }, [dispatch, classSectionId])

  if (!selectedRoster) {
    return (
      <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
        <PageHeader onRefresh={() => classSectionId && void dispatch(fetchClassSectionRoster(classSectionId))} />
        <p className="text-muted-foreground text-sm">{status === "loading" ? "Loading roster..." : (error ?? "Class roster not found.")}</p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <PageHeader onRefresh={() => void dispatch(fetchClassSectionRoster(selectedRoster.id))} />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="grid gap-3 rounded-md border p-4 sm:grid-cols-4">
        <SummaryItem label="Class" value={`${selectedRoster.code} - ${selectedRoster.name}`} />
        <SummaryItem label="Campus" value={selectedRoster.campus.name} />
        <SummaryItem label="Active students" value={String(selectedRoster.students.length)} />
        <SummaryItem label="Capacity" value={selectedRoster.capacity ? `${selectedRoster.students.length}/${selectedRoster.capacity}` : "Not set"} />
      </section>
      <section className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <SummaryItem label="Program" value={selectedRoster.program.name} />
        <SummaryItem label="Academic year" value={selectedRoster.academicYear.name} />
      </section>

      <section className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Guardian contacts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedRoster.students.length ? (
              selectedRoster.students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/students/${student.id}`}>
                      {student.firstName} {student.lastName}
                    </Link>
                    <div className="text-muted-foreground text-sm">{student.studentNumber}</div>
                  </TableCell>
                  <TableCell>
                    {student.family ? (
                      <Link className="hover:underline" href={`/families/${student.family.id}`}>
                        {student.family.displayName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">No primary family</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {student.guardians.map((guardian) => (
                        <div key={guardian.id} className="grid gap-1 rounded-md border px-2 py-1">
                          <Badge variant={guardian.isPrimaryContact ? "default" : "outline"}>
                            {guardian.firstName} {guardian.lastName}
                          </Badge>
                          <span className="text-muted-foreground text-xs">{guardian.email ?? guardian.phone ?? "No contact"}</span>
                        </div>
                      ))}
                      {student.guardians.length === 0 ? <span className="text-muted-foreground text-sm">No guardians</span> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={3}>
                  No active student placements.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

function PageHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Class roster</h1>
        <p className="text-muted-foreground text-sm">Active primary placements with family and guardian contact context.</p>
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="size-4" />
        <span className="sr-only">Refresh roster</span>
      </Button>
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
