import type { TypedUseSelectorHook} from "react-redux";
import { useDispatch, useSelector } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import glanceReducer from "./slices/glanceSlice"; // Import glance slice


export const store = configureStore({
  reducer: {
 
    glance: glanceReducer, // Add glance slice to the reducers

  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
