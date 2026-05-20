import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { ApiRequestError } from "@/features/auth/authApi"
import type { ApiError } from "@/features/auth/authTypes"

import * as rbacApi from "./rbacApi"
import type { CreateRoleInput, PermissionSummary, RoleSummary, UpdateRoleInput } from "./rbacTypes"

type RbacState = {
  items: RoleSummary[]
  permissions: PermissionSummary[]
  status: "idle" | "loading" | "ready"
  permissionsStatus: "idle" | "loading" | "ready"
  saving: boolean
  error: string | null
}

const initialState: RbacState = {
  items: [],
  permissions: [],
  status: "idle",
  permissionsStatus: "idle",
  saving: false,
  error: null,
}

export const fetchRoles = createAsyncThunk<RoleSummary[], void, { rejectValue: ApiError }>(
  "rbac/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      return await rbacApi.listRoles()
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchPermissions = createAsyncThunk<PermissionSummary[], void, { rejectValue: ApiError }>(
  "rbac/fetchPermissions",
  async (_, { rejectWithValue }) => {
    try {
      return await rbacApi.listPermissions()
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createRole = createAsyncThunk<RoleSummary, CreateRoleInput, { rejectValue: ApiError }>(
  "rbac/createRole",
  async (input, { rejectWithValue }) => {
    try {
      return await rbacApi.createRole(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const updateRole = createAsyncThunk<
  RoleSummary,
  { id: string; input: UpdateRoleInput },
  { rejectValue: ApiError }
>("rbac/updateRole", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await rbacApi.updateRole(id, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

const rbacSlice = createSlice({
  name: "rbac",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = "ready"
        state.items = action.payload
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = "ready"
        state.error = action.payload?.message ?? "Unable to load roles"
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.permissionsStatus = "loading"
        state.error = null
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissionsStatus = "ready"
        state.permissions = action.payload
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.permissionsStatus = "ready"
        state.error = action.payload?.message ?? "Unable to load permissions"
      })
      .addCase(createRole.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.saving = false
        state.items = [...state.items, action.payload].sort(compareRoles)
      })
      .addCase(createRole.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload?.message ?? "Unable to create role"
      })
      .addCase(updateRole.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.saving = false
        state.items = state.items.map((role) => (role.id === action.payload.id ? action.payload : role)).sort(compareRoles)
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload?.message ?? "Unable to update role"
      })
  },
})

function compareRoles(left: RoleSummary, right: RoleSummary): number {
  return left.key.localeCompare(right.key)
}

function normalizeError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "status" in error && "message" in error) {
    return error as ApiError
  }

  if (error instanceof ApiRequestError) {
    return {
      status: error.status,
      message: error.message,
    }
  }

  return {
    status: 0,
    message: "Network request failed",
  }
}

export default rbacSlice.reducer
