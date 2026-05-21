"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchClassSections } from "@/features/education/educationSlice"
import { createFamilyWizard } from "@/features/families/familiesSlice"
import type { CreateFamilyWizardInput } from "@/features/families/familiesTypes"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

const steps = ["Household", "Guardian", "Student", "Responsibilities", "Placement", "Review"]

type WizardState = CreateFamilyWizardInput & {
  selectedClassSectionId: string
  placementStartsOn: string
}

const initialState: WizardState = {
  family: {
    familyCode: "",
    displayName: "",
    primaryEmail: "",
    primaryPhone: "",
  },
  guardian: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  },
  student: {
    studentNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  },
  relationship: {
    relationshipType: "guardian",
    isPrimaryContact: true,
    isEmergencyContact: true,
    isPickupAuthorized: false,
    isBillingResponsible: false,
    hasPortalAccess: true,
    canApproveRequests: false,
  },
  selectedClassSectionId: "none",
  placementStartsOn: new Date().toISOString().slice(0, 10),
}

export function FamilyWizard() {
  const dispatch = useAppDispatch()
  const { classSections } = useAppSelector((state) => state.education)
  const { saving, error, lastCreated } = useAppSelector((state) => state.families)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardState>(initialState)

  useEffect(() => {
    void dispatch(fetchClassSections())
  }, [dispatch])

  const selectedClassSection = useMemo(
    () => classSections.find((section) => section.id === form.selectedClassSectionId),
    [classSections, form.selectedClassSectionId]
  )

  function submitWizard() {
    const input: CreateFamilyWizardInput = {
      family: {
        familyCode: form.family.familyCode,
        displayName: form.family.displayName,
        primaryEmail: form.family.primaryEmail || null,
        primaryPhone: form.family.primaryPhone || null,
      },
      guardian: {
        firstName: form.guardian.firstName,
        lastName: form.guardian.lastName,
        email: form.guardian.email || null,
        phone: form.guardian.phone || null,
      },
      student: {
        studentNumber: form.student.studentNumber,
        firstName: form.student.firstName,
        lastName: form.student.lastName,
        dateOfBirth: form.student.dateOfBirth || null,
        gender: form.student.gender || null,
      },
      relationship: form.relationship,
      primaryPlacement: selectedClassSection
        ? {
            classSectionId: selectedClassSection.id,
            academicYearId: selectedClassSection.academicYearId,
            startsOn: form.placementStartsOn,
          }
        : undefined,
    }

    void dispatch(createFamilyWizard(input))
  }

  return (
    <div className="space-y-5 rounded-md border p-4">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <Button
            key={label}
            type="button"
            variant={index === step ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </Button>
        ))}
      </div>

      {step === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Family code" value={form.family.familyCode} onChange={(value) => setForm((current) => ({ ...current, family: { ...current.family, familyCode: value } }))} />
          <TextField label="Display name" value={form.family.displayName} onChange={(value) => setForm((current) => ({ ...current, family: { ...current.family, displayName: value } }))} />
          <TextField label="Primary email" value={form.family.primaryEmail ?? ""} onChange={(value) => setForm((current) => ({ ...current, family: { ...current.family, primaryEmail: value } }))} />
          <TextField label="Primary phone" value={form.family.primaryPhone ?? ""} onChange={(value) => setForm((current) => ({ ...current, family: { ...current.family, primaryPhone: value } }))} />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Guardian first name" value={form.guardian.firstName} onChange={(value) => setForm((current) => ({ ...current, guardian: { ...current.guardian, firstName: value } }))} />
          <TextField label="Guardian last name" value={form.guardian.lastName} onChange={(value) => setForm((current) => ({ ...current, guardian: { ...current.guardian, lastName: value } }))} />
          <TextField label="Guardian email" value={form.guardian.email ?? ""} onChange={(value) => setForm((current) => ({ ...current, guardian: { ...current.guardian, email: value } }))} />
          <TextField label="Guardian phone" value={form.guardian.phone ?? ""} onChange={(value) => setForm((current) => ({ ...current, guardian: { ...current.guardian, phone: value } }))} />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Student number" value={form.student.studentNumber} onChange={(value) => setForm((current) => ({ ...current, student: { ...current.student, studentNumber: value } }))} />
          <TextField label="Student first name" value={form.student.firstName} onChange={(value) => setForm((current) => ({ ...current, student: { ...current.student, firstName: value } }))} />
          <TextField label="Student last name" value={form.student.lastName} onChange={(value) => setForm((current) => ({ ...current, student: { ...current.student, lastName: value } }))} />
          <TextField label="Date of birth" type="date" value={form.student.dateOfBirth ?? ""} onChange={(value) => setForm((current) => ({ ...current, student: { ...current.student, dateOfBirth: value } }))} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select
              value={form.relationship.relationshipType}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, relationship: { ...current.relationship, relationshipType: value } }))
              }
            >
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
          <BooleanField label="Primary contact" checked={form.relationship.isPrimaryContact ?? false} onChange={(value) => setRelationshipFlag("isPrimaryContact", value, setForm)} />
          <BooleanField label="Emergency contact" checked={form.relationship.isEmergencyContact ?? false} onChange={(value) => setRelationshipFlag("isEmergencyContact", value, setForm)} />
          <BooleanField label="Pickup authorized" checked={form.relationship.isPickupAuthorized ?? false} onChange={(value) => setRelationshipFlag("isPickupAuthorized", value, setForm)} />
          <BooleanField label="Billing responsible" checked={form.relationship.isBillingResponsible ?? false} onChange={(value) => setRelationshipFlag("isBillingResponsible", value, setForm)} />
          <BooleanField label="Portal access" checked={form.relationship.hasPortalAccess ?? false} onChange={(value) => setRelationshipFlag("hasPortalAccess", value, setForm)} />
          <BooleanField label="Can approve requests" checked={form.relationship.canApproveRequests ?? false} onChange={(value) => setRelationshipFlag("canApproveRequests", value, setForm)} />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Primary class section</Label>
            <Select value={form.selectedClassSectionId} onValueChange={(value) => setForm((current) => ({ ...current, selectedClassSectionId: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No placement yet</SelectItem>
                {classSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.code} - {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField label="Placement starts on" type="date" value={form.placementStartsOn} onChange={(value) => setForm((current) => ({ ...current, placementStartsOn: value }))} />
        </div>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-3 text-sm">
          <ReviewRow label="Family" value={`${form.family.familyCode} - ${form.family.displayName}`} />
          <ReviewRow label="Guardian" value={`${form.guardian.firstName} ${form.guardian.lastName}`} />
          <ReviewRow label="Student" value={`${form.student.studentNumber} - ${form.student.firstName} ${form.student.lastName}`} />
          <ReviewRow label="Placement" value={selectedClassSection ? `${selectedClassSection.code} - ${selectedClassSection.name}` : "No placement"} />
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {lastCreated ? <p className="text-sm text-green-600">Created {lastCreated.family.displayName}.</p> : null}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submitWizard} disabled={saving}>
            <Check className="size-4" />
            Create family
          </Button>
        )}
      </div>
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border p-3 sm:grid-cols-[160px_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function setRelationshipFlag(
  key: keyof CreateFamilyWizardInput["relationship"],
  value: boolean,
  setForm: (updater: (current: WizardState) => WizardState) => void
) {
  setForm((current) => ({
    ...current,
    relationship: {
      ...current.relationship,
      [key]: value,
    },
  }))
}
