import { useState } from "react";
import { createStore } from "reusable";

export const useAIEndpoint = createStore( () => {
  // tslint:disable-next-line: react-hooks-nesting
  const [ useAIEndpoint, setUseAIEndpoint ] = useState(localStorage.getItem("useAIEndpoint"));
  // tslint:disable-next-line: no-shadowed-variable
  const handleSetAIEndPoint = async (useAIEndpoint: any) => {
    localStorage.setItem("useAIEndpoint", useAIEndpoint);
    return setUseAIEndpoint(useAIEndpoint);
  };
  return [useAIEndpoint, handleSetAIEndPoint];
});

export const useOgmiosHook = createStore( () => {
  // tslint:disable-next-line: react-hooks-nesting
  const [ ogmiosHook, setOgmiosHook ] = useState(localStorage.getItem("ogmiosHook"));
  // tslint:disable-next-line: no-shadowed-variable
  const handleSetOgmiosHook = async (ogmiosHook: any) => {
    localStorage.setItem("ogmiosHook", ogmiosHook);
    return setOgmiosHook(ogmiosHook);
  };
  return [ogmiosHook, handleSetOgmiosHook];
});

export const useAiApiKeyhook = createStore( () => {
  // tslint:disable-next-line: react-hooks-nesting
  const [ aiApiKey, setApiKey ] = useState(localStorage.getItem("aiApiHook"));
  // tslint:disable-next-line: no-shadowed-variable
  const handleSetApiKey = async (aiApiKey: any) => {
    localStorage.setItem("aiApiHook", aiApiKey);
    return setApiKey(aiApiKey);
  };
  return [aiApiKey, handleSetApiKey];
});

export const useAiClientHook = createStore( () => {
    // tslint:disable-next-line: react-hooks-nesting
    const [ aiClientHook, setAiClientHook] = useState(localStorage.getItem("aiClientHook"));
    // tslint:disable-next-line: no-shadowed-variable
    const handleSetAiClient = async (aiClientHook: any) => {
      localStorage.setItem("aiClientHook", aiClientHook);
      return setAiClientHook(aiClientHook);
    };
    return [aiClientHook, handleSetAiClient];
});