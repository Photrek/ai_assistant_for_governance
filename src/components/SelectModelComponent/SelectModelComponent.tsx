import React from "react";
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useModel } from "../../hooks/useModel";
import { OllamaApi } from "../../API/ollamaAPI";

export const SelectOllamaModel: React.FC= () => {

  const [selectedOption, setSelectedOption] = React.useState<string>('');
  const [ models, setModels ] = React.useState<any>();
  const [ selectedModel, setSelectedModel ]: any = useModel();


  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedModel(event.target.value);
  };

  const get_model_list = async () => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    try {
      const data = await OllamaApi("tags", options);
      // console.log("Model List: ", JSON.parse(data));
      // const modalsList = JSON.parse(data);
      // console.log("Model List: ", modalsList.models);
      setModels(data);
    } catch (error) {
     console.log("Error: ", error)
    }
  };
  
  React.useEffect(() => {
    get_model_list();
  }, []);

  return (
    <div>
      <FormControl>
        <InputLabel>Select OLLAMA Model</InputLabel>
        <Select
          value={selectedModel}
          onChange={handleChange}
          label="Select OLLAMA Model"
          style={{minWidth: "200px"}}
        >
          { models && models.models.map((option: any) => (
            <MenuItem key={option.model} value={option.model}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};