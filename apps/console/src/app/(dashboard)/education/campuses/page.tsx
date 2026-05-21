"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchCampuses } from "@/features/education/educationSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function CampusesPage() {
  const dispatch = useAppDispatch()
  const { campuses, status, error } = useAppSelector((state) => state.education)

  useEffect(() => {
    void dispatch(fetchCampuses())
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Campuses</h1>
          <p className="text-muted-foreground text-sm">Browse school branches and locations.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void dispatch(fetchCampuses())}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh campuses</span>
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
            {campuses.length ? (
              campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell className="font-medium">{campus.code}</TableCell>
                  <TableCell>{campus.name}</TableCell>
                  <TableCell>{campus.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={3}>
                  {status === "loading" ? "Loading campuses..." : "No campuses found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
