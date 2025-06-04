"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";

interface ImageUploadProps {
  onSvgCreated: (svg: string, viewBox?: string) => void;
}

export function ImageUpload({ onSvgCreated }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processSvgFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        const text = await file.text();

        // Parse SVG to extract path data and viewBox
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) {
          throw new Error("Invalid SVG file");
        }

        // Extract all path elements and combine them
        const paths = Array.from(svgElement.querySelectorAll("path"));
        const combinedPath = paths
          .map((path) => path.getAttribute("d"))
          .filter(Boolean)
          .join(" ");

        // Get viewBox or calculate from width/height
        let viewBox = svgElement.getAttribute("viewBox");
        if (!viewBox) {
          const width = svgElement.getAttribute("width") || "100";
          const height = svgElement.getAttribute("height") || "100";
          viewBox = `0 0 ${width} ${height}`;
        }

        if (combinedPath) {
          onSvgCreated(combinedPath, viewBox);
        } else {
          throw new Error("No path data found in SVG");
        }
      } catch (error) {
        console.error("Error processing SVG:", error);
        alert(
          "Error processing SVG file. Please make sure it contains path elements."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onSvgCreated]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const svgFile = files.find(
        (file) => file.type === "image/svg+xml" || file.name.endsWith(".svg")
      );

      if (svgFile) {
        processSvgFile(svgFile);
      } else {
        alert("Please upload an SVG file");
      }
    },
    [processSvgFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processSvgFile(file);
      }
    },
    [processSvgFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
      <Card
        className={`w-full max-w-2xl p-8 border-2 border-dashed transition-colors ${
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
            <FileText className="w-8 h-8 text-gray-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Upload SVG File
            </h2>
            <p className="text-gray-400">
              Drag and drop your SVG file here, or click to browse
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileInput}
              className="hidden"
              id="svg-upload"
              disabled={isProcessing}
            />

            <Button
              asChild
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={isProcessing}
            >
              <label htmlFor="svg-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Choose SVG File"}
              </label>
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p>Supported format: SVG files with path elements</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
