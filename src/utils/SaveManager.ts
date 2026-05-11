const KEY_HIGH_SCORE = 'sd_high_score';
const KEY_SETTINGS = 'sd_settings';

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.5,
  sfxVolume: 0.7,
};

export const SaveManager = {
  getHighScore(): number {
    const val = localStorage.getItem(KEY_HIGH_SCORE);
    return val ? parseInt(val, 10) : 0;
  },

  saveHighScore(score: number): void {
    const current = this.getHighScore();
    if (score > current) {
      localStorage.setItem(KEY_HIGH_SCORE, String(score));
    }
  },

  getSettings(): GameSettings {
    const val = localStorage.getItem(KEY_SETTINGS);
    if (!val) return { ...DEFAULT_SETTINGS };
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(val) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings: Partial<GameSettings>): void {
    const current = this.getSettings();
    localStorage.setItem(KEY_SETTINGS, JSON.stringify({ ...current, ...settings }));
  },
};
