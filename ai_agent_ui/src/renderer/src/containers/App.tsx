import React from 'react';
import { CssVarsProvider, Box } from '@mui/joy/';
import { TopBar } from '../components/TopBar/TopBar';
import CssBaseline from '@mui/joy/CssBaseline';
import '@fontsource/space-grotesk';
import { PromptInputInterface } from '../components/PromptInputInterface/PromptInputInterface';

const App = (): JSX.Element => {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <TopBar />
      <Box
        sx={{
          width: '100%',
          margin: 'auto',
          padding: 2,
          '@media (max-width: 960px)': {
            flexDirection: 'column',
            height: 'auto',
          },
        }}
      >
        <Box
          sx={{
            margin: '0 auto',
            maxWidth: '100%', // Allow full width
            width: '100%',
            '@media (max-width: 960px)': {
              maxWidth: '100%', // Full width on smaller screens
              marginRight: 0,
              marginBottom: 2,
            },
          }}
        >
          <PromptInputInterface />
        </Box>
      </Box>
    </CssVarsProvider>
  );
};

export default App;