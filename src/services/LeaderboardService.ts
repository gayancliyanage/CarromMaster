export interface LeaderboardEntry {
  name: string;
  score: number;
  wins: number;
  date: string;
  mode: 'cpu' | 'multiplayer';
}

const STORAGE_KEY = 'carrom_leaderboard';
const MAX_ENTRIES = 10;

export class LeaderboardService {
  private static instance: LeaderboardService;

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  getEntries(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
    return [];
  }

  addEntry(name: string, score: number, mode: 'cpu' | 'multiplayer'): number {
    const entries = this.getEntries();
    
    const newEntry: LeaderboardEntry = {
      name: name.trim().substring(0, 12) || 'Player',
      score,
      wins: 1,
      date: new Date().toLocaleDateString(),
      mode,
    };

    // Check if player already exists
    const existingIndex = entries.findIndex(
      e => e.name.toLowerCase() === newEntry.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex].wins += 1;
      entries[existingIndex].score = Math.max(entries[existingIndex].score, score);
      entries[existingIndex].date = newEntry.date;
    } else {
      // Add new entry
      entries.push(newEntry);
    }

    // Sort by score (desc), then by wins (desc)
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.wins - a.wins;
    });

    // Keep only top entries
    const trimmed = entries.slice(0, MAX_ENTRIES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save leaderboard:', e);
    }

    // Return the rank (1-based)
    return trimmed.findIndex(e => e.name.toLowerCase() === newEntry.name.toLowerCase()) + 1;
  }

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear leaderboard:', e);
    }
  }

  isHighScore(score: number): boolean {
    const entries = this.getEntries();
    if (entries.length < MAX_ENTRIES) return true;
    return score > entries[entries.length - 1].score;
  }
}
