import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAIEndpoint, useOgmiosHook } from '../../hooks/useEndpointHook';

export const EndpointSettingsModal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [ hostAddress, setHostAddress ] = React.useState('');
  const [ portNumber, setPortNumber ] = React.useState('');
  const [ aiEndpoint, setAIendpoint ]: any = useAIEndpoint();
  const [ ogmiosHook, setOgmiosHook ]: any = useOgmiosHook();

  const handleSetAIEndPoint = async () => {
    const endpointArray = [ hostAddress, portNumber ];
    const endpointArrayString = JSON.stringify(endpointArray);
    console.log("endpointArrayString: ", endpointArrayString);
    setAIendpoint(endpointArrayString);
  };


  return (
    <div>
      <Button onClick={handleOpen}><SettingsIcon /></Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        fullWidth
        style={{ width: '100%', height: '800px' }}
      >
        <>
          <DialogTitle id="modal-title">Endpoint Settings</DialogTitle>
          <DialogContent>
            <Box >
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

            </Box>
            <Box >
              <h2 id="modal-title">Enter Ogmios endpoint..</h2>
              <TextField
                sx={{ mt: 1 }}
                fullWidth
                variant="outlined"
                size="medium"         
                label="Ogmios"
                value={ogmiosHook}
                onChange={(e) => setOgmiosHook(e.target.value)}
              />

            </Box>
          </DialogContent>
          <DialogActions>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button sx={{ mt: 1 }} onClick={handleClose}>Close</Button>
              <Button sx={{ mt: 1 }} onClick={()=>handleSetAIEndPoint()}>Save</Button>
            </Box>
          </DialogActions>
        </>
      </Dialog>
    </div>
  );
}