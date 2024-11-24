import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, List, ListItem, Typography, Grid } from '@mui/material';
import { wsp } from "../../API/ogmiosApi";

export const OnChainProposalComponent: React.FC = () => {
  const [proposals, setProposals] = useState();

  const getProposal = async () => {
    const method: string = "queryLedgerState/governanceProposals";
    const params = {
      "params": {
        "proposals": []
      },
    };

    let wspRes = wsp(method, {
      "params": {
        "proposals": []
      },
    });
    wspRes.onmessage = (e: any) => {
      const results = JSON.parse(e.data);
      console.log("wsp result", results);
    };
  };

  useEffect(() => {
    getProposal();
  }, []);

  return (
    <>
    <Box sx={{
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', // Full width of its container
      maxWidth: '900px', // Maximum width, so it doesn't get too wide on large screens
      height: '90vh', // 80% of the viewport height, adjust as necessary
      margin: 'auto', // Center the box if it has a max-width
      border: '1px solid #ccc', 
      borderRadius: '4px', 
      overflow: 'hidden',
      [`@media (max-width: 600px)`]: { // Example media query for smaller screens
        height: 'calc(100vh - 56px)' // Adjust for mobile, considering app bars or similar UI elements
      }
    }}>
      </Box>
    </>
  )
};