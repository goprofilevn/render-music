import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks'
import { addProgress, initProgress } from '@renderer/redux/reducers/progressSlice'
import {
  setKeyword,
  setOutputFolder,
  setServer,
  setMaxPage,
  setSize
} from '@renderer/redux/reducers/settingSlice'
import {
  Input,
  Form,
  Space,
  Button,
  Card,
  Row,
  Col,
  message,
  List,
  Image,
  Progress,
  Select,
  InputNumber
} from 'antd'
import { useEffect, useState } from 'react'
import { Scrollbars } from 'react-custom-scrollbars-2'

const DownloadImage = () => {
  const table = 'downloadImage'
  const dispatch = useAppDispatch()
  const progress = useAppSelector((state) => state.progress[table])
  const { keyword, outputFolder, server, maxPage, size } = useAppSelector((state) => state.setting[table])
  const [form] = Form.useForm()
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [percent, setPercent] = useState(0)
  const handleSelectFile = () => {
    window.electron.ipcRenderer.invoke('select-folder').then((result: string) => {
      if (result) {
        dispatch(setOutputFolder({ table, outputFolder: result }))
      }
    })
  }
  const handleStart = () => {
    if (!keyword) {
      message.error('Keyword is required')
      return
    }
    if (!outputFolder) {
      message.error('Output Folder is required')
      return
    }
    setLoading(true)
    window.electron.ipcRenderer.send('start-download-image', {
      keyword,
      outputFolder,
      maxPage,
      size,
      server
    })
  }
  const handleStop = () => {
    setLoading(true)
    window.electron.ipcRenderer.send('stop-download-image')
  }
  useEffect(() => {
    window.electron.ipcRenderer.on('status-download-image', (_, data) => {
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
    window.electron.ipcRenderer.on('progress-download-image', (_, data) => {
      dispatch(addProgress({ table, progress: data }))
      if (data?.total) {
        setPercent(Math.floor(((data.stt + 1) / data.total) * 100))
      }
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('status-download-image')
      window.electron.ipcRenderer.removeAllListeners('progress-download-image')
    }
  }, [])
  return (
    <>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="Download Image">
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item label="Keyword">
                    <Input
                      value={keyword}
                      onChange={(e) => {
                        dispatch(setKeyword({ table, keyword: e.target.value }))
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Server">
                    <Select
                      value={server}
                      onChange={(value) => {
                        dispatch(setServer({ table, server: value }))
                      }}
                      options={[
                        {
                          label: 'Lexica',
                          value: 'lexica'
                        },
                        {
                          label: 'Unsplash',
                          value: 'unsplash'
                        }
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Size">
                    <Input
                      placeholder='1280x720'
                      value={size}
                      onChange={(e) => {
                        dispatch(setSize({ table, size: e.target.value }))
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Max Page"
                    tooltip="lexica: 100, unsplash: 20 (per page)"
                  >
                    <InputNumber
                      value={maxPage}
                      onChange={(value) => {
                        dispatch(setMaxPage({ table, maxPage: value }))
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Output Folder">
                <Space.Compact block>
                  <Input value={outputFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile()}>
                    Select File
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item>
                {running ? (
                  <>
                    <Progress percent={percent} status="active" />
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
                      avatar={<Image src={item.image} height={50} />}
                      title={`${item.stt}. ${item.pathFile}`}
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

export default DownloadImage
