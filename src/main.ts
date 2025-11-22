import "./style.css";
import "./lib/go/wasm_exec";

import wasm from "./lib/go/main.wasm?url";

declare global {
  export interface Window {
    Go: {
      new (): {
        run: (inst: WebAssembly.Instance) => Promise<void>;
        importObject: WebAssembly.Imports;
      };
    };
    generateMaze: (
      imgData: Uint8Array,
      backgroundColor: string,
      foregroundColor: string,
      callback: (mazeData: string) => void
    ) => any;
  }
}

export async function load() {
  if (!WebAssembly) {
    throw new Error("WebAssembly is not supported in your browser");
  }

  const go = new window.Go();
  const result = await WebAssembly.instantiateStreaming(
    // load the binary
    fetch(wasm),
    go.importObject
  );

  // run it
  go.run(result.instance);

  // wait until it creates the function we need
  await until(() => window.generateMaze != undefined);
  // return the function
  return window.generateMaze;
}

// helper Promise which waits until `f` is true
const until = (f: () => boolean): Promise<void> => {
  return new Promise((resolve) => {
    const intervalCode = setInterval(() => {
      if (f()) {
        resolve();
        clearInterval(intervalCode);
      }
    }, 10);
  });
};

const imageInput = document.getElementById("imageInput");
const backgroundInput = document.getElementById("backgroundInput");
const foregroundInput = document.getElementById("foregroundInput");
const downloadButton = document.getElementById("downloadButton");

const generateMaze = await load();

async function update() {
  if (!(imageInput instanceof HTMLInputElement)) return;
  if (imageInput.files === null) return;
  if (imageInput.files.length < 1) return;
  //background checks
  if (!(backgroundInput instanceof HTMLInputElement)) return;
  if (backgroundInput.value.length !== 7) return;
  //foreground checks
  if (!(foregroundInput instanceof HTMLInputElement)) return;
  if (foregroundInput.value.length !== 7) return;

  let data = await imageInput.files[0].bytes();

  generateMaze(data, foregroundInput.value, backgroundInput.value, callback);
}

function callback(data: string) {
  const mazeImage = document.getElementById("mazeImage");
  if (!(mazeImage instanceof HTMLImageElement)) return;

  mazeImage.src = "data:image/png;base64," + data;
}

imageInput?.addEventListener("change", update);
backgroundInput?.addEventListener("input", update);
foregroundInput?.addEventListener("input", update);
downloadButton?.addEventListener("click", () => {
  const mazeImage = document.getElementById("mazeImage");
  if (!(mazeImage instanceof HTMLImageElement)) return;

  const link = document.createElement("a");
  //link to the uploaded image
  //  in your local storage
  link.href = mazeImage.src;
  link.download = "true";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

await update();
