export function initGame() {
  return {
    player: { x: 400, y: 300, hp: 100 },
    enemies: [] as any[],
    bullets: [] as any[],
    tick: 0,
  };
}

export function updateGame(game: any) {
  game.tick++;

  // 적 생성
  if (game.tick % 60 === 0) {
    game.enemies.push({ x: Math.random() * 800, y: 0, hp: 10 });
  }

  // 적 이동
  game.enemies.forEach((e: any) => {
    e.y += 1;
  });

  // 자동 공격
  if (game.tick % 30 === 0) {
    game.bullets.push({ x: game.player.x, y: game.player.y });
  }

  // 총알 이동
  game.bullets.forEach((b: any) => {
    b.y -= 5;
  });

  // 충돌 처리 (버그 수정: 충돌한 총알도 제거)
  const hitBullets = new Set<any>();
  game.enemies.forEach((e: any) => {
    game.bullets.forEach((b: any) => {
      const dx = e.x - b.x;
      const dy = e.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        e.hp -= 10;
        hitBullets.add(b);
      }
    });
  });

  game.bullets = game.bullets.filter(
    (b: any) => !hitBullets.has(b) && b.y > 0
  );
  game.enemies = game.enemies.filter((e: any) => e.hp > 0);
}

export function renderGame(game: any, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 800, 600);

  // 플레이어
  ctx.fillStyle = "blue";
  ctx.fillRect(game.player.x - 10, game.player.y - 10, 20, 20);

  // 적
  ctx.fillStyle = "red";
  game.enemies.forEach((e: any) => {
    ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
  });

  // 총알
  ctx.fillStyle = "yellow";
  game.bullets.forEach((b: any) => {
    ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
  });
}
