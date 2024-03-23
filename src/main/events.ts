import { ipcMain, dialog, Notification } from 'electron'
import axios from 'axios'
import fs from 'fs'
import { Worker } from 'worker_threads'
import { sleep } from './utils'
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

ipcMain.on('start-download-image', async (event, data) => {
  try {
    const { keyword, outputFolder } = data
    const response = await axios({
      method: 'get',
      url: `https://lexica.art/?q=${keyword}`,
      headers: {
        'rsc': 1
      }
    })
    event.reply('status-download-image', { status: 'started', message: 'Download started' })
    isRunningDownloadImage = true
    const rows = response.data.split('\n')
    let json = null
    for (const row of rows) {
      if (row.startsWith('6:')) {
        json = JSON.parse(row.substring(2))
        break
      }
    }
    const images = json?.[3]?.initialPrompts?.images
    for (const image of images) {
      try {
        if (!isRunningDownloadImage) {
          break
        }
        const response = await axios({
          method: 'get',
          url: `https://image.lexica.art/full_jpg/${image.id}`,
          responseType: 'arraybuffer'
        })
        const buffer = Buffer.from(response.data, 'binary')
        const path = `${outputFolder}/${image.id}.jpg`
        await fs.promises.writeFile(path, buffer)
        event.reply('status-download-image', { status: 'success', message: `Download success: ${image.id}` })
        event.reply('progress-download-image', {
          stt: images.indexOf(image),
          total: images.length,
          pathFile: path,
          image: `data:image/jpeg;base64,${buffer.toString('base64')}`,
        })
      } catch(ex) {
        event.reply('status-download-image', { status: 'error', message: ex?.message || ex })
      }
    }
    event.reply('status-download-image', { status: 'stopped', message: 'Download complete' })
    isRunningDownloadImage = false
  } catch(ex) {
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
  for(let i=0; i<thread; i++) {
    const limitValue = i == (thread-1) ? limit - (thread-1) * splitLimit : splitLimit
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
        thread: i+1
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
  workers.forEach(worker => {
    worker.postMessage('stop')
  })
})


// Video to video

ipcMain.handle('start-video-to-video', async () => {

})

ipcMain.handle('stop-video-to-video', async () => {

})