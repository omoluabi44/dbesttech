export type VoiceCategory = 'quizStart' | 'correct' | 'wrong' | 'stageComplete' | 'quizCompleteHigh' | 'quizCompleteLow' | 'timerWarning' | 'encouragement';

class KiddieVoice {
  private _isMuted: boolean = false;
  
  // Pre-built phrase library
  private phrases: Record<VoiceCategory, string[]> = {
    quizStart: ["Let's go!", "Are you ready?", "This is going to be fun!", "Let's play!"],
    correct: ["Amazing!", "You're so smart!", "Great job!", "Wonderful!", "Yes!", "Perfect!"],
    wrong: ["Nice try!", "Don't worry!", "You'll get the next one!", "Keep going!"],
    stageComplete: ["Wow, you finished a level!", "You're a superstar!", "Amazing work!"],
    quizCompleteHigh: ["You're a genius!", "Incredible!", "Outstanding work!"],
    quizCompleteLow: ["Great effort!", "Keep practicing!", "You're getting better!"],
    timerWarning: ["Hurry up!", "Quick quick!", "Time is running out!"],
    encouragement: ["You can do it!", "Keep going!", "Almost there!"]
  };
  
  speak(text: string): void {
    if (this._isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    this.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.4; // kid-like higher pitch
    utterance.rate = 1.1; // slightly faster/natural rate
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a friendly female or child voice
    const preferredVoice = voices.find(v => 
      v.name.toLowerCase().includes('child') || 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('girl') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('tessa')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
  
  speakRandom(category: VoiceCategory): void {
    const list = this.phrases[category];
    if (!list || list.length === 0) return;
    const idx = Math.floor(Math.random() * list.length);
    this.speak(list[idx]);
  }
  
  setMuted(muted: boolean): void {
    this._isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }
  
  get muted(): boolean {
    return this._isMuted;
  }
  
  cancel(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const kiddieVoice = new KiddieVoice();
