import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, List, ListItem, Typography, Grid } from '@mui/material';
import { wsp } from "../../API/ogmiosApi";
import { useDarkMode } from "../../hooks/useDarkMode";
import { decode } from 'cbor-x';

export const OnChainProposalComponent: React.FC = () => {
  const [ proposals, setProposals ] = useState<any[]>([]);
  const [ darkMode, setDarkMode ]: any = useDarkMode();

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
      // console.log("wsp result", results);
      parseResults(results.result);
    };
  };

  const parseResults = async (results: any[]): Promise<void> => {
    setProposals([]);
    console.log("results", results);
    try {
      const parsedProposals = await Promise.all(
        results.map(async (proposal: any) => {
          const metadataUri = proposal.metadata.url;
          const metadata: any = await loadJsonMetadata(metadataUri);
          // console.log("metadata", metadata);
          const propInfo: any = { proposal, metadata }
          console.log("propInfo", propInfo);
          return(propInfo);
        })
      );
      setProposals((prevArray: any[]) => [...prevArray, ...parsedProposals]);
      console.log("parsedProposals", parsedProposals);
    } catch (error) {
      console.log("Error parsing results:", error);
      // Handle error appropriately, perhaps by showing a message to the user
    }
  };

  const loadJsonMetadata = async (metadataUri: any) => {
    const response = await fetch(metadataUri);
    console.log("response", response);
    const jsonData: any[] = response.status !== 404 ? await response.json() : null;
    console.log("jsonData", jsonData);
    return(jsonData);
  };

  const toBuffer = (hex: string) => {
    let Buffer = require('buffer/');
    return Buffer.Buffer.from(hex, "hex");
  };
  const fromBuffer = (bytes: any) => {
    let Buffer = require('buffer/');
    return Buffer.Buffer.from(bytes).toString('hex');
  };
  const hex2a = (hexx: any) => {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  };
  const metadataCbortoJSON = async (cborString: string) => {
    cborString = "a40050ca7a1457ef9f4c7f9c747f8c4a4cfa6c0150b234eefdd40e7964bffd31984a01acee0b8758401b840208e4605cbe0639cd37d04e4a721260b9d3c7c7277ce796d4d6d66e0924812758a651c06160a905167076cbc8c22093c9e0a27fdb9bf0132c50749088a258408244e44c3d1a8544a1b01075bbff8680858de676f1077fc0c3469b60b02950264640460d2e057e258032eb712888a000a45af029f07422fe0ba03021a020acae58406195d0c927a293d9740ecc344482c20282202c202a04c24296ce12124e28461109f9cd122c68ae720e5a01a134dcdf9d297ac3b261683ac611ee16ac6f9ee96058404c8f922673b3903e5f68be8c3611e33ca29e7bb89a364b64625e3799204e25bb71cd3f0944de4e7ceb1db93739823dd84a6622c398016ba33017476e278740e75840819f243fbf83b373207fd0b3bddd712f1108f1f775170f0a0804df30df08cf88888860e1507f674f61ff0007111f51517710f474f6727173f315f50ef20d741258400e72f3120f827e46b5ef5bf2259d745d881395dbcb87b4132578d3b52502a643e2968c5593ddadba0d0d3a499daca65efa0cbe861e6fc3e28b5e29c21d97f22a5830875e98bd35c62d7168991336e3b1cce5c72fd23a27342310c8447c044abff77bd5d45a7852fb62e253c3b4d2561c8d001863584039ab631ea01169abcc48afa60f53b9cd36319bfda24c8194845ef56f4054e5ffcd79a13e27fd8162df486464598166a8836f05952b53069625bc988a575e5e0b"
    try{

      const metadataJSONBuffer = await toBuffer(cborString);
      const metadataCBOR = decode(metadataJSONBuffer);
      const onetoHex = fromBuffer(metadataCBOR["0"])
      console.log("cborJson", onetoHex);
      return(metadataCBOR);
    }catch(error){
      console.log("cborJson Error", error)
      return(error);
    }
  };

  useEffect(() => {
    metadataCbortoJSON("");
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

        {/* Proposal */}
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '10px',
          backgroundColor: darkMode ? 'black' : '#f5f5f5'
        }}>
          <List>
           <GovernanceProposals proposals={proposals} darkMode={darkMode} />
          </List>
        </Box>      
    </Box>
    </>
  )
};

import { Divider, Paper, useTheme } from '@mui/material';

interface Proposal {
  proposal: any;
  metadata: any;
}

const GovernanceProposals: React.FC<{ proposals: Proposal[]; darkMode: boolean }> = ({ proposals, darkMode }) => {
  const theme = useTheme();

  // State to control the expansion of proposal details, references, and votes
  const [expandedProposals, setExpandedProposals] = useState<{ [key: number]: { details: boolean; references: boolean; votes: boolean } }>({});

  const toggleExpand = (index: number, type: 'details' | 'references' | 'votes') => {
    setExpandedProposals(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [type]: !prev[index]?.[type]
      }
    }));
  };

  return (
    <Box 
      sx={{
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        maxWidth: '900px', 
        height: '90vh', 
        margin: 'auto', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: theme.shadows[5],
        backgroundColor: darkMode ? theme.palette.background.paper : '#f5f5f5',
        [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
          height: 'calc(100vh - 64px)'
        }
      }}
    >
      <Box sx={{ padding: '20px', backgroundColor: darkMode ? theme.palette.background.default : '#e0e0e0' }}>
        <Typography variant="h5" gutterBottom>
          Onchain Governance Proposals
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
        <List>
          {proposals.map((proposal, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ padding: '0', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Paper elevation={3} sx={{ width: '100%', mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {proposal.metadata?.body?.title || "Missing Title"}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    <strong>Type:</strong> {proposal.proposal.action.type}<br />
                    <strong>ID:</strong> {proposal.proposal.proposal.transaction.id}<br />
                    <strong>Since:</strong> {proposal.proposal.since.epoch}<br />
                    <strong>Until:</strong> {proposal.proposal.until.epoch}<br />
                    <strong>Deposit:</strong> {proposal.proposal.deposit.ada.lovelace} Lovelace<br />
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Summary:</Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      {proposal.metadata?.body?.abstract || "No data available"}
                    </Typography>
                  </Box>

                  {/* Details Button */}
                  {expandedProposals[index]?.details ? (
                    <>
                      {['Motivation', 'Rationale'].map((section) => (
                        <Box key={section} sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{section}</Typography>
                          <Divider sx={{ my: 0.5 }} />
                          <Typography variant="body2">
                            {proposal.metadata?.body?.[section.toLowerCase()] || "No data available"}
                          </Typography>
                        </Box>
                      ))}
                      <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => toggleExpand(index, 'details')}>
                        View Less Details
                      </Button>
                    </>
                  ) : (
                    <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => toggleExpand(index, 'details')}>
                      View Details
                    </Button>
                  )}

                  <Box sx={{ mt: 2 }}>
                    {/* References Button */}
                    <Button variant="outlined" size="small" onClick={() => toggleExpand(index, 'references')}>
                      {expandedProposals[index]?.references ? 'Hide References' : 'View References'}
                    </Button>
                    {expandedProposals[index]?.references && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">References:</Typography>
                        {proposal.metadata?.body?.references?.map((ref: any, refIndex: number) => (
                          <Box key={refIndex}>
                            <Typography variant="body2">
                              <strong>Type:</strong> {ref['@type']}<br />
                              <strong>Label:</strong> {ref.label}<br />
                              <strong>URI:</strong> <a href={ref.uri} target="_blank" rel="noopener noreferrer">{ref.uri}</a>
                            </Typography>
                          </Box>
                        )) || <Typography variant="body2">No references available.</Typography>}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    {/* Votes Button */}
                    <Button variant="outlined" size="small" onClick={() => toggleExpand(index, 'votes')}>
                      {expandedProposals[index]?.votes ? 'Hide Votes' : 'View Votes'}
                    </Button>
                    {expandedProposals[index]?.votes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">Votes:</Typography>
                        {proposal.proposal.votes ? (
                          Object.entries(proposal.proposal.votes.reduce((acc: any, vote: any) => {
                            acc[vote.issuer.role] = acc[vote.issuer.role] || { yes: 0, no: 0 };
                            acc[vote.issuer.role][vote.vote]++;
                            return acc;
                          }, {})).map(([role, counts]: [string, any]) => (
                            <Typography key={role} variant="body2">
                              <strong>{role}:</strong> Yes: {counts.yes}, No: {counts.no}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2">
                            No votes recorded.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </ListItem>
              {index < proposals.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};
