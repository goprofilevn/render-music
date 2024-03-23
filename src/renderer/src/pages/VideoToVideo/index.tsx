import { Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch } from 'antd'
import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks'
import { setVideoFolder, setOutputFolder, setThread, setMaxDuration, setLimit, setAudioFolder } from '@renderer/redux/reducers/settingSlice'

const VideoToVideo = () => {
  const table = 'videoToVideo'
  const dispatch = useAppDispatch()
  // const progress = useAppSelector(state => state.progress[table])
  const { outputFolder, thread, limit, audioFolder, videoFolder, useGPU, maxDuration } = useAppSelector(state => state.setting[table])
  const handleSelectFile = (key: string) => {
    window.electron.ipcRenderer.invoke('select-folder').then((result: string) => {
      if (result) {
        switch (key) {
          case 'outputFolder':
            dispatch(setOutputFolder({ table, outputFolder: result }))
            break
          case 'videoFolder':
            dispatch(setVideoFolder({ table, videoFolder: result }))
            break
          case 'audioFolder':
            dispatch(setAudioFolder({ table, audioFolder: result }))
            break
        }
      }
    })
  }
  return (
    <>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="Video To Video">
            <Form layout="vertical">
              <Form.Item
                label="Audio Folder"
              >
                <Space.Compact block>
                  <Input value={audioFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('audioFolder')}>Select Folder</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                label="Video Folder"
                name="videoFolder"
              >
                <Space.Compact block>
                  <Input value={videoFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('videoFolder')}>Select Folder</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                label="Output Folder"
              >
                <Space.Compact block>
                  <Input value={outputFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFile('outputFolder')}>Select Folder</Button>
                </Space.Compact>
              </Form.Item>
              <Row>
                <Col span={6}>
                  <Form.Item
                    label="Use GPU"
                    tooltip="Chưa hỗ trợ"
                  >
                    <Switch
                      checked={useGPU}
                      // onChange={(value) => {
                      //   dispatch(setUseGPU({ table, useGPU: value }))
                      // }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Max Duration"
                  >
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
                  <Form.Item
                    label="Thread"
                  >
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
                  <Form.Item
                    label="Limit"
                  >
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
              <Button type="primary">Start</Button>
            </Form>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Progress">
            {/* <Progress percent={progress} status="active" /> */}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default VideoToVideo