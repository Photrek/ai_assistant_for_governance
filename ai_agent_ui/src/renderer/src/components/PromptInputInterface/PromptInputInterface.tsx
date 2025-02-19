import React, { useState, useRef, useEffect } from 'react'
import { Sheet, Input, Button, List, ListItem, Typography } from '@mui/joy'
import SendIcon from '@mui/icons-material/Send'
import { useModel } from '../../hooks/useModel'
import { OllamaApi } from '../../API/ollamaAPI'
import { aiAgentAPI } from '../../API/aiAgentAPI'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// import { SelectOllamaModel } from '../../components/SelectModelComponent/SelectModelComponent'
import Markdown from 'react-markdown'
import { duotoneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from '@mui/joy/styles'
import './PromptInputInterface.css'
import brain from '../../../../assets/artificial-intelligence.gif'

// Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"
// Environment="OLLAMA_ORIGINS=*"

// Define the type for a message
interface Message {
  role: 'user' | 'assistant' | 'thinking'
  content: string | React.ReactNode
}

export const PromptInputInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const [agentMessages, setAgentMessages] = useState<Message[]>([])
  const [agentMessageHistory, setAgentMessageHistory] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [model, setModel]: any = useModel()
  const { mode, setMode } = useColorScheme()
  const [images, setImages] = useState<string[]>([])
  const [domain, setDomain] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  setModel('llama3.1:8b')
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderMessageContent = async (msg: any) => {
    if (typeof msg !== 'string') return msg // If it's not a string, return as is

    // Split by code blocks to separate code from descriptions
    const parts = msg.split(/```(\w+)?([\s\S]*?)```/)
    const elements: React.ReactNode[] = []

    for (let i = 0; i < parts.length; i++) {
      // i % 3 == 0: Text before code block or between code blocks
      if (i % 3 === 0 && parts[i].trim()) {
        elements.push(
          <Typography key={`desc-${i}`}>
            <Markdown>{parts[i].trim()}</Markdown>
          </Typography>
        )
      }
      // i % 3 == 1: Language, not used in rendering but could be for other purposes
      else if (i % 3 === 1) {
        const language = parts[i] || 'text'
        const code = parts[i + 1]?.trim() || ''
        if (code) {
          // console.log('language: ', language)
          elements.push(
            <Sheet key={`code-${i}`} variant="outlined" sx={{ borderRadius: 'sm', p: 1, mb: 1 }}>
              <hr />
              <Typography>AI code block:</Typography>
              <SyntaxHighlighter
                language={language}
                style={mode === 'dark' ? oneDark : duotoneLight}
              >
                {code}
              </SyntaxHighlighter>
            </Sheet>
          )
        }
        i++ // Skip to the next part since we've just processed the code
      }
    }
    return elements.length > 0 ? elements : <Typography>{msg}</Typography>
  }

  const searchDomain = async () => {
    const searchDomainsRes = await aiAgentAPI.agent_websearch('', domain, input)
    // console.log('searchDomainsRes', searchDomainsRes)
    return searchDomainsRes
  }

  const sendAgentMessage = async () => {
    const renderedInput = await renderMessageContent(input)
    console.log('Rendered Input: ', renderedInput)

    let message = agentMessageHistory.concat({
      role: 'user',
      content: input
    })

    if (input.trim()) {
      setAgentMessages((prevMessages) => [
        ...prevMessages,
        { role: 'user', content: input },
        { role: 'thinking', content: <img src={brain} alt="brain" height="50" /> }
      ])
      setInput('')
      setAgentMessageHistory((prevMessages) => [...prevMessages, { role: 'user', content: input }])
    }

    const searchDataRaw = await searchDomain()
    console.log('Raw searchData: ', searchDataRaw)
    const searchData = typeof searchDataRaw === 'string' ? JSON.parse(searchDataRaw) : []
    console.log('Processed searchData: ', searchData)

    const optionsAgentChat = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: message,
        stream: false,
        tools: [
          {
            type: 'function',
            function: {
              name: 'search',
              description: 'Search scraped data from the domain',
              parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'The search query' } },
                required: ['query']
              }
            }
          }
        ],
        searchData: JSON.stringify(searchData)
      })
    }

    const response = await OllamaApi('chat', optionsAgentChat)
    console.log('Initial Response: ', response)

    let finalContent = ''

    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolCall = response.message.tool_calls[0]
      console.log('Tool Call Detected:', toolCall)
      if (toolCall.function.name === 'search') {
        const query = toolCall.function.arguments.query
        console.log('Tool Call Query: ', query)

        const formattedResult = JSON.stringify(searchData, null, 2)
        console.log('Filtered Search Result: ', formattedResult)

        const updatedMessages = message.concat([
          { role: 'assistant', content: '', tool_calls: [toolCall] },
          { role: 'tool', content: formattedResult, tool_call_id: toolCall.id || 'search_call' }
        ])

        const followUpOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: updatedMessages,
            stream: false
          })
        }

        const finalResponse = await OllamaApi('chat', followUpOptions)
        finalContent = finalResponse.message.content
        console.log('Agent Final Response: ', finalContent)
      }
    } else {
      finalContent =
        response.message.content || 'Based on my knowledge, here’s an answer without tool data.'
      console.log('No Tool Call, Agent Response: ', finalContent)
    }

    const renderedResponse = await renderMessageContent(finalContent)
    console.log('Rendered Response: ', renderedResponse)

    setAgentMessages((prevMessages) => [
      ...prevMessages,
      { role: 'assistant', content: renderedResponse }
    ])

    setAgentMessageHistory((prevMessages) => [
      ...prevMessages,
      { role: 'assistant', content: finalContent }
    ])

    setAgentMessages((prevItems) => prevItems.filter((item) => item.role !== 'thinking'))
  }

  // Function to handle sending a message
  const sendMessage = async () => {
    const renderedInput: any = await renderMessageContent(input)
    let message: any = messageHistory.concat({
      role: 'user',
      content: renderedInput
    })
    // console.log('Message: ', message)
    if (renderedInput.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'user',
          content: renderedInput
        }
      ])
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'thinking',
          content: <img src={brain} alt="brain" height="50" />
        }
      ])
      setInput('')
    }
    if (renderedInput.trim()) {
      setMessageHistory((prevMessages) => [
        ...prevMessages,
        {
          role: 'user',
          content: renderedInput
        }
      ])
    }

    const optionsChat = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: message,
        stream: false
      })
    }

    const response = await OllamaApi('chat', optionsChat)
    // console.log('Response: ', response)
    const renderedResponse: any = await renderMessageContent(response.message.content)
    // console.log('Rendered Input: ', renderedResponse)
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'assistant',
        content: renderedResponse
      }
    ])

    setMessageHistory((prevMessages) => [
      ...prevMessages,
      {
        role: 'assistant',
        content: response.message.content
      }
    ])

    setMessages((prevItems) => prevItems.filter((item) => item['role'] !== 'thinking'))
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <>
      <Sheet
        sx={{
          mt: 20,
          // Remove minWidth to allow resizing
          // minWidth: '1000px',
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
        {/* Chat Display */}
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
            {agentMessages.map((msg, index) => (
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

        {/* Input Area */}
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
                  // Insert newline
                  e.preventDefault()
                  setInput((prevInput) => prevInput + '\n')
                } else {
                  // Send message
                  // sendMessage()
                  sendAgentMessage()
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
          {/* <SelectOllamaModel /> */}
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<SendIcon />}
            onClick={sendAgentMessage}
            sx={{
              ml: 1, // Assuming 1 spacing unit is equivalent to 8px, adjust as needed
              mt: 1, // Add margin top for mobile view, same as ml for consistency
              [`@media (min-width: 400px)`]: {
                ml: 1, // Margin left for larger screens, keeping consistent with mobile
                mt: 0 // No margin top needed for larger screens
              },
              maxHeight: '55px'
            }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<SendIcon />}
            onClick={()=>setAgentMessages([])}
            sx={{
              ml: 1, // Assuming 1 spacing unit is equivalent to 8px, adjust as needed
              mt: 1, // Add margin top for mobile view, same as ml for consistency
              [`@media (min-width: 400px)`]: {
                ml: 1, // Margin left for larger screens, keeping consistent with mobile
                mt: 0 // No margin top needed for larger screens
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
                  // Insert newline
                  e.preventDefault()
                  setDomain((prevInput) => prevInput + '\n')
                } else {
                  // Send message
                  // sendMessage()
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
