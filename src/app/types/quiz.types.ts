export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface SurahsData {
  surahs: {
    count: number;
    references: Surah[];
  };
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
}

export interface ApiResponse {
  code: number;
  status: string;
  data: Ayah;
}

export interface QuizQuestion {
  ayah: Ayah;
  correctSurah: Surah;
  options: Surah[];
  questionNumber: number;
}

export interface GameStats {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  streakCount: number;
  timeElapsed: number;
}

export interface UserProgress {
  totalGamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  totalXP: number;
  level: number;
  achievements: SimpleAchievement[];
  dailyStreak: number;
  lastPlayDate: number;
  firstPlayDate: number;
  averageAccuracy: number;
}

export interface SimpleAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  type: string;
  target: number;
}

export interface UserProfile {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  gamesPlayed: number;
  highScore: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  type: string;
  target: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type GameMode = 'classic' | 'timeChallenge' | 'puzzle' | 'daily';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

// Firebase User Interface
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  lastLoginAt: number;
  highestScore: number;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  bestStreak: number;
  level: number;
  xp: number;
}

// Leaderboard Entry Interface
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  highestScore: number;
  level: number;
  xp: number;
  totalGamesPlayed: number;
  accuracy: number;
  lastActiveAt: number;
  rank?: number;
}

// Game Session Interface for recording individual games
export interface GameSession {
  id?: string;
  uid: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  streakCount: number;
  accuracy: number;
  playedAt: number;
  duration: number;
}

// Audio Data Types
export interface AudioAyah {
  number: number;
  audio: string;
  audioSecondary: string[];
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | any;
}

export interface AudioSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: AudioAyah[];
}

export interface AudioData {
  surahs: AudioSurah[];
  edition: AudioEdition;
}

export interface AudioEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export interface AudioRoot {
  code: number;
  status: string;
  data: AudioData;
}
