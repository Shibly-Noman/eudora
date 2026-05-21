import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { normalizeApiError } from "@/features/auth/authApi"
import type { ApiError } from "@/features/auth/authTypes"
import type { ListQuery } from "@/features/shared/apiTypes"

import * as familiesApi from "./familiesApi"
import type {
  AddGuardianInput,
  AddStudentInput,
  CreateFamilyWizardInput,
  CreateFamilyWizardResult,
  FamilyDetail,
  FamilySummary,
  GuardianLoginResult,
  GuardianRelationshipSummary,
  GuardianSummary,
  GuardianUserLinkResult,
  StudentSummary,
  UpdateFamilyInput,
  UpdateRelationshipInput,
} from "./familiesTypes"

type FamiliesState = {
  items: FamilySummary[]
  guardians: GuardianSummary[]
  selectedFamily: FamilyDetail | null
  lastGuardianLogin: GuardianLoginResult | null
  lastCreated: CreateFamilyWizardResult | null
  status: "idle" | "loading" | "ready"
  saving: boolean
  error: string | null
}

const initialState: FamiliesState = {
  items: [],
  guardians: [],
  selectedFamily: null,
  lastGuardianLogin: null,
  lastCreated: null,
  status: "idle",
  saving: false,
  error: null,
}

export const fetchFamilies = createAsyncThunk<FamilySummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "families/fetchFamilies",
  async (query, { rejectWithValue }) => {
    try {
      return (await familiesApi.listFamilies(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchFamilyDetail = createAsyncThunk<FamilyDetail, string, { rejectValue: ApiError }>(
  "families/fetchFamilyDetail",
  async (familyId, { rejectWithValue }) => {
    try {
      return await familiesApi.getFamilyDetail(familyId)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchGuardians = createAsyncThunk<GuardianSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "families/fetchGuardians",
  async (query, { rejectWithValue }) => {
    try {
      return (await familiesApi.listGuardians(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createFamilyWizard = createAsyncThunk<
  CreateFamilyWizardResult,
  CreateFamilyWizardInput,
  { rejectValue: ApiError }
>("families/createFamilyWizard", async (input, { rejectWithValue }) => {
  try {
    return await familiesApi.createFamilyWizard(input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const updateFamily = createAsyncThunk<
  FamilySummary,
  { familyId: string; input: UpdateFamilyInput },
  { rejectValue: ApiError }
>("families/updateFamily", async ({ familyId, input }, { rejectWithValue }) => {
  try {
    return await familiesApi.updateFamily(familyId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const addGuardianToFamily = createAsyncThunk<
  GuardianSummary,
  { familyId: string; input: AddGuardianInput },
  { rejectValue: ApiError }
>("families/addGuardianToFamily", async ({ familyId, input }, { rejectWithValue }) => {
  try {
    return await familiesApi.addGuardianToFamily(familyId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const addStudentToFamily = createAsyncThunk<
  StudentSummary,
  { familyId: string; input: AddStudentInput },
  { rejectValue: ApiError }
>("families/addStudentToFamily", async ({ familyId, input }, { rejectWithValue }) => {
  try {
    return await familiesApi.addStudentToFamily(familyId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const createGuardianLogin = createAsyncThunk<GuardianLoginResult, string, { rejectValue: ApiError }>(
  "families/createGuardianLogin",
  async (guardianId, { rejectWithValue }) => {
    try {
      return await familiesApi.createGuardianLogin(guardianId)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const linkGuardianUser = createAsyncThunk<
  GuardianUserLinkResult,
  { guardianId: string; userId: string },
  { rejectValue: ApiError }
>("families/linkGuardianUser", async ({ guardianId, userId }, { rejectWithValue }) => {
  try {
    return await familiesApi.linkGuardianUser(guardianId, userId)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const updateRelationship = createAsyncThunk<
  GuardianRelationshipSummary,
  { id: string; input: UpdateRelationshipInput },
  { rejectValue: ApiError }
>("families/updateRelationship", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await familiesApi.updateGuardianStudentRelationship(id, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

const familiesSlice = createSlice({
  name: "families",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFamilies.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchFamilies.fulfilled, (state, action) => {
        state.status = "ready"
        state.items = action.payload
      })
      .addCase(fetchFamilies.rejected, failed("Unable to load families"))
      .addCase(fetchFamilyDetail.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchFamilyDetail.fulfilled, (state, action) => {
        state.status = "ready"
        state.selectedFamily = action.payload
      })
      .addCase(fetchFamilyDetail.rejected, failed("Unable to load family"))
      .addCase(fetchGuardians.fulfilled, (state, action) => {
        state.guardians = action.payload
      })
      .addCase(createFamilyWizard.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createFamilyWizard.fulfilled, (state, action) => {
        state.saving = false
        state.status = "ready"
        state.lastCreated = action.payload
        state.items = upsertById(state.items, action.payload.family)
      })
      .addCase(createFamilyWizard.rejected, failed("Unable to create family"))
      .addCase(updateFamily.pending, saving)
      .addCase(updateFamily.fulfilled, (state, action) => {
        state.saving = false
        state.items = upsertById(state.items, action.payload)
        if (state.selectedFamily?.id === action.payload.id) {
          state.selectedFamily = {
            ...state.selectedFamily,
            ...action.payload,
          }
        }
      })
      .addCase(updateFamily.rejected, failed("Unable to update family"))
      .addCase(addGuardianToFamily.pending, saving)
      .addCase(addGuardianToFamily.fulfilled, (state, action) => {
        state.saving = false
        if (state.selectedFamily) {
          state.selectedFamily.guardians.push({
            ...action.payload,
            isPrimary: false,
            portalStatus: "not_linked",
            user: null,
            relationships: [],
          })
        }
      })
      .addCase(addGuardianToFamily.rejected, failed("Unable to add guardian"))
      .addCase(addStudentToFamily.pending, saving)
      .addCase(addStudentToFamily.fulfilled, (state, action) => {
        state.saving = false
        if (state.selectedFamily) {
          state.selectedFamily.students.push({
            ...action.payload,
            isPrimaryHousehold: false,
            livesWithFamily: false,
            guardians: [],
            primaryPlacements: [],
            courseEnrollments: [],
          })
        }
      })
      .addCase(addStudentToFamily.rejected, failed("Unable to add student"))
      .addCase(createGuardianLogin.pending, (state) => {
        state.saving = true
        state.error = null
        state.lastGuardianLogin = null
      })
      .addCase(createGuardianLogin.fulfilled, (state, action) => {
        state.saving = false
        state.lastGuardianLogin = action.payload
        if (state.selectedFamily) {
          const guardian = state.selectedFamily.guardians.find((item) => item.id === action.payload.guardianId)
          if (guardian) {
            guardian.userId = action.payload.userId
            guardian.portalStatus = guardian.relationships.some((relationship) => relationship.hasPortalAccess)
              ? "linked_portal_active"
              : "linked_portal_disabled"
            guardian.user = {
              id: action.payload.userId,
              email: action.payload.email,
              status: "active",
              mustChangePassword: action.payload.mustChangePassword,
            }
          }
        }
      })
      .addCase(createGuardianLogin.rejected, failed("Unable to create guardian login"))
      .addCase(linkGuardianUser.fulfilled, (state, action) => {
        if (!state.selectedFamily) return
        const guardian = state.selectedFamily.guardians.find((item) => item.id === action.payload.guardianId)
        if (guardian) {
          guardian.userId = action.payload.userId
          guardian.portalStatus = guardian.relationships.some((relationship) => relationship.hasPortalAccess)
            ? "linked_portal_active"
            : "linked_portal_disabled"
        }
      })
      .addCase(updateRelationship.fulfilled, (state, action) => {
        if (state.selectedFamily) {
          updateRelationshipInFamily(state.selectedFamily, action.payload)
        }
      })
      .addCase(updateRelationship.rejected, failed("Unable to update relationship"))
  },
})

function failed(message: string) {
  return (state: FamiliesState, action: { payload?: ApiError }) => {
    state.status = "ready"
    state.saving = false
    state.error = action.payload?.message ?? message
  }
}

function saving(state: FamiliesState) {
  state.saving = true
  state.error = null
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter((current) => current.id !== item.id), item]
}

function updateRelationshipInFamily(family: FamilyDetail, relationship: GuardianRelationshipSummary) {
  for (const guardian of family.guardians) {
    guardian.relationships = guardian.relationships.map((current) =>
      current.id === relationship.id ? { ...current, ...relationship } : current
    )
    guardian.portalStatus = !guardian.userId
      ? "not_linked"
      : guardian.relationships.some((current) => current.hasPortalAccess)
        ? "linked_portal_active"
        : "linked_portal_disabled"
  }

  for (const student of family.students) {
    student.guardians = student.guardians.map((current) =>
      current.id === relationship.id ? { ...current, ...relationship } : current
    )
  }
}

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export default familiesSlice.reducer
