"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Settings, Palette } from "lucide-react";

interface ParticleEffectProps {
  svgData: string;
  viewBox: string;
}

export default function ParticleEffect({
  svgData,
  viewBox,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Particle settings
  const [particleColor, setParticleColor] = useState("#ffffff");
  const [useMultiColor, setUseMultiColor] = useState(true);
  const [particleSize, setParticleSize] = useState([1.5]);
  const [particleCount, setParticleCount] = useState([8000]);
  const [interactionDistance, setInteractionDistance] = useState([200]);
  const [particleForce, setParticleForce] = useState([50]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setIsMobile(window.innerWidth < 768);
    };

    updateCanvasSize();

    let particles: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      scatteredColor: string;
      life: number;
    }[] = [];

    let textImageData: ImageData | null = null;

    function createSvgImage() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "white";
      ctx.save();

      // Parse viewBox
      const [minX, minY, width, height] = viewBox.split(" ").map(Number);

      // Calculate scale to fit canvas while maintaining aspect ratio
      const maxSize = Math.min(canvas.width * 0.6, canvas.height * 0.6);
      const scale = maxSize / Math.max(width, height);

      // Center the SVG
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.translate(-minX, -minY);

      // Create and draw the path
      const path = new Path2D(svgData);
      ctx.fill(path);

      ctx.restore();

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null;

      const data = textImageData.data;
      const size = particleSize[0];

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * size + 0.5,
            color: particleColor,
            scatteredColor: useMultiColor
              ? `hsl(${Math.random() * 360}, 70%, 60%)`
              : particleColor,
            life: Math.random() * 100 + 50,
          };
        }
      }

      return null;
    }

    function createInitialParticles() {
      const baseParticleCount = particleCount[0];
      let particleCountScaled = baseParticleCount;
      if (canvas) {
        particleCountScaled = Math.floor(
          baseParticleCount *
            Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
        );
      }
      for (let i = 0; i < particleCountScaled; i++) {
        const particle = createParticle();
        if (particle) particles.push(particle);
      }
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const maxDistance = interactionDistance[0];
      const force = particleForce[0];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
          distance < maxDistance &&
          (isTouchingRef.current || !("ontouchstart" in window))
        ) {
          const forceRatio = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * forceRatio * force;
          const moveY = Math.sin(angle) * forceRatio * force;
          p.x = p.baseX - moveX;
          p.y = p.baseY - moveY;

          ctx.fillStyle = p.scatteredColor;
        } else {
          p.x += (p.baseX - p.x) * 0.1;
          p.y += (p.baseY - p.y) * 0.1;
          ctx.fillStyle = p.color;
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.life--;
        if (p.life <= 0) {
          const newParticle = createParticle();
          if (newParticle) {
            particles[i] = newParticle;
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      const baseParticleCount = particleCount[0];
      const targetParticleCount = Math.floor(
        baseParticleCount *
          Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
      );
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle();
        if (newParticle) particles.push(newParticle);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    createSvgImage();
    createInitialParticles();
    animate();

    const handleResize = () => {
      updateCanvasSize();
      createSvgImage();
      particles = [];
      createInitialParticles();
    };

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = () => {
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      mousePositionRef.current = { x: 0, y: 0 };
    };

    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) {
        mousePositionRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    svgData,
    viewBox,
    isMobile,
    particleColor,
    useMultiColor,
    particleSize,
    particleCount,
    interactionDistance,
    particleForce,
  ]);

  const copyComponentCode = () => {
    const componentCode = `import React, { useRef, useEffect, useState } from 'react';

export default function ParticleEffect({ svgData, viewBox }) {
  const canvasRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // You can customize these settings
  const particleColor = "${particleColor}";
  const useMultiColor = ${useMultiColor};
  const particleSize = ${particleSize[0]};
  const particleCount = ${particleCount[0]};
  const interactionDistance = ${interactionDistance[0]};
  const particleForce = ${particleForce[0]};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setIsMobile(window.innerWidth < 768);
    };

    updateCanvasSize();

    let particles = [];
    let textImageData = null;

    function createSvgImage() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "white";
      ctx.save();

      // Parse viewBox
      const [minX, minY, width, height] = viewBox.split(" ").map(Number);

      // Calculate scale to fit canvas while maintaining aspect ratio
      const maxSize = Math.min(canvas.width * 0.6, canvas.height * 0.6);
      const scale = maxSize / Math.max(width, height);

      // Center the SVG
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.translate(-minX, -minY);

      // Create and draw the path
      const path = new Path2D(svgData);
      ctx.fill(path);

      ctx.restore();

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null;

      const data = textImageData.data;

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * particleSize + 0.5,
            color: particleColor,
            scatteredColor: useMultiColor 
              ? \`hsl(\${Math.random() * 360}, 70%, 60%)\` 
              : particleColor,
            life: Math.random() * 100 + 50,
          };
        }
      }

      return null;
    }

    function createInitialParticles() {
      const particleCountScaled = Math.floor(particleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)));
      for (let i = 0; i < particleCountScaled; i++) {
        const particle = createParticle();
        if (particle) particles.push(particle);
      }
    }

    let animationFrameId;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const maxDistance = interactionDistance;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          const forceRatio = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * forceRatio * particleForce;
          const moveY = Math.sin(angle) * forceRatio * particleForce;
          p.x = p.baseX - moveX;
          p.y = p.baseY - moveY;

          ctx.fillStyle = p.scatteredColor;
        } else {
          p.x += (p.baseX - p.x) * 0.1;
          p.y += (p.baseY - p.y) * 0.1;
          ctx.fillStyle = p.color;
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.life--;
        if (p.life <= 0) {
          const newParticle = createParticle();
          if (newParticle) {
            particles[i] = newParticle;
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      const targetParticleCount = Math.floor(
        particleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
      );
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle();
        if (newParticle) particles.push(newParticle);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    createSvgImage();
    createInitialParticles();
    animate();

    const handleResize = () => {
      updateCanvasSize();
      createSvgImage();
      particles = [];
      createInitialParticles();
    };

    const handleMove = (x, y) => {
      mousePositionRef.current = { x, y };
    };

    const handleMouseMove = (e) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = () => {
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      mousePositionRef.current = { x: 0, y: 0 };
    };

    const handleMouseLeave = () => {
      if (!('ontouchstart' in window)) {
        mousePositionRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [svgData, viewBox]);

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Interactive particle effect with your custom SVG"
      />
    </div>
  );
}

// Usage example:
// <ParticleEffect 
//   svgData="${svgData.substring(0, 100)}${svgData.length > 100 ? "..." : ""}" 
//   viewBox="${viewBox}" 
// />
`;

    navigator.clipboard.writeText(componentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Interactive particle effect with your custom SVG"
      />

      {/* Settings Panel */}
      <div className="absolute top-20 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-white border-gray-600 hover:bg-gray-800"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showSettings ? "Hide Settings" : "Particle Settings"}
        </Button>

        {showSettings && (
          <Card className="mt-2 p-4 bg-black/80 backdrop-blur-sm border-gray-700 w-72">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">Particle Settings</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">
                      Particle Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={particleColor}
                        onChange={(e) => setParticleColor(e.target.value)}
                        className="w-8 h-8 rounded border-2 border-gray-600 bg-transparent cursor-pointer"
                      />
                      <Palette className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">
                      Use Multi-Color
                    </label>
                    <input
                      type="checkbox"
                      checked={useMultiColor}
                      onChange={(e) => setUseMultiColor(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-gray-400">
                      Particle Size
                    </label>
                    <span className="text-xs text-gray-500">
                      {particleSize[0].toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={particleSize}
                    onValueChange={setParticleSize}
                    min={0.5}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-gray-400">
                      Particle Count
                    </label>
                    <span className="text-xs text-gray-500">
                      {particleCount[0]}
                    </span>
                  </div>
                  <Slider
                    value={particleCount}
                    onValueChange={setParticleCount}
                    min={1000}
                    max={20000}
                    step={1000}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-gray-400">
                      Interaction Distance
                    </label>
                    <span className="text-xs text-gray-500">
                      {interactionDistance[0]}px
                    </span>
                  </div>
                  <Slider
                    value={interactionDistance}
                    onValueChange={setInteractionDistance}
                    min={50}
                    max={500}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-gray-400">
                      Particle Force
                    </label>
                    <span className="text-xs text-gray-500">
                      {particleForce[0]}
                    </span>
                  </div>
                  <Slider
                    value={particleForce}
                    onValueChange={setParticleForce}
                    min={10}
                    max={200}
                    step={5}
                  />
                </div>
              </div>

              <Button
                onClick={copyComponentCode}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Component Code
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="absolute bottom-8 text-center z-10">
        <p className="font-mono text-gray-400 text-sm">
          Move your mouse or touch to interact with the particles
        </p>
      </div>
    </div>
  );
}
