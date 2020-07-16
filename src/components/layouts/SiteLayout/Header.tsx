import { DesktopHeader } from 'components/layouts/SiteLayout/DesktopHeader'
import { observer } from 'mobx-react'
import React from 'react'
import { MobileHeader } from 'components/layouts/SiteLayout/MobileHeader'

export type HeaderProps = {
  fullWidth?: boolean
  hideCreate?: boolean
}

export const Header: React.FC<HeaderProps> = observer(
  ({ fullWidth = false, hideCreate = false }) => {
    const desktopHeader = (
      <DesktopHeader fullWidth={fullWidth} hideCreate={hideCreate} />
    )

    const mobileHeader = <MobileHeader hideCreate={hideCreate} />

    return (
      <>
        {desktopHeader}
        {mobileHeader}
      </>
    )
  }
)
