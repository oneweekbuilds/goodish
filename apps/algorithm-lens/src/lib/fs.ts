export const fsSupported = typeof (window as any).showDirectoryPicker === "function";

export async function connectFolder(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error - File System Access API
  const dir = await window.showDirectoryPicker();
  // we can't persist the handle securely across sessions in all browsers,
  // so store a flag + name for UI; re-ask each session as needed.
  localStorage.setItem("lens-folder-name", dir.name);
  return dir;
}

export async function scanForArchives(dir: FileSystemDirectoryHandle){
  const out: FileSystemFileHandle[] = [];
  // @ts-expect-error - File System Access API
  for await (const [name, handle] of dir.entries()){
    if (handle.kind !== "file") continue;
    if (/\.(zip|json|js|csv)$/i.test(name) && /(tiktok|instagram|youtube|watch-history|twitter|tweets|x_|facebook|reddit)/i.test(name)) {
      out.push(handle);
    }
  }
  return out;
}

export async function readFile(handle: FileSystemFileHandle){
  const file = await handle.getFile();
  return { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
}
