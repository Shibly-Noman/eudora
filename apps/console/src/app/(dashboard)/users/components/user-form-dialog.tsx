"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchRoles } from "@/features/rbac/rbacSlice"
import type { RoleSummary } from "@/features/rbac/rbacTypes"
import { createManagedUser } from "@/features/users/usersSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

type ManagedUserFormState = {
  name: string
  email: string
  password: string
  roleKeys: string[]
}

const emptyForm: ManagedUserFormState = {
  name: "",
  email: "",
  password: "",
  roleKeys: [],
}

export function UserFormDialog() {
  const dispatch = useAppDispatch()
  const { items: roles, status: rolesStatus } = useAppSelector((state) => state.rbac)
  const { saving, error } = useAppSelector((state) => state.users)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ManagedUserFormState>(emptyForm)

  useEffect(() => {
    if (open && rolesStatus === "idle") {
      void dispatch(fetchRoles())
    }
  }, [dispatch, open, rolesStatus])

  function toggleRole(roleKey: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      roleKeys: checked
        ? [...current.roleKeys, roleKey].sort()
        : current.roleKeys.filter((key) => key !== roleKey),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await dispatch(
        createManagedUser({
          email: form.email.trim(),
          name: form.name.trim() || undefined,
          password: form.password,
          roleKeys: form.roleKeys,
        })
      ).unwrap()
      setForm(emptyForm)
      setOpen(false)
    } catch {
      // Slice state owns the user-facing error message.
    }
  }

  const canSubmit =
    !saving &&
    form.email.trim().length > 0 &&
    form.password.length >= 12 &&
    form.roleKeys.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setForm(emptyForm)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Create managed user</DialogTitle>
            <DialogDescription>
              Managed accounts start active and must change their temporary password on first login.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="managed-user-name">Name</Label>
              <Input
                id="managed-user-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Staff User"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managed-user-email">Email</Label>
              <Input
                id="managed-user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="staff@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="managed-user-password">Temporary password</Label>
            <Input
              id="managed-user-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              minLength={12}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-md border p-3">
              {roles.length ? (
                roles.map((role) => (
                  <RoleCheckbox
                    key={role.id}
                    role={role}
                    checked={form.roleKeys.includes(role.key)}
                    onCheckedChange={toggleRole}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  {rolesStatus === "loading" ? "Loading roles..." : "No roles are available."}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Creating..." : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RoleCheckbox({
  role,
  checked,
  onCheckedChange,
}: {
  role: RoleSummary
  checked: boolean
  onCheckedChange: (roleKey: string, checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(role.key, value === true)} />
      <span className="grid gap-1 text-sm">
        <span className="font-medium">{role.name}</span>
        <span className="text-muted-foreground">{role.key}</span>
      </span>
    </label>
  )
}
