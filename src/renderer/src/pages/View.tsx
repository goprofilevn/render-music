import {
  FileImageOutlined,
  // VideoCameraOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu } from 'antd'
import React, { useEffect, useState } from 'react'
import ImageToVideo from './ImageToVideo'
import VideoToVideo from './VideoToVideo'
import DownloadImage from './DownloadImage'

const { Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem
}

const items: MenuItem[] = [
  getItem('ImageToVideo', 'imageToVideo', <FileImageOutlined />),
  // getItem('VideoToVideo', 'videoToVideo', <VideoCameraOutlined />),
  getItem('DownloadImage', 'downloadImage', <DownloadOutlined />)
]

const View = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState(['imageToVideo'])
  const onMenuSelect = ({ key }: { key: React.Key }) => setSelectedKeys([key as string])
  useEffect(() => {
    window.electron.ipcRenderer.invoke('check-resource')
  }, [])
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <Menu
          theme="dark"
          defaultSelectedKeys={['imageToVideo']}
          onClick={onMenuSelect}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Content>
          {selectedKeys[0] === 'imageToVideo' ? (
            <ImageToVideo />
          ) : selectedKeys[0] === 'videoToVideo' ? (
            <VideoToVideo />
          ) : selectedKeys[0] === 'downloadImage' ? (
            <DownloadImage />
          ) : null}
        </Content>
        <Footer>Ant Design ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  )
}

export default View
