//go:build wasm
// +build wasm

package main

import (
	"fmt"
	"syscall/js"
)

func main() {
	fmt.Println("WASM loaded")
	js.Global().Set("generateMaze", js.FuncOf(generateMaze))

	// wait
	<-make(chan struct{})
}

func generateMaze(this js.Value, args []js.Value) any {
	return nil
}
