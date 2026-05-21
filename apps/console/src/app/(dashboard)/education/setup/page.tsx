"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createAcademicYear,
  createCampus,
  createClassSection,
  createProgram,
  fetchAcademicYears,
  fetchCampuses,
  fetchClassSections,
  fetchPrograms,
} from "@/features/education/educationSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function EducationSetupPage() {
  const dispatch = useAppDispatch()
  const { campuses, programs, academicYears, classSections, saving, error } = useAppSelector((state) => state.education)
  const [campus, setCampus] = useState({ code: "", name: "" })
  const [program, setProgram] = useState({ campusId: "", code: "", name: "" })
  const [academicYear, setAcademicYear] = useState({ code: "", name: "", startsOn: "", endsOn: "" })
  const [section, setSection] = useState({ campusId: "", programId: "", academicYearId: "", code: "", name: "" })

  useEffect(() => {
    refreshAll(dispatch)
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-5 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Education setup</h1>
          <p className="text-muted-foreground text-sm">Create the minimum academic structure needed before placing students.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refreshAll(dispatch)}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh setup data</span>
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SetupPanel
          title="Campus"
          onSubmit={() => {
            void dispatch(createCampus(campus))
            setCampus({ code: "", name: "" })
          }}
          disabled={saving || !campus.code || !campus.name}
        >
          <TextField label="Code" value={campus.code} onChange={(value) => setCampus((current) => ({ ...current, code: value }))} />
          <TextField label="Name" value={campus.name} onChange={(value) => setCampus((current) => ({ ...current, name: value }))} />
        </SetupPanel>

        <SetupPanel
          title="Program"
          onSubmit={() => {
            void dispatch(createProgram(program))
            setProgram({ campusId: "", code: "", name: "" })
          }}
          disabled={saving || !program.campusId || !program.code || !program.name}
        >
          <SelectField
            label="Campus"
            value={program.campusId}
            placeholder="Select campus"
            items={campuses.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
            onChange={(value) => setProgram((current) => ({ ...current, campusId: value }))}
          />
          <TextField label="Code" value={program.code} onChange={(value) => setProgram((current) => ({ ...current, code: value }))} />
          <TextField label="Name" value={program.name} onChange={(value) => setProgram((current) => ({ ...current, name: value }))} />
        </SetupPanel>

        <SetupPanel
          title="Academic year"
          onSubmit={() => {
            void dispatch(createAcademicYear(academicYear))
            setAcademicYear({ code: "", name: "", startsOn: "", endsOn: "" })
          }}
          disabled={saving || !academicYear.code || !academicYear.name || !academicYear.startsOn || !academicYear.endsOn}
        >
          <TextField label="Code" value={academicYear.code} onChange={(value) => setAcademicYear((current) => ({ ...current, code: value }))} />
          <TextField label="Name" value={academicYear.name} onChange={(value) => setAcademicYear((current) => ({ ...current, name: value }))} />
          <TextField label="Starts on" type="date" value={academicYear.startsOn} onChange={(value) => setAcademicYear((current) => ({ ...current, startsOn: value }))} />
          <TextField label="Ends on" type="date" value={academicYear.endsOn} onChange={(value) => setAcademicYear((current) => ({ ...current, endsOn: value }))} />
        </SetupPanel>

        <SetupPanel
          title="Class section"
          onSubmit={() => {
            void dispatch(createClassSection(section))
            setSection({ campusId: "", programId: "", academicYearId: "", code: "", name: "" })
          }}
          disabled={saving || !section.campusId || !section.programId || !section.academicYearId || !section.code || !section.name}
        >
          <SelectField
            label="Campus"
            value={section.campusId}
            placeholder="Select campus"
            items={campuses.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
            onChange={(value) => setSection((current) => ({ ...current, campusId: value }))}
          />
          <SelectField
            label="Program"
            value={section.programId}
            placeholder="Select program"
            items={programs.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
            onChange={(value) => setSection((current) => ({ ...current, programId: value }))}
          />
          <SelectField
            label="Academic year"
            value={section.academicYearId}
            placeholder="Select academic year"
            items={academicYears.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
            onChange={(value) => setSection((current) => ({ ...current, academicYearId: value }))}
          />
          <TextField label="Code" value={section.code} onChange={(value) => setSection((current) => ({ ...current, code: value }))} />
          <TextField label="Name" value={section.name} onChange={(value) => setSection((current) => ({ ...current, name: value }))} />
        </SetupPanel>
      </div>

      <p className="text-muted-foreground text-sm">
        Current setup: {campuses.length} campuses, {programs.length} programs, {academicYears.length} academic years, {classSections.length} sections.
      </p>
    </div>
  )
}

function refreshAll(dispatch: ReturnType<typeof useAppDispatch>) {
  void dispatch(fetchCampuses())
  void dispatch(fetchPrograms())
  void dispatch(fetchAcademicYears())
  void dispatch(fetchClassSections())
}

function SetupPanel({ title, children, onSubmit, disabled }: { title: string; children: React.ReactNode; onSubmit: () => void; disabled: boolean }) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <Button type="button" onClick={onSubmit} disabled={disabled}>
        <Plus className="size-4" />
        Create {title.toLowerCase()}
      </Button>
    </div>
  )
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function SelectField({
  label,
  value,
  placeholder,
  items,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  items: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
