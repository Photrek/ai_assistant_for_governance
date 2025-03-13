import { w3cwebsocket as W3CWebSocket } from 'websocket';

// Declare a variable to hold the WebSocket connection
let OgmiosWS;

function getOrCreateWebSocket(method: string, params: WebSocketParams): W3CWebSocket | "error" {
  if (!OgmiosWS || OgmiosWS.readyState === WebSocket.CLOSED) {
    let ogmiosHook = localStorage.getItem("ogmiosHook");
    if (ogmiosHook === null) {
      localStorage.setItem("ogmiosHook", "wss://ogmiosmain.onchainapps.io:443");
      ogmiosHook = "wss://ogmiosmain.onchainapps.io:443";
    }
    OgmiosWS = new W3CWebSocket(ogmiosHook);

    OgmiosWS.onopen = function() {
      console.log('Ogmios Connection opened');
      sessionStorage.setItem("ogmiosHealth", "connected");
      try {
        OgmiosWS.send(JSON.stringify({
          "jsonrpc": "2.0",
          "method": method,
          "params": params,
          "id": "init-1234-5678"
        }));
      } catch (error) {
        console.log("Ogmios WS error: ", error);
        sessionStorage.setItem("ogmiosHealth", "error");
        return "error";
      }
    };

    OgmiosWS.onerror = function() {
      console.log('Ogmios Connection Error');
      sessionStorage.setItem("ogmiosHealth", "error");
    };

    OgmiosWS.onclose = function() {
      console.log('Ogmios Connection closed');
      sessionStorage.setItem("ogmiosHealth", "closed");
    };
  }
  return OgmiosWS;
}

interface WebSocketParams {
  [key: string]: any;
}

interface WebSocketMessage {
  jsonrpc: string;
  method: string;
  params: WebSocketParams;
  id: string;
}

export function wsp(method: string, params: WebSocketParams): W3CWebSocket | "error" {
  const ws = getOrCreateWebSocket(method, params);
  
  if (ws.readyState === WebSocket.OPEN) {
    const message: WebSocketMessage = {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: "init-1234-5678"
    };
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.log("Ogmios WS error: ", error);
      sessionStorage.setItem("ogmiosHealth", "error");
      return "error";
    }
  } else {
    console.log("WebSocket not open, trying to open...");
  }
  
  return ws;
}