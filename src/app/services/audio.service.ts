import { Injectable, signal } from '@angular/core';
import { AudioAyah, AudioRoot } from '../types/quiz.types';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioData = signal<AudioRoot | null>(null);
  private audioMap = new Map<number, AudioAyah>();
  private isLoaded = signal<boolean>(false);

  constructor() {
    this.loadAudioData();
  }

  private async loadAudioData(): Promise<void> {
    try {
      const response = await fetch('/assets/data/audio.json');
      const data: AudioRoot = await response.json();
      this.audioData.set(data);

      // Create a map for quick ayah lookup by global ayah number
      data.data.surahs.forEach((surah) => {
        surah.ayahs.forEach((ayah) => {
          this.audioMap.set(ayah.number, ayah);
        });
      });

      this.isLoaded.set(true);
      console.log('Audio data loaded successfully');
    } catch (error) {
      console.error('Failed to load audio data:', error);
    }
  }

  getAyahAudioUrl(ayahNumber: number): string | null {
    const ayah = this.audioMap.get(ayahNumber);
    return ayah?.audio || null;
  }

  getAyahAudioSecondaryUrl(ayahNumber: number): string[] {
    const ayah = this.audioMap.get(ayahNumber);
    return ayah?.audioSecondary || [];
  }

  getAyahData(ayahNumber: number): AudioAyah | null {
    return this.audioMap.get(ayahNumber) || null;
  }

  isAudioDataLoaded(): boolean {
    return this.isLoaded();
  }

  getAudioData() {
    return this.audioData.asReadonly();
  }
}
