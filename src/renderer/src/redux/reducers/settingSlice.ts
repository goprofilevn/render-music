import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface RenderSetting {
  maxDuration?: number
  audioFolder?: string
  imageFolder?: string
  videoFolder?: string
  randomAudio?: string
  useGPU?: boolean
  keyword?: string
  outputFolder: string
  thread?: number
  limit?: number
  server?: 'lexica' | 'unsplash'
  maxPage?: number
  size?: string
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
    randomAudio: '',
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
    limit: 10,
    maxPage: 1,
    server: 'lexica',
    size: '1280x720'
  }
}

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    setMaxDuration: (state, action: PayloadAction<{ table: string; maxDuration: number }>) => {
      state[action.payload.table].maxDuration = action.payload.maxDuration
    },
    setAudioFolder: (state, action: PayloadAction<{ table: string; audioFolder: string }>) => {
      state[action.payload.table].audioFolder = action.payload.audioFolder
    },
    setImageFolder: (state, action: PayloadAction<{ table: string; imageFolder: string }>) => {
      state[action.payload.table].imageFolder = action.payload.imageFolder
    },
    setVideoFolder: (state, action: PayloadAction<{ table: string; videoFolder: string }>) => {
      state[action.payload.table].videoFolder = action.payload.videoFolder
    },
    setRandomAudio: (state, action: PayloadAction<{ table: string; randomAudio: string }>) => {
      state[action.payload.table].randomAudio = action.payload.randomAudio
    },
    setOutputFolder: (state, action: PayloadAction<{ table: string; outputFolder: string }>) => {
      state[action.payload.table].outputFolder = action.payload.outputFolder
    },
    setUseGPU: (state, action: PayloadAction<{ table: string; useGPU: boolean }>) => {
      state[action.payload.table].useGPU = action.payload.useGPU
    },
    setKeyword: (state, action: PayloadAction<{ table: string; keyword: string }>) => {
      state[action.payload.table].keyword = action.payload.keyword
    },
    setThread: (state, action: PayloadAction<{ table: string; thread: number }>) => {
      console.log('action.payload.thread', action.payload.thread)
      state[action.payload.table].thread = action.payload.thread
    },
    setLimit: (state, action: PayloadAction<{ table: string; limit: number }>) => {
      state[action.payload.table].limit = action.payload.limit
    },
    setServer: (state, action: PayloadAction<{ table: string; server: 'lexica' | 'unsplash' }>) => {
      state[action.payload.table].server = action.payload.server
    },
    setMaxPage: (state, action: PayloadAction<{ table: string; maxPage: number }>) => {
      state[action.payload.table].maxPage = action.payload.maxPage
    },
    setSize: (state, action: PayloadAction<{ table: string; size: string }>) => {
      state[action.payload.table].size = action.payload.size
    }
  }
})

export const {
  setMaxDuration,
  setAudioFolder,
  setImageFolder,
  setVideoFolder,
  setRandomAudio,
  setOutputFolder,
  setUseGPU,
  setKeyword,
  setThread,
  setLimit,
  setServer,
  setMaxPage,
  setSize
} = settingSlice.actions

export default settingSlice.reducer
