import { ipcMain, dialog, Notification } from 'electron'
import axios from 'axios'
import fs from 'fs'
import { Worker } from 'worker_threads'
import { sleep, getFileName, resizeBuffer, downloadBuffer } from './utils'
import path from 'path'
import os from 'os'
import AdmZip from 'adm-zip'

let isRunningDownloadImage = false
const workers: Worker[] = []

const homdeDir = os.homedir()

ipcMain.handle('check-resource', async (event) => {
  const ffmpegPath = path.resolve(homdeDir, '.render-music', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffmpeg.exe')
  const ffprobePath = path.resolve(homdeDir, '.render-music', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffprobe.exe')
  if (fs.existsSync(ffmpegPath) && fs.existsSync(ffprobePath)) {
    new Notification({
      title: "Thông báo",
      body: "Đã cài đặt xong ffmpeg"
    }).show()
    return true
  }
  if (!fs.existsSync(path.resolve(homdeDir, '.render-music'))) {
    fs.mkdirSync(path.resolve(homdeDir, '.render-music'), { recursive: true })
  }
  // https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
  const response = await axios({
    method: 'get',
    url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    responseType: 'arraybuffer'
  })
  const buffer = Buffer.from(response.data, 'binary')
  const pathSave = path.resolve(homdeDir, '.render-music', 'ffmpeg.zip')
  await fs.promises.writeFile(pathSave, buffer)
  const zip = new AdmZip(pathSave)
  zip.extractAllTo(path.resolve(homdeDir, '.render-music', 'ffmpeg'), true)
  event.sender.send('ready')
  new Notification({
    title: "Thông báo",
    body: "Đã cài đặt xong ffmpeg"
  }).show()
  return true
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (result.canceled) {
    return ''
  }
  return result.filePaths[0]
})

// Download image

const getImageLexica = async (keyword: string, page: number): Promise<string[]> => {
  try {
    const limit = 100
    const cursor = (page - 1) * limit
    const response = await axios({
      method: 'POST',
      url: `https://lexica.art/api/infinite-prompts`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        "text": keyword,
        "model": "lexica-aperture-v3.5",
        "searchMode": "images",
        "source": "search",
        "cursor": cursor,
      })
    })
    const images = []
    const filters = response.data?.images.filter((image: any) => {
      return image.width > image.height
    })
    for (const image of filters) {
      images.push(`https://image.lexica.art/full_jpg/${image.id}`)
    }
    return images
  } catch (ex) {
    throw ex
  }
}

const getImageUnsplash = async (keyword: string, page: number): Promise<string[]> => {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://unsplash.com/napi/search/photos`,
      params: {
        query: keyword,
        page: page,
        per_page: 20
      }
    })
    const images = []
    const filters = response.data.results.filter((image: any) => {
      return image.width > image.height
    })
    for (const image of filters) {
      images.push(image.urls.full)
    }
    return images
  } catch(ex) {
    throw ex
  }
}

ipcMain.on('start-download-image', async (event, data) => {
  try {
    const { keyword, outputFolder, maxPage, size, server } = data
    event.reply('status-download-image', { status: 'started', message: 'Download started' })
    isRunningDownloadImage = true
    const images = []
    let p = 1;
    while(p <= maxPage) {
      if (server === 'lexica') {
        const imgs = await getImageLexica(keyword, p)
        images.push(...imgs)
      } else {
        const imgs = await getImageUnsplash(keyword, p)
        console.log(`Get images page ${p}: ${imgs.length}`)
        images.push(...imgs)
      }
      p++
    }
    for (let i=0; i<images.length; i++) {
      const image = images[i]
      try {
        if (!isRunningDownloadImage) {
          break
        }
        const fileName = getFileName(image)
        const pathFile = path.join(outputFolder, fileName)
        const downoad = await downloadBuffer(image)
        const buffer = await resizeBuffer(downoad, size)
        fs.writeFileSync(pathFile, buffer)
        event.reply('status-download-image', {
          status: 'success',
          message: `Download success: ${fileName}`
        })
        event.reply('progress-download-image', {
          stt: i + 1,
          total: images.length,
          pathFile: pathFile,
          image: `data:image/jpeg;base64,${buffer.toString('base64')}`
        })
      } catch (ex) {
        event.reply('status-download-image', { status: 'error', message: ex?.message || ex })
      }
    }
    event.reply('status-download-image', { status: 'stopped', message: 'Download complete' })
    isRunningDownloadImage = false
  } catch (ex) {
    event.reply('status-download-image', { status: 'error', message: ex?.message || ex })
    isRunningDownloadImage = false
  }
})

ipcMain.on('stop-download-image', async () => {
  isRunningDownloadImage = false
})

// Image to video

ipcMain.on('start-image-to-video', async (event, data) => {
  const { audioFolder, imageFolder, outputFolder, maxDuration, thread, limit, useGPU } = data
  event.reply('status-image-to-video', { status: 'started', message: 'Download started' })
  const splitLimit = Math.floor(limit / thread)
  for (let i = 0; i < thread; i++) {
    const limitValue = i == thread - 1 ? limit - (thread - 1) * splitLimit : splitLimit
    console.log('limitValue', limitValue)
    const worker = new Worker(path.resolve(__dirname, 'worker.js'), {
      workerData: {
        audioFolder,
        imageFolder,
        outputFolder,
        maxDuration,
        limit: limitValue,
        useGPU,
        type: 'imageToVideo',
        thread: i + 1
      }
    })
    worker.on('message', (message) => {
      if (typeof message === 'object') {
        event.reply('progress-image-to-video', message.progress)
      } else {
        console.log(message)
      }
    })
    worker.on('error', (error) => {
      console.error('error', error)
      event.reply('status-image-to-video', { status: 'error', message: error?.message || error })
    })
    worker.on('exit', (code) => {
      if (code === 0) {
        event.reply('status-image-to-video', { status: 'success', message: 'Render success' })
      } else {
        event.reply('status-image-to-video', { status: 'error', message: 'Render error' })
      }
      workers.splice(workers.indexOf(worker), 1)
    })
    workers.push(worker)
  }
  while (workers.length > 0) {
    await sleep(1000)
  }
  event.reply('status-image-to-video', { status: 'stopped', message: 'Render complete' })
})

ipcMain.on('stop-image-to-video', async () => {
  workers.forEach((worker) => {
    worker.postMessage('stop')
  })
})

// Video to video

ipcMain.handle('start-video-to-video', async () => { })

ipcMain.handle('stop-video-to-video', async () => { })
