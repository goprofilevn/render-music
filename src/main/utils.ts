import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import axios from 'axios'
import sharp from 'sharp'

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
  return new Promise(async (resolve) => {
    const files = (await getFolderFiles(pathFolder)).filter(
      (file) => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.mp4')
    )
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
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const getFileName = (url: string): string => {
  const info = url.split('/')
  let fileName = info[info.length - 1]
  fileName = fileName.split('?')[0]
  return `${fileName}.jpg`
}

export const downloadFile = (url: string, pathFile: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const file = fs.createWriteStream(pathFile)
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream'
      })
      response.data.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
      file.on('error', (err) => {
        reject(err)
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

export const downloadBuffer = (url: string): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'arraybuffer'
      })
      resolve(Buffer.from(response.data))
    } catch (ex) {
      reject(ex)
    }
  })
}

export const resizeImage = async (pathFile: string, size: string): Promise<Buffer> => {
  try {
    const [width, height] = size.split('x').map(Number)
    const resize = await sharp(pathFile).resize(width).toBuffer()
    const info = await sharp(resize).metadata()
    const left = Math.floor(info.width / 2 - width / 2)
    const top = Math.floor(info.height / 2 - height / 2)
    const buffer = sharp(resize).extract({
      width,
      height,
      left: left < 0 ? 0 : left,
      top: top < 0 ? 0 : top
    }).toBuffer()
    return buffer
  } catch (ex) {
    console.error(ex)
    throw ex
  }
}

export const resizeBuffer = async (input: Buffer, size: string): Promise<Buffer> => {
  try {
    const [width, height] = size.split('x').map(Number)
    const resize = await sharp(input).resize(width).toBuffer()
    const info = await sharp(resize).metadata()
    const left = Math.floor(info.width / 2 - width / 2)
    const top = Math.floor(info.height / 2 - height / 2)
    const buffer = sharp(resize).extract({
      width,
      height,
      left: left < 0 ? 0 : left,
      top: top < 0 ? 0 : top
    }).toBuffer()
    return buffer
  } catch (ex) {
    console.error(ex)
    throw ex
  }
}