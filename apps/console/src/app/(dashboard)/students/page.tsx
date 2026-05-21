"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchStudentProfiles } from "@/features/students/studentsSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function StudentsPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.studentProfiles)

  useEffect(() => {
    void dispatch(fetchStudentProfiles())
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Students</h1>
          <p className="text-muted-foreground text-sm">Student profile records created through staff-managed workflows.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void dispatch(fetchStudentProfiles())}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh students</span>
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        <Link className="hover:underline" href={`/students/${student.id}`}>
                          {student.firstName} {student.lastName}
                        </Link>
                      </span>
                      <span className="text-muted-foreground text-sm">{student.studentNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.status ?? "active"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={2}>
                  {status === "loading" ? "Loading students..." : "No students found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
