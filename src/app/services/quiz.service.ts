import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable } from 'rxjs';
import {
  ApiResponse,
  Ayah,
  GameStats,
  QuizQuestion,
  Surah,
  SurahsData,
} from '../types/quiz.types';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly API_BASE_URL = 'https://api.alquran.cloud/v1';
  private readonly TOTAL_AYAHS = 6236;
  private readonly PRELOAD_COUNT = 5;

  private surahsData: Surah[] = [];
  private currentQuestion = signal<QuizQuestion | null>(null);
  private gameStats = signal<GameStats>({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    streakCount: 0,
    timeElapsed: 0,
  });

  private gameInProgress = new BehaviorSubject<boolean>(false);

  // Question queue for preloading
  private questionQueue: QuizQuestion[] = [];
  private isPreloading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadSurahsData();
  }

  // Load surahs data from local JSON
  private async loadSurahsData(): Promise<void> {
    try {
      const response = await fetch('/assets/data/surahs.json');
      const data: SurahsData = await response.json();
      this.surahsData = data.surahs.references;
    } catch (error) {
      console.error('Failed to load surahs data:', error);
    }
  }

  // Get random ayah from API
  getRandomAyah(): Observable<Ayah> {
    const randomAyahNumber = Math.floor(Math.random() * this.TOTAL_AYAHS) + 1;
    return this.http
      .get<ApiResponse>(`${this.API_BASE_URL}/ayah/${randomAyahNumber}`)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Failed to fetch ayah:', error);
          throw error;
        })
      );
  }

  // Generate single quiz question from ayah
  private createQuizQuestionFromAyah(
    ayah: Ayah,
    questionNumber: number
  ): QuizQuestion {
    const correctSurah = this.surahsData.find(
      (s) => s.number === ayah.surah.number
    );
    if (!correctSurah) {
      throw new Error('Surah not found');
    }

    const wrongOptions = this.getRandomSurahs(3, correctSurah.number);
    const allOptions = [correctSurah, ...wrongOptions].sort(
      () => Math.random() - 0.5
    );

    return {
      ayah,
      correctSurah,
      options: allOptions,
      questionNumber,
    };
  }

  // Get next question from queue or generate new one
  getNextQuestion(): Observable<QuizQuestion> {
    return new Observable((observer) => {
      // If we have questions in queue, use the first one
      if (this.questionQueue.length > 0) {
        const question = this.questionQueue.shift()!;
        question.questionNumber = this.gameStats().totalQuestions + 1;
        this.currentQuestion.set(question);

        // Start preloading more questions in background
        this.ensureQueueIsFilled();

        observer.next(question);
        observer.complete();
        return;
      }

      // No questions in queue, generate one immediately
      this.getRandomAyah().subscribe({
        next: (ayah) => {
          const question = this.createQuizQuestionFromAyah(
            ayah,
            this.gameStats().totalQuestions + 1
          );
          this.currentQuestion.set(question);

          // Start preloading more questions
          this.ensureQueueIsFilled();

          observer.next(question);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        },
      });
    });
  }

  // Preload questions to fill the queue
  private ensureQueueIsFilled(): void {
    const questionsNeeded = this.PRELOAD_COUNT - this.questionQueue.length;

    if (questionsNeeded <= 0 || this.isPreloading()) {
      return;
    }

    this.isPreloading.set(true);

    // Create array of ayah requests
    const ayahRequests = Array.from({ length: questionsNeeded }, () =>
      this.getRandomAyah()
    );

    // Execute all requests in parallel
    forkJoin(ayahRequests).subscribe({
      next: (ayahs: Ayah[]) => {
        const newQuestions = ayahs.map((ayah: Ayah, index: number) =>
          this.createQuizQuestionFromAyah(
            ayah,
            this.gameStats().totalQuestions +
              this.questionQueue.length +
              index +
              2
          )
        );

        this.questionQueue.push(...newQuestions);
        this.isPreloading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to preload questions:', error);
        this.isPreloading.set(false);
      },
    });
  }

  // Generate quiz question with 4 options (kept for backward compatibility)
  generateQuizQuestion(): Observable<QuizQuestion> {
    return this.getNextQuestion();
  }

  // Get random surahs excluding the correct one
  private getRandomSurahs(count: number, excludeNumber: number): Surah[] {
    const availableSurahs = this.surahsData.filter(
      (s) => s.number !== excludeNumber
    );
    const shuffled = [...availableSurahs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Submit answer and update stats
  submitAnswer(selectedSurah: Surah): boolean {
    const current = this.currentQuestion();
    if (!current) return false;

    const isCorrect = selectedSurah.number === current.correctSurah.number;
    const currentStats = this.gameStats();

    this.gameStats.set({
      ...currentStats,
      totalQuestions: currentStats.totalQuestions + 1,
      correctAnswers: isCorrect
        ? currentStats.correctAnswers + 1
        : currentStats.correctAnswers,
      score: isCorrect ? currentStats.score + 10 : currentStats.score,
      streakCount: isCorrect ? currentStats.streakCount + 1 : 0,
    });

    return isCorrect;
  }

  // Start new game
  startNewGame(): void {
    this.gameStats.set({
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      streakCount: 0,
      timeElapsed: 0,
    });

    // Clear the question queue for fresh start
    this.questionQueue = [];
    this.isPreloading.set(false);

    this.gameInProgress.next(true);

    // Start preloading questions for the new game
    this.ensureQueueIsFilled();
  }

  // End current game
  endGame(): void {
    this.gameInProgress.next(false);
  }

  // Getters for reactive data
  getCurrentQuestion() {
    return this.currentQuestion.asReadonly();
  }

  getGameStats() {
    return this.gameStats.asReadonly();
  }

  getGameInProgress(): Observable<boolean> {
    return this.gameInProgress.asObservable();
  }

  getSurahsData(): Surah[] {
    return this.surahsData;
  }

  // Calculate accuracy percentage
  getAccuracy(): number {
    const stats = this.gameStats();
    return stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;
  }

  // Get queue status for UI feedback
  getQueueSize(): number {
    return this.questionQueue.length;
  }

  isPreloadingQuestions(): boolean {
    return this.isPreloading();
  }

  // Check if next question is available instantly
  hasNextQuestionReady(): boolean {
    return this.questionQueue.length > 0;
  }
}
