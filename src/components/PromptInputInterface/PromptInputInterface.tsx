import React, { useState } from 'react';
import { Box, TextField, Button, List, ListItem, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useModel } from "../../hooks/useModel";
import { OllamaApi } from "../../API/ollamaAPI";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { useDarkMode } from "../../hooks/useDarkMode";
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

  const renderMessageContent = (msg: any) => {
    if (msg.isCode) {
      const match = msg.text.match(/```(\w+)([\s\S]+?)```/);
      if (match) {
        const [, language, code] = match;
        return (
          <SyntaxHighlighter language={language} style={ darkMode && dark}>
            {code.trim()}
          </SyntaxHighlighter>
        );
      } else {
        return <pre>{msg.text}</pre>;
      }
    }
    return msg.text;
  };

  // Function to handle sending a message
  const sendMessage = async () => {
    if (input.trim()) {
      setMessages(prevMessages => [...prevMessages, { text: input, sender: 'user' }]);
      setMessages(prevMessages => [...prevMessages, { 
        text: <img src="assets/images/artificial-intelligence.gif" alt="brain" height="50" />, 
        sender: 'AI' 
      }]);
      setInput('');
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: input,
        stream: false
      })
    };
    
    const data = await OllamaApi("generate", options);
    console.log(data);
    const isCode = data.includes('```');
    setMessages(prevMessages => [...prevMessages, { 
      text: `AI: ${JSON.parse(data).response}`, 
      sender: 'AI',
      isCode
    }]);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '500px', 
      width: '800px', 
      border: '1px solid #ccc', 
      borderRadius: '4px', 
      overflow: 'hidden' 
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
                sx={{ /* Message box styles */ }}
              >
                <Typography component="div">
                  {renderMessageContent(msg)}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        display: 'flex', 
        padding: '10px', 
        backgroundColor: darkMode ? 'black' : 'white', 
        borderTop: '1px solid #ccc'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type a message"
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<SendIcon />} 
          onClick={sendMessage}
          sx={{ ml: 1 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};
