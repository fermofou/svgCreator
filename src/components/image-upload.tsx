"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, ImageIcon, Settings, Check } from "lucide-react";

interface ImageUploadProps {
  onSvgCreated: (svg: string, viewBox?: string) => void;
}

export default function ImageUpload({ onSvgCreated }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<{
    path: string;
    viewBox: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Edge detection settings
  const [edgeThreshold, setEdgeThreshold] = useState([30]);
  const [pixelSkip, setPixelSkip] = useState([2]);
  const [maxImageSize, setMaxImageSize] = useState([400]);
  const [alphaThreshold, setAlphaThreshold] = useState([128]);

  // Current file for reprocessing with new settings
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const downloadSvg = useCallback(() => {
    if (!generatedSvg) return;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${generatedSvg.viewBox}" width="800" height="600">
  <path d="${generatedSvg.path}" fill="black" stroke="none"/>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-svg.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedSvg]);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setCurrentFile(file);

      try {
        if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
          // Existing SVG processing logic
          const text = await file.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(text, "image/svg+xml");
          const svgElement = svgDoc.querySelector("svg");

          if (!svgElement) {
            throw new Error("Invalid SVG file");
          }

          const paths = Array.from(svgElement.querySelectorAll("path"));
          const combinedPath = paths
            .map((path) => path.getAttribute("d"))
            .filter(Boolean)
            .join(" ");

          let viewBox = svgElement.getAttribute("viewBox");
          if (!viewBox) {
            const width = svgElement.getAttribute("width") || "100";
            const height = svgElement.getAttribute("height") || "100";
            viewBox = `0 0 ${width} ${height}`;
          }

          if (combinedPath) {
            setGeneratedSvg({ path: combinedPath, viewBox });
            onSvgCreated(combinedPath, viewBox);
          } else {
            throw new Error("No path data found in SVG");
          }
        } else if (file.type.startsWith("image/")) {
          // PNG/JPG to SVG conversion
          await convertImageToSvg(file);
        } else {
          throw new Error("Unsupported file type");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing file. Please try a different image or SVG.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onSvgCreated, edgeThreshold, pixelSkip, maxImageSize, alphaThreshold]
  );

  const convertImageToSvg = useCallback(
    async (file: File) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        img.onload = () => {
          try {
            // Set canvas size (limit for performance)
            const maxSize = maxImageSize[0];
            const scale = Math.min(
              maxSize / img.width,
              maxSize / img.height,
              1
            );
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Convert to SVG path using edge detection
            const svgPath = imageDataToSvgPath(
              imageData,
              canvas.width,
              canvas.height
            );
            const viewBox = `0 0 ${canvas.width} ${canvas.height}`;

            if (svgPath) {
              setGeneratedSvg({ path: svgPath, viewBox });
              onSvgCreated(svgPath, viewBox);
              resolve();
            } else {
              reject(new Error("Could not generate SVG path from image"));
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Could not load image"));
        };

        // Set crossOrigin to handle CORS
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(file);
      });
    },
    [onSvgCreated, edgeThreshold, pixelSkip, maxImageSize, alphaThreshold]
  );

  // Improved edge detection and path generation
  const imageDataToSvgPath = (
    imageData: ImageData,
    width: number,
    height: number
  ): string => {
    const data = imageData.data;
    const threshold = alphaThreshold[0];
    const edgeSensitivity = edgeThreshold[0];
    const skip = pixelSkip[0];
    const paths: string[] = [];

    // Create a binary map for edge detection
    const edges: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      edges[y] = [];
      for (let x = 0; x < width; x++) {
        edges[y][x] = false;
      }
    }

    // Detect edges using simple gradient method
    for (let y = 1; y < height - 1; y += skip) {
      for (let x = 1; x < width - 1; x += skip) {
        const idx = (y * width + x) * 4;

        // Get grayscale value
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const alpha = data[idx + 3];

        if (alpha > threshold) {
          // Check surrounding pixels for edge detection
          const neighbors = [
            (data[((y - 1) * width + x) * 4] +
              data[((y - 1) * width + x) * 4 + 1] +
              data[((y - 1) * width + x) * 4 + 2]) /
              3,
            (data[((y + 1) * width + x) * 4] +
              data[((y + 1) * width + x) * 4 + 1] +
              data[((y + 1) * width + x) * 4 + 2]) /
              3,
            (data[(y * width + (x - 1)) * 4] +
              data[(y * width + (x - 1)) * 4 + 1] +
              data[(y * width + (x - 1)) * 4 + 2]) /
              3,
            (data[(y * width + (x + 1)) * 4] +
              data[(y * width + (x + 1)) * 4 + 1] +
              data[(y * width + (x + 1)) * 4 + 2]) /
              3,
          ];

          const maxDiff = Math.max(...neighbors.map((n) => Math.abs(gray - n)));

          if (maxDiff > edgeSensitivity) {
            // Edge threshold
            edges[y][x] = true;
          }
        }
      }
    }

    // Convert edges to SVG paths
    for (let y = 0; y < height; y += skip + 1) {
      for (let x = 0; x < width; x += skip + 1) {
        if (edges[y] && edges[y][x]) {
          // Create small rectangles for edge pixels
          paths.push(
            `M ${x} ${y} L ${x + skip} ${y} L ${x + skip} ${y + skip} L ${x} ${
              y + skip
            } Z`
          );
        }
      }
    }

    return paths.join(" ");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const supportedFile = files.find(
        (file) =>
          file.type === "image/svg+xml" ||
          file.name.endsWith(".svg") ||
          file.type.startsWith("image/")
      );

      if (supportedFile) {
        processFile(supportedFile);
      } else {
        alert("Please upload an SVG or image file (PNG, JPG, JPEG)");
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const reprocessWithNewSettings = useCallback(() => {
    if (currentFile) {
      processFile(currentFile);
    }
  }, [currentFile, processFile]);

  return (
    <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Card
          className={`p-8 border-2 border-dashed transition-colors ${
            isDragging
              ? "border-cyan-400 bg-cyan-400/5"
              : "border-gray-600 bg-gray-900/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Upload Image or SVG File
              </h2>
              <p className="text-gray-400">
                Drag and drop your image or SVG file here, or click to browse
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="file"
                accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />

              <Button
                asChild
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={isProcessing}
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Choose Image or SVG File"}
                </label>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="ml-2 text-white border-gray-600 hover:bg-gray-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showSettings ? "Hide Settings" : "Edge Detection Settings"}
              </Button>
            </div>

            {showSettings && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
                <h3 className="text-white font-medium mb-4">
                  Edge Detection Settings
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-400">
                        Edge Sensitivity
                      </label>
                      <span className="text-xs text-gray-500">
                        {edgeThreshold[0]}
                      </span>
                    </div>
                    <Slider
                      value={edgeThreshold}
                      onValueChange={setEdgeThreshold}
                      min={5}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">
                      Lower values detect more edges (more detailed)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-400">
                        Pixel Skip (Performance)
                      </label>
                      <span className="text-xs text-gray-500">
                        {pixelSkip[0]}
                      </span>
                    </div>
                    <Slider
                      value={pixelSkip}
                      onValueChange={setPixelSkip}
                      min={1}
                      max={8}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">
                      Higher values improve performance but reduce detail
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-400">
                        Max Image Size
                      </label>
                      <span className="text-xs text-gray-500">
                        {maxImageSize[0]}px
                      </span>
                    </div>
                    <Slider
                      value={maxImageSize}
                      onValueChange={setMaxImageSize}
                      min={100}
                      max={1000}
                      step={50}
                    />
                    <p className="text-xs text-gray-500">
                      Larger sizes preserve more detail but use more memory
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-400">
                        Alpha Threshold
                      </label>
                      <span className="text-xs text-gray-500">
                        {alphaThreshold[0]}
                      </span>
                    </div>
                    <Slider
                      value={alphaThreshold}
                      onValueChange={setAlphaThreshold}
                      min={1}
                      max={254}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">
                      Determines which pixels are considered visible
                    </p>
                  </div>

                  {currentFile && currentFile.type.startsWith("image/") && (
                    <Button
                      onClick={reprocessWithNewSettings}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                      disabled={isProcessing}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply Settings
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 space-y-2">
              <p>
                <strong>Supported formats:</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                  SVG
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                  PNG
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                  JPG
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                  JPEG
                </span>
              </div>
              <p className="text-xs mt-2">
                Images will be converted to SVG paths automatically
              </p>
            </div>
          </div>
        </Card>

        {/* Download SVG Option */}
        {generatedSvg && (
          <Card className="p-4 bg-gray-900/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">
                  SVG Generated Successfully!
                </h3>
                <p className="text-gray-400 text-sm">
                  You can now preview the particle effect or download the SVG
                </p>
              </div>
              <Button
                onClick={downloadSvg}
                variant="outline"
                className="text-white border-gray-600 hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
