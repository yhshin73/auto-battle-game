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

    const onKeyDown = (e: KeyboardEvent) => { game.keys[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { game.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      updateGame(game);
      renderGame(game, ctx);
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ display: "block", margin: "0 auto" }} />;
}
