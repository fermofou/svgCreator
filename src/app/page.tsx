"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
// Fix the import to use the correct component name
import ImageUpload from "@/components/image-upload";
import CanvasDraw from "@/components/canvas-draw";
import ParticleEffect from "@/components/particle-effect";

export type Mode = "upload" | "draw" | "preview";

export default function App() {
  const [mode, setMode] = useState<Mode>("upload");
  const [svgData, setSvgData] = useState<string>("");
  const [svgViewBox, setSvgViewBox] = useState<string>("0 0 100 100");

  const handleSvgCreated = (svg: string, viewBox?: string) => {
    setSvgData(svg);
    if (viewBox) setSvgViewBox(viewBox);
    setMode("preview");
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleReset = () => {
    setSvgData("");
    setSvgViewBox("0 0 100 100");
    setMode("upload");
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar
        mode={mode}
        onModeChange={handleModeChange}
        onReset={handleReset}
        hasContent={!!svgData}
      />

      <main className="relative">
        {/* Use the correct component name here */}
        {mode === "upload" && <ImageUpload onSvgCreated={handleSvgCreated} />}
        {mode === "draw" && <CanvasDraw onSvgCreated={handleSvgCreated} />}
        {mode === "preview" && svgData && (
          <ParticleEffect svgData={svgData} viewBox={svgViewBox} />
        )}
      </main>
    </div>
  );
}
