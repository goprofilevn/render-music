import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface VideoState {
  stt: number
  pathFile: string
  progress: number
  image: string
  total?: number
}

export interface InitialState {
  [key: string]: VideoState[]
}

const initialState: InitialState = {
  imageToVideo: [],
  videoToVideo: [],
  downloadImage: []
}

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    initProgress: (state, action: PayloadAction<string>) => {
      state[action.payload] = []
    },
    addProgress: (state, action: PayloadAction<{ table: string; progress: VideoState }>) => {
      const { table, progress } = action.payload
      state[table].push(progress)
    },
    updateProgress: (state, action: PayloadAction<{ table: string; stt: number; progress: number }>) => {
      const { table, stt, progress } = action.payload
      const index = state[table].findIndex((item) => item.stt === stt)
      state[table][index].progress = progress
    },
  }
})

export const { initProgress, addProgress, updateProgress } = progressSlice.actions

export default progressSlice.reducer
