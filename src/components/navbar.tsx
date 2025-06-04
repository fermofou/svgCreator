"use client";

import { Button } from "@/components/ui/button";
import { Upload, Paintbrush, Eye, RotateCcw } from "lucide-react";
import type { Mode } from "@/app/page";

interface NavbarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onReset: () => void;
  hasContent: boolean;
}

export default function Navbar({
  mode,
  onModeChange,
  onReset,
  hasContent,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <h1 className="text-white font-bold text-xl mr-6">
              SVG Particle Creator
            </h1>

            <Button
              variant={mode === "upload" ? "default" : "default"}
              size="sm"
              onClick={() => onModeChange("upload")}
              className={
                mode === "upload"
                  ? "text-cyan-400"
                  : "text-gray-400 hover:text-cyan-400"
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image/SVG
            </Button>

            <Button
              variant={mode === "draw" ? "default" : "default"}
              size="sm"
              onClick={() => onModeChange("draw")}
              className={
                mode === "draw"
                  ? "text-cyan-400"
                  : "text-gray-400 hover:text-cyan-400"
              }
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              Draw
            </Button>

            {hasContent && (
              <Button
                variant={mode === "preview" ? "default" : "default"}
                size="sm"
                onClick={() => onModeChange("preview")}
                className={
                  mode === "preview"
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
          </div>

          {hasContent && (
            <Button
              variant={mode === "preview" ? "destructive" : "ghost"}
              size="sm"
              onClick={onReset}
              className="text-white border-gray-600 hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
