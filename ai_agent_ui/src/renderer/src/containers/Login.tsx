import React from 'react'
import { CssVarsProvider } from '@mui/joy/'
import { TopBar } from '../components/TopBar/TopBar'
import CssBaseline from '@mui/joy/CssBaseline'
import '@fontsource/space-grotesk'
import { LoginBox } from '../components/LoginBox/LoginBox'
import { Box } from '@mui/joy';

const Login = (): JSX.Element => {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <TopBar />
      <Box 
        sx={{
          display: 'flex',
          width: '100%',
          
          margin: 'auto',
          padding: 2,
          '@media (max-width: 1200px)': { 
            flexDirection: 'column',
            height: 'auto'
          }
        }}
      >
        <Box 
          sx={{ 
            flex: '1 1 0', // This makes it grow and shrink with the container
            marginRight: 2, // Adding some space between the components
            maxWidth: '50%', // Ensuring it doesn't take more than half the width
            minWidth: '700px', // Minimum width to prevent too skinny on small screens
            '@media (max-width: 1200px)': {
              maxWidth: '100%', // Full width on smaller screens
              marginRight: 0,
              marginBottom: 2
            }
          }}
        >
          <LoginBox />
        </Box>
      </Box>
    </CssVarsProvider>
  )
}

export default Login