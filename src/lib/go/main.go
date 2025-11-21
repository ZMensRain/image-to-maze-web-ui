//go:build wasm
// +build wasm

package main

import "syscall/js"

func main() {
	js.Global().Set("generateMaze", js.FuncOf(generateMaze))

	// wait
	<-make(chan struct{})
}

func generateMaze(this js.Value, args []js.Value) any {
	return nil
}
