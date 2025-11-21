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
    generateMaze: () => any;
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

load();
