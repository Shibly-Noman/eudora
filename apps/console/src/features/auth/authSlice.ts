import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import * as authApi from "./authApi"
import { normalizeApiError } from "./authApi"
import type {
  ApiError,
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  SignupInput,
} from "./authTypes"

type AuthState = {
  user: CurrentUser | null
  status: "idle" | "loading" | "authenticated" | "unauthenticated"
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
}

export const fetchCurrentUser = createAsyncThunk<
  CurrentUser,
  void,
  { rejectValue: ApiError }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    return await authApi.fetchCurrentUser()
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const login = createAsyncThunk<CurrentUser, LoginInput, { rejectValue: ApiError }>(
  "auth/login",
  async (input, { dispatch, rejectWithValue }) => {
    try {
      await authApi.login(input)
      return await dispatch(fetchCurrentUser()).unwrap()
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const signup = createAsyncThunk<void, SignupInput, { rejectValue: ApiError }>(
  "auth/signup",
  async (input, { rejectWithValue }) => {
    try {
      await authApi.signup(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const logout = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout()
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const changePassword = createAsyncThunk<
  CurrentUser,
  ChangePasswordInput,
  { rejectValue: ApiError }
>("auth/changePassword", async (input, { dispatch, rejectWithValue }) => {
  try {
    await authApi.changePassword(input)
    return await dispatch(fetchCurrentUser()).unwrap()
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "authenticated"
        state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "unauthenticated"
        state.user = null
        state.error = action.payload?.message ?? null
      })
      .addCase(login.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated"
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "unauthenticated"
        state.user = null
        state.error = action.payload?.message ?? "Unable to sign in"
      })
      .addCase(signup.pending, (state) => {
        state.error = null
      })
      .addCase(signup.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Unable to create account"
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "unauthenticated"
        state.user = null
        state.error = null
      })
      .addCase(changePassword.pending, (state) => {
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.status = "authenticated"
        state.user = action.payload
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Unable to change password"
      })
  },
})

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
