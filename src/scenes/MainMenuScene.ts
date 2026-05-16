import Phaser from 'phaser';
import { getTopScores, LeaderboardEntry } from '../lib/leaderboard';

export class MainMenuScene extends Phaser.Scene {
  private nickname: string = '';
  private nicknameDisplay!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private rankingTexts: Phaser.GameObjects.Text[] = [];
  private cursorVisible: boolean = true;
  private inputActive: boolean = true;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    const cx = width / 2;
    const lx = width * 0.28;

    // ── 배경 ──────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);
    for (let i = 0; i < 80; i++) {
      this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7),
      );
    }

    // ── 타이틀 ────────────────────────────────────────
    this.add.text(cx, 46, '⚔️ 서바이버 디펜스 ⚔️', {
      fontSize: '38px', color: '#ffffff',
      stroke: '#000088', strokeThickness: 6, fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── 닉네임 입력 (Phaser 네이티브) ────────────────
    this.add.text(lx, 112, '닉네임 입력', {
      fontSize: '15px', color: '#aaaacc',
    }).setOrigin(0.5);

    // 입력창 배경
    const inputBg = this.add.rectangle(lx, 148, 220, 38, 0x111133)
      .setStrokeStyle(2, 0x4466ff)
      .setInteractive({ useHandCursor: true });

    // 닉네임 표시 텍스트 (커서 포함)
    this.nicknameDisplay = this.add.text(lx, 148, '|', {
      fontSize: '17px', color: '#ffffff',
    }).setOrigin(0.5);

    // 입력창 클릭 시 포커스 표시
    inputBg.on('pointerdown', () => {
      this.inputActive = true;
      inputBg.setStrokeStyle(2, 0x88aaff);
    });

    // 커서 깜빡임
    this.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.updateDisplay();
      },
    });

    // ── 상태 텍스트 ───────────────────────────────────
    this.statusText = this.add.text(lx, 178, '', {
      fontSize: '12px', color: '#ff6666',
    }).setOrigin(0.5);

    // ── 게임 시작 버튼 ────────────────────────────────
    const startBtn = this.add.rectangle(lx, 212, 200, 40, 0x2244cc)
      .setStrokeStyle(2, 0x4466ff)
      .setInteractive({ useHandCursor: true });
    const startText = this.add.text(lx, 212, '▶ 게임 시작', {
      fontSize: '17px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    startBtn.on('pointerover',  () => startBtn.setFillStyle(0x3355ee));
    startBtn.on('pointerout',   () => startBtn.setFillStyle(0x2244cc));
    startBtn.on('pointerdown',  () => this.startGame());

    // ── 조작법 ────────────────────────────────────────
    this.add.text(lx, 290, [
      '🕹️ WASD / 방향키 이동',
      '💎 EXP 획득 → ⬆️ 레벨업 → 🪄 무기 강화',
      '👾 몬스터를 처치하고 최대한 생존하세요!',
    ].join('\n'), {
      fontSize: '12px', color: '#777799', align: 'center',
    }).setOrigin(0.5);

    // ── 키보드 입력 ───────────────────────────────────
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (!this.inputActive) return;

      if (event.key === 'Enter') {
        this.startGame();
      } else if (event.key === 'Backspace') {
        this.nickname = this.nickname.slice(0, -1);
        this.updateDisplay();
      } else if (
        event.key.length === 1 &&
        this.nickname.length < 12
      ) {
        this.nickname += event.key;
        this.updateDisplay();
      }
    });

    // 시작 버튼 반짝임
    this.tweens.add({
      targets: startText,
      alpha: 0.6, duration: 900, yoyo: true, repeat: -1,
    });

    // ── 랭킹보드 (우측) ──────────────────────────────
    const rx = width * 0.72;
    this.add.rectangle(rx, height / 2, width * 0.48, height - 80, 0x0a0a22, 0.88)
      .setStrokeStyle(1, 0x333366);

    this.add.text(rx, 92, '🏆 랭킹', {
      fontSize: '21px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(rx - 126, 120, '#',      { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx - 106, 120, '닉네임', { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx + 22,  120, '점수',   { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx + 84,  120, 'Lv',     { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);

    const loadingText = this.add.text(rx, 220, '불러오는 중...', {
      fontSize: '14px', color: '#555577',
    }).setOrigin(0.5);

    const entries = await getTopScores(10);
    loadingText.destroy();
    this.renderRanking(entries, rx);
  }

  private updateDisplay(): void {
    const cursor = this.cursorVisible ? '|' : ' ';
    const display = this.nickname.length > 0
      ? this.nickname + cursor
      : cursor;
    this.nicknameDisplay.setText(display);
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
      const y = 142 + i * 34;
      const color = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaaacc';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

      const r1 = this.add.text(rx - 126, y, medal,                    { fontSize: '13px', color }).setOrigin(0, 0.5);
      const r2 = this.add.text(rx - 106, y, e.nickname.slice(0, 10),  { fontSize: '13px', color }).setOrigin(0, 0.5);
      const r3 = this.add.text(rx + 22,  y, String(e.score),          { fontSize: '13px', color: '#ffffff' }).setOrigin(0, 0.5);
      const r4 = this.add.text(rx + 84,  y, `${e.level}`,             { fontSize: '12px', color: '#88aaff' }).setOrigin(0, 0.5);
      this.rankingTexts.push(r1, r2, r3, r4);
    });
  }

  private startGame(): void {
    const name = this.nickname.trim();
    if (!name) {
      this.statusText.setText('닉네임을 입력해주세요!');
      this.tweens.add({
        targets: this.statusText,
        alpha: 0, delay: 1800, duration: 400,
        onComplete: () => { this.statusText.setAlpha(1).setText(''); },
      });
      return;
    }

    this.inputActive = false;
    this.registry.set('nickname', name);
    this.input.keyboard!.removeAllListeners();
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
