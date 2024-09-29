import * as React from 'react';
import { Modal, TextField, Button, Box, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAIEndpoint } from '../../hooks/useEndpointHook';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export const EndpointSettingsModal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [ hostAddress, setHostAddress ] = React.useState('');
  const [ portNumber, setPortNumber ] = React.useState('');
  const [ aiEndpoint, setAIendpoint ]: any = useAIEndpoint();

  const handleSetAIEndPoint = async () => {
    const endpointArray = [ hostAddress, portNumber];
    const endpointArrayString = JSON.stringify(endpointArray);
    console.log("endpointArrayString: ", endpointArrayString);
    setAIendpoint(endpointArrayString);
  };

  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };  

  return (
    <div>
      <Button onClick={handleOpen}><SettingsIcon /></Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
      <Box sx={style}>
        <h2 id="modal-title">Enter endpoints for your Ollama instance.</h2>
        <TextField
          sx={{ mt: 1 }}
          fullWidth
          variant="outlined"
          size="medium"         
          label={ "IP Address: " + !aiEndpoint ? 'localhost' : JSON.parse(aiEndpoint)[0] }
          value={hostAddress}
          onChange={(e) => setHostAddress(e.target.value)}
        />
        <TextField
          sx={{ mt: 1 }}
          fullWidth
          variant="outlined"
          size="medium"  
          label={"Port Number: " + !aiEndpoint ? '11434' : JSON.parse(aiEndpoint)[1]}
          value={portNumber}
          onChange={(e) => setPortNumber(e.target.value)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button sx={{ mt: 1 }} onClick={handleClose}>Cancel</Button>
          <Button sx={{ mt: 1 }} onClick={()=>handleSetAIEndPoint()}>Save</Button>
        </Box>
      </Box>
      </Modal>
    </div>
  );
}