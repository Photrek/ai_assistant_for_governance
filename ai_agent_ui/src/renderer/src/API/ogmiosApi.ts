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

export const ogmiosHealth = async () => {
  let ogmiosHook = localStorage.getItem("ogmiosHook");
  if (ogmiosHook === null) {
    localStorage.setItem("ogmiosHook", "wss://ogmiosmain.onchainapps.io:443");
    ogmiosHook = "wss://ogmiosmain.onchainapps.io:443";
  };
  const requestOptions: any = {
    method: "GET",
    redirect: "follow",
  };

  let settings = {};
  settings = {
    method: "GET",
    headers: {},
    redirect: "follow",
  };
  try {
    const fetchResponse = await fetch(`${ogmiosHook.replace("wss://", "https://").replace("ws://", "http://")}/health`, requestOptions);
    const data = await fetchResponse.json();
    // console.log(data);
    return data;
  } catch (e) {
    console.log(e);
    return e;
  }
};

export const getCurrentEpochTime = async () => {
  const chainInfo = await ogmiosHealth();
  const epochSLotsTotal = 432000;
  const epoch = chainInfo.currentEpoch;
  const currentEpochSlot = chainInfo.slotInEpoch;
  const epochSlotsLeft = epochSLotsTotal - currentEpochSlot;
  const epochPercentDone = (currentEpochSlot / epochSLotsTotal) * 100;
  const timeLeftInEpoch = formatSeconds(epochSlotsLeft);
  return {
    epoch,
    currentEpochSlot,
    epochSlotsLeft,
    epochPercentDone,
    timeLeftInEpoch,
  };
};

function formatSeconds(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400); // 86,400 seconds in a day
  const remainingAfterDays = totalSeconds - (days * 86400);
  const hours = Math.floor(remainingAfterDays / 3600); // 3,600 seconds in an hour
  const remainingAfterHours = remainingAfterDays - (hours * 3600);
  const minutes = Math.floor(remainingAfterHours / 60); // 60 seconds in a minute
  const seconds = remainingAfterHours - (minutes * 60);

  return `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
}