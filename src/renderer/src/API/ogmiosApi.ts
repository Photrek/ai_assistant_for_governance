import { w3cwebsocket as W3CWebSocket } from 'websocket'

export const wsp = (method: string, params: object ) => {
  let ogmiosHook = localStorage.getItem("ogmiosHook");
  ogmiosHook === null && localStorage.setItem("ogmiosHook", "wss://ogmiosmain.onchainapps.io:443");
  let OgmiosWS = new W3CWebSocket( ogmiosHook );

  OgmiosWS.onopen = () => {
    console.log('Ogmios Connection opened');
    sessionStorage.setItem("ogmiosHealth", "connected")
    try{
      OgmiosWS.send(JSON.stringify({
        "jsonrpc": "2.0",
        "method": "queryLedgerState/governanceProposals",
        "params": {
          "proposals": []
        },
        "id": "init-1234-5678"
      }));
    }catch( error ) {
      console.log("Ogmiso WS error: ", error);
      sessionStorage.setItem("ogmiosHealth", "error")
      return("error");
    };    
  };
  OgmiosWS.onerror = () => {
    console.log('Ogmios Connection Error');
    sessionStorage.setItem("ogmiosHealth", "error")
  };
  OgmiosWS.onclose = () => {
    console.log('Ogmios Connection close');
    sessionStorage.setItem( "ogmiosHealth", "closed" )
  };
  return(OgmiosWS);
};