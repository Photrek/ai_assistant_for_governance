import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  Input,
  Button,
  List,
  ListItem,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  FormHelperText,
  Tooltip,
} from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { useModel } from '../../hooks/useModel';
import { Ollama } from 'ollama/browser';
import { useAIEndpoint } from '../../hooks/useEndpointHook';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { duotoneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useColorScheme } from '@mui/joy/styles';
import './PromptInputInterface.css';
import { proposalsHook } from '../../hooks/proposalsHook';
import { wsp, getCurrentEpochTime } from '../../API/ogmiosApi';
import brain from '../../../../assets/artificial-intelligence.gif';
import brain_dark from '../../../../assets/artificial-intelligence-dark.gif';
import Refresh from '@mui/icons-material/Refresh';
import rehypeRaw from 'rehype-raw';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAiApiKeyhook, useAiClientHook } from '../../hooks/useEndpointHook';
import { sendMessageOpenAi } from './OpenAIInputComponent';
import cipdata from './data/cips.cardano.org.json';
import lalkul from './data/lalkul-drep.json';
import sancho from './data/sancho.network.json';
import intersect from './data/docs.intersectmbo.org.json';
import LalkulWhitepaper from './data/lalkulWhitepaper.json';

export interface Message {
  role: 'user' | 'assistant' | 'thinking' | 'system';
  content: string | React.ReactNode;
}
export interface MessageHistory {
  role: 'system' | 'user' | 'assistant' | 'thinking';
  content: string | React.ReactNode;
}

export const PromptInputInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel]: any = useModel();
  const [images, setImages] = useState<string[]>([]);
  const [domain, setDomain] = useState('');
  const [aiEndpoint, setAIendpoint]: any = useAIEndpoint();
  const [proposals, setProposals]: any = proposalsHook();
  const [epochInfo, setEpochInfo] = useState<any>();
  const { mode, setMode } = useColorScheme();
  const [contextSize, setContextSize] = useState(65000);
  const [temp, setTemp] = useState(0.5);
  const [persona, setPersona] = useState('Franklin D. Roosevelt');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [aiClinet, setAiClient] = useAiClientHook<'ollama' | 'chatgpt' | 'grok'>();
  const [aiApiHook, setAiApiHook] = useAiApiKeyhook<string>();

  const agentPrompt = ` 
  You are an AI agent assisting with Cardano governance proposals, take on the persona of ${persona}.
  Each proposal includes fields like "title", "transactionId", "abstract", "votes", "epochStart", and "epochEnd".
  When the user asks about Cardano governance proposals in any form (e.g., "list proposals", "show me current proposals", "what are the Cardano proposals?", "display governance proposals", "tell me about active proposals", or "what are the proposal IDs"), 
  refer to the system message containing Cardano governance proposals in the conversation history and use it to answer accurately. For example:
  - If the user asks to "list proposals", "show me current proposals", or similar queries asking for a list, extract and list the "title" and "transactionId" of each proposal in a human-readable format. 
  Ensure you only include proposals that are currently live (i.e., the current epoch is between "epochStart" and "epochEnd" as of the current date, ${new Date().toISOString().split('T')[0]}). 
  Use the "Current Epoch data:" system message to determine the current epoch.
  - If the user asks "what are the proposal IDs", return only the "transactionId" values of live proposals.
  - If the user asks for details about a specific proposal (e.g., "tell me about proposal with ID <transactionId>"), provide all available fields for that proposal, such as "title", "abstract", "votes", "epochStart", and "epochEnd", regardless of its status.
  Also, each proposal will have Epoch start and end time, so use this information to answer questions about the current epoch if relevant, such as filtering proposals that are active in the current epoch when asked for "current proposals".
  The conversation contains a system message starting with "Cardano Governance Proposals:" which contains information about Cardano's onchain governance proposals and their details, so when asked for proposal-related information, this is where you get the data from.
  The conversation contains a system message starting with "Current Epoch data: Which holds information about Cardano current Epoch information. Cardano has 432000 slots per epoch each slot is 1 sec long and epochs are approximately 5 days long.".
  The conversation contains a system message starting with "Cip data: Which contains information about Cardano CIPs".             
  The conversation contains a system message starting with "Lalkul-drep data: Which contains information about the Lalkul Drep.". 
  The conversation contains a system message starting with "Governance Technical Data:" that has information about doing different governance on-chain transactions and how to generate transactions using cardano-cli.
  Make sure you look at all the past messages to get the context of the conversation.
  If the JSON is missing or malformed, respond with an error message like: "Error: Could not retrieve proposal data. The data might be missing or malformed. Please try again later."
  When providing mathematical expressions, please use LaTeX syntax and wrap inline math with single dollar signs ($) and display math with double dollar signs ($$).
  Make sure you're not outputting any JSON or anything that's not human readable.
  `;

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const sendMessageOllama = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };

    setMessages((prev) => [...prev, userMessage]);
    setMessageHistory((prev) => [...prev, userMessage]);
    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        role: 'thinking',
        content: <img src={mode === 'dark' ? brain_dark : brain} alt='brain' height='50' />,
      },
    ]);

    try {
      console.log('messageHistory', messageHistory);
      const aiEndpointParsed = JSON.parse(aiEndpoint);
      const host = aiEndpointParsed[0];
      const port = aiEndpointParsed[1];
      const urlHost = `${host}:${port}`;
      const ollama: any = new Ollama({ host: `${urlHost}` });

      const response: any = await ollama.chat({
        model: model,
        messages: [
          { role: 'system', content: agentPrompt }, // Agent instructions
          ...messageHistory,
          { role: 'user', content: input }, // Current user query
        ],
        stream: true,
        options: {
          num_ctx: contextSize, // Custom context size
          temperature: temp, // Make responses more deterministic
        },
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
    } catch (error) {
      console.log('Error in sendMessage:', error);
      setMessages((prev) => [
        ...prev.filter((item) => item.role !== 'thinking'),
        { role: 'assistant', content: `${error}` },
      ]);
    }
  };

  async function loadData(data: string = '', dataName: string = '') {
    setMessageHistory((prev: MessageHistory[]) => [
      ...prev.filter(
        (msg) => !(msg.role === 'system' && typeof msg.content === 'string' && msg.content.startsWith(`${dataName} data:`)),
      ),
      { role: 'system', content: `${dataName} data: ${data}` },
    ]);
  }

  function findCIP(cipNumber: string): string {
    console.log('looking for cip: ', cipNumber);

    const cipSections = cipdata.content
      .split('---')
      .map((section) => section.trim())
      .filter((section) => section);

    for (const section of cipSections) {
      const firstLine = section.split('\n')[0];
      if (
        firstLine.includes(`CIP-${cipNumber}`) ||
        firstLine.includes(`CIP-${cipNumber.padStart(4, '0')}`) ||
        firstLine.includes(`#${cipNumber}`)
      ) {
        console.log('CIP found:', section);
        loadData(section, 'Cip');
      }
    }
    return 'CIP not found';
  }

  async function agentGetProposalsTool() {
    setLoadingProposals(true);
    setMessages((prev: any) => [
      ...prev,
      {
        role: 'system',
        content: 'Fetching current live proposals. The agent will let you know in here once proposals are available.',
      },
    ]);
    try {
      const fetchedProposals: any[] = await getProposals();
      console.log('fetchedProposals:', fetchedProposals);
      const isDifferent = JSON.stringify(fetchedProposals) !== JSON.stringify(proposals);
      console.log('isDifferent:', isDifferent);
      if (isDifferent) {
        setProposals(fetchedProposals);
        const contextContent = JSON.stringify(fetchedProposals, null, 2);
        setMessageHistory((prev: any) => [
          ...prev.filter((msg) => !(msg.role === 'system' && msg.content.startsWith('Cardano Governance Proposals:'))),
          { role: 'system', content: `Cardano Governance Proposals: ${contextContent}` },
        ]);
      }
      setMessages((prev: any) => [
        ...prev,
        { role: 'system', content: `Proposals are now available, there are currently ${fetchedProposals.length} proposals.` },
      ]);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      setMessages((prev: any) => [
        ...prev,
        {
          role: 'system',
          content: 'There was an error getting proposals, please make sure you are connected to the Cardano network in the settings above.',
        },
      ]);
    }
  }

  async function getProposals(): Promise<any[]> {
    const method: string = 'queryLedgerStateGovernanceProposals';
    const params = {};

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
          ...prev.filter((msg) => !(msg.role === 'system' && msg.content.startsWith('Current Epoch data:'))),
          { role: 'system', content: `Current Epoch data: ${epochContent}` },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch Epoch:', error);
      setMessageHistory((prev: any) => [
        ...prev,
        { role: 'system', content: 'Error: Could not fetch epoch data.' },
      ]);
    }
    setInterval(async () => {
      try {
        const epochTime = await getCurrentEpochTime();
        const isDifferent = JSON.stringify(epochTime) !== JSON.stringify(epochInfo);
        if (isDifferent) {
          setEpochInfo(epochTime);
          const epochContent = JSON.stringify(epochTime, null, 2);
          setMessageHistory((prev: any) => [
            ...prev.filter((msg) => !(msg.role === 'system' && msg.content.startsWith('Current Epoch data:'))),
            { role: 'system', content: `Current Epoch data: ${epochContent}` },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch Epoch:', error);
        setMessageHistory((prev: any) => [
          ...prev,
          { role: 'system', content: 'Error: Could not fetch epoch data.' },
        ]);
      }
    }, 25000);
  }

  async function parseResults(results: any[]): Promise<Array<{ proposal: any; metadata: any }>> {
    const parsedProposals: any = await Promise.all(
      results.map(async (proposal: any) => {
        let proposalParsed = {};
        const metadataUri = proposal.metadata.url;
        const metadata = await loadJsonMetadata(metadataUri);
        const votes = proposal.votes;
        const voteSummary = {
          totalYes: votes.filter((v: any) => v.vote === 'yes').length,
          totalNo: votes.filter((v: any) => v.vote === 'no').length,
          totalAbstain: votes.filter((v: any) => v.vote === 'abstain').length,
          totalVotes: votes.length,
        };
        metadata !== 'error'
          ? (proposalParsed = {
              '@contxt': proposal['@contxt'],
              title: metadata.body.title,
              proposalActionType: proposal.action.type,
              abstract: metadata.body.abstract,
              motivation: metadata.body.motivation,
              rationale: metadata.body.rationale,
              references: metadata.body.references,
              transactionId: proposal.proposal.transaction.id,
              deposit: proposal.deposit.ada.lovelace,
              returnAccount: proposal.returnAccount,
              metadata: metadata,
              votes: votes,
              voteSummary: voteSummary,
              epochStart: proposal.since.epoch,
              epochEnd: proposal.until.epoch,
            })
          : (proposalParsed = {
              '@contxt': proposal['@contxt'],
              title: 'unavailable',
              proposalActionType: proposal.action.type,
              abstract: 'unavailable',
              motivation: 'unavailable',
              rationale: 'unavailable',
              references: 'unavailable',
              transactionId: proposal.proposal.transaction.id,
              deposit: proposal.deposit.ada.lovelace,
              returnAccount: proposal.returnAccount,
              metadata: 'unavailable',
              votes: votes,
              voteSummary: voteSummary,
              epochStart: proposal.since.epoch,
              epochEnd: proposal.until.epoch,
            });
        return proposalParsed;
      }),
    );
    return parsedProposals;
  }

  async function loadJsonMetadata(metadataUri: string) {
    let uri = metadataUri.startsWith('ipfs://')
      ? `https://ipfs.onchainapps.io/ipfs/${metadataUri.slice(7)}`
      : metadataUri;

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        console.warn('Failed to fetch metadata:', response.statusText);
        return 'error';
      }
      const jsonData = await response.json();
      console.log('Metadata fetched:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('Error loading metadata:', error);
      return 'error';
    }
  }

  function renderMessageContent(msg: string | undefined): React.ReactNode {
    if (typeof msg !== 'string') {
      console.warn('Expected msg to be a string, received:', typeof msg);
      return msg as React.ReactNode;
    }

    const preprocessMath = (text: string): string => {
      return text.replace(/times/g, '\\cdot').replace(/frac/g, '\\frac').replace(/\\(.)/g, '$1');
    };

    const cleanMessage = (text: string): string => {
      return text.replace(/\n{3,}/g, '\n\n');
    };

    const parts = msg.split(/(```(\w+)?([\s\S]*?)```|\$\$[\s\S]*?\$\$|(?<!\\)\$(?:(?!\\).)*\$(?<!\\))/);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part && typeof part === 'string') {
        if (part.startsWith('```')) {
          const language = parts[i + 1] || 'text';
          const code = parts[i + 2]?.trim() || '';
          if (code) {
            elements.push(
              <Sheet key={`code-${i}`} variant='outlined' sx={{ borderRadius: 'sm', p: 1, mb: 1 }}>
                <Divider />
                <Typography level='body-sm' sx={{ fontWeight: 'bold' }}>
                  Code block:
                </Typography>
                <SyntaxHighlighter
                  language={language}
                  style={mode === 'dark' ? oneDark : duotoneLight}
                  customStyle={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {code}
                </SyntaxHighlighter>
              </Sheet>,
            );
            i += 2;
          }
        } else if (part.startsWith('$$  ') && part.endsWith('  $$')) {
          const math = part.slice(2, -2).trim();
          const mathProcessed = preprocessMath(math);
          elements.push(
            <Typography key={`math-${i}`} level='body-md'>
              <BlockMath>{mathProcessed}</BlockMath>
            </Typography>,
          );
        } else {
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
              const math = segment.slice(1, -1);
              const mathProcessed = preprocessMath(math);
              return <InlineMath key={`inline-math-${idx}`}>{mathProcessed}</InlineMath>;
            }
            return <Markdown rehypePlugins={[rehypeRaw]} key={`text-${idx}`}>{segment}</Markdown>;
          });

          elements.push(
            <Typography key={`desc-${i}`} level='body-md' sx={{ whiteSpace: 'pre-wrap' }}>
              {renderedSegments}
            </Typography>,
          );
        }
      }
    }
    return elements.length > 0 ? elements : <Typography level='body-md'>{msg}</Typography>;
  }

  async function getConversationTokenCount(messages) {
    const prompt = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
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
          num_predict: 0,
        },
      });
      console.log('Ollama response:', response);
      if (response.prompt_eval_count !== undefined) {
        return response.prompt_eval_count;
      } else {
        console.error('prompt_eval_count is undefined');
        return 0;
      }
    } catch (error) {
      console.error('Error in getTokenCount:', error);
      return 0;
    }
  }

  async function ollamaAbort() {
    try {
      const aiEndpointParsed = JSON.parse(aiEndpoint);
      const host = aiEndpointParsed[0];
      const port = aiEndpointParsed[1];
      const urlHost = `${host}:${port}`;
      const ollama = new Ollama({ host: urlHost });
      const response = ollama.abort();
      console.log('Ollama abort response:', response);
    } catch (error) {
      console.error('Error in ollamaAbort:', error);
    }
  }

  useEffect(() => {
    agentGetProposalsTool();
    agentGetEpochInformationTool();
    loadData(JSON.stringify(LalkulWhitepaper, null, 2), 'lalkul-drep');
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <Sheet
        sx={{
          mt: 10, // Reduced margin to account for TopBar height
          flexDirection: 'column',
          maxWidth: '100vw', // Changed to 100vw to ensure it fits the viewport
          width: '100%', // Full width of parent
          height: '80vh',
          borderRadius: 'md',
          overflow: 'hidden',
          boxShadow: 'sm',
          backgroundColor: mode === 'dark' ? 'background.surface' : 'background.body',
          '@media (max-width: 960px)': {
            height: 'calc(100vh - 80px)', // Adjusted for TopBar and padding
            maxWidth: '100vw', // Ensure it doesn't exceed viewport
          },
        }}
      >
        <Typography level='body-md' sx={{ m: 1 }}>
          Agent {epochInfo ? `is currently in epoch ${epochInfo.epoch}. Current Epoch Ends In ${epochInfo.timeLeftInEpoch}` : 'is fetching epoch information...'} <br />
        </Typography>
        <hr />
        <Sheet
          sx={{
            height: '50vh',
            width: '100%', // Full width of parent
            maxWidth: '100vw', // Prevent overflow
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
          }}
        >
          <List>
            {messages.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Sheet
                  variant='soft'
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
                {msg.role !== 'thinking' && <CopyTextButton textToCopy={msg.content} />}
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
            '@media (min-width: 400px)': {
              flexDirection: 'row',
            },
          }}
        >
          <Input
            fullWidth
            variant='outlined'
            size='md'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  e.preventDefault();
                  setInput((prevInput) => prevInput + '\n');
                } else {
                  aiClinet === 'ollama'
                    ? sendMessageOllama()
                    : sendMessageOpenAi(
                        input,
                        setInput,
                        setMessages,
                        setMessageHistory,
                        messageHistory,
                        temp,
                        renderMessageContent,
                        agentPrompt,
                        aiApiHook,
                        aiClinet,
                        mode,
                      );
                }
              }
            }}
            placeholder='Type a message'
            sx={{
              flexGrow: 1,
              '@media (max-width: 400px)': {
                mb: 1,
              },
              '& .MuiInput-input': {
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              },
            }}
          />
          <Button
            variant='outlined'
            color='primary'
            endDecorator={<SendIcon />}
            onClick={
              aiClinet === 'ollama'
                ? sendMessageOllama
                : () =>
                    sendMessageOpenAi(
                      input,
                      setInput,
                      setMessages,
                      setMessageHistory,
                      messageHistory,
                      temp,
                      renderMessageContent,
                      agentPrompt,
                      aiApiHook,
                      aiClinet,
                      mode,
                    )
            }
            sx={{
              ml: 1,
              mt: 1,
              '@media (min-width: 400px)': {
                ml: 1,
                mt: 0,
              },
              maxHeight: '55px',
            }}
          >
            Send
          </Button>
          <Button
            variant='outlined'
            color='primary'
            endDecorator={<ClearIcon />}
            onClick={() => setMessages([])}
            sx={{
              ml: 1,
              mt: 1,
              '@media (min-width: 400px)': {
                ml: 1,
                mt: 0,
              },
              maxHeight: '55px',
            }}
          >
            Clear
          </Button>
          <Button
            variant='outlined'
            color='primary'
            endDecorator={<ClearIcon />}
            onClick={() => ollamaAbort()}
            sx={{
              ml: 1,
              mt: 1,
              '@media (min-width: 400px)': {
                ml: 1,
                mt: 0,
              },
              maxHeight: '55px',
            }}
          >
            Abort
          </Button>
        </Sheet>
        <Sheet
          sx={{
            display: 'flex',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
            borderTop: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            flexDirection: 'column',
            '@media (min-width: 400px)': {
              flexDirection: 'row',
            },
          }}
        >
          <FormControl>
            <FormLabel>Context Size</FormLabel>
            <Input
              variant='outlined'
              size='md'
              value={contextSize}
              type='number'
              onChange={(e) => setContextSize(Number(e.target.value))}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    e.preventDefault();
                    setContextSize((prevInput) => prevInput);
                  } else {
                    setContextSize((prevInput) => prevInput);
                  }
                }
              }}
              placeholder='Context Size'
              sx={{
                flexGrow: 1,
                '@media (max-width: 400px)': {
                  mb: 1,
                },
                '& .MuiInput-input': {
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                },
              }}
            />
            <FormHelperText>If you get RAM errors lower this.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Temperature:</FormLabel>
            <Input
              variant='outlined'
              size='md'
              type='number'
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    e.preventDefault();
                    setTemp((prevInput) => prevInput);
                  } else {
                    setTemp((prevInput) => prevInput);
                  }
                }
              }}
              placeholder='Temperature'
              sx={{
                flexGrow: 1,
                '@media (max-width: 400px)': {
                  mb: 1,
                },
                '& .MuiInput-input': {
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                },
              }}
            />
            <FormHelperText>How creative should the llm be.</FormHelperText>
          </FormControl>
          <Button
            variant='outlined'
            color='primary'
            endDecorator={<Refresh />}
            onClick={() => agentGetProposalsTool()}
            sx={{
              top: 25,
              ml: 0,
              mt: 0,
              '@media (min-width: 400px)': {
                ml: 0,
                mt: 0,
              },
              maxHeight: '25px',
            }}
          >
            Reload Proposals
          </Button>
        </Sheet>
        <Sheet
          sx={{
            display: 'flex',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body',
            borderTop: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            flexDirection: 'column',
            '@media (min-width: 400px)': {
              flexDirection: 'row',
            },
          }}
        >
          <Input
            fullWidth
            variant='outlined'
            size='md'
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  e.preventDefault();
                  setPersona((prevInput) => prevInput + '\n');
                } else {
                  setPersona((prevInput) => prevInput + '\n');
                }
              }
            }}
            placeholder='Persona'
            sx={{
              flexGrow: 1,
              '@media (max-width: 400px)': {
                mb: 1,
              },
              '& .MuiInput-input': {
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              },
            }}
          />
          <FormHelperText>Short description of personality.</FormHelperText>
        </Sheet>
      </Sheet>
    </>
  );
};

interface CopyTextButtonProps {
  textToCopy: any;
}

const CopyTextButton: React.FC<CopyTextButtonProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    console.log('copying text: ', textToCopy);
    try {
      let text = textToCopy;
      if (typeof textToCopy !== 'string') {
        text = JSON.stringify(textToCopy[0].props.children[0].props.children, null, 2);
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} variant='soft'>
      <Button variant='outlined' color='neutral' startDecorator={<ContentCopyIcon />} onClick={handleCopy} sx={{ m: 0, pr: 0 }}>
        {/*copied ? 'Copied' : 'Copy'*/}
      </Button>
    </Tooltip>
  );
};