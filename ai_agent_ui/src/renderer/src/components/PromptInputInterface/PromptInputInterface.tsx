import React, { useState, useRef, useEffect } from 'react'
import { Sheet, Input, Button, List, ListItem, Typography } from '@mui/joy'
import SendIcon from '@mui/icons-material/Send'
import ClearIcon from '@mui/icons-material/Clear'
import { useModel } from '../../hooks/useModel'
import ollama from 'ollama/browser'
import { Ollama } from 'ollama'
import { useAIEndpoint } from '../../hooks/useEndpointHook'
import { SelectOllamaModel } from '../../components/SelectModelComponent/SelectModelComponent'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import Markdown from 'react-markdown'
import { duotoneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from '@mui/joy/styles'
import './PromptInputInterface.css'
import brain from '../../../../assets/artificial-intelligence.gif'
import { proposalsHook } from '../../hooks/proposalsHook'

interface Message {
  role: 'user' | 'assistant' | 'thinking'
  content: string | React.ReactNode
}

export const PromptInputInterface: React.FC = () => {
  const [ messages, setMessages ] = useState<Message[]>([])
  const [ messageHistory, setMessageHistory ] = useState<Message[]>([])
  const [ input, setInput ] = useState('')
  const [ model, setModel ]: any = useModel()
  const [ images, setImages ] = useState<string[]>([])
  const [ domain, setDomain ] = useState('')
  const [ aiEndpoint, setAIendpoint ]: any = useAIEndpoint()
  const [ proposals, setProposals ]: any = proposalsHook()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { mode, setMode } = useColorScheme()

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderMessageContent = async (msg: string): Promise<React.ReactNode> => {
    if (typeof msg !== 'string') return msg
    const parts = msg.split(/```(\w+)?([\s\S]*?)```/)
    const elements: React.ReactNode[] = []
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0 && parts[i].trim()) {
        elements.push(
          <Typography key={`desc-${i}`}>
            <Markdown>{parts[i].trim()}</Markdown>
          </Typography>
        )
      } else if (i % 3 === 1) {
        const language = parts[i] || 'text'
        const code = parts[i + 1]?.trim() || ''
        if (code) {
          elements.push(
            <Sheet key={`code-${i}`} variant="outlined" sx={{ borderRadius: 'sm', p: 1, mb: 1 }}>
              <Typography>Code block:</Typography>
              <SyntaxHighlighter
                language={language}
                style={mode === 'dark' ? oneDark : duotoneLight}
              >
                {code}
              </SyntaxHighlighter>
            </Sheet>
          )
        }
        i++
      }
    }
    return elements.length > 0 ? (
      elements
    ) : (
      <Typography>
        <Markdown>{msg}</Markdown>
      </Typography>
    )
  }

  const availableTools = {
    list_proposals: {
      description: 'Lists all available proposals with details in Markdown format',
      execute: () => {
        if (!proposals || proposals.length === 0) {
          return 'No proposals available'
        }
        const proposalList = proposals
          .map((item: any, i: number) => {
            const p = item.proposal
            const meta = item.metadata?.body || {}

            // Calculate vote summary
            const voteSummary = p.votes.reduce((acc: any, vote: any) => {
              acc[vote.vote] = (acc[vote.vote] || 0) + 1
              return acc
            }, {})

            return `
              ### ${i + 1}. ${meta.title || 'Untitled'}  
              **ID:** \`${p.proposal.transaction.id}\`  
              **Type:** ${p.action.type}  
              **Deposit:** ${(p.deposit.ada.lovelace / 1000000).toLocaleString()} ADA  
              **Active Period:** Epoch ${p.since.epoch} to ${p.until.epoch}  
              **Metadata URL:** [${p.metadata.url}](${p.metadata.url})  
              **Votes:**  
              - Yes: ${voteSummary.yes || 0}  
              - No: ${voteSummary.no || 0}  
              - Abstain: ${voteSummary.abstain || 0}  
              **Description:** ${meta.abstract || 'No description available'}
            `
            })
            .join('\n\n')
          return proposalList || 'No proposals found'
      }
    },
    web_search: {
      description: 'Searches the web for information',
      execute: (query: string) => `
        **Web Search:**  
        Searching web for: *${query}*  
        *(Note: Full implementation would require API integration)*
        `
    }
  }

  const agentProcess = async (userInput: string): Promise<string> => {
    const lowercaseInput = userInput.toLowerCase().trim()

    // Tool detection and execution
    if (lowercaseInput.includes('list') && lowercaseInput.includes('proposal')) {
      return availableTools['list_proposals'].execute()
    }
    if (lowercaseInput.includes('search') || lowercaseInput.includes('find')) {
      return availableTools['web_search'].execute(userInput)
    }

    // Default LLM processing with context
    const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
    const systemPrompt = `
You are an AI agent assisting with Cardano governance proposals. You have access to proposal data and can provide detailed information when asked. For general questions, respond conversationally. Format your responses in Markdown for readability.

Available tools:
- **list_proposals**: Lists all proposals with details
- **web_search**: Simulates a web search (placeholder)

Current proposal data is available but will be provided by tools when needed. Respond to the user's input directly.
    `

    const response = await ollama.chat({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messageHistory,
        { role: 'user', content: userInput }
      ],
      stream: false // We'll handle streaming in sendMessage
    })

    return response.message.content
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setMessageHistory((prev) => [...prev, userMessage])
    setInput('')

    setMessages((prev) => [
      ...prev,
      { role: 'thinking', content: <img src={brain} alt="brain" height="50" /> }
    ])

    try {
      const isToolRequest =
        (input.toLowerCase().includes('list') && input.toLowerCase().includes('proposal')) ||
        input.toLowerCase().includes('search') ||
        input.toLowerCase().includes('find')

      if (isToolRequest) {
        const toolResult = await agentProcess(input)
        const renderedContent = await renderMessageContent(toolResult)
        setMessages((prev) => [
          ...prev.filter((item) => item.role !== 'thinking'),
          { role: 'assistant', content: renderedContent }
        ])
        setMessageHistory((prev) => [...prev, { role: 'assistant', content: toolResult }])
      } else {
        const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
        const response = await ollama.chat({
          model: model,
          messages: [
            {
              role: 'system',
              content: `
You are an AI agent assisting with Cardano governance proposals. Format responses in Markdown. Use the conversation history and respond to the user's input directly.
            `
            },
            ...messageHistory,
            { role: 'user', content: input }
          ],
          stream: true
        })

        let accumulatedResponse = ''
        setMessages((prev) => prev.filter((item) => item.role !== 'thinking'))

        for await (const part of response) {
          accumulatedResponse += part.message.content
          const renderedContent = await renderMessageContent(accumulatedResponse)

          setMessages((prev) => {
            const withoutThinking = prev.filter((item) => item.role !== 'thinking')
            const lastWasAssistant =
              withoutThinking[withoutThinking.length - 1]?.role === 'assistant'

            if (lastWasAssistant) {
              return [
                ...withoutThinking.slice(0, -1),
                { role: 'assistant', content: renderedContent }
              ]
            }
            return [...withoutThinking, { role: 'assistant', content: renderedContent }]
          })
        }

        setMessageHistory((prev) => [...prev, { role: 'assistant', content: accumulatedResponse }])
      }
    } catch (error) {
      console.error('Error in sendMessage:', error)
      setMessages((prev) => [
        ...prev.filter((item) => item.role !== 'thinking'),
        { role: 'assistant', content: 'Error occurred while processing your request' }
      ])
    }
  }

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
        <Sheet
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body'
          }}
        >
          <List>
            <Typography level="body-md">
              AI chat box(Currently only available with Ollama running localy)
            </Typography>
            <hr />
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
                    color: mode === 'dark' ? 'text.primary' : 'text.secondary'
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
          <br />
          <SelectOllamaModel />
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
      </Sheet>
    </>
  )
}
