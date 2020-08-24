import { DesktopHeader } from 'components/layouts/SiteLayout/DesktopHeader'
import { MobileHeader } from 'components/layouts/SiteLayout/MobileHeader'
import { observer } from 'mobx-react'
import React from 'react'

export type HeaderProps = {
  hideCreate?: boolean
}

export const Header: React.FC<HeaderProps> = observer(
  ({ hideCreate = false }) => {
    const desktopHeader = <DesktopHeader hideCreate={hideCreate} />

    const mobileHeader = <MobileHeader hideCreate={hideCreate} />

    return (
      <>
        {desktopHeader}
        {mobileHeader}
      </>
    )
  }
)
