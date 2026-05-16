import Phaser from 'phaser';
import { getTopScores, LeaderboardEntry } from '../lib/leaderboard';

export class MainMenuScene extends Phaser.Scene {
  private nicknameInput!: Phaser.GameObjects.DOMElement;
  private statusText!: Phaser.GameObjects.Text;
  private rankingTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    const cx = width / 2;

    // ── 배경 ──────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
    }

    // ── 타이틀 ────────────────────────────────────────
    this.add.text(cx, 48, '⚔️ 서바이버 디펜스 ⚔️', {
      fontSize: '38px', color: '#ffffff',
      stroke: '#000088', strokeThickness: 6, fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── 레이아웃 구분선 ───────────────────────────────
    // 좌: 닉네임 입력 / 우: 랭킹

    // ── 닉네임 입력 (좌측) ────────────────────────────
    const lx = width * 0.28;

    this.add.text(lx, 120, '닉네임을 입력하세요', {
      fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5);

    // HTML input 요소
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.maxLength = 12;
    inputEl.placeholder = '닉네임 (최대 12자)';
    inputEl.style.cssText = [
      'width: 200px',
      'padding: 8px 12px',
      'font-size: 16px',
      'border: 2px solid #4444ff',
      'border-radius: 6px',
      'background: #111133',
      'color: #ffffff',
      'outline: none',
      'text-align: center',
      'font-family: sans-serif',
    ].join(';');

    this.nicknameInput = this.add.dom(lx, 158, inputEl);

    // ── 상태 텍스트 ───────────────────────────────────
    this.statusText = this.add.text(lx, 196, '', {
      fontSize: '13px', color: '#ff6666',
    }).setOrigin(0.5);

    // ── 게임 시작 버튼 ────────────────────────────────
    const startBtn = this.add.rectangle(lx, 234, 200, 44, 0x2244cc)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4466ff);
    const startText = this.add.text(lx, 234, '▶ 게임 시작', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    startBtn.on('pointerover',  () => startBtn.setFillStyle(0x3355ee));
    startBtn.on('pointerout',   () => startBtn.setFillStyle(0x2244cc));
    startBtn.on('pointerdown',  () => this.startGame(inputEl));

    // Enter 키로도 시작
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.startGame(inputEl);
    });

    // ── 조작법 ────────────────────────────────────────
    this.add.text(lx, 300, '🕹️ WASD / 방향키 이동\n💎 EXP 획득 → ⬆️ 레벨업 → 🪄 무기 강화\n👾 몬스터를 처치하고 최대한 생존하세요!', {
      fontSize: '12px', color: '#777799', align: 'center',
    }).setOrigin(0.5);

    // ── 랭킹보드 (우측) ──────────────────────────────
    const rx = width * 0.72;

    this.add.rectangle(rx, height / 2, width * 0.48, height - 80, 0x0a0a22, 0.85)
      .setStrokeStyle(1, 0x333366);

    this.add.text(rx, 96, '🏆 랭킹', {
      fontSize: '22px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(rx, 124, '─────────────────────────', {
      fontSize: '12px', color: '#333355',
    }).setOrigin(0.5);

    // 랭킹 헤더
    this.add.text(rx - 130, 144, '#', { fontSize: '13px', color: '#888899' }).setOrigin(0, 0.5);
    this.add.text(rx - 110, 144, '닉네임',  { fontSize: '13px', color: '#888899' }).setOrigin(0, 0.5);
    this.add.text(rx + 20,  144, '점수',    { fontSize: '13px', color: '#888899' }).setOrigin(0, 0.5);
    this.add.text(rx + 80,  144, '레벨',   { fontSize: '13px', color: '#888899' }).setOrigin(0, 0.5);

    const loadingText = this.add.text(rx, 220, '불러오는 중...', {
      fontSize: '14px', color: '#555577',
    }).setOrigin(0.5);

    // 랭킹 비동기 로드
    const entries = await getTopScores(10);
    loadingText.destroy();
    this.renderRanking(entries, rx);

    // 반짝임
    this.tweens.add({
      targets: startText,
      alpha: 0.6, duration: 900, yoyo: true, repeat: -1,
    });
  }

  private renderRanking(entries: LeaderboardEntry[], rx: number): void {
    this.rankingTexts.forEach(t => t.destroy());
    this.rankingTexts = [];

    if (entries.length === 0) {
      const t = this.add.text(rx, 220, '아직 기록이 없습니다\n첫 번째 도전자가 되세요!', {
        fontSize: '14px', color: '#555577', align: 'center',
      }).setOrigin(0.5);
      this.rankingTexts.push(t);
      return;
    }

    entries.forEach((e, i) => {
      const y = 168 + i * 30;
      const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaaacc';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

      const mins = Math.floor(e.time_seconds / 60);
      const secs = e.time_seconds % 60;
      const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

      const rankT  = this.add.text(rx - 130, y, medal,   { fontSize: '13px', color: rankColor }).setOrigin(0, 0.5);
      const nameT  = this.add.text(rx - 108, y, e.nickname.slice(0, 10), { fontSize: '13px', color: rankColor }).setOrigin(0, 0.5);
      const scoreT = this.add.text(rx + 20,  y, String(e.score),  { fontSize: '13px', color: '#ffffff' }).setOrigin(0, 0.5);
      const levelT = this.add.text(rx + 80,  y, `Lv${e.level}`,  { fontSize: '12px', color: '#88aaff' }).setOrigin(0, 0.5);

      this.rankingTexts.push(rankT, nameT, scoreT, levelT);
    });
  }

  private startGame(inputEl: HTMLInputElement): void {
    const nickname = inputEl.value.trim();
    if (!nickname) {
      this.statusText.setText('닉네임을 입력해주세요!');
      this.tweens.add({ targets: this.statusText, alpha: 0, duration: 2000, onComplete: () => this.statusText.setAlpha(1).setText('') });
      return;
    }

    // 닉네임을 전역 레지스트리에 저장
    this.registry.set('nickname', nickname);

    // DOM 요소 제거
    this.nicknameInput.destroy();

    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
