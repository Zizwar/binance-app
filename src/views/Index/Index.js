import './Index.css'
import React, { useState} from 'react'

import WatchTable from './WatchTable/WatchTable'
import HoldTable from './HoldTable/HoldTable'

import { Button, Input, Divider, Modal, Alert } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'

import { makeHashParams, isUsingHash } from 'utils/hashParams'

import { useSelector } from 'react-redux'
import { selectListWatch } from './WatchTable/watchListSlice'
import { selectListHold } from './HoldTable/holdListSlice'

function Index() {
  const [shareToggle, setShareToggle] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)

  const listWatch = useSelector(selectListWatch)
  const listHold = useSelector(selectListHold)

  function shareYourList() {
    const shareUrl = makeHashParams({
      listWatch,
      listHold,
    })
    setShareUrl(shareUrl)
    setShareToggle(state => !state)
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl.toString())
    setShareToggle(state => !state)
  }

  function createYourList() {
    window.location.href = window.location.origin
  }

  return (
    <React.Fragment>
      <div className="index-header">
        {!isUsingHash.check && <Button type="primary" size="large" icon={<ShareAltOutlined />} onClick={shareYourList}>Share your list</Button>}
        {isUsingHash.check && <Button type="primary" size="large" onClick={createYourList}>Create your own list</Button>}
      </div>
      <Modal title="Share your list" visible={shareToggle}
             onOk={() => { copyShareUrl().then(() => setShareToggle(false)); }}
             okText="Copy to clipboard"
             onCancel={() => setShareToggle(false)}>
        <p>You can share your list to your friends by sending them this URL</p>
        <p><Input value={shareUrl} /></p>
        <p>
          <Alert
            message="Warning"
            description="If you change your data (watch list / hold list), a new hash will be generated, so when you change the data please copy the new URL and share again"
            type="warning"
            showIcon
            closable
          />
        </p>
      </Modal>
      <div className="index-container">
        <h2>Watch List</h2>
        <WatchTable/>
        <Divider dashed={true} />
        <h2>Hold List</h2>
        <HoldTable />
      </div>
    </React.Fragment>
  )
}

export default React.memo(Index)
