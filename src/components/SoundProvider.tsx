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
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  playImpact: () => void;
  playLeverPull: () => void;
  playTrolleyRoll: () => void;
  stopTrolleyRoll: () => void;
  startAmbientMusic: () => void;
  stopAmbientMusic: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
  setSoundEnabled: () => {},
  playImpact: () => {},
  playLeverPull: () => {},
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
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Background Ambient Music nodes
  const musicGainRef = useRef<GainNode | null>(null);
  const musicOscsRef = useRef<OscillatorNode[]>([]);
  const isMusicPlayingRef = useRef<boolean>(false);

  // Trolley Roll interval
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

  // Initialize preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('trolley-sound-enabled');
      if (stored !== null) {
        setSoundEnabledState(stored === 'true');
      }
    } catch {}
  }, []);

  // Toggle Sound On/Off
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem('trolley-sound-enabled', String(enabled));
    } catch {}

    if (!enabled) {
      if (musicGainRef.current && audioCtxRef.current) {
        musicGainRef.current.gain.setTargetAtTime(
          0,
          audioCtxRef.current.currentTime,
          0.1
        );
      }
    } else {
      if (musicGainRef.current && audioCtxRef.current) {
        musicGainRef.current.gain.setTargetAtTime(
          0.12,
          audioCtxRef.current.currentTime,
          0.3
        );
      }
    }
  }, []);

  const toggleSound = useCallback(() => {
    // Resume audio context on user action
    getAudioContext();
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled, setSoundEnabled, getAudioContext]);

  // 1. Ambient Background Music (Cinematic Low D Minor Breathing Drone)
  const startAmbientMusic = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx || isMusicPlayingRef.current) return;

    try {
      isMusicPlayingRef.current = true;
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.12, now + 1.8);
      masterGain.connect(ctx.destination);
      musicGainRef.current = masterGain;

      // Filter: Resonant Lowpass
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.Q.setValueAtTime(2.2, now);
      filter.connect(masterGain);

      // Filter LFO: Slow breathing modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, now); // 11-second breath
      lfoGain.gain.setValueAtTime(140, now);
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

        const vol = idx === 0 ? 0.35 : idx === 1 ? 0.25 : 0.18;
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
  }, [soundEnabled, getAudioContext]);

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

  // 2. Lever Pull Sound Effect (Mechanical heavy click)
  const playLeverPull = useCallback(() => {
    if (!soundEnabled) return;
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
  }, [soundEnabled, getAudioContext]);

  // 3. Trolley Wheel Clatter Sound (Rhythmic track travel sound)
  const playTrolleyRoll = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
    }

    const clickClack = () => {
      if (!soundEnabled || !audioCtxRef.current) return;
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
  }, [soundEnabled, getAudioContext]);

  const stopTrolleyRoll = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
  }, []);

  // 4. Dramatic Collision Impact Sound (Sub-bass thud + comic splat + metal ring)
  const playImpact = useCallback(() => {
    if (!soundEnabled) return;
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
  }, [soundEnabled, getAudioContext]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTrolleyRoll();
      stopAmbientMusic();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopTrolleyRoll, stopAmbientMusic]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        setSoundEnabled,
        playImpact,
        playLeverPull,
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

