import * as React from 'react';
import { Modal, ModalDialog, DialogActions, ModalClose, Typography, Input, Button, Sheet, Radio, RadioGroup } from '@mui/joy';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAIEndpoint, useOgmiosHook, useAiApiKeyhook, useAiClientHook } from '../../hooks/useEndpointHook';
import { SelectOllamaModel } from '../../components/SelectModelComponent/SelectModelComponent'
import { useModel } from '../../hooks/useModel'

export const EndpointSettingsModal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [endpointType, setEndpointType] = useAiClientHook()as [string, (endpointType: string) => void];;
  const [apiKey, setApiKey] = useAiApiKeyhook() as [string, (aiApiKey: string) => void];
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [hostAddress, setHostAddress] = React.useState('');
  const [portNumber, setPortNumber] = React.useState('');
  const [aiEndpoint, setAIendpoint]: any = useAIEndpoint();
  const [ogmiosHook, setOgmiosHook]: any = useOgmiosHook();
  const [selectedModel, setSelectedModel]: any = useModel()

  const handleSetAIEndPoint = async () => {
    if (endpointType === 'ollama') {
      // Validate Ollama input
      if (!hostAddress || !portNumber) {
        alert('Please enter both IP address and port number.');
        return;
      }
      if (isNaN(Number(portNumber))) {
        alert('Port number must be a number.');
        return;
      }
      const endpointArray = [hostAddress, portNumber];
      const endpointArrayString = JSON.stringify(endpointArray);
      console.log("endpointArrayString: ", endpointArrayString);
      setAIendpoint(endpointArrayString);
      setSelectedModel('llama3.1:latest');
    } else {
      if (!apiKey) {
        alert('Please enter an API key.');
        return;
      }
      setApiKey(import.meta.env.VITE_GPT_API_KEY as string);
      setAIendpoint(JSON.stringify({ type: 'chatgpt', apiKey }));
      
    }
    // Save Ogmios endpoint
    setOgmiosHook(ogmiosHook);
    setDefaultEndPoints();
    handleClose();
  };

  const setDefaultEndPoints = async () => {
    endpointType === "ollama" && setAIendpoint(JSON.stringify(["https://ollama.photrek.io", "443"]));
    endpointType === "ollama" && setHostAddress('https://ollama.photrek.io');
    endpointType === "ollama" && setPortNumber('443');
    endpointType === "ollama" && setSelectedModel('llama3.1:latest');
    endpointType === "chatgpt" && setApiKey(import.meta.env.VITE_GPT_API_KEY as string);
    endpointType === "chatgpt" &&  setAIendpoint(JSON.stringify({ type: 'chatgpt', apiKey }));
    setOgmiosHook("wss://ogmiosmain.onchainapps.io");
  };

  return (
    <div>
      <Button onClick={handleOpen} startDecorator={<SettingsIcon />} variant='outlined'>Settings</Button>
      <Modal 
        open={open} 
        onClose={handleClose}
      >
        <ModalDialog>
          <ModalClose />
          <Typography level="h4" id="modal-title">Endpoint Settings</Typography>
          <Sheet sx={{ p: 2 }}>
            <Typography level="body-md" id="modal-description">Select AI endpoint type:</Typography>
            <RadioGroup
              value={endpointType}
              onChange={(e) => setEndpointType(e.target.value as 'ollama' | 'chatgpt')}
              sx={{ mt: 1 }}
            >
              <Radio value="ollama" label="Ollama" />
              <Radio value="chatgpt" label="ChatGPT" />
            </RadioGroup>

            {endpointType === 'ollama' ? (
              <>
                <Typography level="body-md" sx={{ mt: 2 }}>URL For Ollama instance.</Typography>
                <Input
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                  size="md"         
                  placeholder={"IP Address: " + (!aiEndpoint ? 'localhost' : JSON.parse(aiEndpoint)[0])}
                  value={hostAddress}
                  onChange={(e) => setHostAddress(e.target.value)}
                />
                <Typography level="body-md" sx={{ mt: 2 }}>Specify Port.</Typography>
                <Input
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                  size="md"  
                  placeholder={"Port Number: " + (!aiEndpoint ? '11434' : JSON.parse(aiEndpoint)[1])}
                  value={portNumber}
                  onChange={(e) => setPortNumber(e.target.value)}
                />
                <Typography level="body-md" sx={{ mt: 2 }}>Select Ollama model.</Typography>
                <SelectOllamaModel />
              </>
            ) : (
              <>
                <Typography level="body-md" sx={{ mt: 2 }}>Enter ChatGPT API Key.</Typography>
                <Input
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                  size="md"
                  placeholder="ChatGPT API Key"
                  value={typeof apiKey === 'string' ? apiKey : ''}
                  onChange={(e) => setApiKey?.(e.target.value)}
                />
              </>
            )}
          </Sheet>
          <Sheet sx={{ p: 2 }}>
            <Typography level="body-md" id="modal-description">Enter Cardano Node/Ogmios endpoint.</Typography>
            <Input
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
              size="md"         
              placeholder="Ogmios"
              value={ogmiosHook}
              onChange={(e) => setOgmiosHook(e.target.value)}
            />
          </Sheet>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleSetAIEndPoint}>Save</Button>
            <Button onClick={setDefaultEndPoints}>Set Defaults</Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}