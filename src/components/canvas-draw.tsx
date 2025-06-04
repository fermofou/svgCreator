"use client";

import type React from "react";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Palette, Eraser, Check } from "lucide-react";

interface CanvasDrawProps {
  onSvgCreated: (svg: string, viewBox?: string) => void;
}

export function CanvasDraw({ onSvgCreated }: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([5]);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath(`M ${x} ${y}`);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update current path
    setCurrentPath((prev) => `${prev} L ${x} ${y}`);

    // Draw on canvas for visual feedback
    ctx.lineWidth = brushSize[0];
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath("");
    }
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPaths([]);
      setCurrentPath("");
    }
  };

  const generateSvg = () => {
    if (paths.length === 0) {
      alert("Please draw something first!");
      return;
    }

    const combinedPath = paths.join(" ");
    const viewBox = "0 0 800 600"; // Canvas dimensions
    onSvgCreated(combinedPath, viewBox);
  };

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Controls */}
        <Card className="p-4 bg-gray-900/50 border-gray-700">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-gray-400" />
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-10 h-10 rounded border-2 border-gray-600 bg-transparent cursor-pointer"
              />
              <span className="text-sm text-gray-400">Color</span>
            </div>

            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                Brush Size:
              </span>
              <Slider
                value={brushSize}
                onValueChange={setBrushSize}
                max={20}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-white w-8">{brushSize[0]}px</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="text-white border-gray-600 hover:bg-gray-800"
              >
                <Eraser className="w-4 h-4 mr-2" />
                Clear
              </Button>

              <Button
                onClick={generateSvg}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={paths.length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Create Particles
              </Button>
            </div>
          </div>
        </Card>

        {/* Canvas */}
        <Card className="p-4 bg-gray-900/50 border-gray-700">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white mb-2">
              Draw Your Design
            </h2>
            <p className="text-gray-400">
              Draw on the canvas below to create your particle effect
            </p>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-600 rounded-lg bg-black cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
