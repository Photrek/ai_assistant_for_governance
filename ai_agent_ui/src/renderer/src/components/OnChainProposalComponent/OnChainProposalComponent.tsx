import React, { useState, useEffect, ReactNode } from 'react';
import { Sheet, Button, List, ListItem, Typography, Box, Card, Divider } from '@mui/joy';
import { wsp } from '../../API/ogmiosApi';
import { useColorScheme } from '@mui/joy/styles';
import { decode } from 'cbor-x';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import { duotoneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { proposalsHook } from '../../hooks/proposalsHook';
import { showProposalsHook } from '../../hooks/miscHooks'

export const OnChainProposalComponent: React.FC = () => {
  const [ proposals, setProposals ] = proposalsHook<any[]>();
  const { mode, setMode } = useColorScheme();
  const [ proposalBoxHide, setProposalBoxHide ] = showProposalsHook()

  // console.log('mode', mode);

  const getProposal = async () => {
    console.log('getProposal')
    const method: string = 'queryLedgerState/governanceProposals';
    const params = {
      proposals: []
    };

    let wspRes = wsp(method, params);
    console.log('wspRes', wspRes);
    wspRes.onmessage = (e: any) => {
      const results = JSON.parse(e.data);
      console.log('results', results);
      parseResults(results.result);
    };
  };

  async function parseResults(results: any[]): Promise<void> {
    setProposals([]);
     console.log('results', results);
    try {
      const parsedProposals = await Promise.all(
        results.map(async (proposal: any) => {
          const metadataUri = proposal.metadata.url;
          const metadata: any = await loadJsonMetadata(metadataUri);
          const propInfo: any = { proposal, metadata };
          console.log('propInfo', propInfo);
          return propInfo;
        })
      );
      setProposals((prevArray: any[]) => [...prevArray, ...parsedProposals]);
      console.log('parsedProposals', parsedProposals);
    } catch (error) {
      console.log('Error parsing results:', error);
      // Handle error appropriately, perhaps by showing a message to the user
    }
  };
  
  const preprocessMath = (text: string): string => {
    return text
      .replace(/times/g, '\\cdot')
      .replace(/frac/g, '\\frac')
      .replace(/\\(.)/g, '$1'); // Unescapes backslashes if needed
  };

  const loadJsonMetadata = async (metadataUri: string) => {
    let uri = metadataUri.startsWith('ipfs://') 
      ? `https://ipfs.onchainapps.io/ipfs/${metadataUri.slice(7)}` 
      : metadataUri;
  
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        console.warn('Failed to fetch metadata:', response.statusText);
        return null;
      }
      const jsonData = await response.json();
      if (jsonData.body) {
        for (const key in jsonData.body) {
          if (typeof jsonData.body[key] === 'string') {
            jsonData.body[key] = preprocessMath(jsonData.body[key]);
          }
        }
      }
      console.log('Metadata fetched:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('Error loading metadata:', error);
      return null;
    }
  };

  const toBuffer = (hex: string) => {
    let Buffer = require('buffer/');
    return Buffer.Buffer.from(hex, 'hex');
  };

  const fromBuffer = (bytes: any) => {
    let Buffer = require('buffer/');
    return Buffer.Buffer.from(bytes).toString('hex');
  };

  const hex2a = (hexx: any) => {
    var hex = hexx.toString();
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  };

  const metadataCbortoJSON = async (cborString: string) => {
    cborString = 'your_cbor_string_here'; // Replace with actual string or remove this line if you're passing it
    try {
      const metadataJSONBuffer = await toBuffer(cborString);
      const metadataCBOR = decode(metadataJSONBuffer);
      const onetoHex = fromBuffer(metadataCBOR['0']);
      console.log('cborJson', onetoHex);
      return metadataCBOR;
    } catch (error) {
      console.log('cborJson Error', error);
      return error;
    }
  };

  useEffect(() => {
    getProposal();
  }, [proposalBoxHide]);

  return (
    <Sheet
      sx={{
        mt: 20,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '90vh',
        borderRadius: 'md',
        overflow: 'hidden',
        boxShadow: 'sm',
        bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
        '@media (max-width: 960px)': {
          height: 'calc(100vh - 64px)'
        }
      }}
    >
      <Sheet
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: mode === 'dark' ? 'background.surface' : 'background.body'
        }}
      >
        <List>
          <GovernanceProposals proposals={proposals} mode={mode} />
        </List>
      </Sheet>
    </Sheet>
  );
};

interface Proposal {
  proposal: any;
  metadata: any;
}

const GovernanceProposals: React.FC<{ proposals: Proposal[]; mode: string | undefined }> = ({
  proposals,
  mode
}) => {
  const [expandedProposals, setExpandedProposals] = useState<{
    [key: number]: { details: boolean; references: boolean; votes: boolean }
  }>({});

  const toggleExpand = (index: number, type: 'details' | 'references' | 'votes') => {
    setExpandedProposals((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [type]: !prev[index]?.[type]
      }
    }));
  };

  function renderMessageContent(msg: string, mode: string | undefined): ReactNode {
    if (typeof msg !== 'string') {
      console.warn('Expected msg to be a string, received:', typeof msg);
      return msg as ReactNode; // Type assertion since we can't return 'msg' directly as ReactNode
    }
  
    const parts = msg.split(/(```(\w+)?([\s\S]*?)```|\$\$[\s\S]*?\$\$|(?<!\\)\$(?:(?!\\).)*\$(?<!\\))/);
  
    const elements: ReactNode[] = [];
  
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
  
      if (part && typeof part === 'string') { 
        if (part.startsWith('```')) { // Code block
          const language = parts[i + 1] || 'text';
          const code = parts[i + 2]?.trim() || '';
          if (code) {
            console.log('language: ', language);
            elements.push(
              <Sheet key={`code-${i}`} variant="outlined" sx={{ borderRadius: 'sm', p: 1, mb: 1 }}>
                <Divider />
                <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>AI code block:</Typography>
                <SyntaxHighlighter
                  key={`code-block-${i}`}
                  language={language}
                  style={mode === 'dark' ? oneDark : duotoneLight}
                >
                  {code}
                </SyntaxHighlighter>
              </Sheet>
            );
            i += 2;
          }
        } else if (part.startsWith('$$') && part.endsWith('$$')) { // Block Math
          const math = part.slice(2, -2).trim();
          elements.push(
            <Typography key={`math-${i}`} level="body-md">
              <BlockMath>{math}</BlockMath>
            </Typography>
          );
        } else {  // Regular text or inline math
          const inlineMathRegex = /\$(.*?)\$/g;
          let match: RegExpExecArray | null;
          let lastIndex = 0;
          const segments: string[] = [];
          
          while ((match = inlineMathRegex.exec(part))) {
            if (match.index > lastIndex) {
              segments.push(part.slice(lastIndex, match.index));
            }
            segments.push(match[0]);
            lastIndex = inlineMathRegex.lastIndex;
          }
          if (lastIndex < part.length) {
            segments.push(part.slice(lastIndex));
          }
  
          const renderedSegments = segments.map((segment, idx) => {
            if (segment.startsWith('$') && segment.endsWith('$')) {
              return <InlineMath key={`inline-math-${idx}`}>{segment.slice(1, -1)}</InlineMath>;
            }
            return <Markdown key={`text-${idx}`}>{segment}</Markdown>;
          });
  
          elements.push(
            <Typography key={`desc-${i}`} level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>
              {renderedSegments}
            </Typography>
          );
        }
      }
    }
  
    return elements.length > 0 ? elements : <Typography level="body-md">{msg}</Typography>;
  };

  return (
    <Sheet
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        borderRadius: 'md',
        overflow: 'hidden',
        boxShadow: 'none',
        bgcolor: mode === 'dark' ? 'background.surface' : 'background.body'
      }}
    >
      <Sheet sx={{ bgcolor: mode ? 'background.surface' : 'background.level1' }}>
        <Typography level="h4">Onchain Governance Proposals</Typography>
        <Divider />
      </Sheet>

      <Sheet sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {proposals && proposals.map((proposal, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ padding: '0', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Card variant="outlined" sx={{ width: '100%', mb: 2, p: 2, borderRadius: 'lg' }}>
                  <Typography level="h4" fontWeight="bold">
                    {proposal.metadata?.body?.title || 'Missing Title'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {proposal.proposal.action.type}<br />
                    <strong>ID:</strong> {proposal.proposal.proposal.transaction.id}<br />
                    <strong>Since:</strong> {proposal.proposal.since.epoch}<br />
                    <strong>Until:</strong> {proposal.proposal.until.epoch}<br />
                    <strong>Deposit:</strong> {proposal.proposal.deposit.ada.lovelace} Lovelace
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography level="h4" fontWeight="bold">
                      Summary:
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                    {renderMessageContent(proposal.metadata?.body?.abstract || 'No data available', mode)}
                  </Box>

                  {/* Details Button */}
                  {expandedProposals[index]?.details ? (
                    <>
                      {['Motivation', 'Rationale'].map((section) => (
                        <Box key={section} sx={{ mt: 2 }}>
                          <Typography level="h4" fontWeight="bold">
                            {section}
                          </Typography>
                          <Divider sx={{ my: 0.5 }} />
                          {renderMessageContent(proposal.metadata?.body?.[section.toLowerCase()] || 'No data available', mode)}
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        size="sm"
                        sx={{ mt: 1 }}
                        onClick={() => toggleExpand(index, 'details')}
                      >
                        View Less Details
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      size="sm"
                      sx={{ mt: 1 }}
                      onClick={() => toggleExpand(index, 'details')}
                    >
                      View Details
                    </Button>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => toggleExpand(index, 'references')}
                    >
                      {expandedProposals[index]?.references ? 'Hide References' : 'View References'}
                    </Button>
                    {expandedProposals[index]?.references && (
                      <Box sx={{ mt: 2 }}>
                        <Typography level="h4" fontWeight="bold">
                          References:
                        </Typography>
                        {proposal.metadata?.body?.references?.map((ref: any, refIndex: number) => (
                          <Box key={refIndex}>
                            <Typography level="body-sm">
                              <strong>Type:</strong> {ref['@type']}
                              <br />
                              <strong>Label:</strong> {ref.label}
                              <br />
                              <strong>URI:</strong> 
                              <a href={ref.uri} target="_blank" rel="noopener noreferrer">
                                {ref.uri}
                              </a>
                            </Typography>
                          </Box>
                        )) || <Typography level="body-sm">No references available.</Typography>}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => toggleExpand(index, 'votes')}
                    >
                      {expandedProposals[index]?.votes ? 'Hide Votes' : 'View Votes'}
                    </Button>
                    {expandedProposals[index]?.votes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography level="h4" fontWeight="bold">
                          Votes:
                        </Typography>
                        {proposal.proposal.votes ? (
                          Object.entries(
                            proposal.proposal.votes.reduce((acc: any, vote: any) => {
                              acc[vote.issuer.role] = acc[vote.issuer.role] || { yes: 0, no: 0 };
                              acc[vote.issuer.role][vote.vote]++;
                              return acc;
                            }, {})
                          ).map(([role, counts]: [string, any]) => (
                            <Typography key={role} level="body-sm">
                              <strong>{role}:</strong> Yes: {counts.yes}, No: {counts.no}
                            </Typography>
                          ))
                        ) : (
                          <Typography level="body-sm">No votes recorded.</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Card>
              </ListItem>
              {index < proposals.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Sheet>
    </Sheet>
  );
};