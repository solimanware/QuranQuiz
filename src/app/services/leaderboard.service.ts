import { Injectable, signal } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { AppUser, GameSession, LeaderboardEntry } from '../types/quiz.types';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private leaderboard = signal<LeaderboardEntry[]>([]);
  private userRank = signal<number | null>(null);
  private isLoading = signal<boolean>(false);

  constructor(private firestore: Firestore) {}

  async recordGameSession(
    gameSession: Omit<GameSession, 'id' | 'playedAt'>
  ): Promise<void> {
    try {
      const sessionData: Omit<GameSession, 'id'> = {
        ...gameSession,
        playedAt: Date.now(),
      };

      const sessionsRef = collection(this.firestore, 'gameSessions');
      await addDoc(sessionsRef, sessionData);
    } catch (error) {
      console.error('Error recording game session:', error);
      throw error;
    }
  }

  async getTopPlayers(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    try {
      this.isLoading.set(true);

      const usersRef = collection(this.firestore, 'users');
      const q = query(
        usersRef,
        orderBy('highestScore', 'desc'),
        orderBy('xp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const leaderboardData: LeaderboardEntry[] = [];

      querySnapshot.docs.forEach((doc, index) => {
        const userData = doc.data() as AppUser;
        const accuracy =
          userData.totalQuestions > 0
            ? Math.round(
                (userData.totalCorrectAnswers / userData.totalQuestions) * 100
              )
            : 0;

        leaderboardData.push({
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          highestScore: userData.highestScore,
          level: userData.level,
          xp: userData.xp,
          totalGamesPlayed: userData.totalGamesPlayed,
          accuracy,
          lastActiveAt: userData.lastLoginAt,
          rank: index + 1,
        });
      });

      this.leaderboard.set(leaderboardData);
      return leaderboardData;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserRank(userId: string): Promise<number | null> {
    try {
      // Get all users with higher scores
      const usersRef = collection(this.firestore, 'users');
      const userDoc = await this.getUserData(userId);

      if (!userDoc) return null;

      const higherScoreQuery = query(
        usersRef,
        where('highestScore', '>', userDoc.highestScore)
      );

      const higherScoreSnapshot = await getDocs(higherScoreQuery);

      // Users with same score but higher XP
      const sameScoreQuery = query(
        usersRef,
        where('highestScore', '==', userDoc.highestScore),
        where('xp', '>', userDoc.xp)
      );

      const sameScoreSnapshot = await getDocs(sameScoreQuery);

      const rank = higherScoreSnapshot.size + sameScoreSnapshot.size + 1;
      this.userRank.set(rank);

      return rank;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  async getUserGameHistory(
    userId: string,
    limitCount: number = 10
  ): Promise<GameSession[]> {
    try {
      const sessionsRef = collection(this.firestore, 'gameSessions');
      const q = query(
        sessionsRef,
        where('uid', '==', userId),
        orderBy('playedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: GameSession[] = [];

      querySnapshot.docs.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        } as GameSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching user game history:', error);
      throw error;
    }
  }

  async getTodaysTopScores(): Promise<LeaderboardEntry[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const sessionsRef = collection(this.firestore, 'gameSessions');
      const q = query(
        sessionsRef,
        where('playedAt', '>=', todayTimestamp),
        orderBy('score', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const todaysScores: LeaderboardEntry[] = [];
      const userScores = new Map<string, GameSession>();

      // Get the highest score for each user today
      querySnapshot.docs.forEach((doc) => {
        const session = doc.data() as GameSession;
        const existing = userScores.get(session.uid);

        if (!existing || session.score > existing.score) {
          userScores.set(session.uid, session);
        }
      });

      // Convert to leaderboard entries (would need to fetch user data for display names)
      let rank = 1;
      for (const [uid, session] of userScores) {
        const userData = await this.getUserData(uid);
        if (userData) {
          todaysScores.push({
            uid,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            highestScore: session.score,
            level: userData.level,
            xp: userData.xp,
            totalGamesPlayed: userData.totalGamesPlayed,
            accuracy: session.accuracy,
            lastActiveAt: session.playedAt,
            rank: rank++,
          });
        }
      }

      return todaysScores.sort((a, b) => b.highestScore - a.highestScore);
    } catch (error) {
      console.error("Error fetching today's top scores:", error);
      throw error;
    }
  }

  private async getUserData(userId: string): Promise<AppUser | null> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('uid', '==', userId), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as AppUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Computed getters for reactive data
  getLeaderboard() {
    return this.leaderboard();
  }

  getUserCurrentRank() {
    return this.userRank();
  }

  isLoadingLeaderboard() {
    return this.isLoading();
  }
}
