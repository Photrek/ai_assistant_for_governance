import React, { useState, useRef, useEffect } from 'react'
import { Sheet, Input, Button, List, ListItem, Typography, Grid } from '@mui/joy'
import SendIcon from '@mui/icons-material/Send'
import { useModel } from '../../hooks/useModel'
import { OllamaApi } from '../../API/ollamaAPI'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { SelectOllamaModel } from '../../components/SelectModelComponent/SelectModelComponent'
import Markdown from 'react-markdown'
import { prism, coy, dark, funky, okaidia, twilight, solarizedlight, solarizedDarkAtom, tomorrow, atomDark, darcula, duotoneDark, duotoneLight, ghcolors, nightOwl, oneDark, oneLight, vs, vscDarkPlus, xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from '@mui/joy/styles'
import './PromptInputInterface.css'

// Define the type for a message
interface Message {
  role: 'user' | 'assistant' | 'thinking'
  content: string | React.ReactNode
}

export const PromptInputInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [model, setModel]: any = useModel()
  const { mode, setMode } = useColorScheme()
  const [images, setImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
          console.log('language: ', language)
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

  // Function to handle sending a message
  const sendMessage = async () => {
    let message: any = messageHistory.concat({
      role: 'user',
      content: input
    })
    console.log('Message: ', message)
    if (input.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'user',
          content: input
        }
      ])
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'thinking',
          content: <img src="assets/images/artificial-intelligence.gif" alt="brain" height="50" />
        }
      ])
      setInput('')
    }
    if (input.trim()) {
      setMessageHistory((prevMessages) => [
        ...prevMessages,
        {
          role: 'user',
          content: input
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
    console.log('Response: ', response)
    const renderedInput: any = await renderMessageContent(response.message.content)
    console.log('Rendered Input: ', renderedInput)
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'assistant',
        content: renderedInput
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
            <Typography level="body-md">AI chat box</Typography>
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
          <SelectOllamaModel />
          <Button
            variant="outlined"
            color="primary"
            endDecorator={<SendIcon />}
            onClick={sendMessage}
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
        </Sheet>
      </Sheet>
    </>
  )
}
