"use strict";const o=require("electron");var i={};const{contextBridge:n,ipcRenderer:t}=o;n.exposeInMainWorld("electronAPI",{uploadFile:(e,r)=>t.invoke("upload-file",e,r)});module.exports=i;
