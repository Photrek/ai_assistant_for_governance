import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    let validChannels = ['asynchronous-message'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ['asynchronous-reply'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Example function to check if it's a dev environment
  isDev: () => ipcRenderer.invoke('is-dev')
});

// Here you can add more functionality if needed, ensuring security by limiting exposure to the renderer process.