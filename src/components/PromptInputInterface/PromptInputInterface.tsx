import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, List, ListItem, Typography, Grid } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useModel } from "../../hooks/useModel";
import { OllamaApi } from "../../API/ollamaAPI";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { SelectOllamaModel } from "../../components/SelectModelComponent/SelectModelComponent";
import Markdown from 'react-markdown'
import { prism, coy, dark, funky, okaidia, twilight, solarizedlight, solarizedDarkAtom, tomorrow, atomDark, darcula, duotoneDark, duotoneLight, ghcolors, nightOwl, oneDark, oneLight, vs, vscDarkPlus, xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism'; // or any other style
import "./PromptInputInterface.css";

// Define the type for a message
interface Message {
  text: string | React.ReactNode;
  sender: 'user' | 'AI';
  isCode?: boolean; // New property to indicate if the message contains code
}
export const PromptInputInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ model, setModel ]: any = useModel();
  const [ darkMode, setDarkMode ]: any = useDarkMode();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderMessageContent = async (msg: any) => {
    if (typeof msg !== 'string') return msg; // If it's not a string, return as is
  
    // Split by code blocks to separate code from descriptions
    const parts = msg.split(/```(\w+)?([\s\S]*?)```/);
    const elements: React.ReactNode[] = [];
  
    for (let i = 0; i < parts.length; i++) {
      // i % 3 == 0: Text before code block or between code blocks
      if (i % 3 === 0 && parts[i].trim()) {
        elements.push(
        <Typography key={`desc-${i}`}>
          <Markdown>{parts[i].trim()}</Markdown>
        </Typography>);
      } 
      // i % 3 == 1: Language, not used in rendering but could be for other purposes
      else if (i % 3 === 1) {
        const language = parts[i] || 'text';
        const code = parts[i + 1]?.trim() || '';
        if (code) {
          elements.push(
            <Box key={`code-${i}`}>
              <hr />
              <Typography>AI code block:</Typography>
              <SyntaxHighlighter language={language} style={darkMode ? vscDarkPlus : vs}>
                {code}
              </SyntaxHighlighter>
            </Box>
          );
        }
        i++; // Skip to the next part since we've just processed the code
      }
      // i % 3 == 2 would be the code, but we handle it with i % 3 == 1 for simplicity
    }
    return elements.length > 0 ? elements : <Typography>{msg}</Typography>;
  };

  // Function to handle sending a message
  const sendMessage = async () => {
    if (input.trim()) {
      setMessages(prevMessages => [...prevMessages, { 
        text: input,
        sender: 'user'
      }]);
      // setMessages(prevMessages => [...prevMessages, { 
      //   text: <img src="assets/images/artificial-intelligence.gif" alt="brain" height="50" />, 
      //   sender: 'AI',
      // }]);
      setInput('');
    };

    const optionsGenerate = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: input,
        stream: false,
        // format: 'json'
      })
    };

    const optionsChat = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: input
          }
        ],
        stream: false,
        // format: 'json'
      })
    };
    
    // const response = await OllamaApi("generate", options);
    const response = await OllamaApi("chat", optionsChat);
    console.log("Response: ", response);
    // renderMessageContent(response);
    const renderedInput: any = await renderMessageContent(response.message.content);
    console.log("Rendered Input: ", renderedInput);
    setMessages(prevMessages => [...prevMessages, {
      text: renderedInput,
      sender: 'AI'
    }]);
    
    // const isCode = response.includes('```');
    // Then when you update your messages state:
    /*
    setMessages(prevMessages => [...prevMessages, {
      text: `AI: ${response}`, // Assuming response is the string you get back from the API
      sender: 'AI',
      isCode: isCode // Here, isCode is set based on whether the message includes ```
    }]);
    */
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        {/* Chat Display */}
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '10px',
          backgroundColor: darkMode ? 'black' : '#f5f5f5'
        }}>
          <List>
            {messages.map((msg, index) => (
              <ListItem key={index} sx={{
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <Box
                  sx={{ 
                    backgroundColor: msg.sender === 'user' ? '#dcf8c6' : '#fff', 
                    borderRadius: '10px', 
                    padding: '8px 12px', 
                    display: 'inline-block',
                    color: darkMode ? 'black' : 'black'
                  }}                
                >
                  <Typography component="div">
                    {msg.text}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Area */}
        <Box sx={{
          display: 'flex',
          padding: '10px', 
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'black' : 'white',
          borderTop: '1px solid #ccc',
          flexDirection: 'column', // Stack items vertically on very small screens
          [`@media (min-width: 400px)`]: { // Adjust layout for slightly larger screens
            flexDirection: 'row'
          }
        }}>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  // Insert newline
                  // Prevent default behavior to avoid form submission if within a form
                  e.preventDefault();
                  setInput((prevInput) => prevInput + '\n');
                } else {
                  // Send message
                  sendMessage();
                }
              }
            }}
            placeholder="Type a message"
            multiline
            minRows={1}
            sx={{
              flexGrow: 1, // Takes up available space in row direction
              [`@media (max-width: 400px)`]: {
                marginBottom: '10px' // Add space between TextField and Button on small screens
              },
              '& .MuiOutlinedInput-input': {
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              },
            }}
          />
          <SelectOllamaModel />
          <Button 
            variant="outlined"
            color="primary"
            endIcon={<SendIcon />}
            onClick={sendMessage}
            sx={{ 
              ml: theme => theme.spacing(1), // Use theme spacing for consistency
              mt: theme => theme.spacing(1), // Add margin top for mobile view
              [`@media (min-width: 400px)`]: {
                ml: 1, // Margin left for larger screens
                mt: 0 // No margin top needed for larger screens
              },
              maxHeight: '55px'
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </>
  );
};
