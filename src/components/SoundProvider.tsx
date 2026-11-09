'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

interface SoundContextType {
  // Sound effects (SFX) toggle
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;

  // Background Ambient Music toggle
  musicEnabled: boolean;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;

  // Sound effects
  playImpact: () => void;
  playLeverPull: () => void;
  startTicking: () => void;
  stopTicking: () => void;
  playTrolleyRoll: () => void;
  stopTrolleyRoll: () => void;

  // Ambient music
  startAmbientMusic: () => void;
  stopAmbientMusic: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
  setSoundEnabled: () => {},
  musicEnabled: true,
  toggleMusic: () => {},
  setMusicEnabled: () => {},
  playImpact: () => {},
  playLeverPull: () => {},
  startTicking: () => {},
  stopTicking: () => {},
  playTrolleyRoll: () => {},
  stopTrolleyRoll: () => {},
  startAmbientMusic: () => {},
  stopAmbientMusic: () => {},
});

export const useSound = () => useContext(SoundContext);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabledState] = useState<boolean>(true);

  const soundEnabledRef = useRef<boolean>(true);
  const musicEnabledRef = useRef<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Background Ambient Music nodes
  const musicGainRef = useRef<GainNode | null>(null);
  const musicOscsRef = useRef<OscillatorNode[]>([]);
  const isMusicPlayingRef = useRef<boolean>(false);

  // Trolley Ticking / Clatter interval
  const isTickingActiveRef = useRef<boolean>(false);
  const rollIntervalRef = useRef<number | null>(null);

  // Safe AudioContext getter
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Initialize preferences from localStorage
  useEffect(() => {
    try {
      const storedSound = localStorage.getItem('trolley-sound-enabled');
      if (storedSound !== null) {
        const val = storedSound === 'true';
        setSoundEnabledState(val);
        soundEnabledRef.current = val;
      }

      const storedMusic = localStorage.getItem('trolley-music-enabled');
      if (storedMusic !== null) {
        const val = storedMusic === 'true';
        setMusicEnabledState(val);
        musicEnabledRef.current = val;
      }
    } catch {}
  }, []);

  // Resume audio context on any user interaction across the window
  useEffect(() => {
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // 1. Ambient Background Music (Cinematic Low D Minor Breathing Drone - Louder volume: 0.32)
  const startAmbientMusic = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx || isMusicPlayingRef.current) return;

    try {
      isMusicPlayingRef.current = true;
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      const targetGain = musicEnabledRef.current ? 0.32 : 0.0001;
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(targetGain, now + 1.8);
      masterGain.connect(ctx.destination);
      musicGainRef.current = masterGain;

      // Filter: Resonant Lowpass (360Hz cutoff for richer presence)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, now);
      filter.Q.setValueAtTime(2.4, now);
      filter.connect(masterGain);

      // Filter LFO: Slow breathing modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, now); // 11-second breath
      lfoGain.gain.setValueAtTime(160, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);

      // Chords: D2 (73.4Hz), A2 (110Hz), D3 (146.8Hz), F3 (174.6Hz)
      const freqs = [73.42, 110.0, 146.83, 174.61];
      const oscs: OscillatorNode[] = [lfo];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        // Micro detune for lush thickness
        osc.detune.setValueAtTime((idx - 1.5) * 5, now);

        const vol = idx === 0 ? 0.45 : idx === 1 ? 0.35 : 0.28;
        oscGain.gain.setValueAtTime(vol, now);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start(now);
        oscs.push(osc);
      });

      musicOscsRef.current = oscs;
    } catch {
      isMusicPlayingRef.current = false;
    }
  }, [getAudioContext]);

  const stopAmbientMusic = useCallback(() => {
    if (!isMusicPlayingRef.current || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      if (musicGainRef.current) {
        musicGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      }
      setTimeout(() => {
        musicOscsRef.current.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        musicOscsRef.current = [];
        isMusicPlayingRef.current = false;
      }, 1300);
    } catch {
      isMusicPlayingRef.current = false;
    }
  }, []);

  // Music toggle control
  const setMusicEnabled = useCallback(
    (enabled: boolean) => {
      setMusicEnabledState(enabled);
      musicEnabledRef.current = enabled;
      try {
        localStorage.setItem('trolley-music-enabled', String(enabled));
      } catch {}

      if (!audioCtxRef.current || !musicGainRef.current) {
        if (enabled && !isMusicPlayingRef.current) {
          startAmbientMusic();
        }
        return;
      }

      const ctx = audioCtxRef.current;
      if (enabled) {
        musicGainRef.current.gain.setTargetAtTime(0.32, ctx.currentTime, 0.25);
      } else {
        musicGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      }
    },
    [startAmbientMusic]
  );

  const toggleMusic = useCallback(() => {
    getAudioContext();
    setMusicEnabled(!musicEnabledRef.current);
  }, [getAudioContext, setMusicEnabled]);

  // 2. Trolley Wheel Clatter / Ticking Sound (Rhythmic track travel sound)
  const startTicking = useCallback(() => {
    isTickingActiveRef.current = true;
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }

    const clickClack = () => {
      if (!soundEnabledRef.current || !audioCtxRef.current) return;
      const c = audioCtxRef.current;
      const t = c.currentTime;

      // Wheel rail bump 1
      const osc1 = c.createOscillator();
      const g1 = c.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(120, t);
      osc1.frequency.exponentialRampToValueAtTime(45, t + 0.05);
      g1.gain.setValueAtTime(0.18, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc1.connect(g1);
      g1.connect(c.destination);
      osc1.start(t);
      osc1.stop(t + 0.06);

      // Wheel rail bump 2 (syncopated)
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(140, t + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(50, t + 0.12);
      g2.gain.setValueAtTime(0.14, t + 0.07);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc2.connect(g2);
      g2.connect(c.destination);
      osc2.start(t + 0.07);
      osc2.stop(t + 0.13);
    };

    clickClack();
    rollIntervalRef.current = window.setInterval(clickClack, 340);
  }, [getAudioContext]);

  const stopTicking = useCallback(() => {
    isTickingActiveRef.current = false;
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
  }, []);

  // Backward compatible aliases
  const playTrolleyRoll = startTicking;
  const stopTrolleyRoll = stopTicking;

  // Sound effects toggle control
  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      setSoundEnabledState(enabled);
      soundEnabledRef.current = enabled;
      try {
        localStorage.setItem('trolley-sound-enabled', String(enabled));
      } catch {}

      if (!enabled) {
        // Immediately silence ticking if active
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
      } else {
        // If scene is currently waiting in intro or pause, resume ticking
        if (isTickingActiveRef.current && !rollIntervalRef.current) {
          startTicking();
        }
      }
    },
    [startTicking]
  );

  const toggleSound = useCallback(() => {
    getAudioContext();
    setSoundEnabled(!soundEnabledRef.current);
  }, [getAudioContext, setSoundEnabled]);

  // 3. Lever Pull Sound Effect (Mechanical heavy click)
  const playLeverPull = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Click snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // Heavy latch thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(220, now + 0.04);
      thud.frequency.exponentialRampToValueAtTime(55, now + 0.18);

      thudGain.gain.setValueAtTime(0.4, now + 0.04);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);

      thud.start(now + 0.04);
      thud.stop(now + 0.19);
    } catch {}
  }, [getAudioContext]);

  // 4. Dramatic Collision Impact Sound (Sub-bass thud + comic splat + metal ring - "коли давлять")
  const playImpact = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer A: Massive sub-bass punch
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(180, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.42);

      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.46);

      // Layer B: Comic SPLAT squelch (Filter-swept noise)
      const bufferSize = ctx.sampleRate * 0.28;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const splatFilter = ctx.createBiquadFilter();
      splatFilter.type = 'bandpass';
      splatFilter.frequency.setValueAtTime(1100, now);
      splatFilter.frequency.exponentialRampToValueAtTime(180, now + 0.28);
      splatFilter.Q.setValueAtTime(3.5, now);

      const splatGain = ctx.createGain();
      splatGain.gain.setValueAtTime(0.65, now);
      splatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      whiteNoise.connect(splatFilter);
      splatFilter.connect(splatGain);
      splatGain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.29);

      // Layer C: Metallic resonance ring
      const metal = ctx.createOscillator();
      const metalGain = ctx.createGain();
      metal.type = 'triangle';
      metal.frequency.setValueAtTime(460, now + 0.02);
      metal.frequency.exponentialRampToValueAtTime(310, now + 0.55);

      metalGain.gain.setValueAtTime(0.3, now + 0.02);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      metal.connect(metalGain);
      metalGain.connect(ctx.destination);
      metal.start(now + 0.02);
      metal.stop(now + 0.56);
    } catch {}
  }, [getAudioContext]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTicking();
      stopAmbientMusic();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopTicking, stopAmbientMusic]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        setSoundEnabled,
        musicEnabled,
        toggleMusic,
        setMusicEnabled,
        playImpact,
        playLeverPull,
        startTicking,
        stopTicking,
        playTrolleyRoll,
        stopTrolleyRoll,
        startAmbientMusic,
        stopAmbientMusic,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
