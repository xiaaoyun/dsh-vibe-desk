window.__ModuleLoader__.load({
  id: 'dsh-vibe-desk',
  factory(require) {
    'use strict';

    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const SOURCE = 'dsh-vibe-desk';
    const NS = 'vibe-desk';
    const STORE_KEY = 'vibe-desk.settings.v1';
    const DEFAULT_ACCENT = '#2f7df6';
    const DEFAULT_SETTINGS = {
      mood: 'native',
      accent: DEFAULT_ACCENT,
      strength: 55,
      track: 'night',
      volume: 0.6,
    };

    /* ------------------------------------------------------------------ */
    /* text                                                                */
    /* ------------------------------------------------------------------ */

    const DICT = {
      zh: {
        launcher: '氛围台',
        close: '关闭',
        panel_title: '氛围台',
        tab_theme: '主题',
        tab_music: '音乐',
        mode_label: '明暗外观',
        mode_light: '浅色',
        mode_dark: '深色',
        mode_system: '跟随系统',
        mood_label: '配色预设',
        mood_native: '原生',
        mood_sea: '海盐',
        mood_twilight: '暮光',
        mood_forest: '森林',
        mood_sakura: '樱花',
        mood_amber: '琥珀',
        mood_midnight: '午夜',
        mood_custom: '自定义',
        accent_label: '主题色',
        strength_label: '氛围浓度',
        reset: '恢复默认',
        play: '播放',
        pause: '暂停',
        prev: '上一首',
        next: '下一首',
        volume: '音量',
        now_playing: '正在播放',
        idle: '已暂停',
        tracks: '曲目',
        local: '播放本地音频',
        local_hint: '仅在本机播放，不会上传',
        synth_hint: '由浏览器实时合成',
        unsupported: '当前环境不支持 Web Audio',
      },
      en: {
        launcher: 'Vibe desk',
        close: 'Close',
        panel_title: 'Vibe desk',
        tab_theme: 'Theme',
        tab_music: 'Music',
        mode_label: 'Appearance',
        mode_light: 'Light',
        mode_dark: 'Dark',
        mode_system: 'System',
        mood_label: 'Palettes',
        mood_native: 'Native',
        mood_sea: 'Sea salt',
        mood_twilight: 'Twilight',
        mood_forest: 'Forest',
        mood_sakura: 'Sakura',
        mood_amber: 'Amber',
        mood_midnight: 'Midnight',
        mood_custom: 'Custom',
        accent_label: 'Accent',
        strength_label: 'Tint strength',
        reset: 'Reset appearance',
        play: 'Play',
        pause: 'Pause',
        prev: 'Previous track',
        next: 'Next track',
        volume: 'Volume',
        now_playing: 'Now playing',
        idle: 'Paused',
        tracks: 'Tracks',
        local: 'Play a local file',
        local_hint: 'Plays on this device, never uploaded',
        synth_hint: 'Synthesized in the browser',
        unsupported: 'Web Audio is unavailable here',
      },
    };

    function isZhId(id) {
      return String(id || '').toLowerCase().indexOf('zh') === 0;
    }

    function registerDictionaries(localeSvc) {
      if (!localeSvc || typeof localeSvc.register !== 'function') return;
      const ids = ['en', 'zh'];
      try {
        const active = localeSvc.getLocale().active;
        if (active && ids.indexOf(active) < 0) ids.push(String(active));
      } catch (err) {
        /* locale snapshot unavailable: the two baseline dictionaries still load */
      }
      ids.forEach((id) => {
        try {
          localeSvc.register(NS, id, isZhId(id) ? DICT.zh : DICT.en);
        } catch (err) {
          /* another activation already owns this dictionary */
        }
      });
    }

    function makeLang(localeSvc) {
      return function lang() {
        try {
          if (localeSvc) return isZhId(localeSvc.getLocale().active) ? 'zh' : 'en';
        } catch (err) {
          /* fall through to the browser language */
        }
        const nav = typeof navigator !== 'undefined' ? String(navigator.language || '') : '';
        return isZhId(nav) ? 'zh' : 'en';
      };
    }

    function makeT(localeSvc) {
      let bound = null;
      try {
        if (localeSvc && typeof localeSvc.bind === 'function') bound = localeSvc.bind(NS);
      } catch (err) {
        bound = null;
      }
      return function t(key) {
        if (bound) {
          try {
            const value = bound(key);
            if (typeof value === 'string' && value && value !== key) return value;
          } catch (err) {
            /* fall back to the bundled dictionary */
          }
        }
        return DICT[makeLang(localeSvc)()][key] || key;
      };
    }

    function makeTx(lang) {
      return function tx(pair) {
        if (!pair) return '';
        return pair[lang()] || pair.en || '';
      };
    }

    /* ------------------------------------------------------------------ */
    /* palettes and tracks                                                 */
    /* ------------------------------------------------------------------ */

    const MOODS = [
      { id: 'native', hue: null, accent: null, grad: ['#94a3b8', '#cbd5e1'] },
      { id: 'sea', hue: 214, accent: '#2f7df6', grad: ['#2f7df6', '#6fb3ff'] },
      { id: 'twilight', hue: 264, accent: '#7c5cf5', grad: ['#6d4df0', '#b28cff'] },
      { id: 'forest', hue: 160, accent: '#0f9d7a', grad: ['#0f9d7a', '#54d6ab'] },
      { id: 'sakura', hue: 340, accent: '#e8578f', grad: ['#e2578f', '#ffa8c3'] },
      { id: 'amber', hue: 32, accent: '#d97a13', grad: ['#d97a13', '#f7bd5e'] },
      { id: 'midnight', hue: 200, accent: '#22c3d6', grad: ['#1fb6c9', '#7de7f2'] },
      { id: 'custom', hue: null, accent: null, grad: ['#64748b', '#94a3b8'] },
    ];

    const ACCENTS = ['#2f7df6', '#7c5cf5', '#0f9d7a', '#e8578f', '#d97a13', '#22c3d6', '#e5484d', '#8b6b4a'];

    const TRACKS = [
      {
        id: 'night',
        name: { zh: '夜航', en: 'Night flight' },
        note: { zh: '低频铺底 · 稀疏钟声', en: 'Low pads · sparse bells' },
        bpm: 58, root: 57, pad: 'sine',
        chords: [[0, 3, 7, 10, 14], [-4, 0, 3, 7, 12], [5, 8, 12, 15], [7, 10, 14, 17]],
        steps: 8, arpGain: 0.055, noise: 0.05, delay: 0.36,
        grad: ['#1c2a4a', '#3f6fa8'],
      },
      {
        id: 'rain',
        name: { zh: '雨窗', en: 'Rain window' },
        note: { zh: '雨声 · 大七和弦', en: 'Rain bed · major sevenths' },
        bpm: 64, root: 60, pad: 'triangle',
        chords: [[0, 4, 7, 11, 14], [-3, 0, 4, 9], [-7, -3, 0, 4], [-5, 0, 2, 7]],
        steps: 6, arpGain: 0.045, noise: 0.14, delay: 0.42,
        grad: ['#173432', '#4f8f86'],
      },
      {
        id: 'lamp',
        name: { zh: '暖灯', en: 'Warm lamp' },
        note: { zh: '慢摇 · 木质琴音', en: 'Slow sway · felt keys' },
        bpm: 72, root: 56, pad: 'triangle',
        chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-7, -3, 0, 4], [-5, -1, 2, 7]],
        steps: 8, arpGain: 0.06, noise: 0.03, delay: 0.33,
        grad: ['#3a2a1c', '#a8763f'],
      },
      {
        id: 'orbit',
        name: { zh: '星轨', en: 'Star trail' },
        note: { zh: '悬浮和弦 · 高频泛音', en: 'Suspended chords · shimmer' },
        bpm: 52, root: 64, pad: 'sine',
        chords: [[0, 6, 11, 14], [2, 7, 12, 16], [-3, 4, 9, 12], [-5, 2, 7, 14]],
        steps: 4, arpGain: 0.045, noise: 0.02, delay: 0.52,
        grad: ['#241b3f', '#6f5bd6'],
      },
    ];

    function moodOf(id) {
      for (let i = 0; i < MOODS.length; i += 1) if (MOODS[i].id === id) return MOODS[i];
      return MOODS[0];
    }

    function trackOf(id) {
      for (let i = 0; i < TRACKS.length; i += 1) if (TRACKS[i].id === id) return TRACKS[i];
      return TRACKS[0];
    }

    /* ------------------------------------------------------------------ */
    /* colour helpers                                                      */
    /* ------------------------------------------------------------------ */

    function clamp(value, lo, hi) {
      const n = Number(value);
      if (!isFinite(n)) return lo;
      return Math.min(hi, Math.max(lo, n));
    }

    function normHex(value) {
      const match = /^#?([0-9a-f]{6})$/i.exec(String(value || ''));
      return match ? '#' + match[1].toLowerCase() : '';
    }

    function hexToHsl(hex) {
      const clean = normHex(hex) || DEFAULT_ACCENT;
      const n = parseInt(clean.slice(1), 16);
      const r = ((n >> 16) & 255) / 255;
      const g = ((n >> 8) & 255) / 255;
      const b = (n & 255) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let hue = 0;
      let sat = 0;
      if (max !== min) {
        const d = max - min;
        sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue *= 60;
      }
      return { h: hue, s: sat * 100, l: l * 100 };
    }

    function hsl(hue, sat, light) {
      const hh = ((Number(hue) % 360) + 360) % 360;
      return 'hsl(' + hh.toFixed(1) + ' ' + clamp(sat, 0, 100).toFixed(1) + '% ' + clamp(light, 0, 100).toFixed(1) + '%)';
    }

    function rgba(hex, alpha) {
      const clean = normHex(hex) || DEFAULT_ACCENT;
      const n = parseInt(clean.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }

    /**
     * Stacked theme layer: surface + accent tokens for both colour modes.
     * Text and button tokens stay with the base theme so contrast keeps working.
     */
    function themeTokens(settings) {
      const mood = moodOf(settings.mood);
      const accent = hexToHsl(settings.accent);
      const hue = typeof mood.hue === 'number' ? mood.hue : accent.h;
      const k = clamp(settings.strength, 0, 100) / 100;
      const accentLight = hsl(accent.h, Math.max(accent.s, 55), clamp(accent.l, 38, 50));
      const accentDark = hsl(accent.h, Math.max(accent.s, 58), clamp(accent.l, 58, 68));
      const light = {
        base: hsl(hue, 6 + 26 * k, 97.6 - 2 * k),
        layer1: hsl(hue, 4 + 18 * k, 99.6 - 0.8 * k),
        layer2: hsl(hue, 5 + 22 * k, 95.8 - 2.4 * k),
        overlay: hsl(hue, 5 + 18 * k, 99),
        sidebar: hsl(hue, 6 + 24 * k, 96.6 - 2 * k),
        border1: hsl(hue, 6 + 16 * k, 89 - 6 * k),
        border2: hsl(hue, 6 + 16 * k, 80 - 6 * k),
      };
      const dark = {
        base: hsl(hue, 5 + 18 * k, 7.6 + 2.6 * k),
        layer1: hsl(hue, 5 + 16 * k, 11 + 2.2 * k),
        layer2: hsl(hue, 5 + 14 * k, 14.6 + 2 * k),
        overlay: hsl(hue, 5 + 14 * k, 12.4 + 2 * k),
        sidebar: hsl(hue, 5 + 18 * k, 9.6 + 2 * k),
        border1: hsl(hue, 5 + 12 * k, 21 + 4 * k),
        border2: hsl(hue, 5 + 12 * k, 29 + 4 * k),
      };
      return {
        '--dsw-alias-brand-primary': { light: accentLight, dark: accentDark },
        '--dsw-alias-bg-base': { light: light.base, dark: dark.base },
        '--dsw-alias-bg-layer-1': { light: light.layer1, dark: dark.layer1 },
        '--dsw-alias-bg-layer-2': { light: light.layer2, dark: dark.layer2 },
        '--dsw-alias-bg-overlay': { light: light.overlay, dark: dark.overlay },
        '--dsw-specific-sidebar-fill': { light: light.sidebar, dark: dark.sidebar },
        '--dsw-alias-border-l1': { light: light.border1, dark: dark.border1 },
        '--dsw-alias-border-l2': { light: light.border2, dark: dark.border2 },
      };
    }

    function createThemeLayer(getThemeSvc) {
      let dispose = null;
      return {
        apply(settings) {
          if (dispose) {
            try {
              dispose();
            } catch (err) {
              /* layer already gone */
            }
            dispose = null;
          }
          const themeSvc = getThemeSvc();
          if (!themeSvc || !settings || settings.mood === 'native') return;
          try {
            dispose = themeSvc.overrideTokens(SOURCE, themeTokens(settings));
          } catch (err) {
            dispose = null;
            console.error('[vibe-desk] theme layer rejected', err);
          }
        },
        dispose() {
          if (!dispose) return;
          try {
            dispose();
          } catch (err) {
            /* ignore */
          }
          dispose = null;
        },
      };
    }

    function readPreference(themeSvc) {
      try {
        if (themeSvc) return themeSvc.getTheme().preference || 'system';
      } catch (err) {
        /* ignore */
      }
      return 'system';
    }

    function readPreferenceLazy(getThemeSvc) {
      try {
        return readPreference(getThemeSvc());
      } catch (err) {
        return 'system';
      }
    }

    /* ------------------------------------------------------------------ */
    /* stored settings                                                     */
    /* ------------------------------------------------------------------ */

    function loadSettings() {
      const next = Object.assign({}, DEFAULT_SETTINGS);
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return next;
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.mood && moodOf(saved.mood).id === saved.mood) next.mood = saved.mood;
          const accent = normHex(saved.accent);
          if (accent) next.accent = accent;
          if (typeof saved.strength === 'number') next.strength = clamp(saved.strength, 0, 100);
          if (saved.track && trackOf(saved.track).id === saved.track) next.track = saved.track;
          if (typeof saved.volume === 'number') next.volume = clamp(saved.volume, 0, 1);
        }
      } catch (err) {
        /* unreadable storage: defaults are fine */
      }
      return next;
    }

    function persistSettings(settings) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(settings));
      } catch (err) {
        /* storage full or blocked */
      }
    }

    /* ------------------------------------------------------------------ */
    /* store                                                               */
    /* ------------------------------------------------------------------ */

    function createStore(initial) {
      let state = initial;
      const listeners = new Set();
      return {
        get() {
          return state;
        },
        set(patch) {
          state = Object.assign({}, state, patch);
          listeners.forEach((fn) => {
            try {
              fn();
            } catch (err) {
              console.error('[vibe-desk] store subscriber failed', err);
            }
          });
        },
        subscribe(fn) {
          listeners.add(fn);
          return function unsubscribe() {
            listeners.delete(fn);
          };
        },
      };
    }

    function useStore(store) {
      const [snap, setSnap] = useState(store.get());
      useEffect(() => store.subscribe(() => setSnap(store.get())), [store]);
      return snap;
    }

    /* ------------------------------------------------------------------ */
    /* audio engine                                                        */
    /* ------------------------------------------------------------------ */

    function midiToHz(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function createAudioEngine(hooks) {
      let audioCtx = null;
      let master = null;
      let voiceBus = null;
      let analyser = null;
      let delay = null;
      let noiseGain = null;
      let noiseStarted = false;
      let timer = 0;
      let playing = false;
      let mode = 'synth';
      let current = TRACKS[0];
      let nextBar = 0;
      let barIndex = 0;
      let element = null;
      let fileRouted = false;
      let fileUrl = null;

      function supported() {
        return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
      }

      function volumeGain() {
        return Math.pow(clamp(hooks.getVolume(), 0, 1), 1.4) * 0.9;
      }

      function startNoise(ctx, bus) {
        if (noiseStarted) return;
        noiseStarted = true;
        try {
          const seconds = 4;
          const frames = Math.floor(ctx.sampleRate * seconds);
          const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let b0 = 0;
          let b1 = 0;
          let b2 = 0;
          for (let i = 0; i < frames; i += 1) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99765 * b0 + white * 0.099046;
            b1 = 0.963 * b1 + white * 0.296516;
            b2 = 0.57 * b2 + white * 1.052691;
            data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
          }
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const low = ctx.createBiquadFilter();
          low.type = 'lowpass';
          low.frequency.value = 1500;
          source.connect(low);
          low.connect(noiseGain);
          source.start();
        } catch (err) {
          noiseStarted = false;
        }
      }

      function ensure() {
        if (audioCtx) return audioCtx;
        if (!supported()) throw new Error('unsupported');
        const Ctor = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctor();
        master = audioCtx.createGain();
        master.gain.value = 0.0001;
        voiceBus = audioCtx.createGain();
        voiceBus.gain.value = 1;
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        const tone = audioCtx.createBiquadFilter();
        tone.type = 'lowpass';
        tone.frequency.value = 3400;
        delay = audioCtx.createDelay(1.5);
        delay.delayTime.value = 0.34;
        const feedback = audioCtx.createGain();
        feedback.gain.value = 0.28;
        const wet = audioCtx.createGain();
        wet.gain.value = 0.22;
        noiseGain = audioCtx.createGain();
        noiseGain.gain.value = 0.0001;
        noiseGain.connect(tone);
        voiceBus.connect(tone);
        voiceBus.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(tone);
        tone.connect(master);
        master.connect(analyser);
        analyser.connect(audioCtx.destination);
        startNoise(audioCtx, voiceBus);
        return audioCtx;
      }

      function openMaster(fadeSeconds) {
        const ctx = audioCtx;
        if (!ctx || !master) return;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
        master.gain.linearRampToValueAtTime(volumeGain(), now + (fadeSeconds || 0.8));
      }

      function closeMaster(fadeSeconds) {
        const ctx = audioCtx;
        if (!ctx || !master) return;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
        master.gain.linearRampToValueAtTime(0.0001, now + (fadeSeconds || 0.3));
      }

      function barLength(track) {
        return (60 / track.bpm) * 4;
      }

      function padVoice(when, hz, seconds, gain, wave) {
        const osc = audioCtx.createOscillator();
        const amp = audioCtx.createGain();
        osc.type = wave || 'sine';
        osc.frequency.setValueAtTime(hz, when);
        const attack = Math.min(1.8, seconds * 0.35);
        amp.gain.setValueAtTime(0.0001, when);
        amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + attack);
        amp.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
        osc.connect(amp);
        amp.connect(voiceBus);
        osc.start(when);
        osc.stop(when + seconds + 0.06);
      }

      function pluckVoice(when, hz, gain) {
        const osc = audioCtx.createOscillator();
        const amp = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(hz, when);
        amp.gain.setValueAtTime(0.0001, when);
        amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + 0.012);
        amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.85);
        osc.connect(amp);
        amp.connect(voiceBus);
        osc.start(when);
        osc.stop(when + 0.95);
      }

      function scheduleBar(when, track, index) {
        const chord = track.chords[index % track.chords.length];
        const length = barLength(track);
        const spread = chord.length > 4 ? 0.035 : 0.05;
        chord.forEach((semi, i) => {
          padVoice(when + i * spread, midiToHz(track.root + semi - 12), length * 1.02, 0.05 / Math.sqrt(chord.length), track.pad);
        });
        padVoice(when + 0.02, midiToHz(track.root + chord[chord.length - 1] + 12), length * 0.9, 0.018, 'sine');
        padVoice(when, midiToHz(track.root + chord[0] - 24), length * 0.92, 0.07, 'sine');
        const steps = track.steps || 6;
        for (let step = 0; step < steps; step += 1) {
          const semi = chord[(step + index) % chord.length] + (step % 4 === 3 ? 12 : 0);
          pluckVoice(when + step * (length / steps), midiToHz(track.root + semi + 12), track.arpGain);
        }
      }

      function tick() {
        if (!playing || !audioCtx) return;
        const horizon = audioCtx.currentTime + 0.8;
        let guard = 0;
        while (nextBar < horizon && guard < 6) {
          scheduleBar(nextBar, current, barIndex);
          nextBar += barLength(current);
          barIndex += 1;
          guard += 1;
        }
      }

      function start(trackId) {
        ensure();
        const wasPlaying = playing;
        current = trackOf(trackId);
        mode = 'synth';
        if (element && !element.paused) element.pause();
        if (wasPlaying && voiceBus) {
          const now = audioCtx.currentTime;
          voiceBus.gain.cancelScheduledValues(now);
          voiceBus.gain.setValueAtTime(Math.max(voiceBus.gain.value, 0.0001), now);
          voiceBus.gain.linearRampToValueAtTime(0.0001, now + 0.12);
          voiceBus.gain.linearRampToValueAtTime(1, now + 0.55);
        }
        if (delay) delay.delayTime.setTargetAtTime(current.delay || 0.34, audioCtx.currentTime, 0.3);
        if (noiseGain) noiseGain.gain.setTargetAtTime(current.noise || 0.0001, audioCtx.currentTime, 0.5);
        if (audioCtx.state === 'suspended') {
          try {
            audioCtx.resume();
          } catch (err) {
            /* resume will be retried by the next gesture */
          }
        }
        openMaster(0.9);
        barIndex = 0;
        nextBar = audioCtx.currentTime + 0.12;
        playing = true;
        hooks.onMode('synth');
        tick();
        if (timer) clearInterval(timer);
        timer = setInterval(tick, 150);
        hooks.onPlayChange(true);
      }

      function pause() {
        playing = false;
        if (timer) {
          clearInterval(timer);
          timer = 0;
        }
        if (element && !element.paused) element.pause();
        closeMaster(0.35);
        hooks.onPlayChange(false);
      }

      function resumeFile() {
        ensure();
        if (!element || !element.src) {
          start(current.id);
          return;
        }
        mode = 'file';
        if (audioCtx.state === 'suspended') {
          try {
            audioCtx.resume();
          } catch (err) {
            /* ignore */
          }
        }
        openMaster(0.4);
        const promise = element.play();
        playing = true;
        hooks.onMode('file');
        hooks.onPlayChange(true);
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            playing = false;
            hooks.onPlayChange(false);
          });
        }
      }

      function playFile(file) {
        ensure();
        if (timer) {
          clearInterval(timer);
          timer = 0;
        }
        if (!element) {
          element = new Audio();
          element.loop = true;
          element.preload = 'auto';
          try {
            const source = audioCtx.createMediaElementSource(element);
            source.connect(master);
            fileRouted = true;
          } catch (err) {
            fileRouted = false;
            console.error('[vibe-desk] local file cannot join the analyser', err);
          }
        }
        if (fileUrl) {
          try {
            URL.revokeObjectURL(fileUrl);
          } catch (err) {
            /* ignore */
          }
        }
        fileUrl = URL.createObjectURL(file);
        element.src = fileUrl;
        element.volume = fileRouted ? 1 : clamp(hooks.getVolume(), 0, 1);
        mode = 'file';
        if (audioCtx.state === 'suspended') {
          try {
            audioCtx.resume();
          } catch (err) {
            /* ignore */
          }
        }
        openMaster(0.4);
        const promise = element.play();
        playing = true;
        hooks.onMode('file');
        hooks.onPlayChange(true);
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            playing = false;
            hooks.onPlayChange(false);
          });
        }
      }

      function toggle(trackId) {
        if (playing) {
          pause();
          return;
        }
        if (mode === 'file' && element && element.src) {
          resumeFile();
          return;
        }
        start(trackId || current.id);
      }

      function setVolume(value) {
        const volume = clamp(value, 0, 1);
        if (element && !fileRouted) element.volume = volume;
        if (audioCtx && master && playing) {
          master.gain.setTargetAtTime(volumeGain(), audioCtx.currentTime, 0.06);
        }
      }

      function levels(bytes) {
        if (!analyser) {
          for (let i = 0; i < bytes.length; i += 1) bytes[i] = 0;
          return bytes;
        }
        analyser.getByteFrequencyData(bytes);
        return bytes;
      }

      function dispose() {
        playing = false;
        if (timer) {
          clearInterval(timer);
          timer = 0;
        }
        if (element) {
          try {
            element.pause();
            element.removeAttribute('src');
          } catch (err) {
            /* ignore */
          }
        }
        if (fileUrl) {
          try {
            URL.revokeObjectURL(fileUrl);
          } catch (err) {
            /* ignore */
          }
          fileUrl = null;
        }
        if (audioCtx) {
          try {
            audioCtx.close();
          } catch (err) {
            /* ignore */
          }
          audioCtx = null;
        }
      }

      return {
        supported,
        start,
        pause,
        toggle,
        playFile,
        resumeFile,
        setVolume,
        levels,
        dispose,
        currentId() {
          return current.id;
        },
      };
    }

    /* ------------------------------------------------------------------ */
    /* styles                                                              */
    /* ------------------------------------------------------------------ */

    const CSS = `
.vd-launch{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:30px;min-width:30px;padding:0 6px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .16s ease,color .16s ease}
.vd-launch:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.vd-launch.is-open{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
.vd-glyph{display:flex;align-items:flex-end;gap:2px;height:14px}
.vd-glyph i{display:block;width:3px;border-radius:2px;background:currentColor;opacity:.85;height:6px}
.vd-glyph i:nth-child(1){height:6px}
.vd-glyph i:nth-child(2){height:12px}
.vd-glyph i:nth-child(3){height:9px}
.vd-glyph i:nth-child(4){height:4px}
.vd-launch.is-playing .vd-glyph i{animation:vd-bars 1.1s ease-in-out infinite}
.vd-launch.is-playing .vd-glyph i:nth-child(2){animation-delay:.18s}
.vd-launch.is-playing .vd-glyph i:nth-child(3){animation-delay:.36s}
.vd-launch.is-playing .vd-glyph i:nth-child(4){animation-delay:.54s}
@keyframes vd-bars{0%,100%{transform:scaleY(.55)}50%{transform:scaleY(1.15)}}

.vd-panel{pointer-events:auto;position:fixed;left:12px;bottom:66px;z-index:45;width:336px;max-height:min(660px,calc(100vh - 96px));display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;box-shadow:var(--dsw-shadow-lv3);overflow:hidden;font-size:13px;line-height:1.45;backdrop-filter:blur(20px) saturate(1.15);animation:vd-rise .2s cubic-bezier(.22,.9,.3,1)}
@keyframes vd-rise{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
.vd-head{display:flex;align-items:flex-start;gap:9px;padding:13px 14px 8px}
.vd-mark{width:18px;height:18px;border-radius:6px;flex:none;margin-top:2px;background:linear-gradient(140deg,var(--dsw-alias-brand-primary),#e8578f);box-shadow:inset 0 0 0 1px rgba(255,255,255,.24)}
.vd-heading{min-width:0;flex:1}
.vd-title{font-size:13.5px;font-weight:600;letter-spacing:.01em}
.vd-sub{margin-top:2px;font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vd-icon{width:26px;height:26px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0}
.vd-icon:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.vd-close{margin-left:auto;border-color:transparent;background:transparent}
.vd-tabs{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:0 12px 8px;padding:3px;border-radius:10px;background:var(--dsw-alias-bg-layer-2)}
.vd-tab{height:27px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;cursor:pointer}
.vd-tab:hover{color:var(--dsw-alias-label-primary)}
.vd-tab.is-on{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv1)}
.vd-body{overflow-y:auto;padding:2px 12px 13px;display:flex;flex-direction:column;gap:13px}
.vd-body::-webkit-scrollbar{width:8px}
.vd-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l1);border-radius:999px}
.vd-sec{display:flex;flex-direction:column;gap:7px}
.vd-sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.vd-sec-side{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vd-seg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;padding:3px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.vd-seg-btn{height:25px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;cursor:pointer}
.vd-seg-btn:hover{color:var(--dsw-alias-label-primary)}
.vd-seg-btn.is-on{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv1)}
.vd-moods{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.vd-mood{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:10px;border:1px solid transparent;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;font-size:12px;cursor:pointer;text-align:left}
.vd-mood:hover{background:var(--dsw-alias-interactive-bg-hover)}
.vd-mood.is-on{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-shadow-lv1)}
.vd-dot{width:16px;height:16px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
.vd-accents{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.vd-acc{width:22px;height:22px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);transition:transform .12s ease}
.vd-acc:hover{transform:scale(1.08)}
.vd-acc.is-on{box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 0 0 2px var(--dsw-alias-bg-overlay),0 0 0 3.5px var(--dsw-alias-label-primary)}
.vd-acc-custom{position:relative;overflow:hidden;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1}
.vd-acc-custom input{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);opacity:0;cursor:pointer;border:0;padding:0}
.vd-range{width:100%;height:18px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.vd-reset{align-self:flex-start;margin-top:1px;padding:5px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer}
.vd-reset:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.vd-now{display:flex;align-items:center;gap:11px;padding:9px;border-radius:13px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}
.vd-cover{width:52px;height:52px;border-radius:11px;flex:none;position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding-bottom:9px}
.vd-cover::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 28% 18%,rgba(255,255,255,.52),transparent 58%)}
.vd-cover i{position:relative;z-index:1;display:block;width:3.5px;border-radius:3px;background:rgba(255,255,255,.94);height:8px;animation:vd-eq .95s ease-in-out infinite}
.vd-cover i:nth-child(2){animation-delay:.16s}
.vd-cover i:nth-child(3){animation-delay:.32s}
.vd-cover i:nth-child(4){animation-delay:.48s}
.vd-cover::before{content:'';position:absolute;z-index:1;left:50%;top:50%;width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,.42);transform:translate(-50%,-50%);opacity:.9}
@keyframes vd-eq{0%,100%{height:6px}50%{height:17px}}
.vd-now-meta{min-width:0;flex:1}
.vd-now-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vd-now-note{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.vd-now-state{font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin-top:3px}
.vd-play{width:36px;height:36px;border-radius:50%;border:0;background:var(--dsw-alias-brand-primary);color:var(--dsw-static-neutral-00);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0;transition:transform .14s ease}
.vd-play:hover{transform:scale(1.06)}
.vd-viz{width:100%;height:50px;display:block;border-radius:10px;background:var(--dsw-alias-bg-layer-2)}
.vd-ctl{display:flex;align-items:center;gap:7px}
.vd-vol{display:flex;align-items:center;gap:6px;margin-left:auto;color:var(--dsw-alias-label-tertiary)}
.vd-vol .vd-range{width:86px}
.vd-tracks{display:flex;flex-direction:column;gap:2px}
.vd-track{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:9px;border:1px solid transparent;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left;width:100%}
.vd-track:hover{background:var(--dsw-alias-interactive-bg-hover)}
.vd-track.is-on{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.vd-track-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-border-l2);flex:none}
.vd-track.is-on .vd-track-dot{background:var(--dsw-alias-brand-primary)}
.vd-track-name{font-size:12.5px}
.vd-track-note{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-left:auto;white-space:nowrap}
.vd-file{display:flex;flex-direction:column;gap:4px}
.vd-file-btn{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;padding:5px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer}
.vd-file-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.vd-file-btn span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px}
.vd-hint{font-size:10.5px;color:var(--dsw-alias-label-tertiary)}
.vd-notice{font-size:11px;color:var(--dsw-alias-state-error-primary)}
`;

    function StyleTag() {
      return h('style', { dangerouslySetInnerHTML: { __html: CSS } });
    }

    /* ------------------------------------------------------------------ */
    /* icons                                                               */
    /* ------------------------------------------------------------------ */

    function glyph(size, children, extra) {
      return h('svg', Object.assign({
        viewBox: '0 0 24 24',
        width: size || 15,
        height: size || 15,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.9,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, extra || {}), children);
    }

    const ICON_PLAY = glyph(16, h('path', { d: 'M8 5.2v13.6L19 12z', fill: 'currentColor', stroke: 'none' }));
    const ICON_PAUSE = glyph(16, [
      h('rect', { key: 'a', x: 7, y: 5.5, width: 3.4, height: 13, rx: 1.2, fill: 'currentColor', stroke: 'none' }),
      h('rect', { key: 'b', x: 13.6, y: 5.5, width: 3.4, height: 13, rx: 1.2, fill: 'currentColor', stroke: 'none' }),
    ]);
    const ICON_PREV = glyph(14, [
      h('path', { key: 'a', d: 'M18 6.5v11L9.5 12z', fill: 'currentColor', stroke: 'none' }),
      h('path', { key: 'b', d: 'M6 5.5v13' }),
    ]);
    const ICON_NEXT = glyph(14, [
      h('path', { key: 'a', d: 'M6 6.5v11L14.5 12z', fill: 'currentColor', stroke: 'none' }),
      h('path', { key: 'b', d: 'M18 5.5v13' }),
    ]);
    const ICON_VOLUME = glyph(14, [
      h('path', { key: 'a', d: 'M4 9.4h3l4-3.4v12l-4-3.4H4z' }),
      h('path', { key: 'b', d: 'M15 9a4.4 4.4 0 0 1 0 6' }),
    ]);
    const ICON_CLOSE = glyph(13, [
      h('path', { key: 'a', d: 'M6.5 6.5l11 11' }),
      h('path', { key: 'b', d: 'M17.5 6.5l-11 11' }),
    ]);
    const ICON_FILE = glyph(13, [
      h('path', { key: 'a', d: 'M12 5.5v9' }),
      h('path', { key: 'b', d: 'M8.4 9.1L12 12.7l3.6-3.6' }),
      h('path', { key: 'c', d: 'M5.5 16.5v2.2h13v-2.2' }),
    ]);

    /* ------------------------------------------------------------------ */
    /* visualizer                                                          */
    /* ------------------------------------------------------------------ */

    function Visualizer(props) {
      const canvasRef = useRef(null);
      const engine = props.engine;
      const accent = props.accent;
      const playing = props.playing;

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const g2d = canvas.getContext('2d');
        if (!g2d) return undefined;
        const bins = new Uint8Array(128);
        const bars = 44;
        let raf = 0;
        const started = performance.now();

        const draw = (now) => {
          raf = requestAnimationFrame(draw);
          const width = canvas.width;
          const height = canvas.height;
          g2d.clearRect(0, 0, width, height);
          const data = engine.levels(bins);
          const step = Math.max(1, Math.floor(data.length / bars));
          const gap = width / bars;
          const barWidth = Math.max(2, gap - 3);
          for (let i = 0; i < bars; i += 1) {
            let peak = 0;
            for (let j = 0; j < step; j += 1) peak = Math.max(peak, data[i * step + j] || 0);
            const wave = 0.16 + 0.1 * Math.sin(i * 0.6 + ((now - started) / 1100));
            const value = playing ? Math.max(peak / 255, 0.05) : wave;
            const barHeight = Math.max(3, value * (height - 12));
            const x = i * gap + 1;
            const y = height - 6 - barHeight;
            const alpha = 0.32 + Math.min(0.66, value);
            g2d.fillStyle = rgba(accent, alpha.toFixed(2));
            const radius = Math.min(3, barWidth / 2);
            g2d.beginPath();
            if (typeof g2d.roundRect === 'function') {
              g2d.roundRect(x, y, barWidth, barHeight, radius);
            } else {
              g2d.rect(x, y, barWidth, barHeight);
            }
            g2d.fill();
          }
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
      }, [engine, accent, playing]);

      return h('canvas', { ref: canvasRef, className: 'vd-viz', width: 620, height: 100, 'aria-hidden': true });
    }

    /* ------------------------------------------------------------------ */
    /* launcher                                                            */
    /* ------------------------------------------------------------------ */

    function Launcher(props) {
      const bridge = props.bridge;
      const state = useStore(bridge.store);
      const t = bridge.t;
      const classes = ['vd-launch'];
      if (state.open) classes.push('is-open');
      if (state.playing) classes.push('is-playing');
      return h(React.Fragment, null,
        h(StyleTag, { key: 's' }),
        h('button', {
          key: 'b',
          type: 'button',
          className: classes.join(' '),
          'data-vibe-desk-launcher': '1',
          title: t('launcher'),
          'aria-label': t('launcher'),
          'aria-expanded': state.open ? 'true' : 'false',
          onClick: () => bridge.actions.toggleOpen(),
        }, h('span', { className: 'vd-glyph', 'aria-hidden': true }, [0, 1, 2, 3].map((i) => h('i', { key: i }))))
      );
    }

    /* ------------------------------------------------------------------ */
    /* theme pane                                                          */
    /* ------------------------------------------------------------------ */

    function ThemePane(props) {
      const bridge = props.bridge;
      const state = props.state;
      const t = bridge.t;
      const settings = state.settings;
      const mode = state.preference || 'system';

      const modeRow = h('div', { className: 'vd-sec' },
        h('div', { className: 'vd-sec-head' }, h('span', null, t('mode_label'))),
        h('div', { className: 'vd-seg' }, ['light', 'dark', 'system'].map((id) => h('button', {
          key: id,
          type: 'button',
          className: 'vd-seg-btn' + (mode === id ? ' is-on' : ''),
          'aria-pressed': mode === id,
          onClick: () => bridge.actions.setMode(id),
        }, t('mode_' + id))))
      );

      const paletteRow = h('div', { className: 'vd-sec' },
        h('div', { className: 'vd-sec-head' },
          h('span', null, t('mood_label')),
          h('span', { className: 'vd-sec-side' }, t('mood_' + settings.mood))
        ),
        h('div', { className: 'vd-moods' }, MOODS.filter((mood) => mood.id !== 'custom').map((mood) => h('button', {
          key: mood.id,
          type: 'button',
          className: 'vd-mood' + (settings.mood === mood.id ? ' is-on' : ''),
          'aria-pressed': settings.mood === mood.id,
          onClick: () => bridge.actions.setMood(mood.id),
        },
          h('span', {
            className: 'vd-dot',
            style: { background: 'linear-gradient(135deg,' + mood.grad[0] + ',' + mood.grad[1] + ')' },
          }),
          h('span', null, t('mood_' + mood.id))
        )))
      );

      const accentRow = h('div', { className: 'vd-sec' },
        h('div', { className: 'vd-sec-head' },
          h('span', null, t('accent_label')),
          h('span', { className: 'vd-sec-side' }, String(settings.accent).toUpperCase())
        ),
        h('div', { className: 'vd-accents' },
          ACCENTS.map((color) => h('button', {
            key: color,
            type: 'button',
            title: color,
            'aria-label': color,
            className: 'vd-acc' + (normHex(settings.accent) === normHex(color) ? ' is-on' : ''),
            style: { background: color },
            onClick: () => bridge.actions.setAccent(color),
          })),
          h('label', { className: 'vd-acc vd-acc-custom' + (settings.mood === 'custom' ? ' is-on' : ''), title: t('mood_custom') },
            h('span', null, '+'),
            h('input', {
              type: 'color',
              value: normHex(settings.accent) || DEFAULT_ACCENT,
              'aria-label': t('mood_custom'),
              onChange: (event) => bridge.actions.setAccent(event.target.value),
            })
          )
        )
      );

      const strengthRow = h('div', { className: 'vd-sec' },
        h('div', { className: 'vd-sec-head' },
          h('span', null, t('strength_label')),
          h('span', { className: 'vd-sec-side' }, Math.round(settings.strength) + '%')
        ),
        h('input', {
          type: 'range',
          min: 0,
          max: 100,
          step: 5,
          value: Math.round(settings.strength),
          className: 'vd-range',
          'aria-label': t('strength_label'),
          onChange: (event) => bridge.actions.setStrength(Number(event.target.value)),
        })
      );

      return h('div', { className: 'vd-pane' },
        modeRow,
        paletteRow,
        accentRow,
        strengthRow,
        h('button', { type: 'button', className: 'vd-reset', onClick: () => bridge.actions.reset() }, t('reset'))
      );
    }

    /* ------------------------------------------------------------------ */
    /* music pane                                                          */
    /* ------------------------------------------------------------------ */

    function MusicPane(props) {
      const bridge = props.bridge;
      const state = props.state;
      const t = bridge.t;
      const tx = bridge.tx;
      const settings = state.settings;
      const track = trackOf(settings.track);
      const playing = state.playing;
      const isFile = state.mode === 'file';
      const fileRef = useRef(null);

      const cover = h('div', {
        className: 'vd-cover',
        style: { background: 'linear-gradient(140deg,' + track.grad[0] + ',' + track.grad[1] + ')' },
      }, playing ? [0, 1, 2, 3].map((i) => h('i', { key: i })) : null);

      const now = h('div', { className: 'vd-now' },
        cover,
        h('div', { className: 'vd-now-meta' },
          h('div', { className: 'vd-now-title' }, isFile && state.file ? state.file : tx(track.name)),
          h('div', { className: 'vd-now-note' }, isFile ? t('local_hint') : tx(track.note)),
          h('div', { className: 'vd-now-state' }, playing ? t('now_playing') : t('idle'))
        ),
        h('button', {
          type: 'button',
          className: 'vd-play',
          title: playing ? t('pause') : t('play'),
          'aria-label': playing ? t('pause') : t('play'),
          onClick: () => bridge.actions.togglePlay(),
        }, playing ? ICON_PAUSE : ICON_PLAY)
      );

      const controls = h('div', { className: 'vd-ctl' },
        h('button', { type: 'button', className: 'vd-icon', title: t('prev'), 'aria-label': t('prev'), onClick: () => bridge.actions.prevTrack() }, ICON_PREV),
        h('button', { type: 'button', className: 'vd-icon', title: t('next'), 'aria-label': t('next'), onClick: () => bridge.actions.nextTrack() }, ICON_NEXT),
        h('div', { className: 'vd-vol' },
          h('span', { 'aria-hidden': true }, ICON_VOLUME),
          h('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: Math.round(settings.volume * 100),
            className: 'vd-range',
            'aria-label': t('volume'),
            onChange: (event) => bridge.actions.setVolume(Number(event.target.value) / 100),
          })
        )
      );

      const list = h('div', { className: 'vd-sec' },
        h('div', { className: 'vd-sec-head' },
          h('span', null, t('tracks')),
          h('span', { className: 'vd-sec-side' }, t('synth_hint'))
        ),
        h('div', { className: 'vd-tracks' }, TRACKS.map((item) => h('button', {
          key: item.id,
          type: 'button',
          className: 'vd-track' + (!isFile && settings.track === item.id ? ' is-on' : ''),
          'aria-pressed': !isFile && settings.track === item.id,
          onClick: () => bridge.actions.selectTrack(item.id),
        },
          h('span', { className: 'vd-track-dot', 'aria-hidden': true }),
          h('span', { className: 'vd-track-name' }, tx(item.name)),
          h('span', { className: 'vd-track-note' }, tx(item.note))
        )))
      );

      const fileRow = h('div', { className: 'vd-file' },
        h('button', {
          type: 'button',
          className: 'vd-file-btn',
          onClick: () => {
            if (fileRef.current) fileRef.current.click();
          },
        }, ICON_FILE, h('span', null, t('local'))),
        h('span', { className: 'vd-hint' }, t('local_hint')),
        h('input', {
          ref: fileRef,
          type: 'file',
          accept: 'audio/*',
          style: { display: 'none' },
          onChange: (event) => {
            const file = event.target.files && event.target.files[0];
            if (file) bridge.actions.playFile(file);
            event.target.value = '';
          },
        })
      );

      return h('div', { className: 'vd-pane' },
        now,
        h(Visualizer, { engine: bridge.engine, accent: settings.accent, playing }),
        controls,
        list,
        fileRow,
        state.notice ? h('div', { className: 'vd-notice' }, state.notice) : null
      );
    }

    /* ------------------------------------------------------------------ */
    /* panel                                                               */
    /* ------------------------------------------------------------------ */

    function Panel(props) {
      const bridge = props.bridge;
      const state = useStore(bridge.store);
      const t = bridge.t;
      const ref = useRef(null);
      const open = state.open;

      useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          const node = ref.current;
          const target = event.target;
          if (node && target && node.contains(target)) return;
          if (target && target.closest && target.closest('[data-vibe-desk-launcher]')) return;
          bridge.actions.close();
        };
        const onKey = (event) => {
          if (event.key === 'Escape') bridge.actions.close();
        };
        document.addEventListener('mousedown', onPointerDown, true);
        document.addEventListener('keydown', onKey);
        return () => {
          document.removeEventListener('mousedown', onPointerDown, true);
          document.removeEventListener('keydown', onKey);
        };
      }, [open, bridge]);

      if (!open) return null;

      const settings = state.settings;
      const track = trackOf(settings.track);
      const subtitle = [
        t('mood_' + settings.mood),
        state.mode === 'file' && state.file ? state.file : bridge.tx(track.name),
      ].join(' · ');

      const tab = (id) => h('button', {
        type: 'button',
        className: 'vd-tab' + (state.tab === id ? ' is-on' : ''),
        onClick: () => bridge.actions.setTab(id),
      }, t(id === 'music' ? 'tab_music' : 'tab_theme'));

      return h(React.Fragment, null,
        h(StyleTag, { key: 's' }),
        h('div', {
          key: 'panel',
          className: 'vd-panel',
          ref,
          role: 'dialog',
          'aria-label': t('panel_title'),
          'data-vibe-desk-panel': '1',
        },
          h('div', { className: 'vd-head' },
            h('span', { className: 'vd-mark', 'aria-hidden': true }),
            h('div', { className: 'vd-heading' },
              h('div', { className: 'vd-title' }, t('panel_title')),
              h('div', { className: 'vd-sub' }, subtitle)
            ),
            h('button', {
              type: 'button',
              className: 'vd-icon vd-close',
              title: t('close'),
              'aria-label': t('close'),
              onClick: () => bridge.actions.close(),
            }, ICON_CLOSE)
          ),
          h('div', { className: 'vd-tabs' }, tab('theme'), tab('music')),
          h('div', { className: 'vd-body' },
            state.tab === 'music'
              ? h(MusicPane, { bridge, state })
              : h(ThemePane, { bridge, state })
          )
        )
      );
    }

    /* ------------------------------------------------------------------ */
    /* plugin                                                              */
    /* ------------------------------------------------------------------ */

    return {
      inject: ['slots'],
      apply(ctx) {
        let themeSvc = ctx.get('theme');
        const getThemeSvc = () => {
          if (!themeSvc) themeSvc = ctx.get('theme');
          return themeSvc;
        };
        const localeSvc = ctx.get('locale');

        registerDictionaries(localeSvc);
        const t = makeT(localeSvc);
        const lang = makeLang(localeSvc);
        const tx = makeTx(lang);

        const settings = loadSettings();
        const store = createStore({
          settings,
          open: false,
          tab: 'theme',
          playing: false,
          mode: 'synth',
          file: null,
          notice: null,
          preference: readPreferenceLazy(getThemeSvc),
          localeRev: 0,
        });

        const layer = createThemeLayer(getThemeSvc);
        layer.apply(settings);

        /* First run: open the desk once so the plugin is easy to find. */
        const welcomeTimer = window.setTimeout(() => {
          try {
            if (window.localStorage.getItem(STORE_KEY + '.seen')) return;
            window.localStorage.setItem(STORE_KEY + '.seen', '1');
            store.set({ open: true });
          } catch (err) {
            /* storage blocked: the sidebar icon still opens the desk */
          }
        }, 800);
        ctx.effect(() => () => window.clearTimeout(welcomeTimer));

        const engine = createAudioEngine({
          getVolume() {
            return store.get().settings.volume;
          },
          onPlayChange(playing) {
            store.set({ playing });
          },
          onMode(mode) {
            store.set({ mode });
          },
        });

        const commit = (patch, options) => {
          const next = Object.assign({}, store.get().settings, patch);
          persistSettings(next);
          store.set({ settings: next, notice: null });
          if (!options || options.theme !== false) layer.apply(next);
        };

        const actions = {
          toggleOpen() {
            store.set({ open: !store.get().open });
          },
          close() {
            if (store.get().open) store.set({ open: false });
          },
          setTab(tab) {
            store.set({ tab });
          },
          setMode(id) {
            try {
              const svc = getThemeSvc();
              if (svc) svc.setTheme(id);
            } catch (err) {
              console.error('[vibe-desk] theme preference rejected', err);
            }
            store.set({ preference: readPreferenceLazy(getThemeSvc) });
          },
          setMood(id) {
            const mood = moodOf(id);
            if (mood.id === 'native') {
              commit({ mood: 'native' });
              return;
            }
            if (mood.id === 'custom') return;
            commit({ mood: mood.id, accent: mood.accent });
          },
          setAccent(hex) {
            const accent = normHex(hex);
            if (!accent) return;
            commit({ accent, mood: 'custom' });
          },
          setStrength(value) {
            commit({ strength: clamp(value, 0, 100) });
          },
          reset() {
            commit({ mood: 'native', accent: DEFAULT_ACCENT, strength: DEFAULT_SETTINGS.strength }, { theme: false });
            layer.apply(store.get().settings);
          },
          setVolume(value) {
            const volume = clamp(value, 0, 1);
            commit({ volume }, { theme: false });
            engine.setVolume(volume);
          },
          togglePlay() {
            try {
              engine.toggle(store.get().settings.track);
              store.set({ notice: null });
            } catch (err) {
              store.set({ notice: t('unsupported') });
            }
          },
          selectTrack(id) {
            const track = trackOf(id);
            commit({ track: track.id }, { theme: false });
            store.set({ file: null });
            if (store.get().playing) {
              try {
                engine.start(track.id);
              } catch (err) {
                store.set({ notice: t('unsupported') });
              }
            }
          },
          prevTrack() {
            const listIndex = TRACKS.findIndex((item) => item.id === store.get().settings.track);
            const target = TRACKS[(listIndex <= 0 ? TRACKS.length : listIndex) - 1];
            actions.selectTrack(target.id);
          },
          nextTrack() {
            const listIndex = TRACKS.findIndex((item) => item.id === store.get().settings.track);
            const target = TRACKS[(listIndex + 1) % TRACKS.length];
            actions.selectTrack(target.id);
          },
          playFile(file) {
            try {
              engine.playFile(file);
              store.set({ file: file && file.name ? file.name : t('local'), mode: 'file', notice: null });
            } catch (err) {
              store.set({ notice: t('unsupported') });
            }
          },
        };

        const bridge = { store, actions, engine, t, tx, trackOf };

        ctx.effect(() => {
          const disposers = [];
          try {
            disposers.push(ctx.on('theme/change', () => {
              store.set({ preference: readPreferenceLazy(getThemeSvc) });
            }));
          } catch (err) {
            /* the client composition may not emit theme changes */
          }
          try {
            if (localeSvc && typeof localeSvc.subscribe === 'function') {
              disposers.push(localeSvc.subscribe(() => store.set({ localeRev: store.get().localeRev + 1 })));
            }
          } catch (err) {
            /* locale service without a subscription face */
          }
          return () => {
            disposers.forEach((dispose) => {
              try {
                dispose();
              } catch (err) {
                /* ignore */
              }
            });
          };
        });

        ctx.effect(() => () => {
          engine.dispose();
          layer.dispose();
        });

        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'dsh-vibe-desk.launcher',
          order: 25,
        }, () => h(Launcher, { bridge })));

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'dsh-vibe-desk.panel',
          order: 25,
        }, () => h(Panel, { bridge })));
      },
    };
  },
});
