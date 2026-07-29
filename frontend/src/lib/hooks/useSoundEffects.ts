'use client';
import { useCallback, useRef, useEffect, useState } from 'react';
import { audio } from '../utils/audio';
import { kiddieVoice, VoiceCategory } from '../utils/kiddieVoice';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const musicTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleInteraction = () => {
      // Trigger voice load
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (musicTimerRef.current !== null) {
        window.clearInterval(musicTimerRef.current);
      }
    };
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    musicPlayingRef.current = false;
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      audio.setMuted(newMuted);
      kiddieVoice.setMuted(newMuted);
      if (newMuted) {
        stopBackgroundMusic();
      }
      return newMuted;
    });
  }, [stopBackgroundMusic]);

  const playPop = useCallback(() => audio.play('pop'), []);
  const playCorrect = useCallback(() => audio.play('correct'), []);
  const playWrong = useCallback(() => audio.play('wrong'), []);
  const playStageComplete = useCallback(() => audio.play('stageComplete'), []);
  const playQuizComplete = useCallback(() => audio.play('quizComplete'), []);
  const playCountdown = useCallback(() => audio.play('countdown'), []);
  const playButtonClick = useCallback(() => audio.play('buttonClick'), []);
  const playStarCollect = useCallback(() => audio.play('starCollect'), []);
  const playWhoosh = useCallback(() => audio.play('whoosh'), []);
  const playSuccess = playStageComplete;

  const speakEncouragement = useCallback((category: VoiceCategory) => {
    kiddieVoice.speakRandom(category);
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (isMuted || musicPlayingRef.current) return;
    
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      } else {
        return;
      }
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    musicPlayingRef.current = true;

    // Pentatonic scale (C, D, E, G, A)
    const melody = [
      523.25, 587.33, 659.25, 783.99, // C5, D5, E5, G5
      880.00, 783.99, 659.25, 587.33, // A5, G5, E5, D5
      523.25, 659.25, 783.99, 880.00, // C5, E5, G5, A5
      1046.50, 880.00, 783.99, 587.33 // C6, A5, G5, D5
    ];
    
    const bass = [
      130.81, 0, 196.00, 0, // C3, -, G3, -
      174.61, 0, 130.81, 0, // F3, -, C3, -
      130.81, 0, 196.00, 0, // C3, -, G3, -
      174.61, 0, 196.00, 0  // F3, -, G3, -
    ];

    let step = 0;
    const beatLength = 0.215; // roughly 140 BPM
    
    const playNextNote = () => {
      if (!musicPlayingRef.current || isMuted) return;

      const t = ctx.currentTime;
      
      if (melody[step]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = melody[step];
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatLength - 0.02);
        
        osc.start(t);
        osc.stop(t + beatLength);
      }
      
      if (bass[step]) {
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.value = bass[step];
        bOsc.connect(bGain);
        bGain.connect(ctx.destination);
        
        bGain.gain.setValueAtTime(0, t);
        bGain.gain.linearRampToValueAtTime(0.05, t + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + beatLength - 0.02);
        
        bOsc.start(t);
        bOsc.stop(t + beatLength);
      }
      
      step = (step + 1) % 16;
    };
    
    playNextNote();
    musicTimerRef.current = window.setInterval(playNextNote, beatLength * 1000);
  }, [isMuted]);

  return {
    playPop, playCorrect, playWrong, playStageComplete, playQuizComplete,
    playCountdown, playButtonClick, playStarCollect, playWhoosh,
    playSuccess, // legacy alias
    speakEncouragement,
    startBackgroundMusic, stopBackgroundMusic,
    toggleMute, isMuted
  };
}
