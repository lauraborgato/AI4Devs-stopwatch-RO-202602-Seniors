(() => {
  'use strict';

  // ==================== DOM REFERENCES ====================
  const dom = {
    // Tabs
    tabStopwatch: document.getElementById('tab-stopwatch'),
    tabCountdown: document.getElementById('tab-countdown'),
    panelStopwatch: document.getElementById('panel-stopwatch'),
    panelCountdown: document.getElementById('panel-countdown'),
    // Stopwatch
    swDisplay: document.getElementById('stopwatch-display'),
    swStartBtn: document.getElementById('sw-start-btn'),
    swLapBtn: document.getElementById('sw-lap-btn'),
    swResetBtn: document.getElementById('sw-reset-btn'),
    swLaps: document.getElementById('sw-laps'),
    // Countdown
    cdHours: document.getElementById('cd-hours'),
    cdMinutes: document.getElementById('cd-minutes'),
    cdSeconds: document.getElementById('cd-seconds'),
    cdInputView: document.getElementById('cd-input-view'),
    cdDisplayView: document.getElementById('cd-display-view'),
    cdDisplayContainer: document.getElementById('cd-display-container'),
    cdDisplay: document.getElementById('countdown-display'),
    cdTimesup: document.getElementById('cd-timesup'),
    cdStartBtn: document.getElementById('cd-start-btn'),
    cdDismissBtn: document.getElementById('cd-dismiss-btn'),
    cdResetBtn: document.getElementById('cd-reset-btn'),
    cdPresets: document.querySelectorAll('.cd-preset'),
    // Shared screen-reader live region
    srTimerLive: document.getElementById('sr-timer-live'),
  };

  // ==================== TIMER LOGIC ====================

  // --- Stopwatch State ---
  const sw = {
    running: false,
    elapsed: 0,       // total elapsed ms
    startTime: 0,     // timestamp when started/resumed
    rafId: null,
    laps: [],
    lastLapElapsed: 0,
    ariaInterval: null,
  };

  const pad = (n, d = 2) => String(n).padStart(d, '0');

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mill = Math.floor(ms % 1000);
    return { h: pad(h), m: pad(m), s: pad(s), ms: pad(mill, 3) };
  };

  const updateSwDisplay = () => {
    const now = performance.now();
    const total = sw.elapsed + (now - sw.startTime);
    const { h, m, s, ms } = formatTime(total);
    dom.swDisplay.innerHTML = `${h}:${m}:${s}<span class="text-2xl sm:text-3xl text-gray-400">.${ms}</span>`;
    sw.rafId = requestAnimationFrame(updateSwDisplay);
  };

  const startStopwatch = () => {
    sw.running = true;
    sw.startTime = performance.now();
    sw.rafId = requestAnimationFrame(updateSwDisplay);
    dom.swStartBtn.textContent = 'Pause';
    dom.swStartBtn.setAttribute('aria-label', 'Pause stopwatch');
    dom.swStartBtn.setAttribute('aria-pressed', 'true');
    dom.swStartBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    dom.swStartBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    dom.swLapBtn.classList.remove('hidden');
    // Throttled screen-reader announcements
    sw.ariaInterval = setInterval(() => {
      dom.srTimerLive.textContent = `Stopwatch: ${dom.swDisplay.textContent}`;
    }, 5000);
  };

  const pauseStopwatch = () => {
    sw.running = false;
    sw.elapsed += performance.now() - sw.startTime;
    cancelAnimationFrame(sw.rafId);
    clearInterval(sw.ariaInterval);
    dom.swStartBtn.textContent = 'Resume';
    dom.swStartBtn.setAttribute('aria-label', 'Resume stopwatch');
    dom.swStartBtn.setAttribute('aria-pressed', 'false');
    dom.swStartBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    dom.swStartBtn.classList.add('bg-green-500', 'hover:bg-green-600');
  };

  const resetStopwatch = () => {
    sw.running = false;
    sw.elapsed = 0;
    sw.laps = [];
    sw.lastLapElapsed = 0;
    cancelAnimationFrame(sw.rafId);
    clearInterval(sw.ariaInterval);
    dom.srTimerLive.textContent = '';
    dom.swDisplay.innerHTML = '00:00:00<span class="text-2xl sm:text-3xl text-gray-400">.000</span>';
    dom.swStartBtn.textContent = 'Start';
    dom.swStartBtn.setAttribute('aria-label', 'Start stopwatch');
    dom.swStartBtn.setAttribute('aria-pressed', 'false');
    dom.swStartBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    dom.swStartBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    dom.swLapBtn.classList.add('hidden');
    dom.swLaps.innerHTML = '';
  };

  const recordLap = () => {
    const currentElapsed = sw.elapsed + (sw.running ? performance.now() - sw.startTime : 0);
    const splitMs = currentElapsed - sw.lastLapElapsed;
    sw.lastLapElapsed = currentElapsed;
    sw.laps.push({ split: splitMs, cumulative: currentElapsed });
    renderLaps();
  };

  const renderLaps = () => {
    dom.swLaps.innerHTML = `
      <table class="w-full text-sm font-mono">
        <thead class="text-gray-400 border-b border-gray-700">
          <tr>
            <th class="py-1 px-2 text-left">Lap</th>
            <th class="py-1 px-2 text-right">Split</th>
            <th class="py-1 px-2 text-right">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          ${sw.laps.map((lap, i) => {
            const split = formatTime(lap.split);
            const cum = formatTime(lap.cumulative);
            return `<tr class="border-b border-gray-800">
              <td class="py-1 px-2">${i + 1}</td>
              <td class="py-1 px-2 text-right">${split.h}:${split.m}:${split.s}.${split.ms}</td>
              <td class="py-1 px-2 text-right">${cum.h}:${cum.m}:${cum.s}.${cum.ms}</td>
            </tr>`;
          }).reverse().join('')}
        </tbody>
      </table>`;
  };

  // --- Countdown State ---
  const cd = {
    running: false,
    remainingMs: 0,
    intervalId: null,
    lastTick: 0,
    finished: false,
    audioCtx: null,
    oscillator: null,
    gainNode: null,
    beepInterval: null,
    ariaInterval: null,
  };

  const formatCountdown = (ms) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const showCountdownDisplay = () => {
    dom.cdInputView.classList.add('hidden');
    dom.cdDisplayView.classList.remove('hidden');
  };

  const showCountdownInput = () => {
    dom.cdInputView.classList.remove('hidden');
    dom.cdDisplayView.classList.add('hidden');
    dom.cdTimesup.classList.add('hidden');
    dom.cdDismissBtn.classList.add('hidden');
    dom.cdDisplayContainer.classList.remove('flash-red');
  };

  const startCountdown = () => {
    if (!cd.running && !cd.finished) {
      // Read input values if starting fresh
      if (cd.remainingMs === 0) {
        const h = Math.min(99, Math.max(0, Number.parseInt(dom.cdHours.value) || 0));
        const m = Math.min(59, Math.max(0, Number.parseInt(dom.cdMinutes.value) || 0));
        const s = Math.min(59, Math.max(0, Number.parseInt(dom.cdSeconds.value) || 0));
        cd.remainingMs = (h * 3600 + m * 60 + s) * 1000;
        if (cd.remainingMs <= 0) return;
      }
      showCountdownDisplay();
      dom.cdDisplay.textContent = formatCountdown(cd.remainingMs);
    }

    cd.running = true;
    cd.lastTick = performance.now();

    cd.intervalId = setInterval(() => {
      const now = performance.now();
      const delta = now - cd.lastTick;
      cd.lastTick = now;
      cd.remainingMs -= delta;

      if (cd.remainingMs <= 0) {
        cd.remainingMs = 0;
        cd.running = false;
        cd.finished = true;
        clearInterval(cd.intervalId);
        clearInterval(cd.ariaInterval);
        cd.ariaInterval = null;
        dom.cdDisplay.textContent = '00:00:00';
        onCountdownFinish();
        return;
      }
      dom.cdDisplay.textContent = formatCountdown(cd.remainingMs);
    }, 100);

    dom.cdStartBtn.textContent = 'Pause';
    dom.cdStartBtn.setAttribute('aria-label', 'Pause countdown');
    dom.cdStartBtn.setAttribute('aria-pressed', 'true');
    dom.cdStartBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    dom.cdStartBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    // Throttled screen-reader announcements
    cd.ariaInterval = setInterval(() => {
      dom.srTimerLive.textContent = `Countdown: ${dom.cdDisplay.textContent}`;
    }, 5000);
  };

  const pauseCountdown = () => {
    cd.running = false;
    clearInterval(cd.intervalId);
    clearInterval(cd.ariaInterval);
    dom.cdStartBtn.textContent = 'Resume';
    dom.cdStartBtn.setAttribute('aria-label', 'Resume countdown');
    dom.cdStartBtn.setAttribute('aria-pressed', 'false');
    dom.cdStartBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    dom.cdStartBtn.classList.add('bg-green-500', 'hover:bg-green-600');
  };

  const resetCountdown = () => {
    cd.running = false;
    cd.finished = false;
    cd.remainingMs = 0;
    clearInterval(cd.intervalId);
    clearInterval(cd.ariaInterval);
    stopBeep();
    dom.srTimerLive.textContent = '';
    dom.cdDisplay.textContent = '00:00:00';
    dom.cdStartBtn.textContent = 'Start';
    dom.cdStartBtn.setAttribute('aria-label', 'Start countdown');
    dom.cdStartBtn.setAttribute('aria-pressed', 'false');
    dom.cdStartBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    dom.cdStartBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    dom.cdStartBtn.classList.remove('hidden');
    dom.cdDismissBtn.classList.add('hidden');
    showCountdownInput();
  };

  const onCountdownFinish = () => {
    dom.cdDisplayContainer.classList.add('flash-red');
    dom.cdTimesup.classList.remove('hidden');
    dom.cdDismissBtn.classList.remove('hidden');
    dom.cdStartBtn.classList.add('hidden');
    dom.cdStartBtn.setAttribute('aria-pressed', 'false');
    dom.srTimerLive.textContent = "Time's up!";
    playBeep();
  };

  // ==================== AUDIO (Web Audio API) ====================

  const playBeep = () => {
    cd.audioCtx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    cd.gainNode = cd.audioCtx.createGain();
    cd.gainNode.gain.value = 0.3;
    cd.gainNode.connect(cd.audioCtx.destination);

    const playTone = () => {
      if (!cd.audioCtx || cd.audioCtx.state === 'closed') return;
      const osc = cd.audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 880;
      osc.connect(cd.gainNode);
      osc.start();
      osc.stop(cd.audioCtx.currentTime + 0.15);
    };

    playTone();
    cd.beepInterval = setInterval(playTone, 600);
  };

  const stopBeep = () => {
    if (cd.beepInterval) {
      clearInterval(cd.beepInterval);
      cd.beepInterval = null;
    }
    if (cd.audioCtx) {
      cd.audioCtx.close();
      cd.audioCtx = null;
    }
  };

  // ==================== TAB SWITCHING ====================

  let activeMode = 'stopwatch';

  const switchTab = (mode) => {
    if (mode === activeMode) return;
    // Reset both timers when switching
    resetStopwatch();
    resetCountdown();
    activeMode = mode;

    if (mode === 'stopwatch') {
      dom.tabStopwatch.setAttribute('aria-selected', 'true');
      dom.tabStopwatch.setAttribute('tabindex', '0');
      dom.tabStopwatch.classList.remove('bg-gray-700', 'text-gray-300');
      dom.tabStopwatch.classList.add('bg-blue-500', 'text-white');
      dom.tabCountdown.setAttribute('aria-selected', 'false');
      dom.tabCountdown.setAttribute('tabindex', '-1');
      dom.tabCountdown.classList.remove('bg-blue-500', 'text-white');
      dom.tabCountdown.classList.add('bg-gray-700', 'text-gray-300');
      dom.panelStopwatch.classList.remove('hidden');
      dom.panelCountdown.classList.add('hidden');
    } else {
      dom.tabCountdown.setAttribute('aria-selected', 'true');
      dom.tabCountdown.setAttribute('tabindex', '0');
      dom.tabCountdown.classList.remove('bg-gray-700', 'text-gray-300');
      dom.tabCountdown.classList.add('bg-blue-500', 'text-white');
      dom.tabStopwatch.setAttribute('aria-selected', 'false');
      dom.tabStopwatch.setAttribute('tabindex', '-1');
      dom.tabStopwatch.classList.remove('bg-blue-500', 'text-white');
      dom.tabStopwatch.classList.add('bg-gray-700', 'text-gray-300');
      dom.panelCountdown.classList.remove('hidden');
      dom.panelStopwatch.classList.add('hidden');
    }
  };

  // ==================== EVENT LISTENERS ====================

  // Tabs
  dom.tabStopwatch.addEventListener('click', () => switchTab('stopwatch'));
  dom.tabCountdown.addEventListener('click', () => switchTab('countdown'));

  // Keyboard navigation for tabs
  [dom.tabStopwatch, dom.tabCountdown].forEach((tab) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const target = tab === dom.tabStopwatch ? dom.tabCountdown : dom.tabStopwatch;
        target.focus();
        target.click();
      }
    });
  });

  // Stopwatch buttons
  dom.swStartBtn.addEventListener('click', () => {
    if (sw.running) {
      pauseStopwatch();
    } else {
      startStopwatch();
    }
  });

  dom.swResetBtn.addEventListener('click', resetStopwatch);
  dom.swLapBtn.addEventListener('click', recordLap);

  // Countdown buttons
  dom.cdStartBtn.addEventListener('click', () => {
    if (cd.finished) return;
    if (cd.running) {
      pauseCountdown();
    } else {
      startCountdown();
    }
  });

  dom.cdResetBtn.addEventListener('click', resetCountdown);

  dom.cdDismissBtn.addEventListener('click', () => {
    stopBeep();
    dom.cdDisplayContainer.classList.remove('flash-red');
    dom.cdTimesup.classList.add('hidden');
    dom.cdDismissBtn.classList.add('hidden');
    dom.cdStartBtn.classList.remove('hidden');
    resetCountdown();
  });

  // Presets
  dom.cdPresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      const minutes = Number.parseInt(btn.dataset.minutes);
      dom.cdHours.value = 0;
      dom.cdMinutes.value = minutes;
      dom.cdSeconds.value = 0;
      startCountdown();
    });
  });

  // Clamp input values
  [dom.cdHours, dom.cdMinutes, dom.cdSeconds].forEach((input) => {
    input.addEventListener('change', () => {
      const max = Number.parseInt(input.max);
      const min = Number.parseInt(input.min);
      let val = Number.parseInt(input.value) || 0;
      input.value = Math.min(max, Math.max(min, val));
    });
  });
})();
