import * as React from 'react';
import { Modal, ModalDialog, DialogActions, ModalClose, Typography, Input, Button, Sheet } from '@mui/joy';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAIEndpoint, useOgmiosHook } from '../../hooks/useEndpointHook';

export const EndpointSettingsModal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [hostAddress, setHostAddress] = React.useState('');
  const [portNumber, setPortNumber] = React.useState('');
  const [aiEndpoint, setAIendpoint]: any = useAIEndpoint();
  const [ogmiosHook, setOgmiosHook]: any = useOgmiosHook();

  const handleSetAIEndPoint = async () => {
    // Validate input
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
    // Save Ogmios endpoint
    setOgmiosHook(ogmiosHook); // This might need to be adjusted based on how you want to handle or format the Ogmios endpoint
    handleClose(); // Close the modal after saving
  };

  React.useEffect(() => {
    !aiEndpoint ? setHostAddress('http://ollama.photrek.io') :  setHostAddress(JSON.parse(aiEndpoint)[0])
    !aiEndpoint ? setPortNumber('11434') :  setPortNumber(JSON.parse(aiEndpoint)[1])

  }, [aiEndpoint, ogmiosHook]);

  return (
    <div>
      <Button onClick={handleOpen} startDecorator={<SettingsIcon />}>Settings</Button>
      <Modal open={open} onClose={handleClose}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4" id="modal-title">Endpoint Settings</Typography>
          <Sheet sx={{ p: 2 }}>
            <Typography level="body-md" id="modal-description">Enter endpoints for your Ollama instance.</Typography>
            <Input
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
              size="md"         
              placeholder={"IP Address: " + (!aiEndpoint ? 'localhost' : JSON.parse(aiEndpoint)[0])}
              value={hostAddress ? hostAddress : 'localhost'}
              onChange={(e) => setHostAddress(e.target.value)}
            />
            <Input
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
              size="md"  
              placeholder={"Port Number: " + (!aiEndpoint ? '11434' : JSON.parse(aiEndpoint)[1])}
              value={portNumber ? portNumber : '11434'}
              onChange={(e) => setPortNumber(e.target.value)}
            />
          </Sheet>
          <Sheet sx={{ p: 2 }}>
            <Typography level="body-md" id="modal-description">Enter Ogmios endpoint.</Typography>
            <Input
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
              size="md"         
              placeholder="Ogmios"
              value={ogmiosHook ? ogmiosHook : "https://ogmiosmain.onchainapps.io"}
              onChange={(e) => setOgmiosHook(e.target.value)}
            />
          </Sheet>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleSetAIEndPoint}>Save</Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}