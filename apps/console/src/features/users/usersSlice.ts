import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import type { ApiError } from "@/features/auth/authTypes"
import { normalizeApiError } from "@/features/auth/authApi"

import * as usersApi from "./usersApi"
import type { CreateManagedUserInput, UserRoleSummary, UserSummary } from "./usersTypes"

type UsersState = {
  items: UserSummary[]
  status: "idle" | "loading" | "ready"
  filter: string
  error: string | null
  saving: boolean
  actionUserIds: string[]
}

const initialState: UsersState = {
  items: [],
  status: "idle",
  filter: "pending_verification",
  error: null,
  saving: false,
  actionUserIds: [],
}

export const fetchUsers = createAsyncThunk<UserSummary[], string | undefined, { rejectValue: ApiError }>(
  "users/fetchUsers",
  async (status, { rejectWithValue }) => {
    try {
      return await usersApi.listUsers(status)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const activateUser = createAsyncThunk<UserSummary, string, { rejectValue: ApiError }>(
  "users/activateUser",
  async (id, { rejectWithValue }) => {
    try {
      return await usersApi.activateUser(id)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createManagedUser = createAsyncThunk<UserSummary, CreateManagedUserInput, { rejectValue: ApiError }>(
  "users/createManagedUser",
  async (input, { rejectWithValue }) => {
    try {
      return await usersApi.createManagedUser(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const rejectUser = createAsyncThunk<UserSummary, string, { rejectValue: ApiError }>(
  "users/rejectUser",
  async (id, { rejectWithValue }) => {
    try {
      return await usersApi.rejectUser(id)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const replaceUserRoles = createAsyncThunk<
  { userId: string; roles: UserRoleSummary[] },
  { userId: string; roleKeys: string[] },
  { rejectValue: ApiError }
>("users/replaceUserRoles", async ({ userId, roleKeys }, { rejectWithValue }) => {
  try {
    return {
      userId,
      roles: await usersApi.replaceUserRoles(userId, roleKeys),
    }
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUserStatusFilter(state, action: { payload: string }) {
      state.filter = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "ready"
        state.items = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "ready"
        state.error = action.payload?.message ?? "Unable to load users"
      })
      .addCase(createManagedUser.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createManagedUser.fulfilled, (state, action) => {
        state.saving = false
        state.filter = "all"
        state.items = [action.payload, ...state.items.filter((user) => user.id !== action.payload.id)]
      })
      .addCase(createManagedUser.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload?.message ?? "Unable to create user"
      })
      .addCase(activateUser.pending, (state, action) => {
        state.error = null
        state.actionUserIds = addActionUserId(state.actionUserIds, action.meta.arg)
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.payload.id)
        state.items =
          state.filter === "all"
            ? state.items.map((user) => (user.id === action.payload.id ? action.payload : user))
            : state.items.filter((user) => user.id !== action.payload.id)
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.meta.arg)
        state.error = action.payload?.message ?? "Unable to activate user"
      })
      .addCase(rejectUser.pending, (state, action) => {
        state.error = null
        state.actionUserIds = addActionUserId(state.actionUserIds, action.meta.arg)
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.payload.id)
        state.items =
          state.filter === "all"
            ? state.items.map((user) => (user.id === action.payload.id ? action.payload : user))
            : state.items.filter((user) => user.id !== action.payload.id)
      })
      .addCase(rejectUser.rejected, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.meta.arg)
        state.error = action.payload?.message ?? "Unable to reject user"
      })
      .addCase(replaceUserRoles.pending, (state, action) => {
        state.error = null
        state.actionUserIds = addActionUserId(state.actionUserIds, action.meta.arg.userId)
      })
      .addCase(replaceUserRoles.fulfilled, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.payload.userId)
        state.items = state.items.map((user) =>
          user.id === action.payload.userId
            ? { ...user, roleKeys: action.payload.roles.map((role) => role.key) }
            : user
        )
      })
      .addCase(replaceUserRoles.rejected, (state, action) => {
        state.actionUserIds = removeActionUserId(state.actionUserIds, action.meta.arg.userId)
        state.error = action.payload?.message ?? "Unable to update roles"
      })
  },
})

function addActionUserId(current: string[], userId: string): string[] {
  return current.includes(userId) ? current : [...current, userId]
}

function removeActionUserId(current: string[], userId: string): string[] {
  return current.filter((id) => id !== userId)
}

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export const { setUserStatusFilter } = usersSlice.actions
export default usersSlice.reducer
