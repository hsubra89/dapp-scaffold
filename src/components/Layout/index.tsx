import { Layout } from "antd"
import React from "react"
import { Link } from "react-router-dom"
import { LABELS } from "../../constants"
import { AppBar } from "../AppBar"
import "./../../App.less"

export const AppLayout = React.memo(({ children }) => {
  return (
      <div className="App wormhole-bg">
        <Layout title={LABELS.APP_TITLE}>
          <Layout.Header className="App-Bar">
            <Link to="/">
              <div className="app-title">
                <h2>{ LABELS.APP_TITLE }</h2>
              </div>
            </Link>
            <AppBar />
          </Layout.Header>
          <Layout.Content style={{ padding: '50px' }}>{children}</Layout.Content>
        </Layout>
      </div>
  )
})
