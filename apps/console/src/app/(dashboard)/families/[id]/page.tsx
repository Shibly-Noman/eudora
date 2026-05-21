"use client"

import { useEffect, useState } from "react"
import { KeyRound, LinkIcon, Plus, RefreshCw, Save } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  addGuardianToFamily,
  addStudentToFamily,
  createGuardianLogin,
  fetchFamilyDetail,
  linkGuardianUser,
  updateFamily,
  updateRelationship,
} from "@/features/families/familiesSlice"
import type { UpdateRelationshipInput } from "@/features/families/familiesTypes"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

type HouseholdForm = {
  displayName: string
  primaryEmail: string
  primaryPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  status: string
}

type RelationshipForm = {
  relationshipType: string
  isPrimaryContact: boolean
  isEmergencyContact: boolean
  isPickupAuthorized: boolean
  isBillingResponsible: boolean
  hasPortalAccess: boolean
  canApproveRequests: boolean
}

const emptyHousehold: HouseholdForm = {
  displayName: "",
  primaryEmail: "",
  primaryPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  status: "active",
}

const defaultRelationship: RelationshipForm = {
  relationshipType: "guardian",
  isPrimaryContact: false,
  isEmergencyContact: false,
  isPickupAuthorized: false,
  isBillingResponsible: false,
  hasPortalAccess: false,
  canApproveRequests: false,
}

const relationshipActions: Array<{ key: keyof UpdateRelationshipInput; label: string }> = [
  { key: "hasPortalAccess", label: "Portal" },
  { key: "isPrimaryContact", label: "Primary" },
  { key: "isEmergencyContact", label: "Emergency" },
  { key: "isPickupAuthorized", label: "Pickup" },
  { key: "isBillingResponsible", label: "Billing" },
  { key: "canApproveRequests", label: "Approver" },
]

export default function FamilyDetailPage() {
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const dispatch = useAppDispatch()
  const { selectedFamily, lastGuardianLogin, status, saving, error } = useAppSelector((state) => state.families)
  const [userIds, setUserIds] = useState<Record<string, string>>({})
  const [household, setHousehold] = useState<HouseholdForm>(emptyHousehold)
  const [guardian, setGuardian] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isPrimary: false,
    studentId: "none",
    relationship: defaultRelationship,
  })
  const [student, setStudent] = useState({
    studentNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    isPrimaryHousehold: false,
    livesWithFamily: false,
    guardianId: "none",
    relationship: defaultRelationship,
  })

  useEffect(() => {
    if (familyId) {
      void dispatch(fetchFamilyDetail(familyId))
    }
  }, [dispatch, familyId])

  useEffect(() => {
    if (!selectedFamily) return

    setHousehold({
      displayName: selectedFamily.displayName,
      primaryEmail: selectedFamily.primaryEmail ?? "",
      primaryPhone: selectedFamily.primaryPhone ?? "",
      addressLine1: selectedFamily.addressLine1 ?? "",
      addressLine2: selectedFamily.addressLine2 ?? "",
      city: selectedFamily.city ?? "",
      state: selectedFamily.state ?? "",
      postalCode: selectedFamily.postalCode ?? "",
      country: selectedFamily.country ?? "",
      status: selectedFamily.status ?? "active",
    })
  }, [selectedFamily])

  async function saveHousehold() {
    if (!selectedFamily) return

    try {
      await dispatch(
        updateFamily({
          familyId: selectedFamily.id,
          input: {
            displayName: household.displayName,
            primaryEmail: household.primaryEmail || null,
            primaryPhone: household.primaryPhone || null,
            addressLine1: household.addressLine1 || null,
            addressLine2: household.addressLine2 || null,
            city: household.city || null,
            state: household.state || null,
            postalCode: household.postalCode || null,
            country: household.country || null,
            status: household.status,
          },
        })
      ).unwrap()
    } catch {
      return undefined
    }
  }

  async function createGuardian() {
    if (!selectedFamily) return

    try {
      await dispatch(
        addGuardianToFamily({
          familyId: selectedFamily.id,
          input: {
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            email: guardian.email || null,
            phone: guardian.phone || null,
            isPrimary: guardian.isPrimary,
            studentRelationships:
              guardian.studentId === "none" ? [] : [{ ...guardian.relationship, studentId: guardian.studentId }],
          },
        })
      ).unwrap()
      setGuardian({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        isPrimary: false,
        studentId: "none",
        relationship: defaultRelationship,
      })
      await dispatch(fetchFamilyDetail(selectedFamily.id)).unwrap()
    } catch {
      return undefined
    }
  }

  async function createStudent() {
    if (!selectedFamily) return

    try {
      await dispatch(
        addStudentToFamily({
          familyId: selectedFamily.id,
          input: {
            studentNumber: student.studentNumber,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth || null,
            gender: student.gender || null,
            isPrimaryHousehold: student.isPrimaryHousehold,
            livesWithFamily: student.livesWithFamily,
            guardianRelationships:
              student.guardianId === "none" ? [] : [{ ...student.relationship, guardianId: student.guardianId }],
          },
        })
      ).unwrap()
      setStudent({
        studentNumber: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        isPrimaryHousehold: false,
        livesWithFamily: false,
        guardianId: "none",
        relationship: defaultRelationship,
      })
      await dispatch(fetchFamilyDetail(selectedFamily.id)).unwrap()
    } catch {
      return undefined
    }
  }

  if (!selectedFamily) {
    return (
      <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
        <PageHeader onRefresh={() => familyId && void dispatch(fetchFamilyDetail(familyId))} />
        <p className="text-muted-foreground text-sm">{status === "loading" ? "Loading family..." : (error ?? "Family not found.")}</p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <PageHeader onRefresh={() => void dispatch(fetchFamilyDetail(selectedFamily.id))} />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1fr_240px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Display name" value={household.displayName} onChange={(value) => setHousehold((current) => ({ ...current, displayName: value }))} />
          <TextField label="Primary email" value={household.primaryEmail} onChange={(value) => setHousehold((current) => ({ ...current, primaryEmail: value }))} />
          <TextField label="Primary phone" value={household.primaryPhone} onChange={(value) => setHousehold((current) => ({ ...current, primaryPhone: value }))} />
          <TextField label="Address line 1" value={household.addressLine1} onChange={(value) => setHousehold((current) => ({ ...current, addressLine1: value }))} />
          <TextField label="Address line 2" value={household.addressLine2} onChange={(value) => setHousehold((current) => ({ ...current, addressLine2: value }))} />
          <TextField label="City" value={household.city} onChange={(value) => setHousehold((current) => ({ ...current, city: value }))} />
          <TextField label="State" value={household.state} onChange={(value) => setHousehold((current) => ({ ...current, state: value }))} />
          <TextField label="Postal code" value={household.postalCode} onChange={(value) => setHousehold((current) => ({ ...current, postalCode: value }))} />
          <TextField label="Country" value={household.country} onChange={(value) => setHousehold((current) => ({ ...current, country: value }))} />
        </div>
        <div className="grid content-start gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={household.status} onValueChange={(value) => setHousehold((current) => ({ ...current, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={() => void saveHousehold()} disabled={saving || !household.displayName.trim()}>
            <Save className="size-4" />
            Save household
          </Button>
        </div>
      </section>

      {lastGuardianLogin ? (
        <section className="rounded-md border border-green-600/40 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4" />
            Temporary guardian credentials
          </div>
          <p className="mt-2 text-sm">{lastGuardianLogin.email}</p>
          <code className="mt-2 block rounded-sm bg-muted px-2 py-1 text-sm">{lastGuardianLogin.temporaryPassword}</code>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border p-4">
          <h2 className="text-base font-semibold">Add guardian</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="First name" value={guardian.firstName} onChange={(value) => setGuardian((current) => ({ ...current, firstName: value }))} />
            <TextField label="Last name" value={guardian.lastName} onChange={(value) => setGuardian((current) => ({ ...current, lastName: value }))} />
            <TextField label="Email" value={guardian.email} onChange={(value) => setGuardian((current) => ({ ...current, email: value }))} />
            <TextField label="Phone" value={guardian.phone} onChange={(value) => setGuardian((current) => ({ ...current, phone: value }))} />
          </div>
          <BooleanField label="Primary household guardian" checked={guardian.isPrimary} onChange={(value) => setGuardian((current) => ({ ...current, isPrimary: value }))} />
          <RelationshipSelector
            label="Student link"
            value={guardian.studentId}
            options={selectedFamily.students.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))}
            relationship={guardian.relationship}
            onValueChange={(value) => setGuardian((current) => ({ ...current, studentId: value }))}
            onRelationshipChange={(relationship) => setGuardian((current) => ({ ...current, relationship }))}
          />
          <Button type="button" onClick={() => void createGuardian()} disabled={saving || !guardian.firstName || !guardian.lastName}>
            <Plus className="size-4" />
            Add guardian
          </Button>
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <h2 className="text-base font-semibold">Add student</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Student number" value={student.studentNumber} onChange={(value) => setStudent((current) => ({ ...current, studentNumber: value }))} />
            <TextField label="First name" value={student.firstName} onChange={(value) => setStudent((current) => ({ ...current, firstName: value }))} />
            <TextField label="Last name" value={student.lastName} onChange={(value) => setStudent((current) => ({ ...current, lastName: value }))} />
            <TextField label="Date of birth" type="date" value={student.dateOfBirth} onChange={(value) => setStudent((current) => ({ ...current, dateOfBirth: value }))} />
            <TextField label="Gender" value={student.gender} onChange={(value) => setStudent((current) => ({ ...current, gender: value }))} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <BooleanField label="Primary household" checked={student.isPrimaryHousehold} onChange={(value) => setStudent((current) => ({ ...current, isPrimaryHousehold: value }))} />
            <BooleanField label="Lives with family" checked={student.livesWithFamily} onChange={(value) => setStudent((current) => ({ ...current, livesWithFamily: value }))} />
          </div>
          <RelationshipSelector
            label="Guardian link"
            value={student.guardianId}
            options={selectedFamily.guardians.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))}
            relationship={student.relationship}
            onValueChange={(value) => setStudent((current) => ({ ...current, guardianId: value }))}
            onRelationshipChange={(relationship) => setStudent((current) => ({ ...current, relationship }))}
          />
          <Button type="button" onClick={() => void createStudent()} disabled={saving || !student.studentNumber || !student.firstName || !student.lastName}>
            <Plus className="size-4" />
            Add student
          </Button>
        </div>
      </section>

      <section className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guardian</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Relationships</TableHead>
              <TableHead className="w-[360px]">Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedFamily.guardians.map((familyGuardian) => (
              <TableRow key={familyGuardian.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {familyGuardian.firstName} {familyGuardian.lastName}
                    </span>
                    <span className="text-muted-foreground text-sm">{familyGuardian.email ?? "Email required for login"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PortalBadge status={familyGuardian.portalStatus} />
                </TableCell>
                <TableCell>
                  <div className="grid gap-2">
                    {familyGuardian.relationships.map((relationship) => (
                      <div key={relationship.id} className="grid gap-2 rounded-md border p-2">
                        <span className="text-sm font-medium">{relationship.studentName ?? relationship.studentId}</span>
                        <div className="flex flex-wrap gap-1">
                          {relationshipActions.map((action) => {
                            const enabled = Boolean(relationship[action.key])
                            return (
                              <Button
                                key={action.key}
                                type="button"
                                size="sm"
                                variant={enabled ? "secondary" : "outline"}
                                onClick={() => void dispatch(updateRelationship({ id: relationship.id, input: { [action.key]: !enabled } }))}
                              >
                                {action.label}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {familyGuardian.relationships.length === 0 ? <span className="text-muted-foreground text-sm">No student links</span> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={saving || Boolean(familyGuardian.userId) || !familyGuardian.email}
                      onClick={() => void dispatch(createGuardianLogin(familyGuardian.id))}
                    >
                      <KeyRound className="size-4" />
                      Create login
                    </Button>
                    <div className="flex min-w-48 gap-2">
                      <Input
                        value={userIds[familyGuardian.id] ?? ""}
                        placeholder="Existing user ID"
                        onChange={(event) => setUserIds((current) => ({ ...current, [familyGuardian.id]: event.target.value }))}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={saving || Boolean(familyGuardian.userId) || !userIds[familyGuardian.id]}
                        onClick={() => void dispatch(linkGuardianUser({ guardianId: familyGuardian.id, userId: userIds[familyGuardian.id] ?? "" }))}
                      >
                        <LinkIcon className="size-4" />
                        <span className="sr-only">Link user</span>
                      </Button>
                    </div>
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
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Guardians</TableHead>
              <TableHead>Academic</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedFamily.students.map((familyStudent) => (
              <TableRow key={familyStudent.id}>
                <TableCell>
                  <Link className="font-medium hover:underline" href={`/students/${familyStudent.id}`}>
                    {familyStudent.firstName} {familyStudent.lastName}
                  </Link>
                  <div className="text-muted-foreground text-sm">{familyStudent.studentNumber}</div>
                </TableCell>
                <TableCell>{familyStudent.status ?? "active"}</TableCell>
                <TableCell>{familyStudent.guardians.length}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{familyStudent.primaryPlacements.length} placements</Badge>
                    <Badge variant="outline">{familyStudent.courseEnrollments.length} courses</Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-md border p-4">
        <h2 className="text-base font-semibold">Activity</h2>
        <div className="mt-3 grid gap-2">
          {selectedFamily.activity.length ? (
            selectedFamily.activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{item.event}</span>
                <span className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No family activity yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function PageHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Family workspace</h1>
        <p className="text-muted-foreground text-sm">Manage household links, portal readiness, and guardian access.</p>
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="size-4" />
        <span className="sr-only">Refresh family</span>
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

function BooleanField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{label}</span>
    </label>
  )
}

function RelationshipSelector({
  label,
  value,
  options,
  relationship,
  onValueChange,
  onRelationshipChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  relationship: RelationshipForm
  onValueChange: (value: string) => void
  onRelationshipChange: (relationship: RelationshipForm) => void
}) {
  return (
    <div className="grid gap-3">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No link yet</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value !== "none" ? (
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={relationship.relationshipType} onValueChange={(relationshipType) => onRelationshipChange({ ...relationship, relationshipType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="grandparent">Grandparent</SelectItem>
                <SelectItem value="sponsor">Sponsor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {relationshipActions.map((action) => (
              <BooleanField
                key={action.key}
                label={action.label}
                checked={Boolean(relationship[action.key])}
                onChange={(checked) => onRelationshipChange({ ...relationship, [action.key]: checked })}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PortalBadge({ status }: { status: "not_linked" | "linked_portal_disabled" | "linked_portal_active" }) {
  if (status === "linked_portal_active") {
    return <Badge>Active</Badge>
  }

  if (status === "linked_portal_disabled") {
    return <Badge variant="secondary">Linked</Badge>
  }

  return <Badge variant="outline">Not linked</Badge>
}
