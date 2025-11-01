import React, { useState, DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";

export function FileDropZone({onFiles}:{onFiles:(files:File[])=>void}){
  const [drag, setDrag] = useState(false);

  const handleDrop = (e:DragEvent<HTMLDivElement>)=>{
    e.preventDefault();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files);
    onFiles(files);
  };

  const handleChange = (e:ChangeEvent<HTMLInputElement>)=>{
    if(e.target.files) onFiles(Array.from(e.target.files));
  };

  return (
    <div
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={handleDrop}
      className={clsx("border-2 border-dashed rounded-2xl p-8 text-center transition focus-within:outline focus-within:outline-2 outline-brand",
        drag?"border-brand bg-brand/5":"border-line hover:border-brand")}
    >
      <Upload className="mx-auto mb-4 text-inkMuted" size={48}/>
      <p className="text-inkDim mb-2">Drag & drop files here, or click to browse</p>
      <p className="text-sm text-inkMuted mb-4">Supports .zip, .json, .js, .csv from Instagram, TikTok, X, YouTube, Facebook, Reddit</p>
      <input type="file" multiple accept=".zip,.json,.js,.csv" onChange={handleChange} className="hidden" id="file-input"/>
      <label htmlFor="file-input" className="inline-block px-4 py-2 bg-brand text-white rounded-full cursor-pointer hover:bg-brandDark transition focus-visible:outline focus-visible:outline-2 outline-brand">
        Choose Files
      </label>
    </div>
  );
}
