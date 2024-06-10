import ffmpeg from 'fluent-ffmpeg'
import { isMainThread, workerData, parentPort } from 'worker_threads'
import { getFolderFiles, getInfo, getInfoAll, timeMarkToSeconds } from './utils'
import path from 'path'
import os from 'os'
import fs from 'fs'

const homdeDir = os.homedir()

ffmpeg.setFfmpegPath(path.join(homdeDir, '.render-music', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffmpeg.exe'))
ffmpeg.setFfprobePath(path.join(homdeDir, '.render-music', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffprobe.exe'))

const renderAudio = ({
  maxDuration,
  audioInfos,
  stt
}: {
  audioInfos: ffmpeg.FfprobeData[]
  maxDuration: number
  stt: number
}): Promise<{
  audioFile: string
  duration: number
}> => {
  return new Promise(async (resolve, reject) => {
    const tempFolder = os.tmpdir()
    let totalDuration = 0
    const commandAudio = ffmpeg()
    let count = 0
    const selected = []
    maxDuration = maxDuration * 60
    for (let i = 0; i < audioInfos.length; i++) {
      const index = Math.floor(Math.random() * audioInfos.length)
      if (selected.includes(index)) {
        continue
      }
      selected.push(index)
      const audio = audioInfos[index]
      totalDuration += audio.format.duration
      commandAudio.input(audio.format.filename)
      count++
      if (totalDuration > maxDuration) {
        break
      }
    }
    commandAudio.mergeToFile(path.join(tempFolder, `${stt}.mp3`), tempFolder)
    commandAudio.on('end', () => {
      resolve({
        audioFile: path.join(tempFolder, `${stt}.mp3`),
        duration: totalDuration
      })
    })
    commandAudio.on('error', (err) => {
      reject(err)
    })
    // commandAudio.on('progress', (progress) => {
    //   parentPort.postMessage({
    //     progress: {
    //       type: 'update',
    //       action: 'audio',
    //       stt,
    //       percent: Math.floor(progress.percent / count),
    //       thread
    //     }
    //   })
    // })
  })
}

const renderAudioMix = ({
  maxDuration,
  audioInfos,
  randomAudioInfo,
  stt
}: {
  audioInfos: ffmpeg.FfprobeData[]
  randomAudioInfo: ffmpeg.FfprobeData
  maxDuration: number
  stt: number
}): Promise<{
  audioFile: string
  duration: number
}> => {
  return new Promise(async (resolve, reject) => {
    const tempFolder = os.tmpdir()
    let totalDuration = 0
    const commandAudio = ffmpeg()
    let count = 0
    const selected = []
    maxDuration = maxDuration * 60
    for (let i = 0; i < audioInfos.length; i++) {
      const index = Math.floor(Math.random() * audioInfos.length)
      if (selected.includes(index)) {
        continue
      }
      selected.push(index)
      const audio = audioInfos[index]
      totalDuration += audio.format.duration
      commandAudio.input(audio.format.filename)
      totalDuration += randomAudioInfo.format.duration
      commandAudio.input(randomAudioInfo.format.filename)
      count++
      if (totalDuration > maxDuration) {
        break
      }
    }
    // render to aac
    commandAudio.mergeToFile(path.join(tempFolder, `${stt}.mp3`), tempFolder)
    commandAudio.on('end', () => {
      resolve({
        audioFile: path.join(tempFolder, `${stt}.mp3`),
        duration: totalDuration
      })
    })
    commandAudio.on('error', (err) => {
      reject(err)
    })
    // commandAudio.on('progress', (progress) => {
    //   parentPort.postMessage({
    //     progress: {
    //       type: 'update',
    //       action: 'audio',
    //       stt,
    //       percent: Math.floor(progress.percent / count),
    //       thread
    //     }
    //   })
    // })
  })
}

const getListRenderMix = ({
  maxDuration,
  audioInfos,
  audioRandomInfo,
}: {
  audioInfos: ffmpeg.FfprobeData[]
  audioRandomInfo: ffmpeg.FfprobeData
  maxDuration: number
}): string[][] => {
  let totalDuration = 0
  let count = 0
  const selected = []
  maxDuration = maxDuration * 60
  const commands = []
  for (let i = 0; i < audioInfos.length; i++) {
    const index = Math.floor(Math.random() * audioInfos.length)
    if (selected.includes(index)) {
      continue
    }
    selected.push(index)
    const audio = audioInfos[index]
    totalDuration += audio.format.duration
    totalDuration += audioRandomInfo.format.duration
    const items = []
    items.push(audio.format.filename)
    items.push(audioRandomInfo.format.filename)
    commands.push(items)
    count++
    if (totalDuration > maxDuration) {
      break
    }
  }
  return commands
}

const mergeAudio = async ({ list, stt, index }: {
  list: string[],
  stt: number,
  index?: number
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempFolder = os.tmpdir()
    const fileName = index ? `${stt}_${index}.mp3` : `${stt}.mp3`
    const command = ffmpeg()
    for (const item of list) {
      command.input(item)
    }
    command.mergeToFile(path.join(tempFolder, fileName), tempFolder)
    command.on('end', () => {
      resolve(path.join(tempFolder, fileName))
    })
    command.on('error', (err) => {
      reject(err)
    })
  })
}

const compareAudioImage = async ({
  stt,
  audioFile,
  imageFile,
  outputFile,
  duration,
  thread
}: {
  audioFile: string
  imageFile: string
  outputFile: string
  duration: number
  stt: number
  thread: number
}) => {
  return new Promise((resolve, reject) => {
    const commandVideo = ffmpeg()
    commandVideo.input(imageFile)
    commandVideo.inputOption('-loop 1')
    commandVideo.input(audioFile)
    commandVideo.outputOptions([
      '-r 1',
      '-c:v libx264',
      '-tune stillimage',
      '-crf 18',
      '-c:a copy',
      '-shortest',
      '-s 1920x1080'
    ])
    commandVideo.output(outputFile)
    commandVideo.on('end', () => {
      resolve(outputFile)
    })
    commandVideo.on('error', (err) => {
      reject(err)
    })
    commandVideo.on('progress', (progress) => {
      const time = timeMarkToSeconds(progress.timemark)
      const percent = Math.floor((time / duration) * 100)
      parentPort.postMessage({
        progress: {
          type: 'update',
          action: 'video',
          stt,
          percent,
          thread
        }
      })
    })
    commandVideo.run()
  })
}

  ; (async () => {
    if (isMainThread) {
      process.exit(0)
    }
    try {
      parentPort.once('message', (message) => {
        if (message === 'stop') {
          process.exit(0)
        }
      })
      const { audioFolder, imageFolder, outputFolder, maxDuration, limit, type, thread, randomAudio } = workerData
      console.log('thread', thread, limit)
      if (type == 'imageToVideo') {
        const imageFiles = (await getFolderFiles(imageFolder)).filter(
          (file) => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
        )
        if (!randomAudio) {
          const audioInfos = await getInfoAll(audioFolder)
          for (let i = 0; i < limit; i++) {
            const stt = (thread - 1) * limit + i + 1
            const image = imageFiles[Math.floor(Math.random() * imageFiles.length)]
            const buffer = fs.readFileSync(path.join(imageFolder, image))
            const outputFile = path.join(outputFolder, `${stt}.mp4`)
            parentPort.postMessage({
              progress: {
                type: 'add',
                stt,
                pathFile: outputFile,
                progress: 0,
                image: `data:image/jpeg;base64,${buffer.toString('base64')}`
              }
            })
            // render audio
            const { audioFile, duration } = await renderAudio({ audioInfos, maxDuration, stt })
            // join audio and image to video
            await compareAudioImage({
              stt,
              audioFile,
              imageFile: path.join(imageFolder, image),
              outputFile: outputFile,
              duration,
              thread
            })
            fs.unlinkSync(audioFile)
          }
        } else {
          const audioInfos = await getInfoAll(audioFolder)
          const randomAudioInfo = await getInfo(randomAudio)
          for (let i = 0; i < limit; i++) {
            const stt = (thread - 1) * limit + i + 1
            const image = imageFiles[Math.floor(Math.random() * imageFiles.length)]
            const buffer = fs.readFileSync(path.join(imageFolder, image))
            const outputFile = path.join(outputFolder, `${stt}.mp4`)
            parentPort.postMessage({
              progress: {
                type: 'add',
                stt,
                pathFile: outputFile,
                progress: 0,
                image: `data:image/jpeg;base64,${buffer.toString('base64')}`
              }
            })
            // // render audio
            // const commands = getListRenderMix({
            //   audioInfos,
            //   audioRandomInfo: randomAudioInfo,
            //   maxDuration,
            // })
            // // render tung doan
            // const audioFiles = []
            // for(let i = 0; i < commands.length; i++) {
            //   const audioFile = await mergeAudio({ list: commands[i], stt, index: i })
            //   audioFiles.push(audioFile)
            // }
            // const audioFile = await mergeAudio({ list: audioFiles, stt })

            const { audioFile, duration } = await renderAudioMix({ audioInfos, randomAudioInfo, maxDuration, stt })

            // join audio and image to video
            await compareAudioImage({
              stt,
              audioFile,
              imageFile: path.join(imageFolder, image),
              outputFile: outputFile,
              duration,
              thread
            })
            fs.unlinkSync(audioFile)
          }
        }
      } else {
        // not implemented
      }
    } catch(ex) {
      console.error(ex)
    }
    process.exit(0)
  })()
