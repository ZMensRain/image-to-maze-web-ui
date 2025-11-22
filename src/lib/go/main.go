//go:build wasm
// +build wasm

package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg"
	"image/png"
	"syscall/js"

	"github.com/ZMensRain/image-to-maze/core"
	"github.com/ZMensRain/image-to-maze/utils"
)

func main() {
	fmt.Println("WASM loaded")

	js.Global().Set("generateMaze", generateMazeWrapper())

	// wait
	<-make(chan struct{})
}

func generateMazeWrapper() js.Func {
	// imageData,background,foreground,callback
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 4 {
			return ""
		}
		imageData, background, foreground, callback := args[0], args[1], args[2], args[3]

		var buffer []byte = make([]byte, imageData.Length())
		js.CopyBytesToGo(buffer, imageData)

		backgroundColor, _ := utils.ParseHexColor(background.String())
		foregroundColor, _ := utils.ParseHexColor(foreground.String())
		base64String, err := generateMaze(buffer, backgroundColor, foregroundColor)

		if err != nil {
			fmt.Println(err.Error())
		}

		callback.Invoke(base64String)

		return nil
	})
}

func parseImage(buffer []byte) (image.Image, error) {
	buf := bytes.NewReader(buffer)

	img, _, err := image.Decode(buf)

	return img, err
}

func encodeImage(img image.Image) string {

	buffer := new(bytes.Buffer)
	png.Encode(buffer, img)
	return base64.StdEncoding.EncodeToString(buffer.Bytes())
}

func generateMaze(imageData []byte, background, foreground color.RGBA) (string, error) {
	img, err := parseImage(imageData)
	if err != nil {
		return "", err
	}
	fmt.Println("creating the grid based on your image")
	grid := core.GridFromImage(img)
	fmt.Println("Generation Started")
	for i := grid.FindUnvisited(); i != -1; i = grid.FindUnvisited() {
		grid.GenerateMaze(i)
	}
	fmt.Println("Generation Finished")
	maze := grid.RenderWalls(background, foreground)

	return encodeImage(maze), nil
}
