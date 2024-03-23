import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface RenderSetting {
  maxDuration?: number
  audioFolder?: string
  imageFolder?: string
  videoFolder?: string
  useGPU?: boolean
  keyword?: string
  outputFolder: string
  thread?: number
  limit?: number
}

export interface InitialState {
  [key: string]: RenderSetting
}

const initialState: InitialState = {
  imageToVideo: {
    maxDuration: 60,
    audioFolder: '',
    imageFolder: '',
    videoFolder: '',
    outputFolder: '',
    thread: 1,
    useGPU: false,
    limit: 10
  },
  videoToVideo: {
    maxDuration: 60,
    audioFolder: '',
    imageFolder: '',
    videoFolder: '',
    outputFolder: '',
    thread: 1,
    useGPU: false,
    limit: 10
  },
  downloadImage: {
    keyword: '',
    outputFolder: '',
    limit: 10
  }
}

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    setMaxDuration: (state, action: PayloadAction<{ table: string, maxDuration: number}>) => {
      state[action.payload.table].maxDuration = action.payload.maxDuration
    },
    setAudioFolder: (state, action: PayloadAction<{ table: string, audioFolder: string}>) => {
      state[action.payload.table].audioFolder = action.payload.audioFolder
    },
    setImageFolder: (state, action: PayloadAction<{ table: string, imageFolder: string}>) => {
      state[action.payload.table].imageFolder = action.payload.imageFolder
    },
    setVideoFolder: (state, action: PayloadAction<{ table: string, videoFolder: string}>) => {
      state[action.payload.table].videoFolder = action.payload.videoFolder
    },
    setOutputFolder: (state, action: PayloadAction<{ table: string, outputFolder: string}>) => {
      state[action.payload.table].outputFolder = action.payload.outputFolder
    },
    setUseGPU: (state, action: PayloadAction<{ table: string, useGPU: boolean}>) => {
      state[action.payload.table].useGPU = action.payload.useGPU
    },
    setKeyword: (state, action: PayloadAction<{ table: string, keyword: string}>) => {
      state[action.payload.table].keyword = action.payload.keyword
    },
    setThread: (state, action: PayloadAction<{ table: string, thread: number}>) => {
      console.log('action.payload.thread', action.payload.thread)
      state[action.payload.table].thread = action.payload.thread
    },
    setLimit: (state, action: PayloadAction<{ table: string, limit: number}>) => {
      state[action.payload.table].limit = action.payload.limit
    }
  }
})

export const { setMaxDuration, setAudioFolder, setImageFolder, setVideoFolder, setOutputFolder, setUseGPU, setKeyword, setThread, setLimit } = settingSlice.actions

export default settingSlice.reducer
