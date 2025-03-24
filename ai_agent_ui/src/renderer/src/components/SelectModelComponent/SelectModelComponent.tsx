import React from 'react'
import { FormLabel, Select, Option } from '@mui/joy'
import { useModel } from '../../hooks/useModel'
import { Ollama } from 'ollama/browser';
import { useAIEndpoint } from '../../hooks/useEndpointHook';

export const SelectOllamaModel: React.FC = () => {
  const [models, setModels] = React.useState<any>()
  const [selectedModel, setSelectedModel]: any = useModel()
  const [aiEndpoint, setAIendpoint]: any = useAIEndpoint();

  const handleChange = (event: any, newValue: any) => {
    // Joy UI's Select component uses `onChange` with two parameters
    setSelectedModel(newValue)
  }

  const get_model_list = async () => {
    const aiEndpointParsed = JSON.parse(aiEndpoint);
    const host = aiEndpointParsed[0];
    const port = aiEndpointParsed[1];
    const urlHost = `${host}:${port}`;
    try {
      const ollama = new Ollama({ host: `${urlHost}` });
      const response = await ollama.list()
      console.log("get_model_list data: ", response)
      setModels(response)
    } catch (error) {
      console.log('Error get_model_list: ', error)
    }
  }

  React.useEffect(() => {
    get_model_list()
  }, [aiEndpoint])

  return (
    <>
      <Select
        value={selectedModel}
        onChange={handleChange}
        placeholder="Select Model"
        sx={{ 
          width: "100%",
        }}
      >
        {models && models.models.map((option: any) => (
          <Option key={option.model} value={option.model}>
            {option.name}
          </Option>
        ))}
      </Select>
    </>
  )
}