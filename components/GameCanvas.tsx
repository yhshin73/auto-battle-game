"use client";
import { useEffect, useRef } from "react";
import { initGame, updateGame, renderGame } from "../lib/game";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const game = initGame();
    let animationId: number;

    const loop = () => {
      updateGame(game);
      renderGame(game, ctx);
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
}
