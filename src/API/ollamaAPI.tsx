
export const OllamaApi = async ( apiRequest: string, options: {[key: string]: any} ) => {
  try {
    const response = await fetch(`http://192.168.1.100:11434/api/${apiRequest}`, options);
    console.log(" OllamaApi Response: ", response);
    const data: any = await response.text();
    // console.log("ollama api: ", data);
    return(data);
  } catch (error) {
      console.log("OllamaApi Error: ", error);
  };
};