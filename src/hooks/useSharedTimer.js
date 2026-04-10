// ============================================================
// useSharedTimer — Collaborative Pomodoro timer via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

const WORK_DURATION = 25 * 60 * 1000;       // 25 minutes
const SHORT_BREAK = 5 * 60 * 1000;          // 5 minutes
const LONG_BREAK = 15 * 60 * 1000;          // 15 minutes
const SESSIONS_BEFORE_LONG = 4;

/**
 * Play a soft bell sound using Web Audio API.
 */
function playBellSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Bell-like tone: two oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);

    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    // Silently ignore
  }
}

export default function useSharedTimer(ydoc, isOwner = false) {
  const [timerState, setTimerState] = useState({
    running: false,
    startedAt: null,
    duration: WORK_DURATION,
    mode: 'work', // 'work' | 'shortBreak' | 'longBreak'
    sessions: 0,
  });
  const [remaining, setRemaining] = useState(WORK_DURATION);
  const yTimerRef = useRef(null);
  const intervalRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!ydoc) return;

    const yTimer = ydoc.getMap('timer');
    yTimerRef.current = yTimer;

    // Initialize if empty
    if (!yTimer.has('running')) {
      ydoc.transact(() => {
        yTimer.set('running', false);
        yTimer.set('startedAt', null);
        yTimer.set('duration', WORK_DURATION);
        yTimer.set('mode', 'work');
        yTimer.set('sessions', 0);
      }, 'local');
    }

    const observe = () => {
      setTimerState({
        running: yTimer.get('running') || false,
        startedAt: yTimer.get('startedAt') || null,
        duration: yTimer.get('duration') || WORK_DURATION,
        mode: yTimer.get('mode') || 'work',
        sessions: yTimer.get('sessions') || 0,
      });
      endedRef.current = false;
    };

    yTimer.observeDeep(observe);
    observe();

    return () => {
      yTimer.unobserveDeep(observe);
    };
  }, [ydoc]);

  // Tick: calculate remaining time from shared startedAt
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (timerState.running && timerState.startedAt) {
      const tick = () => {
        const elapsed = Date.now() - timerState.startedAt;
        const rem = Math.max(0, timerState.duration - elapsed);
        setRemaining(rem);

        if (rem <= 0 && !endedRef.current) {
          endedRef.current = true;
          playBellSound();

          // Auto-switch mode (only owner writes to Yjs)
          if (isOwner) {
            const yTimer = yTimerRef.current;
            if (!yTimer) return;
            ydoc.transact(() => {
              const sessions = (yTimer.get('sessions') || 0);
              let nextMode, nextDuration;

              if (timerState.mode === 'work') {
                const newSessions = sessions + 1;
                yTimer.set('sessions', newSessions);
                if (newSessions % SESSIONS_BEFORE_LONG === 0) {
                  nextMode = 'longBreak';
                  nextDuration = LONG_BREAK;
                } else {
                  nextMode = 'shortBreak';
                  nextDuration = SHORT_BREAK;
                }
              } else {
                nextMode = 'work';
                nextDuration = WORK_DURATION;
              }

              yTimer.set('mode', nextMode);
              yTimer.set('duration', nextDuration);
              yTimer.set('running', false);
              yTimer.set('startedAt', null);
            }, 'local');
          }
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 200);
    } else {
      setRemaining(timerState.duration);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.running, timerState.startedAt, timerState.duration, timerState.mode, isOwner]);

  const start = useCallback(() => {
    if (!isOwner) return;
    const yTimer = yTimerRef.current;
    if (!yTimer) return;
    ydoc.transact(() => {
      yTimer.set('running', true);
      yTimer.set('startedAt', Date.now());
    }, 'local');
  }, [isOwner, ydoc]);

  const pause = useCallback(() => {
    if (!isOwner) return;
    const yTimer = yTimerRef.current;
    if (!yTimer) return;
    const elapsed = Date.now() - (yTimer.get('startedAt') || Date.now());
    const rem = Math.max(0, (yTimer.get('duration') || WORK_DURATION) - elapsed);
    ydoc.transact(() => {
      yTimer.set('running', false);
      yTimer.set('startedAt', null);
      yTimer.set('duration', rem);
    }, 'local');
  }, [isOwner, ydoc]);

  const reset = useCallback(() => {
    if (!isOwner) return;
    const yTimer = yTimerRef.current;
    if (!yTimer) return;
    ydoc.transact(() => {
      yTimer.set('running', false);
      yTimer.set('startedAt', null);
      yTimer.set('mode', 'work');
      yTimer.set('duration', WORK_DURATION);
      yTimer.set('sessions', 0);
    }, 'local');
  }, [isOwner, ydoc]);

  const skip = useCallback(() => {
    if (!isOwner) return;
    const yTimer = yTimerRef.current;
    if (!yTimer) return;
    endedRef.current = true;

    ydoc.transact(() => {
      const sessions = yTimer.get('sessions') || 0;
      const currentMode = yTimer.get('mode') || 'work';
      let nextMode, nextDuration;

      if (currentMode === 'work') {
        const newSessions = sessions + 1;
        yTimer.set('sessions', newSessions);
        if (newSessions % SESSIONS_BEFORE_LONG === 0) {
          nextMode = 'longBreak';
          nextDuration = LONG_BREAK;
        } else {
          nextMode = 'shortBreak';
          nextDuration = SHORT_BREAK;
        }
      } else {
        nextMode = 'work';
        nextDuration = WORK_DURATION;
      }

      yTimer.set('mode', nextMode);
      yTimer.set('duration', nextDuration);
      yTimer.set('running', false);
      yTimer.set('startedAt', null);
    }, 'local');
  }, [isOwner, ydoc]);

  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  return {
    ...timerState,
    remaining,
    formattedTime: formatTime(remaining),
    start,
    pause,
    reset,
    skip,
    isOwner,
  };
}
