"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchCurrentUser } from "@/features/auth/authSlice"
import { fetchMyFamily, updateMyContact } from "@/features/familyPortal/familyPortalSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

type ContactForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const responsibilityLabels: Record<string, string> = {
  isPrimaryContact: "Primary contact",
  isEmergencyContact: "Emergency contact",
  isPickupAuthorized: "Pickup authorized",
  isBillingResponsible: "Billing responsible",
  hasPortalAccess: "Portal access",
  canApproveRequests: "Can approve requests",
}

export default function MyFamilyPage() {
  const dispatch = useAppDispatch()
  const { data, status, saving, error } = useAppSelector((state) => state.familyPortal)
  const user = useAppSelector((state) => state.auth.user)
  const canEditContact = user?.permissions.includes("familyPortal.updateContact") ?? false
  const [contact, setContact] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void dispatch(fetchMyFamily())
  }, [dispatch])

  useEffect(() => {
    if (!data) {
      return
    }

    setContact({
      firstName: data.guardian.firstName,
      lastName: data.guardian.lastName,
      email: data.guardian.email ?? "",
      phone: data.guardian.phone ?? "",
    })
  }, [data])

  async function saveContact() {
    setSaved(false)
    await dispatch(
      updateMyContact({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || null,
      })
    ).unwrap()
    setSaved(true)
    void dispatch(fetchCurrentUser())
  }

  const contactReady = Boolean(contact.firstName.trim() && contact.lastName.trim() && contact.email.trim())

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">My family</h1>
          <p className="text-muted-foreground text-sm">Family, student, placement, and guardian contact details.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void dispatch(fetchMyFamily())}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh family</span>
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {!data && !error ? <p className="text-muted-foreground text-sm">{status === "loading" ? "Loading family..." : "No family data found."}</p> : null}

      {data ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,360px)_1fr]">
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h2 className="text-base font-semibold">Guardian contact</h2>
                <p className="text-muted-foreground text-sm">
                  {data.guardian.firstName} {data.guardian.lastName}
                </p>
              </div>

              {canEditContact ? (
                <div className="grid gap-3">
                  <ContactField label="First name" value={contact.firstName} onChange={(value) => updateContact("firstName", value, setContact, setSaved)} />
                  <ContactField label="Last name" value={contact.lastName} onChange={(value) => updateContact("lastName", value, setContact, setSaved)} />
                  <ContactField label="Email" type="email" value={contact.email} onChange={(value) => updateContact("email", value, setContact, setSaved)} />
                  <ContactField label="Phone" value={contact.phone} onChange={(value) => updateContact("phone", value, setContact, setSaved)} />
                  <Button type="button" onClick={() => void saveContact()} disabled={saving || !contactReady}>
                    <Save className="size-4" />
                    Save contact
                  </Button>
                  {saved ? <p className="text-sm text-green-600">Contact details saved.</p> : null}
                </div>
              ) : (
                <div className="grid gap-1 text-sm">
                  <p>{data.guardian.email ?? "No email"}</p>
                  <p>{data.guardian.phone ?? "No phone"}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.families.map((family) => (
                <div key={family.id} className="rounded-md border p-4">
                  <h2 className="text-base font-semibold">{family.displayName}</h2>
                  <p className="text-muted-foreground text-sm">{family.familyCode}</p>
                  <p className="text-sm">{family.primaryEmail ?? family.primaryPhone ?? "No primary contact"}</p>
                </div>
              ))}
              {data.families.length === 0 ? (
                <div className="rounded-md border p-4">
                  <h2 className="text-base font-semibold">No household record</h2>
                  <p className="text-muted-foreground text-sm">Your account is active, but no household is linked yet.</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4">
            {data.students.length === 0 ? (
              <div className="rounded-md border p-4">
                <h2 className="text-base font-semibold">No linked students</h2>
                <p className="text-muted-foreground text-sm">Student access appears here after staff enables portal access.</p>
              </div>
            ) : null}

            {data.students.map((student) => (
              <div key={student.id} className="space-y-3 rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">
                        {student.firstName} {student.lastName}
                      </h2>
                      <Badge variant="secondary">{student.relationshipType}</Badge>
                      <Badge variant="outline">{student.studentNumber}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{student.status}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(student.responsibilities)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="outline">
                        {responsibilityLabels[key] ?? key}
                      </Badge>
                    ))}
                </div>
                {student.primaryPlacements.length ? (
                  student.primaryPlacements.map((placement) => (
                    <p key={placement.id} className="text-sm">
                      {placement.classSection.name} - {placement.classSection.program.name} - {placement.classSection.campus.name}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No active primary placement.</p>
                )}
                {student.courseEnrollments.length ? (
                  <div className="flex flex-wrap gap-2">
                    {student.courseEnrollments.map((enrollment) => (
                      <Badge key={enrollment.id} variant="secondary">
                        {enrollment.courseClass.code} - {enrollment.courseClass.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No active course enrollments.</p>
                )}
              </div>
            ))}
          </section>
        </>
      ) : null}
    </div>
  )
}

function ContactField({
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

function updateContact(
  key: keyof ContactForm,
  value: string,
  setContact: (updater: (current: ContactForm) => ContactForm) => void,
  setSaved: (saved: boolean) => void
) {
  setSaved(false)
  setContact((current) => ({
    ...current,
    [key]: value,
  }))
}
