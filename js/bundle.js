console.log("BUNDLE LOADED VERSION 2");
alert("Check Console!");
const FLAP_AUDIO_BASE64 = "";
const GRID_COLS = 22;
const GRID_ROWS = 5;

const SCRAMBLE_DURATION = 800;
const FLIP_DURATION = 300;
const STAGGER_DELAY = 25;
const TOTAL_TRANSITION = 3800;
const MESSAGE_INTERVAL = 4000;

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-!?'/";

const SCRAMBLE_COLORS = [
  '#00AAFF', '#00FFCC', '#AA00FF',
  '#FF2D00', '#FFCC00', '#FFFFFF'
];

const ACCENT_COLORS = [
  '#00FF7F', '#FF4D00', '#AA00FF',
  '#00AAFF', '#00FFCC'
];

const MESSAGES = [
  [
    '',
    'HEATHER TOYE',
    'MOTHER OF DRAGONS',
    '- GEORGE RR MARTIN',
    ''
  ],
  [
    '',
    'STAY HUNGRY',
    'STAY FOOLISH',
    '- STEVE JOBS',
    ''
  ],
  [
    '',
    'ID SAY GO TO HELL',
    'BUT I NEVER WANT', 
    'TO SEE YOU AGAIN',
    '- THOMAS WATSON',
    ''
  ],
  [
    '',
    'THIS ISNT NAM', 
    'THIS IS BOWLING',
    'THERE ARE RULES',
    '- MIES VAN DER ROHE',
    ''
  ],
  [
    '',
    'MAKE IT SIMPLE',
    'BUT SIGNIFICANT',
    '- DON DRAPER',
    ''
  ],
  [
    '',
    'HAVE  A DRINK',
    'IT WILL MAKE ME',
    'LOOK YOUNGER',
    '- SALVADOR DALI',
    ''
  ],
];

// --- TILE LOGIC (FORMERLY TILE.JS) ---

class Tile {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.currentChar = ' ';
    this.isAnimating = false;
    this._scrambleTimer = null;

    // Build DOM
    this.el = document.createElement('div');
    this.el.className = 'tile';

    this.innerEl = document.createElement('div');
    this.innerEl.className = 'tile-inner';

    this.frontEl = document.createElement('div');
    this.frontEl.className = 'tile-front';
    this.frontSpan = document.createElement('span');
    this.frontEl.appendChild(this.frontSpan);

    this.backEl = document.createElement('div');
    this.backEl.className = 'tile-back';
    this.backSpan = document.createElement('span');
    this.backEl.appendChild(this.backSpan);

    this.innerEl.appendChild(this.frontEl);
    this.innerEl.appendChild(this.backEl);
    this.el.appendChild(this.innerEl);
  }

  setChar(char) {
    this.currentChar = char;
    this.frontSpan.textContent = char === ' ' ? '' : char;
    this.backSpan.textContent = '';
    this.frontEl.style.backgroundColor = '';
  }

  scrambleTo(targetChar, delay) {
    if (targetChar === this.currentChar) return;

    // Cancel any in-progress animation
    if (this._scrambleTimer) {
      clearInterval(this._scrambleTimer);
      this._scrambleTimer = null;
    }
    this.isAnimating = true;

    setTimeout(() => {
      this.el.classList.add('scrambling');
      let scrambleCount = 0;
      const maxScrambles = 10 + Math.floor(Math.random() * 4);
      const scrambleInterval = 70;

      this._scrambleTimer = setInterval(() => {
        // Random character
        const randChar = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        this.frontSpan.textContent = randChar === ' ' ? '' : randChar;

        // Cycle background color
        const color = SCRAMBLE_COLORS[scrambleCount % SCRAMBLE_COLORS.length];
        this.frontEl.style.backgroundColor = color;

        // Briefly change text color for contrast on light backgrounds
        if (color === '#FFFFFF' || color === '#FFCC00') {
          this.frontSpan.style.color = '#111';
        } else {
          this.frontSpan.style.color = '';
        }

        scrambleCount++;

        if (scrambleCount >= maxScrambles) {
          clearInterval(this._scrambleTimer);
          this._scrambleTimer = null;

          // Reset colors
          this.frontEl.style.backgroundColor = '';
          this.frontSpan.style.color = '';

          // Set the final character directly
          this.frontSpan.textContent = targetChar === ' ' ? '' : targetChar;

          // Quick flash effect: brief scale transform
          this.innerEl.style.transition = `transform ${FLIP_DURATION}ms ease-in-out`;
          this.innerEl.style.transform = 'perspective(400px) rotateX(-8deg)';

          setTimeout(() => {
            this.innerEl.style.transform = '';
            setTimeout(() => {
              this.innerEl.style.transition = '';
              this.el.classList.remove('scrambling');
              this.currentChar = targetChar;
              this.isAnimating = false;
            }, FLIP_DURATION);
          }, FLIP_DURATION / 2);
        }
      }, scrambleInterval);
    }, delay);
  }
}

// --- SOUND ENGINE (FORMERLY SOUNDENGINE.JS) ---

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this._initialized = false;
    this._audioBuffer = null;
    this._currentSource = null;
  }

  async init() {
    if (this._initialized) return;
    // Standard AudioContext for most TV browsers, webkit for older ones
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('Web Audio API not supported on this TV');
      return;
    }
    this.ctx = new AudioContext();
    this._initialized = true;

    try {
      // Note: Ensure FLAP_AUDIO_BASE64 is defined in your bundle!
      const binaryStr = atob(FLAP_AUDIO_BASE64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      this._audioBuffer = await this.ctx.decodeAudioData(bytes.buffer);
    } catch (e) {
      console.warn('Failed to decode flap audio:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTransition() {
    if (!this.ctx || !this._audioBuffer || this.muted) return;
    this.resume();

    if (this._currentSource) {
      try {
        this._currentSource.stop();
      } catch (e) {}
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this._audioBuffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(0);
    this._currentSource = source;

    source.onended = () => {
      if (this._currentSource === source) {
        this._currentSource = null;
      }
    };
  }

  getTransitionDuration() {
    if (this._audioBuffer) {
      return this._audioBuffer.duration * 1000;
    }
    return 3800;
  }

  scheduleFlaps() {
    this.playTransition();
  }
}

// --- BOARD LOGIC (FORMERLY BOARD.JS) ---

class Board {
  constructor(containerEl, soundEngine) {
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.soundEngine = soundEngine;
    this.isTransitioning = false;
    this.tiles = [];
    this.currentGrid = [];
    this.accentIndex = 0;

    // Build board DOM
    this.boardEl = document.createElement('div');
    this.boardEl.className = 'board';
    this.boardEl.style.setProperty('--grid-cols', this.cols);
    this.boardEl.style.setProperty('--grid-rows', this.rows);

    // Left accent squares
    this.leftBar = this._createAccentBar('accent-bar-left');
    this.boardEl.appendChild(this.leftBar);

    // Tile grid
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'tile-grid';

    for (let r = 0; r < this.rows; r++) {
      const row = [];
      const charRow = [];
      for (let c = 0; c < this.cols; c++) {
        const tile = new Tile(r, c);
        tile.setChar(' ');
        this.gridEl.appendChild(tile.el);
        row.push(tile);
        charRow.push(' ');
      }
      this.tiles.push(row);
      this.currentGrid.push(charRow);
    }

    this.boardEl.appendChild(this.gridEl);

    // Right accent squares
    this.rightBar = this._createAccentBar('accent-bar-right');
    this.boardEl.appendChild(this.rightBar);

    // Keyboard hint icon
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.textContent = 'N';
    hint.title = 'Keyboard shortcuts';
    hint.addEventListener('click', (e) => {
      e.stopPropagation();
      const overlay = this.boardEl.querySelector('.shortcuts-overlay');
      if (overlay) overlay.classList.toggle('visible');
    });
    this.boardEl.appendChild(hint);

    // Shortcuts overlay
    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-overlay';
    overlay.innerHTML = `
      <div><span>Next message</span><kbd>Enter</kbd></div>
      <div><span>Previous</span><kbd>←</kbd></div>
      <div><span>Fullscreen</span><kbd>F</kbd></div>
      <div><span>Mute</span><kbd>M</kbd></div>
    `;
    this.boardEl.appendChild(overlay);

    containerEl.appendChild(this.boardEl);
    this._updateAccentColors();
  }

  _createAccentBar(extraClass) {
    const bar = document.createElement('div');
    bar.className = `accent-bar ${extraClass}`;
    for (let i = 0; i < 2; i++) {
      const seg = document.createElement('div');
      seg.className = 'accent-segment';
      bar.appendChild(seg);
    }
    return bar;
  }

  _updateAccentColors() {
    const color = ACCENT_COLORS[this.accentIndex % ACCENT_COLORS.length];
    const segments = this.boardEl.querySelectorAll('.accent-segment');
    segments.forEach(seg => {
      seg.style.backgroundColor = color;
    });
  }

  displayMessage(lines) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const newGrid = this._formatToGrid(lines);
    let hasChanges = false;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const newChar = newGrid[r][c];
        const oldChar = this.currentGrid[r][c];

        if (newChar !== oldChar) {
          const delay = (r * this.cols + c) * STAGGER_DELAY;
          this.tiles[r][c].scrambleTo(newChar, delay);
          hasChanges = true;
        }
      }
    }

    if (hasChanges && this.soundEngine) {
      this.soundEngine.playTransition();
    }

    this.accentIndex++;
    this._updateAccentColors();
    this.currentGrid = newGrid;

    setTimeout(() => {
      this.isTransitioning = false;
    }, TOTAL_TRANSITION + 200);
  }

  _formatToGrid(lines) {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      const line = (lines[r] || '').toUpperCase();
      const padTotal = this.cols - line.length;
      const padLeft = Math.max(0, Math.floor(padTotal / 2));
      const padded = ' '.repeat(padLeft) + line + ' '.repeat(Math.max(0, this.cols - padLeft - line.length));
      grid.push(padded.split(''));
    }
    return grid;
  }
}

// --- SINGLETON INITIALIZATION ---
function startFlipOff() {
    var container = document.getElementById('board-container');
    if (!container) return;

    // 1. Safety check: Wipe the container and stop if a board exists
    if (document.querySelector('.board')) return;
    container.innerHTML = ''; 

    // 2. Setup Engines
    var sound = new SoundEngine();
    var board = new Board(container, sound);
    
    // Attach to window so our Click-to-Unlock listener can find them
    window.globalSound = sound;
    window.globalBoard = board;

    var messageIndex = 0;
    function cycle() {
        board.displayMessage(MESSAGES[messageIndex]);
        messageIndex = (messageIndex + 1) % MESSAGES.length;
    }

    // 3. Start the loop
    cycle();
    setInterval(cycle, MESSAGE_INTERVAL + TOTAL_TRANSITION);
}

// 4. Global Click Listener for TV (Unlocks Fullscreen & Audio)
window.addEventListener('click', function() {
    // Request Fullscreen
    var el = document.documentElement;
    var requestMethod = el.requestFullscreen || el.webkitRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (requestMethod) { requestMethod.call(el); }

    // Unlock Audio Context
    if (window.globalSound) {
        window.globalSound.init();
        window.globalSound.resume();
        window.globalSound.playTransition(); // Test sound
    }
}, { once: true });

// 5. Boot up logic
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startFlipOff();
} else {
    document.addEventListener('DOMContentLoaded', startFlipOff);
}
