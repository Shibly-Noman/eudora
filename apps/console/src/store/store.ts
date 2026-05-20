import { configureStore } from "@reduxjs/toolkit"

import authReducer from "@/features/auth/authSlice"
import rbacReducer from "@/features/rbac/rbacSlice"
import usersReducer from "@/features/users/usersSlice"

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      rbac: rbacReducer,
      users: usersReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
