"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Pencil, Plus, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PermissionGate } from "@/features/auth/PermissionGate"
import { createRole, fetchPermissions, fetchRoles, updateRole } from "@/features/rbac/rbacSlice"
import type { PermissionSummary, RoleSummary } from "@/features/rbac/rbacTypes"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

type RoleFormState = {
  key: string
  name: string
  description: string
  permissionKeys: string[]
}

type RoleSubmitInput = {
  key: string
  name: string
  description: string | null
  permissionKeys: string[]
}

const emptyForm: RoleFormState = {
  key: "",
  name: "",
  description: "",
  permissionKeys: [],
}

export default function RolesPage() {
  const dispatch = useAppDispatch()
  const { items, permissions, status, permissionsStatus, saving, error } = useAppSelector((state) => state.rbac)

  useEffect(() => {
    void dispatch(fetchRoles())
    void dispatch(fetchPermissions())
  }, [dispatch])

  return (
    <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Roles</h1>
          <p className="text-muted-foreground text-sm">Create role profiles and choose their system permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              void dispatch(fetchRoles())
              void dispatch(fetchPermissions())
            }}
            disabled={status === "loading" || permissionsStatus === "loading"}
          >
            <RefreshCw className="size-4" />
            <span className="sr-only">Refresh roles</span>
          </Button>
          <PermissionGate permissions={["roles.create"]}>
            <RoleDialog
              permissions={permissions}
              saving={saving}
              onSubmit={(input) => void dispatch(createRole(input))}
            />
          </PermissionGate>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
                      </div>
                      <span className="text-muted-foreground text-sm">{role.key}</span>
                      {role.description ? (
                        <span className="text-muted-foreground text-sm">{role.description}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PermissionBadges permissionKeys={role.permissionKeys} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <PermissionGate permissions={["roles.update"]}>
                        <RoleDialog
                          role={role}
                          permissions={permissions}
                          saving={saving}
                          onSubmit={(input) =>
                            void dispatch(
                              updateRole({
                                id: role.id,
                                input: {
                                  name: input.name,
                                  description: input.description,
                                  permissionKeys: input.permissionKeys,
                                },
                              })
                            )
                          }
                        />
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={3}>
                  {status === "loading" ? "Loading roles..." : "No roles found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RoleDialog({
  role,
  permissions,
  saving,
  onSubmit,
}: {
  role?: RoleSummary
  permissions: PermissionSummary[]
  saving: boolean
  onSubmit: (input: RoleSubmitInput) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RoleFormState>(emptyForm)
  const isEditing = Boolean(role)

  useEffect(() => {
    if (!open) {
      return
    }

    setForm(
      role
        ? {
            key: role.key,
            name: role.name,
            description: role.description ?? "",
            permissionKeys: role.permissionKeys,
          }
        : emptyForm
    )
  }, [open, role])

  function togglePermission(permissionKey: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      permissionKeys: checked
        ? [...current.permissionKeys, permissionKey].sort()
        : current.permissionKeys.filter((key) => key !== permissionKey),
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      permissionKeys: form.permissionKeys,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? "ghost" : "default"} size={isEditing ? "sm" : "default"}>
          {isEditing ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isEditing ? "Edit" : "New role"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit role" : "Create role"}</DialogTitle>
            <DialogDescription>
              Permission keys are seeded by the system; roles decide which of those keys a user receives.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-key">Key</Label>
              <Input
                id="role-key"
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: normalizeKey(event.target.value) }))}
                disabled={isEditing}
                required
                placeholder="support_manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                placeholder="Support Manager"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional internal note"
            />
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid max-h-80 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                  <Checkbox
                    checked={form.permissionKeys.includes(permission.key)}
                    onCheckedChange={(checked) => togglePermission(permission.key, checked === true)}
                  />
                  <span className="grid gap-1 text-sm">
                    <span className="font-medium">{permission.key}</span>
                    {permission.description ? (
                      <span className="text-muted-foreground">{permission.description}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving || !form.key.trim() || !form.name.trim()}>
              {isEditing ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PermissionBadges({ permissionKeys }: { permissionKeys: string[] }) {
  const visiblePermissions = useMemo(() => permissionKeys.slice(0, 6), [permissionKeys])
  const hiddenCount = permissionKeys.length - visiblePermissions.length

  if (permissionKeys.length === 0) {
    return <span className="text-muted-foreground text-sm">No permissions</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiblePermissions.map((permissionKey) => (
        <Badge key={permissionKey} variant="outline">
          {permissionKey}
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge variant="secondary">+{hiddenCount}</Badge> : null}
    </div>
  )
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "_")
}
