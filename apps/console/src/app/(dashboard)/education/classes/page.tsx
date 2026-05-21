"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchClassSections } from "@/features/education/educationSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function ClassesPage() {
  const dispatch = useAppDispatch()
  const { classSections, status, error } = useAppSelector((state) => state.education)

  useEffect(() => {
    void dispatch(fetchClassSections())
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Classes</h1>
          <p className="text-muted-foreground text-sm">Primary class sections used for student placement.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void dispatch(fetchClassSections())}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh classes</span>
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classSections.length ? (
              classSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" href={`/education/classes/${section.id}`}>
                      {section.code}
                    </Link>
                  </TableCell>
                  <TableCell>{section.name}</TableCell>
                  <TableCell>{section.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={3}>
                  {status === "loading" ? "Loading classes..." : "No classes found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
