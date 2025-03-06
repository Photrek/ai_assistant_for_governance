import React from 'react'
import { FormLabel, Select, Option, SelectChangeEvent } from '@mui/joy'
import { useModel } from '../../hooks/useModel'
import { OllamaApi } from '../../API/ollamaAPI'

export const SelectOllamaModel: React.FC = () => {
  const [models, setModels] = React.useState<any>()
  const [selectedModel, setSelectedModel]: any = useModel()

  const handleChange = (event: SelectChangeEvent<string>, newValue: string) => {
    // Joy UI's Select component uses `onChange` with two parameters
    setSelectedModel(newValue)
  }

  const get_model_list = async () => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    try {
      const data = await OllamaApi('tags', options)
      console.log("get_model_list data: ", data)
      setModels(data)
    } catch (error) {
      console.log('Error get_model_list: ', error)
    }
  }

  React.useEffect(() => {
    get_model_list()
  }, [])

  return (
    <div>
      <FormLabel>Select Model</FormLabel>
      <Select
        value={selectedModel}
        onChange={handleChange}
        placeholder="Select Model"
        sx={{ 
          marginLeft: '4px', // Adjust spacing as needed
          maxWidth: '200px', // Example max width, adjust as needed
          minWidth: '50px'  // Keeping your original minWidth
        }}
      >
        {models && models.models.map((option: any) => (
          <Option key={option.model} value={option.model}>
            {option.name}
          </Option>
        ))}
      </Select>
    </div>
  )
}