/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { DarkLightToggle } from '../DarkLightToggle/DarkLightToggle';
import { Sheet, Typography } from '@mui/joy';
import { EndpointSettingsModal } from '../EndpointSettingsModal/EndpointSettingsModal';
import { OnChainProposalComponent } from '../OnChainProposalComponent/OnChainProposalComponent';

export const TopBar = (): JSX.Element => {

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
          backgroundColor: 'background.body',
        }}
      >
        <Sheet
          sx={{
            display: 'flex',
            flexDirection: 'row', // Ensure buttons are side by side
            alignItems: 'center',
            gap: '0.5rem', // Add spacing between buttons
          }}
        >
          <DarkLightToggle />
          <EndpointSettingsModal />
          <OnChainProposalComponent />
        </Sheet>
        
        <Typography level="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          {/* <img src={icon} alt="Icon" height="25" style={{ marginRight: '0.5rem' }} /> */}
          AI Assistant for Governance: Empowering Team-Based dReps
        </Typography>
      </Sheet>
    </>
  );
};