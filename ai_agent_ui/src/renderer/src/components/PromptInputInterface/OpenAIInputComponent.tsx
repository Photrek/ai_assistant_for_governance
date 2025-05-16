import React from 'react'
import { OpenAI } from "openai";
import { useColorScheme } from '@mui/joy/styles'
import { useAiApiKeyhook, useAiClientHook } from '../../hooks/useEndpointHook';
import { Message, MessageHistory } from "./PromptInputInterface"
import brain from '../../../../assets/artificial-intelligence.gif'
import brain_dark from '../../../../assets/artificial-intelligence-dark.gif'

export const sendMessageOpenAi = async (
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setMessageHistory: React.Dispatch<React.SetStateAction<Message[]>>,
  messageHistory: Message[],
  temp: number,
  renderMessageContent: (content: string) => React.ReactNode,
  agentPrompt: string,
  aiApiHook: string | undefined,
  aiClient: string | undefined,
  mode: string | undefined,

): Promise<void> => {
    
  console.log("aiApiHook", aiApiHook);
  const openai = new OpenAI({
    apiKey: aiApiHook,
    dangerouslyAllowBrowser: true,
  });

  if (!input.trim()) return;

  const userMessage: Message = { role: 'user', content: input };

  setMessages((prev) => [...prev, userMessage]);
  setMessageHistory((prev) => [...prev, userMessage]);
  setInput('');

  setMessages((prev) => [
    ...prev,
    {
      role: 'thinking',
      content: (
        <img
          src={mode === "dark" ? brain_dark : brain}
          alt="brain"
          height="50"
        />
      ),
    },
  ]);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // e.g., "gpt-4" or "gpt-3.5-turbo"
      messages: [
        { role: 'system', content: agentPrompt },
        ...messageHistory
          .filter((msg) => msg.role !== 'thinking') // Exclude invalid roles
          .map((msg) => ({
            role: msg.role as 'system' | 'user' | 'assistant', // Narrow down roles
            content: typeof msg.content === 'string' ? msg.content : '', // Ensure content is a string
          })),
        { role: 'user', content: input },
      ],
      stream: true,
      temperature: temp,
    });

    let accumulatedResponse = '';
    setMessages((prev) =>
      prev.filter((item) => item.role !== 'thinking')
    );

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta?.content || '';
      accumulatedResponse += delta;

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
    console.error('Error in sendMessage:', error);
    setMessages((prev) => [
      ...prev.filter((item) => item.role !== 'thinking'),
      { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}` },
    ]);
  }
};