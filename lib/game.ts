export function initGame() {
  return {
    player: { x: 400, y: 300, hp: 100, speed: 4 },
    enemies: [] as any[],
    bullets: [] as any[],
    keys: {} as Record<string, boolean>,
    tick: 0,
  };
}

export function updateGame(game: any) {
  game.tick++;

  // 플레이어 이동
  const { keys, player } = game;
  if (keys["ArrowUp"] || keys["w"]) player.y = Math.max(10, player.y - player.speed);
  if (keys["ArrowDown"] || keys["s"]) player.y = Math.min(590, player.y + player.speed);
  if (keys["ArrowLeft"] || keys["a"]) player.x = Math.max(10, player.x - player.speed);
  if (keys["ArrowRight"] || keys["d"]) player.x = Math.min(790, player.x + player.speed);

  // 적 생성
  if (game.tick % 60 === 0) {
    game.enemies.push({ x: Math.random() * 800, y: 0, hp: 10 });
  }

  // 적 이동 (플레이어 방향으로 추적)
  game.enemies.forEach((e: any) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    e.x += (dx / dist) * 1.5;
    e.y += (dy / dist) * 1.5;
  });

  // 자동 공격 (가장 가까운 적을 향해)
  if (game.tick % 30 === 0) {
    let target = game.enemies[0];
    let minDist = Infinity;
    game.enemies.forEach((e: any) => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; target = e; }
    });

    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      game.bullets.push({
        x: player.x, y: player.y,
        vx: (dx / dist) * 7,
        vy: (dy / dist) * 7,
      });
    } else {
      game.bullets.push({ x: player.x, y: player.y, vx: 0, vy: -7 });
    }
  }

  // 총알 이동
  game.bullets.forEach((b: any) => {
    b.x += b.vx;
    b.y += b.vy;
  });

  // 충돌 처리
  const hitBullets = new Set<any>();
  game.enemies.forEach((e: any) => {
    game.bullets.forEach((b: any) => {
      const dx = e.x - b.x;
      const dy = e.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < 15) {
        e.hp -= 10;
        hitBullets.add(b);
      }
    });
  });

  game.bullets = game.bullets.filter(
    (b: any) =>
      !hitBullets.has(b) &&
      b.x > 0 && b.x < 800 &&
      b.y > 0 && b.y < 600
  );
  game.enemies = game.enemies.filter((e: any) => e.hp > 0);
}

export function renderGame(game: any, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 800, 600);

  // 배경
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 800, 600);

  // 플레이어
  ctx.fillStyle = "#4af";
  ctx.fillRect(game.player.x - 10, game.player.y - 10, 20, 20);

  // 적
  ctx.fillStyle = "#f44";
  game.enemies.forEach((e: any) => {
    ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
  });

  // 총알
  ctx.fillStyle = "#ff0";
  game.bullets.forEach((b: any) => {
    ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
  });

  // UI
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText("HP: " + game.player.hp, 10, 20);
  ctx.fillText("적: " + game.enemies.length, 10, 40);
  ctx.fillText("WASD / 방향키로 이동", 560, 20);
}
