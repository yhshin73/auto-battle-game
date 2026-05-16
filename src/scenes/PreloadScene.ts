import Phaser from 'phaser';

const FRAME_W = 100;
const FRAME_H = 100;
const CFG = { frameWidth: FRAME_W, frameHeight: FRAME_H };

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);
    this.add.text(width / 2, height / 2 - 40, '⚔️ 서바이버 디펜스', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 10, 320, 16, 0x333333).setOrigin(0.5);
    const bar   = this.add.rectangle(width / 2 - 159, height / 2 + 10, 0, 14, 0x00ff88).setOrigin(0, 0.5);
    const pct   = this.add.text(width / 2, height / 2 + 36, '0%', {
      fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = 316 * v;
      pct.setText(Math.floor(v * 100) + '%');
    });

    // ── 플레이어 (Wizard) ──────────────────────────────
    this.load.spritesheet('wizard_idle',   'assets/sprites/wizard_idle.png',   CFG);
    this.load.spritesheet('wizard_walk',   'assets/sprites/wizard_walk.png',   CFG);
    this.load.spritesheet('wizard_attack', 'assets/sprites/wizard_attack.png', CFG);
    this.load.spritesheet('wizard_hurt',   'assets/sprites/wizard_hurt.png',   CFG);
    this.load.spritesheet('wizard_death',  'assets/sprites/wizard_death.png',  CFG);

    // ── 적: 슬라임 ────────────────────────────────────
    this.load.spritesheet('slime_idle',   'assets/sprites/slime_idle.png',   CFG);
    this.load.spritesheet('slime_walk',   'assets/sprites/slime_walk.png',   CFG);
    this.load.spritesheet('slime_attack', 'assets/sprites/slime_attack.png', CFG);
    this.load.spritesheet('slime_hurt',   'assets/sprites/slime_hurt.png',   CFG);
    this.load.spritesheet('slime_death',  'assets/sprites/slime_death.png',  CFG);

    // ── 적: 스켈레톤 (고블린) ────────────────────────
    this.load.spritesheet('skeleton_idle',   'assets/sprites/skeleton_idle.png',   CFG);
    this.load.spritesheet('skeleton_walk',   'assets/sprites/skeleton_walk.png',   CFG);
    this.load.spritesheet('skeleton_attack', 'assets/sprites/skeleton_attack.png', CFG);
    this.load.spritesheet('skeleton_hurt',   'assets/sprites/skeleton_hurt.png',   CFG);
    this.load.spritesheet('skeleton_death',  'assets/sprites/skeleton_death.png',  CFG);

    // ── 적: 오크 ─────────────────────────────────────
    this.load.spritesheet('orc_idle',   'assets/sprites/orc_idle.png',   CFG);
    this.load.spritesheet('orc_walk',   'assets/sprites/orc_walk.png',   CFG);
    this.load.spritesheet('orc_attack', 'assets/sprites/orc_attack.png', CFG);
    this.load.spritesheet('orc_hurt',   'assets/sprites/orc_hurt.png',   CFG);
    this.load.spritesheet('orc_death',  'assets/sprites/orc_death.png',  CFG);

    // ── 적: 스켈레톤 아처 (마법사) ──────────────────
    this.load.spritesheet('archer_idle',   'assets/sprites/archer_idle.png',   CFG);
    this.load.spritesheet('archer_walk',   'assets/sprites/archer_walk.png',   CFG);
    this.load.spritesheet('archer_attack', 'assets/sprites/archer_attack.png', CFG);
    this.load.spritesheet('archer_hurt',   'assets/sprites/archer_hurt.png',   CFG);
    this.load.spritesheet('archer_death',  'assets/sprites/archer_death.png',  CFG);

    // ── 보스: 웨어베어 ────────────────────────────────
    this.load.spritesheet('werebear_idle',   'assets/sprites/werebear_idle.png',   CFG);
    this.load.spritesheet('werebear_walk',   'assets/sprites/werebear_walk.png',   CFG);
    this.load.spritesheet('werebear_attack', 'assets/sprites/werebear_attack.png', CFG);
    this.load.spritesheet('werebear_hurt',   'assets/sprites/werebear_hurt.png',   CFG);
    this.load.spritesheet('werebear_death',  'assets/sprites/werebear_death.png',  CFG);

    // ── 투사체 이펙트 ─────────────────────────────────
    this.load.spritesheet('effect_magic1', 'assets/sprites/effect_magic1.png', CFG);
    this.load.spritesheet('effect_magic2', 'assets/sprites/effect_magic2.png', CFG);
  }

  create(): void {
    this.createAnimations();
    this.createFallbackTextures();
    this.scene.start('MainMenuScene');
  }

  private createAnimations(): void {
    const anims = this.anims;

    const def = (key: string, sheet: string, frames: number, rate: number, repeat = -1) => {
      if (anims.exists(key)) return;
      anims.create({
        key,
        frames: anims.generateFrameNumbers(sheet, { start: 0, end: frames - 1 }),
        frameRate: rate,
        repeat,
      });
    };

    // 플레이어 (Wizard)
    def('wizard_idle',   'wizard_idle',   6, 8);
    def('wizard_walk',   'wizard_walk',   8, 10);
    def('wizard_attack', 'wizard_attack', 6, 12, 0);
    def('wizard_hurt',   'wizard_hurt',   4, 12, 0);
    def('wizard_death',  'wizard_death',  4, 8,  0);

    // 슬라임 — attack은 루프(-1)로 설정해 반복 재생
    def('slime_idle',   'slime_idle',   6, 8);
    def('slime_walk',   'slime_walk',   6, 10);
    def('slime_attack', 'slime_attack', 6, 12, -1);
    def('slime_hurt',   'slime_hurt',   4, 12, 0);
    def('slime_death',  'slime_death',  4, 8,  0);

    // 스켈레톤
    def('skeleton_idle',   'skeleton_idle',   6, 8);
    def('skeleton_walk',   'skeleton_walk',   8, 10);
    def('skeleton_attack', 'skeleton_attack', 6, 12, -1);
    def('skeleton_hurt',   'skeleton_hurt',   4, 12, 0);
    def('skeleton_death',  'skeleton_death',  4, 8,  0);

    // 오크
    def('orc_idle',   'orc_idle',   6, 8);
    def('orc_walk',   'orc_walk',   8, 10);
    def('orc_attack', 'orc_attack', 6, 12, -1);
    def('orc_hurt',   'orc_hurt',   4, 12, 0);
    def('orc_death',  'orc_death',  4, 8,  0);

    // 아처
    def('archer_idle',   'archer_idle',   6, 8);
    def('archer_walk',   'archer_walk',   8, 10);
    def('archer_attack', 'archer_attack', 9, 12, -1);
    def('archer_hurt',   'archer_hurt',   4, 12, 0);
    def('archer_death',  'archer_death',  4, 8,  0);

    // 웨어베어 (보스)
    def('werebear_idle',   'werebear_idle',   6, 8);
    def('werebear_walk',   'werebear_walk',   8, 10);
    def('werebear_attack', 'werebear_attack', 9, 12, -1);
    def('werebear_hurt',   'werebear_hurt',   4, 12, 0);
    def('werebear_death',  'werebear_death',  4, 8,  0);

    // 이펙트
    def('effect_magic1', 'effect_magic1', 10, 18, 0);
    def('effect_magic2', 'effect_magic2', 7,  18, 0);
  }

  // 무기 아이콘 등 UI용 폴백 텍스처 (이모지 캔버스)
  private createFallbackTextures(): void {
    const makeEmoji = (key: string, emoji: string, size: number, bg: string) => {
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, size, size)!;
      const ctx = canvas.getContext();
      ctx.fillStyle = bg;
      (ctx as any).roundRect(2, 2, size - 4, size - 4, 8);
      ctx.fill();
      ctx.font = `${Math.floor(size * 0.6)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + 1);
      canvas.refresh();
    };

    const icons: [string, string, string][] = [
      ['icon_wand',    '🪄', '#1a1a3a'],
      ['icon_fire',    '🔥', '#2a1000'],
      ['icon_thunder', '⚡', '#2a2a00'],
      ['icon_blade',   '⚔️', '#001a2a'],
      ['icon_arrow',   '🏹', '#1a0a2a'],
      ['icon_bomb',    '💣', '#2a1500'],
      ['icon_ice',     '❄️', '#001a2a'],
      ['icon_vine',    '🌿', '#001a00'],
      ['icon_scythe',  '☠️', '#1a001a'],
      ['icon_light',   '✨', '#2a2a10'],
      ['icon_orb',     '🔮', '#100020'],
    ];
    for (const [key, emoji, bg] of icons) makeEmoji(key, emoji, 40, bg);

    // 드롭 아이템용
    const drops: [string, string][] = [
      ['drop_exp',    '💎'],
      ['drop_bomb',   '💣'],
      ['drop_meat',   '🍖'],
      ['drop_magnet', '🧲'],
    ];
    for (const [key, emoji] of drops) makeEmoji(key, emoji, 28, '#111133');

    // 던전 바닥 타일
    if (!this.textures.exists('bg_tile')) {
      const bg = this.textures.createCanvas('bg_tile', 96, 96)!;
      const ctx = bg.getContext();
      ctx.fillStyle = '#1c1a2e'; ctx.fillRect(0, 0, 96, 96);
      ctx.strokeStyle = '#2a2840'; ctx.lineWidth = 1.5; ctx.strokeRect(2, 2, 92, 92);
      const patches = [
        { x: 4,  y: 4,  w: 42, h: 42, c: '#201e30' },
        { x: 50, y: 4,  w: 42, h: 42, c: '#1a1828' },
        { x: 4,  y: 50, w: 42, h: 42, c: '#1e1c2c' },
        { x: 50, y: 50, w: 42, h: 42, c: '#201e32' },
      ];
      for (const p of patches) { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.w, p.h); }
      ctx.strokeStyle = '#13121e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(24, 48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(70, 48); ctx.lineTo(74, 96); ctx.stroke();
      bg.refresh();
    }

    // 벽 타일 (맵 경계)
    if (!this.textures.exists('wall_tile')) {
      const wc = this.textures.createCanvas('wall_tile', 96, 96)!;
      const wctx = wc.getContext();
      wctx.fillStyle = '#0d0b18'; wctx.fillRect(0, 0, 96, 96);
      wctx.strokeStyle = '#1a1830'; wctx.lineWidth = 2; wctx.strokeRect(3, 3, 90, 90);
      wctx.fillStyle = '#141220'; wctx.fillRect(10, 10, 76, 76);
      wctx.strokeStyle = '#0a0916'; wctx.lineWidth = 1;
      wctx.beginPath(); wctx.moveTo(10, 40); wctx.lineTo(86, 40); wctx.stroke();
      wctx.beginPath(); wctx.moveTo(48, 10); wctx.lineTo(48, 86); wctx.stroke();
      wc.refresh();
    }

    // 투사체 폴백
    if (!this.textures.exists('projectile')) {
      const c = this.textures.createCanvas('projectile', 100, 100)!;
      const ctx = c.getContext();
      ctx.fillStyle = '#ffff44';
      ctx.beginPath(); ctx.arc(50, 50, 20, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }

    // 화살 텍스처 (100x100 프레임, 내부에 화살 그리기)
    if (!this.textures.exists('arrow')) {
      const c = this.textures.createCanvas('arrow', 100, 100)!;
      const ctx = c.getContext();
      const cx = 50, cy = 50;

      // 보라색 글로우
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 28);
      grad.addColorStop(0, 'rgba(200,120,255,0.6)');
      grad.addColorStop(1, 'rgba(120,40,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();

      // 화살대 (가로 막대)
      ctx.strokeStyle = '#ddaaff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 18, cy);
      ctx.stroke();

      // 화살촉 (삼각형)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx + 28, cy);     // 끝
      ctx.lineTo(cx + 14, cy - 7); // 위
      ctx.lineTo(cx + 14, cy + 7); // 아래
      ctx.closePath();
      ctx.fill();

      // 깃털 (화살 뒤쪽)
      ctx.strokeStyle = '#cc88ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 30, cy - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 30, cy + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 26, cy - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 26, cy + 6); ctx.stroke();

      c.refresh();
    }
  }
}
