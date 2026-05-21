"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FamilyWizard } from "@/features/families/family-wizard"
import { fetchFamilies } from "@/features/families/familiesSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function FamiliesPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.families)

  useEffect(() => {
    void dispatch(fetchFamilies())
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Families</h1>
          <p className="text-muted-foreground text-sm">Create household records and link guardians, students, and placement.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void dispatch(fetchFamilies())}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh families</span>
        </Button>
      </div>

      <FamilyWizard />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((family) => (
                <TableRow key={family.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link className="font-medium hover:underline" href={`/families/${family.id}`}>
                        {family.displayName}
                      </Link>
                      <span className="text-muted-foreground text-sm">{family.familyCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{family.primaryEmail ?? "No email"}</span>
                      <span className="text-muted-foreground">{family.primaryPhone ?? "No phone"}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={2}>
                  {status === "loading" ? "Loading families..." : "No families found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
