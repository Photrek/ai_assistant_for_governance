import React, { useState, useRef, useEffect } from 'react'
import { Sheet, Input, Button, List, ListItem, Typography, Divider } from '@mui/joy'
import SendIcon from '@mui/icons-material/Send'
import ClearIcon from '@mui/icons-material/Clear'
import { useModel } from '../../hooks/useModel'
import { Ollama } from 'ollama/browser';
import { useAIEndpoint } from '../../hooks/useEndpointHook'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import Markdown from 'react-markdown'
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { duotoneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from '@mui/joy/styles'
import './PromptInputInterface.css'
import brain from '../../../../assets/artificial-intelligence.gif'
import { proposalsHook } from '../../hooks/proposalsHook'
import { wsp, getCurrentEpochTime } from '../../API/ogmiosApi';

const agentPrompt = `
                You are an AI agent assisting with Cardano governance proposals, respond as a 1700s US founding father and be a bit snarky and witty.
                The conversation history contains a system message starting with "Proposal data:" followed by a JSON array of Cardano governance proposals.
                
                Each proposal includes fields like "title", "transactionId", "abstract", "votes", "epochStart", and "epochEnd".
                When the user asks about proposals (e.g., "list proposals" or "what are the proposal IDs"), locate this system message, parse the JSON, and use it to answer accurately.
                Also each proposal will have Epoch start and end time, use this information to answer questions about the current epoch.
                The conversation history contains a system message starting with "Epoch data:".
                                
                For example:
                - For "list proposals", extract and list the "title" and "transactionId" of each proposal.
                - For "what are the proposal IDs", return the "transactionId" values.
                Do not generate fictional data or rely on external knowledge—use only the provided JSON.

                If the JSON is missing or malformed, respond with an error message.

                Make sure you're not outputting any JSON or anything that's not human readable.
              `
interface Message {
  role: 'user' | 'assistant' | 'thinking' | 'system';
  content: string | React.ReactNode;
}

export const PromptInputInterface: React.FC = () => {
  const [ messages, setMessages ] = useState<Message[]>([])
  const [ messageHistory, setMessageHistory ] = useState<Message[]>([]);
  const [ input, setInput ] = useState('')
  const [ model, setModel ]: any = useModel()
  const [ images, setImages ] = useState<string[]>([])
  const [ domain, setDomain ] = useState('')
  const [ aiEndpoint, setAIendpoint ]: any = useAIEndpoint()
  const [ proposals, setProposals ]: any = proposalsHook()
  const [ epochInfo, setEpochInfo ] = useState<any>()
  const { mode, setMode } = useColorScheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  function scrollToBottom() 
  {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  /* 
  -------------------------------------- 
  This is where it all starts 
  -------------------------------------- 
  */
  async function sendMessage() {
    if (!input.trim()) return;
  
    const userMessage: Message = { role: 'user', content: input };
  
    setMessages((prev) => [...prev, userMessage]);
    setMessageHistory((prev) => [...prev, userMessage]);
    setInput('');
  
    setMessages((prev) => [
      ...prev,
      { role: 'thinking', content: <img src={brain} alt="brain" height="50" /> },
    ]);
  
    try {
      console.log("messageHistory", messageHistory);
      const aiEndpointParsed = JSON.parse(aiEndpoint);
      const host = aiEndpointParsed[0];
      const port = aiEndpointParsed[1];
      const urlHost = `${host}:${port}`;
      const ollama: any = new Ollama({ host: `${urlHost}` });
  
      // Find the system message with proposal data
      const proposalSystemMessage = messageHistory.find(
        (msg: any) => msg.role === 'system' && msg.content.startsWith('Proposal data:')
      ) || { role: 'system', content: 'Proposal data: []' }; // Fallback if none found
      
      console.log("Messages sent to Ollama:", messages);

      const response: any = await ollama.chat({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: agentPrompt 
          }, // Agent instructions
          proposalSystemMessage, // Ensure proposal data is included
          ...messageHistory.filter(
            (msg: any) => !(msg.role === 'system' && msg.content.startsWith('Proposal data:'))
          ), // Rest of history, excluding duplicate system messages
          { 
            role: 'user', 
            content: input 
          }, // Current user query
        ],
        stream: true,
        options: {
          num_ctx: 32768, // Custom context size
          temperature: 0 // Make responses more deterministic
        }
      });
  
      let accumulatedResponse = '';
      setMessages((prev) => prev.filter((item) => item.role !== 'thinking'));
  
      for await (const part of response) {
        accumulatedResponse += part.message.content;
        const renderedContent = renderMessageContent(accumulatedResponse);
        setMessages((prev) => {
          const withoutThinking = prev.filter((item) => item.role !== 'thinking');
          const lastWasAssistant = withoutThinking[withoutThinking.length - 1]?.role === 'assistant';
          if (lastWasAssistant) {
            return [...withoutThinking.slice(0, -1), { role: 'assistant', content: renderedContent }];
          }
          return [...withoutThinking, { role: 'assistant', content: renderedContent }];
        });
      }
  
      setMessageHistory((prev) => [...prev, { role: 'assistant', content: accumulatedResponse }]);
      console.log("token count", await getConversationTokenCount(messageHistory));
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages((prev) => [
        ...prev.filter((item) => item.role !== 'thinking'),
        { role: 'assistant', content: 'Error occurred while processing your request' },
      ]);
    }
  };

  /* 
  ----------------------------------------------------------------------------  
  Function that queries the ledger state for governance proposals and adds
  it as part of agent history.
  ----------------------------------------------------------------------------  
  */
  async function agentGetProposalsTool() {
    try {
      const fetchedProposals = await getProposals();
      console.log('fetchedProposals:', fetchedProposals);
      const isDifferent = JSON.stringify(fetchedProposals) !== JSON.stringify(proposals);
      console.log('isDifferent:', isDifferent);
      if (isDifferent) {
        setProposals(fetchedProposals);
        const contextContent = JSON.stringify(fetchedProposals, null, 2);
        setMessageHistory((prev: any) => [
          ...prev.filter((msg) => !(msg.role === 'system' && msg.content.startsWith('Proposal data:'))),
          { role: 'system', content: `Proposal data: ${contextContent}` },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      setMessageHistory((prev: any) => [
        ...prev,
        { role: 'system', content: 'Error: Could not fetch proposal data.' },
      ]);
    }
  }

  async function agentGetEpochInformationTool() {
    
    try {
      const epochTime = await getCurrentEpochTime();
      console.log('epochTime:', epochTime);
      const isDifferent = JSON.stringify(epochTime) !== JSON.stringify(epochInfo);
      console.log('isDifferent:', isDifferent);
      if (isDifferent) {
        setEpochInfo(epochTime);
        const epochContent = JSON.stringify(epochTime, null, 2);
        setMessageHistory((prev: any) => [
          ...prev.filter((msg) => !(msg.role === 'system' && msg.content.startsWith('Epoch data:'))),
          { role: 'system', content: `Epoch data: ${epochContent}` },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch Epoch:', error);
      setMessageHistory((prev: any) => [
        ...prev,
        { role: 'system', content: 'Error: Could not fetch epoch data.' },
      ]);
    }
  }

  /* 
  ----------------------------------------------------------------------------  
  Function that queries the ledger state for governance proposals
  ----------------------------------------------------------------------------  
  */
  async function getProposals()
  {
    const method: string = 'queryLedgerState/governanceProposals';
    const params ={};
  
    let wspRes = await wsp(method, params);
    return new Promise((resolve, reject) => {
      wspRes.onmessage = async (e: any) => {
        try {
          const results = JSON.parse(e.data);
          const rawProposalData = results.result;
          const parsedProposals = await parseResults(rawProposalData);
          console.log('parsedProposals:', parsedProposals);
          resolve(parsedProposals);
        } catch (error) {
          reject(error);
        }
      };
    });
  };
  /* 
  ----------------------------------------------------------------------------  
  Function that parses all the metadata from the onchain proposals
  ----------------------------------------------------------------------------  
  */
  async function parseResults(results: any[]): Promise<Array<{ proposal: any, metadata: any }>> {
    try {
      const parsedProposals: any = await Promise.all(
        results.map(async (proposal: any) => {
          const metadataUri = proposal.metadata.url;
          const metadata = await loadJsonMetadata(metadataUri);
          const votes = proposal.votes;
          const voteSummary = {
            totalYes: votes.filter((v: any) => v.vote === 'yes').length,
            totalNo: votes.filter((v: any) => v.vote === 'no').length,
            totalAbstain: votes.filter((v: any) => v.vote === 'abstain').length,
            totalVotes: votes.length,
          };
          const proposalParsed = {
            "@contxt": proposal["@contxt"],
            "title": metadata.body.title,
            "proposalActionType": proposal.action.type,
            "abstract": metadata.body.abstract,
            "motivation": metadata.body.motivation,
            "rationale": metadata.body.rationale,
            "references": metadata.body.references,
            "transactionId": proposal.proposal.transaction.id,
            "deposit": proposal.deposit.ada.lovelace,
            "returnAccount": proposal.returnAccount,
            "metadata": metadata,
            // "votes": votes,
            "voteSummary": voteSummary, // Add summary
            "epochStart": proposal.since.epoch,
            "epochEnd": proposal.until.epoch,
          };
          return proposalParsed;
        })
      );
      return parsedProposals;
    } catch (error) {
      console.log('Error parsing results:', error);
      return [];
    }
  }
  /* 
  ----------------------------------------------------------------------------  
  Fetches metadata from IPFS or HTTP specified in onchain proposal
  ----------------------------------------------------------------------------  
  */
  async function loadJsonMetadata(metadataUri: string)
  {
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
  /* 
  ----------------------------------------------------------------------------  
  Process math equations in text
  ----------------------------------------------------------------------------  
  */
  const preprocessMath = (text: string): string => {
    return text
      .replace(/times/g, '\\cdot')
      .replace(/frac/g, '\\frac')
      .replace(/\\(.)/g, '$1'); // Unescapes backslashes if needed
  };

  /* 
  ----------------------------------------------------------------------------  
  Renders all markdown content in the chat interface that's been preprocessed
  ----------------------------------------------------------------------------  
  */
  function renderMessageContent(msg: string | undefined): React.ReactNode {
    if (typeof msg !== 'string') {
      console.warn('Expected msg to be a string, received:', typeof msg);
      return msg as React.ReactNode;
    }
  
    const parts = msg.split(/(```(\w+)?([\s\S]*?)```|\$\$[\s\S]*?\$\$|(?<!\\)\$(?:(?!\\).)*\$(?<!\\))/);
  
    const elements: React.ReactNode[] = [];
  
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
  
      if (part && typeof part === 'string') { 
        if (part.startsWith('```')) { // Code block
          const language = parts[i + 1] || 'text';
          const code = parts[i + 2]?.trim() || '';
          if (code) {
            elements.push(
              <Sheet key={`code-${i}`} variant="outlined" sx={{ borderRadius: 'sm', p: 1, mb: 1 }}>
                <Divider />
                <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>AI code block:</Typography>
                <SyntaxHighlighter
                  language={language}
                  style={mode === 'dark' ? oneDark : duotoneLight}
                  customStyle={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {code}
                </SyntaxHighlighter>
              </Sheet>
            );
            i += 2;
          }
        } else if (part.startsWith('$$  ') && part.endsWith('  $$')) { // Block Math
          const math = part.slice(2, -2).trim();
          elements.push(
            <Typography key={`math-${i}`} level="body-md">
              <BlockMath>{math}</BlockMath>
            </Typography>
          );
        } else {  // Regular text or inline math
          const cleanedPart = cleanMessage(part);
          const inlineMathRegex = /\$(.*?)\$/g;
          let match: RegExpExecArray | null;
          let lastIndex = 0;
          const segments: string[] = [];
          
          while ((match = inlineMathRegex.exec(cleanedPart))) {
            if (match.index > lastIndex) {
              segments.push(cleanedPart.slice(lastIndex, match.index));
            }
            segments.push(match[0]);
            lastIndex = inlineMathRegex.lastIndex;
          }
          if (lastIndex < cleanedPart.length) {
            segments.push(cleanedPart.slice(lastIndex));
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
  }
  function cleanMessage(msg: string): string {
    return msg.replace(/\n{3,}/g, '\n\n');
  }
  /* 
  ----------------------------------------------------------------------------  
  Test function for caculating current used context tokens to offload into
  REG memory system
  ----------------------------------------------------------------------------  
  */
  async function getConversationTokenCount(messages) {
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    return await getTokenCount(prompt);
  }
  async function getTokenCount(text) {
    try {
      const aiEndpointParsed = JSON.parse(aiEndpoint);
      const host = aiEndpointParsed[0];
      const port = aiEndpointParsed[1];
      const urlHost = `${host}:${port}`;
      const ollama = new Ollama({ host: urlHost });
      const response = await ollama.generate({
        model: model,
        prompt: text,
        stream: false,
        options: {
          num_predict: 0
        }
      });
      console.log('Ollama response:', response);
      if (response.prompt_eval_count !== undefined) {
        return response.prompt_eval_count;
      } else {
        console.error('prompt_eval_count is undefined');
        return 0; // or handle accordingly
      }
    } catch (error) {
      console.error('Error in getTokenCount:', error);
      return 0; // or throw error
    }
  }

  /* 
  ----------------------------------------------------------------------------  
  Abort all prompts
  ----------------------------------------------------------------------------  
  */

  async function ollamaAbort() {
    try {
      const aiEndpointParsed = JSON.parse(aiEndpoint);
      const host = aiEndpointParsed[0];
      const port = aiEndpointParsed[1];
      const urlHost = `${host}:${port}`;
      const ollama = new Ollama({ host: urlHost });
      const response = await ollama.abort();
      console.log('Ollama abort response:', response);
    } catch (error) {
      console.error('Error in ollamaAbort:', error);
    }
  
  }

  useEffect(() => {
    agentGetProposalsTool();
    agentGetEpochInformationTool();
  }, []);


  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <>
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
          backgroundColor: mode === 'dark' ? 'background.surface' : 'background.body',
          [`@media (max-width: 960px)`]: {
            height: 'calc(100vh - 64px)'
          }
        }}
      >
        <Typography level="body-md" sx={{m: 1}}>
          Agent {epochInfo ? `is currently in epoch ${epochInfo.epoch}. Current Epoch Ends In ${epochInfo.timeLeftInEpoch}` : 'is fetching epoch information...'}
        </Typography>
        <hr />
        <Sheet
          sx={{
            width: '100%',
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body'
          }}
        >
          <List>
            {messages.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Sheet
                  variant="soft"
                  color={msg.role === 'user' ? 'primary' : 'neutral'}
                  sx={{
                    borderRadius: 'lg',
                    p: 1,
                    display: 'inline-block',
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                    color: mode === 'dark' ? 'text.primary' : 'text.secondary',
                  }}
                >
                  <Typography>{msg.content}</Typography>
                </Sheet>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Sheet>

        <Sheet
          sx={{
            display: 'flex',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
            borderTop: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            flexDirection: 'column',
            [`@media (min-width: 400px)`]: {
              flexDirection: 'row'
            }
          }}
        >
          <Input
            fullWidth
            variant="outlined"
            size="md"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  e.preventDefault()
                  setInput((prevInput) => prevInput + '\n')
                } else {
                  sendMessage()
                }
              }
            }}
            placeholder="Type a message"
            sx={{
              flexGrow: 1,
              [`@media (max-width: 400px)`]: {
                mb: 1
              },
              '& .MuiInput-input': {
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }
            }}
          />    
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<SendIcon />}
            onClick={sendMessage}
            sx={{
              ml: 1,
              mt: 1,
              [`@media (min-width: 400px)`]: {
                ml: 1,
                mt: 0
              },
              maxHeight: '55px'
            }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<ClearIcon />}
            onClick={() => setMessages([])}
            sx={{
              ml: 1,
              mt: 1,
              [`@media (min-width: 400px)`]: {
                ml: 1,
                mt: 0
              },
              maxHeight: '55px'
            }}
          >
            Clear
          </Button>
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<ClearIcon />}
            onClick={() => ollamaAbort()}
            sx={{
              ml: 1,
              mt: 1,
              [`@media (min-width: 400px)`]: {
                ml: 1,
                mt: 0
              },
              maxHeight: '55px'
            }}
          >
            Aboart
          </Button>
        </Sheet>

        {/*
        <Sheet
          sx={{
            display: 'flex',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
            borderTop: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            flexDirection: 'column',
            [`@media (min-width: 400px)`]: {
              flexDirection: 'row'
            }
          }}
        >
          
          <Input
            fullWidth
            variant="outlined"
            size="md"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  e.preventDefault()
                  setDomain((prevInput) => prevInput + '\n')
                } else {
                  setDomain((prevInput) => prevInput + '\n')
                }
              }
            }}
            placeholder="Domain URL"
            sx={{
              flexGrow: 1,
              [`@media (max-width: 400px)`]: {
                mb: 1
              },
              '& .MuiInput-input': {
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }
            }}
          />
          
        </Sheet>
        */}
      </Sheet>
    </>
  )
}
