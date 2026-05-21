import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { normalizeApiError } from "@/features/auth/authApi"
import type { ApiError } from "@/features/auth/authTypes"
import type { ListQuery } from "@/features/shared/apiTypes"

import * as educationApi from "./educationApi"
import type {
  AcademicYearSummary,
  CampusSummary,
  ClassSectionRoster,
  ClassSectionSummary,
  CourseClassSummary,
  CreateAcademicYearInput,
  CreateCampusInput,
  CreateClassSectionInput,
  CreateProgramInput,
  ProgramSummary,
} from "./educationTypes"

type EducationState = {
  campuses: CampusSummary[]
  programs: ProgramSummary[]
  academicYears: AcademicYearSummary[]
  classSections: ClassSectionSummary[]
  courseClasses: CourseClassSummary[]
  selectedRoster: ClassSectionRoster | null
  status: "idle" | "loading" | "ready"
  saving: boolean
  error: string | null
}

const initialState: EducationState = {
  campuses: [],
  programs: [],
  academicYears: [],
  classSections: [],
  courseClasses: [],
  selectedRoster: null,
  status: "idle",
  saving: false,
  error: null,
}

export const fetchCampuses = createAsyncThunk<CampusSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "education/fetchCampuses",
  async (query, { rejectWithValue }) => {
    try {
      return (await educationApi.listCampuses(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createCampus = createAsyncThunk<CampusSummary, CreateCampusInput, { rejectValue: ApiError }>(
  "education/createCampus",
  async (input, { rejectWithValue }) => {
    try {
      return await educationApi.createCampus(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchPrograms = createAsyncThunk<ProgramSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "education/fetchPrograms",
  async (query, { rejectWithValue }) => {
    try {
      return (await educationApi.listPrograms(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createProgram = createAsyncThunk<ProgramSummary, CreateProgramInput, { rejectValue: ApiError }>(
  "education/createProgram",
  async (input, { rejectWithValue }) => {
    try {
      return await educationApi.createProgram(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchAcademicYears = createAsyncThunk<AcademicYearSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "education/fetchAcademicYears",
  async (query, { rejectWithValue }) => {
    try {
      return (await educationApi.listAcademicYears(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createAcademicYear = createAsyncThunk<AcademicYearSummary, CreateAcademicYearInput, { rejectValue: ApiError }>(
  "education/createAcademicYear",
  async (input, { rejectWithValue }) => {
    try {
      return await educationApi.createAcademicYear(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchClassSections = createAsyncThunk<ClassSectionSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "education/fetchClassSections",
  async (query, { rejectWithValue }) => {
    try {
      return (await educationApi.listClassSections(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchCourseClasses = createAsyncThunk<CourseClassSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "education/fetchCourseClasses",
  async (query, { rejectWithValue }) => {
    try {
      return (await educationApi.listCourseClasses(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchClassSectionRoster = createAsyncThunk<ClassSectionRoster, string, { rejectValue: ApiError }>(
  "education/fetchClassSectionRoster",
  async (classSectionId, { rejectWithValue }) => {
    try {
      return await educationApi.getClassSectionRoster(classSectionId)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const createClassSection = createAsyncThunk<ClassSectionSummary, CreateClassSectionInput, { rejectValue: ApiError }>(
  "education/createClassSection",
  async (input, { rejectWithValue }) => {
    try {
      return await educationApi.createClassSection(input)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

const educationSlice = createSlice({
  name: "education",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampuses.pending, loading)
      .addCase(fetchCampuses.fulfilled, (state, action) => {
        state.status = "ready"
        state.campuses = action.payload
      })
      .addCase(fetchCampuses.rejected, failed("Unable to load campuses"))
      .addCase(createCampus.pending, saving)
      .addCase(createCampus.fulfilled, (state, action) => {
        state.saving = false
        state.campuses = upsertById(state.campuses, action.payload)
      })
      .addCase(createCampus.rejected, failed("Unable to create campus"))
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.status = "ready"
        state.programs = action.payload
      })
      .addCase(createProgram.fulfilled, (state, action) => {
        state.saving = false
        state.programs = upsertById(state.programs, action.payload)
      })
      .addCase(fetchAcademicYears.fulfilled, (state, action) => {
        state.status = "ready"
        state.academicYears = action.payload
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.saving = false
        state.academicYears = upsertById(state.academicYears, action.payload)
      })
      .addCase(fetchClassSections.fulfilled, (state, action) => {
        state.status = "ready"
        state.classSections = action.payload
      })
      .addCase(fetchCourseClasses.fulfilled, (state, action) => {
        state.status = "ready"
        state.courseClasses = action.payload
      })
      .addCase(fetchClassSectionRoster.pending, loading)
      .addCase(fetchClassSectionRoster.fulfilled, (state, action) => {
        state.status = "ready"
        state.selectedRoster = action.payload
      })
      .addCase(fetchClassSectionRoster.rejected, failed("Unable to load class roster"))
      .addCase(createClassSection.fulfilled, (state, action) => {
        state.saving = false
        state.classSections = upsertById(state.classSections, action.payload)
      })
  },
})

function loading(state: EducationState) {
  state.status = "loading"
  state.error = null
}

function saving(state: EducationState) {
  state.saving = true
  state.error = null
}

function failed(message: string) {
  return (state: EducationState, action: { payload?: ApiError }) => {
    state.status = "ready"
    state.saving = false
    state.error = action.payload?.message ?? message
  }
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter((current) => current.id !== item.id), item]
}

function normalizeError(error: unknown): ApiError {
  return normalizeApiError(error)
}

export default educationSlice.reducer
