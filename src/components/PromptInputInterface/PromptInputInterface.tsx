import React, { useState } from 'react';
import { Box, TextField, Button, List, ListItem, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useModel } from "../../hooks/useModel";
import { OllamaApi } from "../../API/ollamaAPI";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { SelectOllamaModel } from "../../components/SelectModelComponent/SelectModelComponent";
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

  const renderMessageContent = (msg: any) => {
    console.log("Response: ", msg.response);
      const match = msg.response.match(/```(\w+)([\s\S]+?)```/g);
      const text = msg.response.replace(/```.*?```/g, "");
      console.log("Match: ", match);
      if (match) {
        const [, language, code ] = match;
        console.log("language: ", language);
        console.log("code: ", code.trim());
        setMessages(prevMessages => [...prevMessages, {
          text:  <><pre>{}</pre> <SyntaxHighlighter language={language} style={ darkMode ? vscDarkPlus : vs }>
                  {code.trim()}
                </SyntaxHighlighter></>, // Assuming response is the string you get back from the API
          sender: 'AI'
        }]); 
      };
  
    // return msg.text;
  };

  const renderMessageContent2 = (msg: any) => {

    const matches = [...msg.response.matchAll(/```(\w+)([\s\S]+?)```/g)];
    console.log("Matches: ", matches); // This will log an array of match objects

    if (matches.length > 0) {

      matches.map((match, index) => {
        const [, language, code] = match; 
        setMessages(prevMessages => [...prevMessages, {
          text:
          <>
            <Typography>AI code block {index + 1}:</Typography>
            <SyntaxHighlighter key={index} language={language || 'text'} style={darkMode ? vscDarkPlus : vs}>
              {code.trim()}
            </SyntaxHighlighter>
          </>,
          sender: 'AI'
        }]); 
      });
    } else {
      // If no code blocks are found, render the entire message as plain or pre-formatted text
      setMessages(prevMessages => [...prevMessages, {
        text:
        <Box>
          <Typography>AI msg:</Typography>
          <pre>{msg.response}</pre>
        </Box>,
      sender: 'AI'
    }]); 
    }
  };

  const renderMessageContent3 = async (msg: any) => {
    if (typeof msg !== 'string') return msg; // If it's not a string, return as is
  
    // Split by code blocks to separate code from descriptions
    const parts = msg.split(/```(\w+)?([\s\S]*?)```/);
    const elements: React.ReactNode[] = [];
  
  
    for (let i = 0; i < parts.length; i++) {
      // i % 3 == 0: Text before code block or between code blocks
      if (i % 3 === 0 && parts[i].trim()) {
        elements.push(<Typography key={`desc-${i}`}>{parts[i].trim()}</Typography>);
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

    const options = {
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
    const renderedInput: any = await renderMessageContent3(response.message.content);
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

  return (
    <>
    <Typography component="div">
      <h2>Chat Interface</h2>
    </Typography>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '700px', 
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
          size="medium"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type a message"
        />
        <SelectOllamaModel />        
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
    </>
  );
};
