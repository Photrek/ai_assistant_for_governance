import React from 'react'
import { CssVarsProvider, Button, Box } from '@mui/joy/'
import { TopBar } from '../components/TopBar/TopBar'
import CssBaseline from '@mui/joy/CssBaseline'
import '@fontsource/space-grotesk'
import { PromptInputInterface } from '../components/PromptInputInterface/PromptInputInterface'
import { OnChainProposalComponent } from '../components/OnChainProposalComponent/OnChainProposalComponent'

const App = (): JSX.Element => {
  
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
            maxWidth:  '100%' , // Ensuring it doesn't take more than half the width
            width:  '100%',
            minWidth: '1200px', // Minimum width to prevent too skinny on small screens
            '@media (max-width: 1200px)': {
              maxWidth: '100%', // Full width on smaller screens
              marginRight: 0,
              marginBottom: 2
            }
          }}
        >
          <PromptInputInterface />
        </Box>
        {/*
          !proposalBoxHide && 
            <Box 
            sx={{ 
              flex: '1 1 0', // This makes it grow and shrink with the container
              maxWidth: '50%', // Ensuring it doesn't take more than half the width
              minWidth: '700px', // Minimum width to prevent too skinny on small screens
              '@media (max-width: 1200px)': {
                maxWidth: '100%', // Full width on smaller screens
                marginBottom: 2
              }
            }}
          >
            <OnChainProposalComponent />
          </Box>
        */}

      </Box>
    </CssVarsProvider>
  )
}

export default App