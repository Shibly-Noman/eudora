import { configureStore } from "@reduxjs/toolkit"

import authReducer from "@/features/auth/authSlice"
import educationReducer from "@/features/education/educationSlice"
import familiesReducer from "@/features/families/familiesSlice"
import familyPortalReducer from "@/features/familyPortal/familyPortalSlice"
import rbacReducer from "@/features/rbac/rbacSlice"
import studentProfilesReducer from "@/features/students/studentsSlice"
import usersReducer from "@/features/users/usersSlice"

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      education: educationReducer,
      families: familiesReducer,
      familyPortal: familyPortalReducer,
      rbac: rbacReducer,
      studentProfiles: studentProfilesReducer,
      users: usersReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
