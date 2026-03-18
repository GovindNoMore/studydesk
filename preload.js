const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize:     ()      => ipcRenderer.send('win:minimize'),
  maximize:     ()      => ipcRenderer.send('win:maximize'),
  close:        ()      => ipcRenderer.send('win:close'),
  fullscreen:   ()      => ipcRenderer.send('win:fullscreen'),
  openExternal: (url)   => ipcRenderer.send('open:external', url),
  send:         (ch)    => ipcRenderer.send(ch),
  spotifyAuth:    ()      => ipcRenderer.invoke('spotify:auth'),
  spotifyRefresh: (token) => ipcRenderer.invoke('spotify:refresh', token),
});
