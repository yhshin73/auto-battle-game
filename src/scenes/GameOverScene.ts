import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { saveScore, getTopScores, LeaderboardEntry } from '../lib/leaderboard';

interface GameOverData {
  kills: number;
  level: number;
  time: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  async create(data: GameOverData): Promise<void> {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const score = data.kills * 10 + data.level * 50 + data.time;
    SaveManager.saveHighScore(score);

    // ── 게임 오버 타이틀 ─────────────────────────────
    this.add.text(cx, 40, '💀 GAME OVER 💀', {
      fontSize: '42px', color: '#ff2222',
      stroke: '#000000', strokeThickness: 6, fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── 레이아웃: 좌 = 내 결과 / 우 = 랭킹 ──────────
    const lx = width * 0.28;
    const rx = width * 0.70;

    // ── 내 결과 ───────────────────────────────────────
    this.add.text(lx, 100, '📊 내 기록', {
      fontSize: '18px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5);

    const mins = Math.floor(data.time / 60);
    const secs = data.time % 60;
    const results = [
      { label: '⏱️ 생존 시간', value: `${mins}분 ${String(secs).padStart(2,'0')}초` },
      { label: '⚔️ 처치 수',   value: `${data.kills}마리` },
      { label: '⬆️ 달성 레벨', value: `Lv.${data.level}` },
      { label: '🏅 총 점수',   value: `${score}` },
    ];
    results.forEach((r, i) => {
      const y = 132 + i * 32;
      this.add.text(lx - 90, y, r.label, { fontSize: '14px', color: '#aaaacc' }).setOrigin(0, 0.5);
      this.add.text(lx + 90, y, r.value, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    // ── 랭킹 저장 & 표시 ─────────────────────────────
    const nickname = this.registry.get('nickname') as string ?? 'UNKNOWN';

    // 저장 중 표시
    const savingText = this.add.text(lx, 310, '💾 기록 저장 중...', {
      fontSize: '13px', color: '#888899',
    }).setOrigin(0.5);

    // Supabase 저장
    await saveScore({ nickname, score, kills: data.kills, level: data.level, time_seconds: data.time });
    savingText.setText('✅ 기록 저장 완료!');
    this.tweens.add({ targets: savingText, alpha: 0, delay: 1500, duration: 500 });

    // 랭킹 불러오기
    const entries = await getTopScores(10);
    this.renderRanking(entries, nickname, score, rx, height);

    // ── 버튼 ─────────────────────────────────────────
    const btnY = height - 44;
    this.createButton(lx - 70, btnY, '🔄 재도전', 0x1a3a1a, () => {
      this.scene.stop();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
    this.createButton(lx + 70, btnY, '🏠 메인', 0x1a1a3a, () => {
      this.scene.stop();
      this.scene.start('MainMenuScene');
    });
  }

  private renderRanking(
    entries: LeaderboardEntry[],
    myNickname: string,
    myScore: number,
    rx: number,
    height: number,
  ): void {
    // 내 순위 찾기
    const myRank = entries.findIndex(e => e.nickname === myNickname && e.score === myScore) + 1;

    this.add.rectangle(rx, height / 2 - 20, 280, height - 80, 0x08081a, 0.9)
      .setStrokeStyle(1, 0x333366);

    this.add.text(rx, 36, '🏆 TOP 10', {
      fontSize: '18px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (myRank > 0) {
      this.add.text(rx, 62, `내 순위: ${myRank}위`, {
        fontSize: '13px', color: '#88ffaa',
      }).setOrigin(0.5);
    }

    // 헤더
    const hY = 84;
    this.add.text(rx - 118, hY, '#',      { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx - 100, hY, '닉네임', { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx + 24,  hY, '점수',   { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);
    this.add.text(rx + 90,  hY, 'Lv',    { fontSize: '12px', color: '#666688' }).setOrigin(0, 0.5);

    entries.forEach((e, i) => {
      const y = 104 + i * 36;
      const isMe = e.nickname === myNickname && e.score === myScore;
      const rankColor = isMe ? '#88ffaa' : i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaaacc';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

      if (isMe) {
        this.add.rectangle(rx, y, 268, 28, 0x113311, 0.7);
      }

      this.add.text(rx - 118, y, medal,              { fontSize: '12px', color: rankColor }).setOrigin(0, 0.5);
      this.add.text(rx - 100, y, e.nickname.slice(0, 9), { fontSize: '12px', color: rankColor }).setOrigin(0, 0.5);
      this.add.text(rx + 24,  y, String(e.score),    { fontSize: '12px', color: '#ffffff' }).setOrigin(0, 0.5);
      this.add.text(rx + 90,  y, `${e.level}`,       { fontSize: '12px', color: '#88aaff' }).setOrigin(0, 0.5);
    });
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const btn = this.add.rectangle(x, y, 120, 36, color)
      .setStrokeStyle(1, 0x666688)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1));
    btn.on('pointerdown', onClick);
  }
}
