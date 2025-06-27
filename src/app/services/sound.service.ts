import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private soundEnabled = signal<boolean>(true);
  private masterVolume = signal<number>(0.7);
  private currentAyahAudio: HTMLAudioElement | null = null;

  private readonly SOUND_PATHS = {
    correct: '/assets/sounds/correct.mp3',
    incorrect: '/assets/sounds/incorrect.mp3',
    buttonClick: '/assets/sounds/button-click.mp3',
    gameOver: '/assets/sounds/game-over.mp3',
    levelUp: '/assets/sounds/level-up.mp3',
    countdown: '/assets/sounds/countdown.mp3',
    timeTicking: '/assets/sounds/time-ticking.mp3',
  };

  constructor() {
    this.loadSounds();
    this.loadSoundSettings();
  }

  private loadSounds(): void {
    Object.entries(this.SOUND_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = this.masterVolume();

      // Handle loading errors gracefully
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${key}`, e);
      });

      this.sounds[key] = audio;
    });
  }

  private loadSoundSettings(): void {
    const savedEnabled = localStorage.getItem('sound-enabled');
    const savedVolume = localStorage.getItem('sound-volume');

    if (savedEnabled !== null) {
      this.soundEnabled.set(savedEnabled === 'true');
    }

    if (savedVolume !== null) {
      const volume = parseFloat(savedVolume);
      this.masterVolume.set(volume);
      this.updateVolume();
    }
  }

  private saveSoundSettings(): void {
    localStorage.setItem('sound-enabled', this.soundEnabled().toString());
    localStorage.setItem('sound-volume', this.masterVolume().toString());
  }

  private playSound(soundKey: string, volume: number = 1): void {
    if (!this.soundEnabled()) return;

    const sound = this.sounds[soundKey];
    if (!sound) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }

    try {
      // Reset the sound to the beginning
      sound.currentTime = 0;
      sound.volume = this.masterVolume() * volume;

      // Play the sound
      const playPromise = sound.play();

      // Handle the promise for better browser compatibility
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio play failed:', error);
        });
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Ayah audio playback methods
  async playAyahAudio(
    audioUrl: string,
    fallbackUrls: string[] = []
  ): Promise<void> {
    if (!this.soundEnabled()) return;

    try {
      // Stop any currently playing ayah audio
      this.stopAyahAudio();

      // Create new audio element for the ayah
      this.currentAyahAudio = new Audio(audioUrl);
      this.currentAyahAudio.volume = this.masterVolume() * 0.8;

      // Add error handler to try fallback URLs
      this.currentAyahAudio.addEventListener('error', () => {
        this.tryFallbackAudio(fallbackUrls);
      });

      // Play the audio
      await this.currentAyahAudio.play();
    } catch (error) {
      console.warn('Failed to play ayah audio:', error);
      // Try fallback URLs if available
      if (fallbackUrls.length > 0) {
        this.tryFallbackAudio(fallbackUrls);
      }
    }
  }

  private async tryFallbackAudio(fallbackUrls: string[]): Promise<void> {
    if (fallbackUrls.length === 0) return;

    try {
      const fallbackUrl = fallbackUrls[0];
      const remainingUrls = fallbackUrls.slice(1);

      this.currentAyahAudio = new Audio(fallbackUrl);
      this.currentAyahAudio.volume = this.masterVolume() * 0.8;

      // Add error handler for remaining fallbacks
      if (remainingUrls.length > 0) {
        this.currentAyahAudio.addEventListener('error', () => {
          this.tryFallbackAudio(remainingUrls);
        });
      }

      await this.currentAyahAudio.play();
    } catch (error) {
      console.warn('Fallback audio also failed:', error);
      // Try remaining URLs if any
      if (fallbackUrls.length > 1) {
        this.tryFallbackAudio(fallbackUrls.slice(1));
      }
    }
  }

  stopAyahAudio(): void {
    if (this.currentAyahAudio) {
      this.currentAyahAudio.pause();
      this.currentAyahAudio.currentTime = 0;
      this.currentAyahAudio = null;
    }
  }

  isAyahAudioPlaying(): boolean {
    return !!(this.currentAyahAudio && !this.currentAyahAudio.paused);
  }

  // Public methods for playing specific sounds
  playCorrect(): void {
    this.playSound('correct', 0.8);
  }

  playIncorrect(): void {
    this.playSound('incorrect', 0.8);
  }

  playButtonClick(): void {
    this.playSound('buttonClick', 0.6);
  }

  playGameOver(): void {
    this.playSound('gameOver', 0.9);
  }

  playLevelUp(): void {
    this.playSound('levelUp', 0.8);
  }

  playCountdown(): void {
    this.playSound('countdown', 0.7);
  }

  playTimeTicking(): void {
    this.playSound('timeTicking', 0.5);
  }

  // Settings management
  toggleSound(): void {
    this.soundEnabled.set(!this.soundEnabled());
    this.saveSoundSettings();
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled.set(enabled);
    this.saveSoundSettings();
  }

  setVolume(volume: number): void {
    this.masterVolume.set(Math.max(0, Math.min(1, volume)));
    this.updateVolume();
    this.saveSoundSettings();
  }

  private updateVolume(): void {
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = this.masterVolume();
    });

    // Update current ayah audio volume if playing
    if (this.currentAyahAudio) {
      this.currentAyahAudio.volume = this.masterVolume() * 0.8;
    }
  }

  // Getters for reactive data
  isSoundEnabled(): boolean {
    return this.soundEnabled();
  }

  getVolume(): number {
    return this.masterVolume();
  }

  getSoundEnabled() {
    return this.soundEnabled.asReadonly();
  }

  getMasterVolume() {
    return this.masterVolume.asReadonly();
  }
}
