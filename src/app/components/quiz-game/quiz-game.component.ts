import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
// Removed ionicons imports - using Font Awesome instead
import { AudioService } from '../../services/audio.service';
import { AuthService } from '../../services/auth.service';
import { LeaderboardService } from '../../services/leaderboard.service';
import { ProgressService } from '../../services/progress.service';
import { QuizService } from '../../services/quiz.service';
import { SoundService } from '../../services/sound.service';
import { QuizQuestion, Surah } from '../../types/quiz.types';

@Component({
  selector: 'app-quiz-game',
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './quiz-game.component.html',
  styleUrls: ['./quiz-game.component.scss'],
})
export class QuizGameComponent implements OnInit {
  currentQuestion = signal<QuizQuestion | null>(null);
  selectedOption = signal<Surah | null>(null);
  showResult = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  gameCompleted = signal<boolean>(false);
  questionsRemaining = signal<number>(10);
  gameStartTime = signal<number>(0);

  gameStats = computed(() => this.quizService.getGameStats()());
  accuracy = computed(() => this.quizService.getAccuracy());
  userProgress = computed(() => this.progressService.getProgress()());

  // Preloading status
  queueSize = computed(() => this.quizService.getQueueSize());
  isPreloading = computed(() => this.quizService.isPreloadingQuestions());
  hasNextReady = computed(() => this.quizService.hasNextQuestionReady());

  // Sound settings
  soundEnabled = computed(() => this.soundService.getSoundEnabled()());

  // Authentication
  currentUser = computed(() => this.authService.user());
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  authLoading = computed(() => this.authService.loading());

  constructor(
    private quizService: QuizService,
    private progressService: ProgressService,
    private soundService: SoundService,
    private authService: AuthService,
    private leaderboardService: LeaderboardService,
    private audioService: AudioService,
    private router: Router
  ) {
    // Font Awesome icons are used instead of Ionic icons
  }

  ngOnInit(): void {
    // Start preloading questions immediately for faster game experience
    this.quizService.startNewGame();
    this.gameStartTime.set(Date.now());
    this.startNewQuestion();
  }

  enToAr(str: number): string {
    return str.toString().replace(/\d/g, (d: any) => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  startNewQuestion(): void {
    if (this.questionsRemaining() <= 0) {
      this.completeGame();
      return;
    }

    // Only show loading if no preloaded question is available
    const hasNext = this.hasNextReady();
    this.isLoading.set(!hasNext);
    this.showResult.set(false);
    this.selectedOption.set(null);

    this.quizService.getNextQuestion().subscribe({
      next: (question) => {
        this.currentQuestion.set(question);
        this.isLoading.set(false);

        // Play ayah audio when question appears
        this.playAyahAudio(question.ayah.number);
      },
      error: (error) => {
        console.error('Error generating question:', error);
        this.isLoading.set(false);
      },
    });
  }

  selectOption(option: Surah): void {
    if (this.showResult()) return;

    // Play button click sound
    this.soundService.playButtonClick();

    this.selectedOption.set(option);
    const correct = this.quizService.submitAnswer(option);
    this.isCorrect.set(correct);
    this.showResult.set(true);

    // Play appropriate sound effect
    if (correct) {
      this.soundService.playCorrect();

      // Check if it's a streak milestone for level up sound
      const currentStreak = this.gameStats().streakCount;
      if (currentStreak > 0 && currentStreak % 5 === 0) {
        setTimeout(() => {
          this.soundService.playLevelUp();
        }, 500);
      }
    } else {
      this.soundService.playIncorrect();

      // Save current score if it's higher than previous highest score (for authenticated users)
      if (this.isAuthenticated()) {
        const currentScore = this.gameStats().score;
        this.authService
          .updateHighestScoreIfBetter(currentScore)
          .catch((error) => {
            console.error('Failed to update highest score:', error);
          });
      }
    }

    // Auto-advance to next question if answer is correct
    if (correct) {
      setTimeout(() => {
        this.nextQuestion();
      }, 200);
    }
  }

  nextQuestion(): void {
    this.questionsRemaining.set(this.questionsRemaining() - 1);
    this.startNewQuestion();
  }

  async completeGame(): Promise<void> {
    const stats = this.gameStats();
    const gameDuration = Date.now() - this.gameStartTime();

    // Stop any playing ayah audio
    this.stopAyahAudio();

    // Play game over sound
    this.soundService.playGameOver();

    // Update progress with game results
    this.progressService.updateProgress({
      correctAnswers: stats.correctAnswers,
      totalQuestions: stats.totalQuestions,
      streak: stats.streakCount,
    });

    // If user is authenticated, record the game session and update stats
    if (this.isAuthenticated()) {
      try {
        const user = this.currentUser();
        if (user) {
          // Update user stats in Auth service
          await this.authService.updateUserStats({
            score: stats.score,
            totalQuestions: stats.totalQuestions,
            correctAnswers: stats.correctAnswers,
            streakCount: stats.streakCount,
          });

          // Record game session for leaderboard
          await this.leaderboardService.recordGameSession({
            uid: user.uid,
            score: stats.score,
            totalQuestions: stats.totalQuestions,
            correctAnswers: stats.correctAnswers,
            streakCount: stats.streakCount,
            accuracy: Math.round(
              (stats.correctAnswers / stats.totalQuestions) * 100
            ),
            duration: gameDuration,
          });
        }
      } catch (error) {
        console.error('Error recording game stats:', error);
      }
    }

    this.gameCompleted.set(true);
  }

  getOptionClass(option: Surah): string {
    if (!this.showResult()) {
      return this.selectedOption() === option ? 'selected' : '';
    }

    const current = this.currentQuestion();
    if (!current) return '';

    if (option.number === current.correctSurah.number) {
      return 'correct';
    }

    if (this.selectedOption() === option && !this.isCorrect()) {
      return 'wrong';
    }

    return '';
  }

  startNewGame(): void {
    // Play button click sound
    this.soundService.playButtonClick();

    // Stop any playing ayah audio
    this.stopAyahAudio();

    this.quizService.startNewGame();
    this.gameCompleted.set(false);
    this.questionsRemaining.set(10);
    this.gameStartTime.set(Date.now());
    this.startNewQuestion();
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.soundService.playCorrect(); // Play success sound
    } catch (error) {
      console.error('Login failed:', error);
      this.soundService.playIncorrect(); // Play error sound
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.soundService.playButtonClick();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  viewLeaderboard(): void {
    this.soundService.playButtonClick();
    this.router.navigate(['/leaderboard']);
  }

  goToHome(): void {
    // Play button click sound
    this.soundService.playButtonClick();
    this.router.navigate(['/home']);
  }

  viewProfile(): void {
    // Play button click sound
    this.soundService.playButtonClick();
    this.router.navigate(['/profile']);
  }

  getProgressPercentage(): number {
    const total = 10; // Default questions per game
    const answered = total - this.questionsRemaining();
    return Math.round((answered / total) * 100);
  }

  toggleSound(): void {
    this.soundService.toggleSound();
  }

  isSoundEnabled(): boolean {
    return this.soundService.getSoundEnabled()();
  }

  async playAyahAudio(ayahNumber: number): Promise<void> {
    if (!this.audioService.isAudioDataLoaded()) {
      console.warn('Audio data not loaded yet');
      return;
    }

    const audioUrl = this.audioService.getAyahAudioUrl(ayahNumber);
    const fallbackUrls = this.audioService.getAyahAudioSecondaryUrl(ayahNumber);

    if (audioUrl) {
      try {
        await this.soundService.playAyahAudio(audioUrl, fallbackUrls);
      } catch (error) {
        console.warn('Failed to play ayah audio:', error);
      }
    }
  }

  stopAyahAudio(): void {
    this.soundService.stopAyahAudio();
  }

  isAyahAudioPlaying(): boolean {
    return this.soundService.isAyahAudioPlaying();
  }

  async toggleAyahAudio(): Promise<void> {
    if (this.isAyahAudioPlaying()) {
      this.stopAyahAudio();
    } else {
      const currentQuestion = this.currentQuestion();
      if (currentQuestion) {
        await this.playAyahAudio(currentQuestion.ayah.number);
      }
    }
  }
}
