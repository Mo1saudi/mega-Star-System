import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  dbRead: () => 
    ipcRenderer.invoke('db-read'),
  dbWrite: (snapshot: any) => 
    ipcRenderer.invoke('db-write', snapshot),
  showNotification: (title: string, body: string) => 
    ipcRenderer.invoke('show-notification', { title, body }),
  selectFile: (options: any) => 
    ipcRenderer.invoke('select-file', options),
  getAppDataPath: () => 
    ipcRenderer.invoke('get-app-data-path'),
  isDesktop: true
});
