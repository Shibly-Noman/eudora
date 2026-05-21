import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import type { ApiError } from "@/features/auth/authTypes"
import { normalizeApiError } from "@/features/auth/authApi"

import * as usersApi from "./usersApi"
import type { UserRoleSummary, UserSummary } from "./usersTypes"

type UsersState = {
  items: UserSummary[]
  status: "idle" | "loading" | "ready"
  filter: string
  error: string | null
}

const initialState: UsersState = {
  items: [],
  status: "idle",
  filter: "pending_verification",
  error: null,
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
      .addCase(activateUser.fulfilled, (state, action) => {
        state.items = state.items.filter((user) => user.id !== action.payload.id)
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.items = state.items.filter((user) => user.id !== action.payload.id)
      })
      .addCase(replaceUserRoles.fulfilled, (state, action) => {
        state.items = state.items.map((user) =>
          user.id === action.payload.userId
            ? { ...user, roleKeys: action.payload.roles.map((role) => role.key) }
            : user
        )
      })
  },
})

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export const { setUserStatusFilter } = usersSlice.actions
export default usersSlice.reducer
