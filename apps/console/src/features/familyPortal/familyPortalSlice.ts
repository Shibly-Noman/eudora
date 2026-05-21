import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { normalizeApiError } from "@/features/auth/authApi"
import type { ApiError } from "@/features/auth/authTypes"

import * as familyPortalApi from "./familyPortalApi"
import type { FamilyPortalData, GuardianContact, UpdateGuardianContactInput } from "./familyPortalTypes"

type FamilyPortalState = {
  data: FamilyPortalData | null
  status: "idle" | "loading" | "ready"
  saving: boolean
  error: string | null
}

const initialState: FamilyPortalState = {
  data: null,
  status: "idle",
  saving: false,
  error: null,
}

export const fetchMyFamily = createAsyncThunk<FamilyPortalData, void, { rejectValue: ApiError }>(
  "familyPortal/fetchMyFamily",
  async (_, { rejectWithValue }) => {
    try {
      return await familyPortalApi.getMyFamily()
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const updateMyContact = createAsyncThunk<GuardianContact, UpdateGuardianContactInput, { rejectValue: ApiError }>(
  "familyPortal/updateMyContact",
  async (input, { rejectWithValue }) => {
    try {
      return await familyPortalApi.updateMyContact(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

const familyPortalSlice = createSlice({
  name: "familyPortal",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyFamily.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMyFamily.fulfilled, (state, action) => {
        state.status = "ready"
        state.data = action.payload
      })
      .addCase(fetchMyFamily.rejected, (state, action) => {
        state.status = "ready"
        state.error = action.payload?.message ?? "Unable to load family portal"
      })
      .addCase(updateMyContact.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateMyContact.fulfilled, (state, action) => {
        state.saving = false
        if (state.data) {
          state.data.guardian = action.payload
        }
      })
      .addCase(updateMyContact.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload?.message ?? "Unable to update contact details"
      })
  },
})

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export default familyPortalSlice.reducer
