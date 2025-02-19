export const OllamaApi = async ( apiRequest: string, options: {[key: string]: any} ) => {
  const endPoints = localStorage.getItem("useAIEndpoint");
  console.log("OllamaApi Endpoints: ", endPoints)
  const endpoint = endPoints ? JSON.parse( endPoints ) : ["localhost", "11434"];
  console.log("OllamaApi Endpoint: ", endpoint);
  try {
    const response = await fetch(`http://${endpoint[0]}:${endpoint[1]}/api/${apiRequest}`, options);
    // console.log(" OllamaApi Response: ", response);
    const data: any = await response.json();
    // console.log("ollama api: ", data);
    return(data);
  } catch (error) {
      console.log("OllamaApi Error: ", error);
  };
};