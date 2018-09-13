const {ipcRenderer: ipc} = require('electron');

process.once('loaded', () => {
  global.ipc = ipc;
});
