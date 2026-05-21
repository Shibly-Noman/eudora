import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { normalizeApiError } from "@/features/auth/authApi"
import type { ApiError } from "@/features/auth/authTypes"
import type { ListQuery } from "@/features/shared/apiTypes"

import * as studentsApi from "./studentsApi"
import type {
  CreateCourseEnrollmentInput,
  ReplacePrimaryPlacementInput,
  StudentCourseEnrollment,
  StudentPrimaryPlacement,
  StudentProfileDetail,
  StudentProfileSummary,
  UpdateStudentInput,
} from "./studentsTypes"

type StudentsState = {
  items: StudentProfileSummary[]
  selectedStudent: StudentProfileDetail | null
  status: "idle" | "loading" | "ready"
  saving: boolean
  error: string | null
}

const initialState: StudentsState = {
  items: [],
  selectedStudent: null,
  status: "idle",
  saving: false,
  error: null,
}

export const fetchStudentProfiles = createAsyncThunk<StudentProfileSummary[], ListQuery | undefined, { rejectValue: ApiError }>(
  "students/fetchStudentProfiles",
  async (query, { rejectWithValue }) => {
    try {
      return (await studentsApi.listStudents(query)).items
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const fetchStudentDetail = createAsyncThunk<StudentProfileDetail, string, { rejectValue: ApiError }>(
  "students/fetchStudentDetail",
  async (studentId, { rejectWithValue }) => {
    try {
      return await studentsApi.getStudentDetail(studentId)
    } catch (error) {
      return rejectWithValue(normalizeError(error))
    }
  }
)

export const updateStudent = createAsyncThunk<
  StudentProfileSummary,
  { studentId: string; input: UpdateStudentInput },
  { rejectValue: ApiError }
>("students/updateStudent", async ({ studentId, input }, { rejectWithValue }) => {
  try {
    return await studentsApi.updateStudent(studentId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const replacePrimaryPlacement = createAsyncThunk<
  StudentPrimaryPlacement,
  { studentId: string; input: ReplacePrimaryPlacementInput },
  { rejectValue: ApiError }
>("students/replacePrimaryPlacement", async ({ studentId, input }, { rejectWithValue }) => {
  try {
    return await studentsApi.replacePrimaryPlacement(studentId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

export const createCourseEnrollment = createAsyncThunk<
  StudentCourseEnrollment,
  { studentId: string; input: CreateCourseEnrollmentInput },
  { rejectValue: ApiError }
>("students/createCourseEnrollment", async ({ studentId, input }, { rejectWithValue }) => {
  try {
    return await studentsApi.createCourseEnrollment(studentId, input)
  } catch (error) {
    return rejectWithValue(normalizeError(error))
  }
})

const studentsSlice = createSlice({
  name: "studentProfiles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfiles.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStudentProfiles.fulfilled, (state, action) => {
        state.status = "ready"
        state.items = action.payload
      })
      .addCase(fetchStudentProfiles.rejected, (state, action) => {
        state.status = "ready"
        state.error = action.payload?.message ?? "Unable to load students"
      })
      .addCase(fetchStudentDetail.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStudentDetail.fulfilled, (state, action) => {
        state.status = "ready"
        state.selectedStudent = action.payload
      })
      .addCase(fetchStudentDetail.rejected, (state, action) => {
        state.status = "ready"
        state.error = action.payload?.message ?? "Unable to load student"
      })
      .addCase(updateStudent.pending, saving)
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.saving = false
        state.items = upsertById(state.items, action.payload)
        if (state.selectedStudent?.id === action.payload.id) {
          state.selectedStudent = {
            ...state.selectedStudent,
            ...action.payload,
          }
        }
      })
      .addCase(updateStudent.rejected, failed("Unable to update student"))
      .addCase(replacePrimaryPlacement.pending, saving)
      .addCase(replacePrimaryPlacement.fulfilled, (state, action) => {
        state.saving = false
        if (state.selectedStudent) {
          state.selectedStudent.primaryPlacements = [
            action.payload,
            ...state.selectedStudent.primaryPlacements.filter((placement) => placement.id !== action.payload.id),
          ]
        }
      })
      .addCase(replacePrimaryPlacement.rejected, failed("Unable to update placement"))
      .addCase(createCourseEnrollment.pending, saving)
      .addCase(createCourseEnrollment.fulfilled, (state, action) => {
        state.saving = false
        if (state.selectedStudent) {
          state.selectedStudent.courseEnrollments = [
            action.payload,
            ...state.selectedStudent.courseEnrollments.filter((enrollment) => enrollment.id !== action.payload.id),
          ]
        }
      })
      .addCase(createCourseEnrollment.rejected, failed("Unable to create course enrollment"))
  },
})

function saving(state: StudentsState) {
  state.saving = true
  state.error = null
}

function failed(message: string) {
  return (state: StudentsState, action: { payload?: ApiError }) => {
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

export default studentsSlice.reducer
