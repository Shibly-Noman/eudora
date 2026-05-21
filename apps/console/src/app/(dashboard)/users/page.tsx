"use client"

import { useEffect } from "react"
import { Check, RefreshCw, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PermissionGate } from "@/features/auth/PermissionGate"
import { activateUser, fetchUsers, rejectUser, setUserStatusFilter } from "@/features/users/usersSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

import { RoleAssignmentDialog } from "./components/role-assignment-dialog"
import { UserFormDialog } from "./components/user-form-dialog"

const statusLabels: Record<string, string> = {
  pending_verification: "Pending verification",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended",
}

export default function UsersPage() {
  const dispatch = useAppDispatch()
  const { items, filter, status, error, actionUserIds } = useAppSelector((state) => state.users)

  useEffect(() => {
    void dispatch(fetchUsers(filter === "all" ? undefined : filter))
  }, [dispatch, filter])

  return (
    <div className="@container/main flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
          <p className="text-muted-foreground text-sm">Review public registrations and manage account status.</p>
        </div>
        <div className="flex gap-2">
          <PermissionGate permissions={["users.create", "roles.read"]}>
            <UserFormDialog />
          </PermissionGate>
          <Select
            value={filter}
            onValueChange={(value) => dispatch(setUserStatusFilter(value))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_verification">Pending verification</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="all">All users</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void dispatch(fetchUsers(filter === "all" ? undefined : filter))}
            disabled={status === "loading"}
          >
            <RefreshCw className="size-4" />
            <span className="sr-only">Refresh users</span>
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Password</TableHead>
              <TableHead className="w-56 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((user) => (
                <TableRow key={user.id} data-disabled={actionUserIds.includes(user.id) ? "true" : undefined}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name ?? user.email}</span>
                      <span className="text-muted-foreground text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{statusLabels[user.status] ?? user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.roleKeys.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {user.roleKeys.map((roleKey) => (
                          <Badge key={roleKey} variant="outline">
                            {roleKey}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No roles</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword ? (
                      <Badge variant="outline">Must change</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Current</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <PermissionGate permissions={["users.assignRoles", "roles.read"]}>
                        <RoleAssignmentDialog user={user} />
                      </PermissionGate>
                      {user.status === "pending_verification" ? (
                        <>
                        <PermissionGate permissions={["users.activate"]}>
                          <Button
                            size="sm"
                            onClick={() => void dispatch(activateUser(user.id))}
                            disabled={actionUserIds.includes(user.id)}
                          >
                            <Check className="size-4" />
                            Activate
                          </Button>
                        </PermissionGate>
                        <PermissionGate permissions={["users.reject"]}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void dispatch(rejectUser(user.id))}
                            disabled={actionUserIds.includes(user.id)}
                          >
                            <X className="size-4" />
                            Reject
                          </Button>
                        </PermissionGate>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={5}>
                  {status === "loading" ? "Loading users..." : "No users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
