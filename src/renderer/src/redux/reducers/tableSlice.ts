import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface InitialState {
  [table: string]: string[]
}

const initialState: InitialState = {}

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    toggleColumnHidden: (state, action: PayloadAction<{ table: string; column: string }>) => {
      const { table, column } = action.payload
      const index = state[table].indexOf(column)
      if (index > -1) state[table].splice(index, 1)
      else state[table].push(column)
    },
    initTable: (state, action: PayloadAction<string>) => {
      state[action.payload] = []
    }
  }
})

export const { toggleColumnHidden, initTable } = tableSlice.actions

export default tableSlice.reducer
