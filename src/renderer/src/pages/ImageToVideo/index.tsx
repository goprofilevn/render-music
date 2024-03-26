import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Progress,
  Row,
  Space,
  Switch,
  message
} from 'antd'
import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks'
import {
  setOutputFolder,
  setThread,
  setAudioFolder,
  setImageFolder,
  setMaxDuration,
  setLimit
} from '@renderer/redux/reducers/settingSlice'
import { useEffect, useState } from 'react'
import { addProgress, initProgress, updateProgress } from '@renderer/redux/reducers/progressSlice'
import Scrollbars from 'react-custom-scrollbars-2'

const ImageToVideo = () => {
  const table = 'imageToVideo'
  const dispatch = useAppDispatch()
  const progress = useAppSelector((state) => state.progress[table])
  const { outputFolder, thread, limit, audioFolder, imageFolder, useGPU, maxDuration } =
    useAppSelector((state) => state.setting[table])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const handleSelectFile = (key: string) => {
    window.electron.ipcRenderer.invoke('select-folder').then((result: string) => {
      if (result) {
        switch (key) {
          case 'outputFolder':
            dispatch(setOutputFolder({ table, outputFolder: result }))
            break
          case 'audioFolder':
            dispatch(setAudioFolder({ table, audioFolder: result }))
            break
          case 'imageFolder':
            dispatch(setImageFolder({ table, imageFolder: result }))
            break
        }
      }
    })
  }
  const handleStart = () => {
    if (!audioFolder) {
      message.error('Audio Folder is required')
      return
    }
    if (!imageFolder) {
      message.error('Image Folder is required')
      return
    }
    if (!outputFolder) {
      message.error('Output Folder is required')
      return
    }
    if (!maxDuration) {
      message.error('Max Duration is required')
      return
    }
    if (!thread) {
      message.error('Thread is required')
      return
    }
    if (!limit) {
      message.error('Limit is required')
      return
    }
    setLoading(true)
    window.electron.ipcRenderer.send('start-image-to-video', {
      audioFolder,
      imageFolder,
      outputFolder,
      maxDuration,
      thread,
      limit,
      useGPU
    })
  }
  const handleStop = () => {
    setLoading(true)
    window.electron.ipcRenderer.send('stop-image-to-video')
  }
  useEffect(() => {
    window.electron.ipcRenderer.on('status-image-to-video', (_, data) => {
      switch (data.status) {
        case 'error':
          message.error(data.message)
          break
        case 'success':
          message.success(data.message)
          break
        case 'info':
          message.info(data.message)
          break
        case 'started':
          setLoading(false)
          setRunning(true)
          dispatch(initProgress(table))
          if (data.message) {
            message.info(data.message)
          }
          break
        case 'stopped':
          setLoading(false)
          setRunning(false)
          if (data.message) {
            message.info(data.message)
          }
          break
      }
    })
    window.electron.ipcRenderer.on('progress-image-to-video', (_, data) => {
      if (data.action == 'audio') return
      if (data.type === 'add') {
        dispatch(addProgress({ table, progress: data }))
      } else {
        dispatch(updateProgress({ table, stt: data.stt, progress: data.percent }))
      }
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('status-image-to-video')
      window.electron.ipcRenderer.removeAllListeners('progress-image-to-video')
    }
  }, [])
  return (
    <>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="Image To Video">
            <Form layout="vertical">
              <Form.Item label="Audio Folder">
                <Space.Compact block>
                  <Input value={audioFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('audioFolder')}>
                    Select Folder
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item label="Image Folder" name="imageFolder">
                <Space.Compact block>
                  <Input value={imageFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('imageFolder')}>
                    Select Folder
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item label="Output Folder">
                <Space.Compact block>
                  <Input value={outputFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('outputFolder')}>
                    Select Folder
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Row>
                <Col span={6}>
                  <Form.Item label="Use GPU" tooltip="Chưa hỗ trợ">
                    <Switch
                      checked={useGPU}
                      // onChange={(value) => {
                      //   dispatch(setUseGPU({ table, useGPU: value }))
                      // }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Max Duration">
                    <InputNumber
                      min={1}
                      value={maxDuration}
                      onChange={(value) => {
                        dispatch(setMaxDuration({ table, maxDuration: value }))
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Thread">
                    <InputNumber
                      min={1}
                      value={thread}
                      onChange={(value) => {
                        dispatch(setThread({ table, thread: value }))
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Limit">
                    <InputNumber
                      min={1}
                      value={limit}
                      onChange={(value) => {
                        dispatch(setLimit({ table, limit: value }))
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {running ? (
                  <>
                    <Button type="primary" danger loading={loading} onClick={handleStop}>
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button type="primary" loading={loading} onClick={handleStart}>
                    Start
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Progress">
            <Scrollbars style={{ height: '500px' }}>
              <List
                itemLayout="horizontal"
                dataSource={progress}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Image src={item?.image} height={50} />}
                      title={`${item.stt}. ${item?.pathFile}`}
                      description={<Progress percent={item?.progress} status="active" />}
                    />
                  </List.Item>
                )}
              />
            </Scrollbars>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ImageToVideo
