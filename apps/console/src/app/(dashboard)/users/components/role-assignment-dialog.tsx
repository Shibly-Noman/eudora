"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { ShieldCheck } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { fetchRoles } from "@/features/rbac/rbacSlice"
import type { RoleSummary } from "@/features/rbac/rbacTypes"
import { replaceUserRoles } from "@/features/users/usersSlice"
import type { UserSummary } from "@/features/users/usersTypes"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function RoleAssignmentDialog({ user }: { user: UserSummary }) {
  const dispatch = useAppDispatch()
  const { items: roles, status } = useAppSelector((state) => state.rbac)
  const [open, setOpen] = useState(false)
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>(user.roleKeys)

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedRoleKeys(user.roleKeys)

    if (status === "idle") {
      void dispatch(fetchRoles())
    }
  }, [dispatch, open, status, user.roleKeys])

  function toggleRole(roleKey: string, checked: boolean) {
    setSelectedRoleKeys((current) =>
      checked ? [...current, roleKey].sort() : current.filter((key) => key !== roleKey)
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void dispatch(replaceUserRoles({ userId: user.id, roleKeys: selectedRoleKeys }))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ShieldCheck className="size-4" />
          Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign roles</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-md border p-3">
              {roles.length ? (
                roles.map((role) => (
                  <RoleCheckbox
                    key={role.id}
                    role={role}
                    checked={selectedRoleKeys.includes(role.key)}
                    onCheckedChange={toggleRole}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  {status === "loading" ? "Loading roles..." : "No roles are available."}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={status === "loading"}>
              Save roles
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
