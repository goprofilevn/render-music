import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

export const getFolderFiles = (pathFolder: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(pathFolder, (err, files) => {
      if (err) {
        reject(err)
      }
      resolve(files)
    })
  })
}

export const getInfo = (pathFile: string): Promise<ffmpeg.FfprobeData> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(pathFile, (err, metadata) => {
      if (err) {
        reject(err)
      }
      resolve(metadata)
    })
  })
}

export const getInfoAll = (pathFolder: string): Promise<ffmpeg.FfprobeData[]> => {
  return new Promise(async(resolve) => {
    const files = (await getFolderFiles(pathFolder)).filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.mp4'))
    const infos = []
    for (const file of files) {
      const info = await getInfo(path.join(pathFolder, file))
      infos.push(info)
    }
    resolve(infos)
  })
}

export const timeMarkToSeconds = (timeMark: string): number => {
  const [hours, minutes, seconds] = timeMark.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}