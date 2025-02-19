/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { DarkLightToggle } from '../DarkLightToggle/DarkLightToggle'
import { Sheet, Typography, IconButton, Menu, MenuItem } from '@mui/joy'
import icon from '../../../../../resources/logo.svg?asset'
import MenuIcon from '@mui/icons-material/Menu'
import { EndpointSettingsModal } from '../EndpointSettingsModal/EndpointSettingsModal'

export const TopBar = (): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    // If the menu is open, close it; otherwise, open it
    setAnchorEl(anchorEl ? null : event.currentTarget)
    return void 0
  }

  return (
    <>
      {/* Top App Bar */}
      <Sheet
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'background.body'
        }}
      >
        <EndpointSettingsModal />
        <Typography level="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          { /* <img src={icon} alt="Icon" height="25" style={{ marginRight: '0.5rem' }} /> */}
          AI Assistant for Governance: Empowering Team-Based dReps
        </Typography>
        <Sheet>
          {/* Settings Menu Button */}
          <IconButton onClick={handleClick} size="sm">
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)} // Close when clicking outside the menu
            sx={{ mt: 1 }}
          >
            <MenuItem>
              <DarkLightToggle />
            </MenuItem>
          </Menu>
        </Sheet>
      </Sheet>
    </>
  )
}
