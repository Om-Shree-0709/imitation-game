// Game variables
let currentLevel = 1;
let typedTextTimeout = null;

// Level narratives
const narratives = {
  1: "My name is Alan Turing. It is 1941, and we are losing the war. The Germans encrypt every message with a machine called Enigma. I am going to teach you how we broke it. Start simple.",
  2: "Good. Now harder. The Germans used substitution — every letter replaced by another. But language has patterns. The letter E appears most in English text. Find the pattern. Break the code.",
  3: "Enigma uses three rotors, each set to a letter. The combination changes daily. We had to find it by logic, not brute force. There were too many possibilities. But humans make mistakes — and mistakes leave traces.",
  4: "Every morning, the German weather station sent a report. It always contained the word WETTER — German for weather. A predictable word in a predictable position. That predictability was their undoing.",
  5: "This is the Bombe. My machine. It does not think — it eliminates. Every wrong answer narrows the search. What remains, however improbable, must be the truth."
};

// End narrative slides
const endNarrativeSlides = [
  "The work at Bletchley Park remained secret for 30 years. Alan Turing was never publicly credited.",
  "In 1952, he was convicted of 'gross indecency' for being gay and chemically castrated by the British government. He died in 1954. He was 41.",
  "In 2013, he received a Royal Pardon. In 2021, his face appeared on the British £50 note.",
  "He asked one question above all others: Can machines think?\n\nHe never got to see the answer. We are still finding it."
];
let endNarrativeIdx = 0;

// Typewriter speed
const typeSpeed = 30;

// Start of application
function startGame() {
  const overlay = document.getElementById('how-to-play-overlay');
  if (overlay) overlay.style.display = 'none';
  initLevel1();
  typeNarrative(narratives[1]);
}

window.addEventListener('load', () => {
  const overlay = document.getElementById('how-to-play-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
});

// Typewriter effect
function typeNarrative(text, callback) {
  const container = document.getElementById('narrative-text');
  container.innerHTML = "";
  if (typedTextTimeout) clearTimeout(typedTextTimeout);
  
  let index = 0;
  function type() {
    if (index < text.length) {
      container.textContent += text.charAt(index);
      index++;
      typedTextTimeout = setTimeout(type, typeSpeed);
    } else {
      // Add blink cursor at the end
      const cursor = document.createElement('span');
      cursor.className = 'narrative-cursor';
      container.appendChild(cursor);
      if (callback) callback();
    }
  }
  type();
}

// Flash Workspace Effect
function flashWorkspace(type) {
  const overlay = document.getElementById('flash-overlay');
  overlay.className = `flash-overlay ${type}`;
  setTimeout(() => {
    overlay.className = 'flash-overlay';
  }, 600);
  
  if (type === 'error') {
    const panel = document.getElementById('workspace-panel');
    panel.classList.add('shake');
    setTimeout(() => {
      panel.classList.remove('shake');
    }, 500);
  }
}

// Set Terminal Status
function setTerminalStatus(text, type = '') {
  const statusEl = document.getElementById('terminal-status');
  const dot = document.getElementById('terminal-dot');
  statusEl.textContent = `STATUS: ${text}`;
  
  if (type === 'success') {
    statusEl.style.color = 'var(--terminal-green)';
    dot.className = 'terminal-dot active';
  } else if (type === 'error') {
    statusEl.style.color = 'var(--terminal-red)';
    dot.className = 'terminal-dot';
  } else {
    statusEl.style.color = 'var(--terminal-amber)';
    dot.className = 'terminal-dot';
  }
}

// Show/Hide continue button
function showContinue(show) {
  const continueRow = document.getElementById('continue-row');
  continueRow.style.display = show ? 'flex' : 'none';
  
  // Toggle interactives state inside active level
  const activeLevel = document.querySelector('.level-container.active');
  if (activeLevel) {
    const inputs = activeLevel.querySelectorAll('input, select, button');
    inputs.forEach(el => {
      if (el.id !== 'continue-btn') {
        el.disabled = show;
        if (show) el.style.opacity = '0.5';
      }
    });
  }
}

// General next level trigger
function nextLevel() {
  closeHint();
  showContinue(false);
  
  // Clean up previous level opacity transitions
  const prevLevelEl = document.getElementById(`level-${currentLevel}`);
  prevLevelEl.classList.remove('active');
  
  currentLevel++;
  
  // Update progress
  updateProgress();

  if (currentLevel <= 5) {
    const nextLevelEl = document.getElementById(`level-${currentLevel}`);
    nextLevelEl.classList.add('active');
    
    // Init next level
    if (currentLevel === 2) initLevel2();
    if (currentLevel === 3) initLevel3();
    if (currentLevel === 4) initLevel4();
    if (currentLevel === 5) initLevel5();
    
    typeNarrative(narratives[currentLevel]);
    setTerminalStatus('STANDBY');
  } else {
    // Run End Cutscene
    startEndCutscene();
  }
}

function updateProgress() {
  document.getElementById('progress-step-text').textContent = `LEVEL ${Math.min(currentLevel, 5)} OF 5`;
  const pips = document.querySelectorAll('.progress-pip');
  pips.forEach((pip, idx) => {
    pip.className = 'progress-pip';
    if (idx < currentLevel - 1) {
      pip.classList.add('completed');
    } else if (idx === currentLevel - 1) {
      pip.classList.add('active');
    }
  });
}

// ==========================================================
// LEVEL 1 — CAESAR CIPHER
// ==========================================================
let l1Shift = 0;
const l1Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function initLevel1() {
  l1Shift = 0;
  
  const topRow = document.getElementById('l1-tape-top');
  const bottomRow = document.getElementById('l1-tape-bottom');
  
  // Render CIPHER row: 26 letters (A-Z)
  topRow.innerHTML = "";
  for (let i = 0; i < 26; i++) {
    topRow.innerHTML += `<div class="l1-tape-cell">${l1Alphabet[i]}</div>`;
  }
  
  // Render PLAIN row: 3 full alphabets (78 letters) to support wrapping shifts
  bottomRow.innerHTML = "";
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 26; i++) {
      bottomRow.innerHTML += `<div class="l1-tape-cell">${l1Alphabet[i]}</div>`;
    }
  }
  
  updateTapeShift();
}

function adjustShift(val) {
  l1Shift = (l1Shift + val + 26) % 26;
  updateTapeShift();
}

function updateTapeShift() {
  const bottomRow = document.getElementById('l1-tape-bottom');
  const topRow = document.getElementById('l1-tape-top');
  const shiftDisplay = document.getElementById('shift-display');
  const liveDecode = document.getElementById('l1-live-decode');
  const ciphertext = "EOHWFKOHB SDUN";
  
  // Slide bottom row to the right by shift * 36px (plus 18px centering offset)
  const offset = 18 + l1Shift * 36;
  bottomRow.style.transform = `translateX(${offset}px)`;
  
  // Align top row (always static at 18px centering offset)
  topRow.style.transform = `translateX(18px)`;
  
  // Update shift display
  shiftDisplay.textContent = `SHIFT: ${l1Shift}`;
  
  // Update live preview
  let decodedResult = "";
  for (let i = 0; i < ciphertext.length; i++) {
    const char = ciphertext[i];
    if (char === " ") {
      decodedResult += " ";
    } else {
      const idx = l1Alphabet.indexOf(char);
      const shiftedIdx = (idx - l1Shift + 26) % 26;
      decodedResult += l1Alphabet[shiftedIdx];
    }
  }
  
  liveDecode.textContent = decodedResult;
}

function checkLevel1() {
  if (l1Shift === 3) {
    // Decoded correctly!
    flashWorkspace('success');
    setTerminalStatus('DECODED SUCCESS', 'success');
    
    const cipherBox = document.getElementById('l1-ciphertext');
    cipherBox.textContent = "BLETCHLEY PARK";
    cipherBox.classList.add('decoded-text');
    
    showContinue(true);
  } else {
    flashWorkspace('error');
    setTerminalStatus('DECRYPTION FAILURE', 'error');
  }
}

// ==========================================================
// LEVEL 2 — SUBSTITUTION CIPHER
// ==========================================================
const l2Plaintext = "PATTERNS REVEAL SECRETS";
const l2Ciphertext = "UYQQXKVJ KXGXYM JXDDKQJ";

// Key mapping: Plaintext letter -> Ciphertext letter
const l2KeyMap = {
  'P': 'U', 'A': 'Y', 'T': 'Q', 'E': 'X', 'R': 'K', 
  'N': 'V', 'S': 'J', 'V': 'G', 'L': 'M', 'C': 'D'
};

// Prefilled values (X=E, Q=T, J=S)
const l2Prefilled = {
  'X': 'E', 'Q': 'T', 'J': 'S'
};

// Player's current map (Ciphertext letter -> Plaintext guess)
let l2PlayerMap = {};

function initLevel2() {
  // Set default player mappings for pre-fills
  l2PlayerMap = { ...l2Prefilled };
  
  // Build key inputs table
  const subTable = document.getElementById('l2-sub-table');
  subTable.innerHTML = "";
  
  // We list the unique ciphertext letters that appear in the cipher
  const ciphertextLetters = ['U', 'Y', 'Q', 'X', 'K', 'V', 'J', 'G', 'M', 'D'];
  
  ciphertextLetters.forEach(cipherChar => {
    const isPrefilled = l2Prefilled[cipherChar] !== undefined;
    const cell = document.createElement('div');
    cell.className = `sub-cell ${isPrefilled ? 'prefilled' : ''}`;
    
    const label = document.createElement('div');
    label.className = 'sub-cell-label';
    label.textContent = cipherChar;
    
    const input = document.createElement('input');
    input.className = 'sub-cell-input';
    input.maxLength = 1;
    input.value = l2PlayerMap[cipherChar] || "";
    input.id = `sub-input-${cipherChar}`;
    if (isPrefilled) {
      input.disabled = true;
    } else {
      // Listeners to update decryption output in real time
      input.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        e.target.value = val;
        if (val) {
          l2PlayerMap[cipherChar] = val;
        } else {
          delete l2PlayerMap[cipherChar];
        }
        updateLevel2DecodedDisplay();
      });
      
      input.addEventListener('focus', () => {
        highlightCipherLetter(cipherChar);
      });
    }
    
    cell.appendChild(label);
    cell.appendChild(input);
    subTable.appendChild(cell);
  });
  
  // Build frequency list/legend
  const freqLegend = document.getElementById('freq-legend-list');
  freqLegend.innerHTML = `
    <div class="freq-item"><span>X</span> (5)</div>
    <div class="freq-item"><span>Q</span> (3)</div>
    <div class="freq-item"><span>J</span> (3)</div>
    <div class="freq-item"><span>K</span> (3)</div>
    <div class="freq-item"><span>Y</span> (2)</div>
    <div class="freq-item"><span>Others</span> (1)</div>
  `;

  updateLevel2DecodedDisplay();
}

function updateLevel2DecodedDisplay() {
  const cipherBox = document.getElementById('l2-ciphertext');
  cipherBox.innerHTML = "";
  
  for (let i = 0; i < l2Ciphertext.length; i++) {
    const char = l2Ciphertext[i];
    if (char === " ") {
      cipherBox.appendChild(document.createTextNode("  "));
    } else {
      const charEl = document.createElement('span');
      charEl.className = 'sub-char';
      charEl.textContent = l2PlayerMap[char] || "_";
      charEl.addEventListener('click', () => {
        // Click letter to highlight and focus its input
        highlightCipherLetter(char);
        const input = document.getElementById(`sub-input-${char}`);
        if (input) input.focus();
      });
      charEl.setAttribute('data-cipher', char);
      cipherBox.appendChild(charEl);
    }
  }
}

function highlightCipherLetter(cipherChar) {
  // Highlight all occurrences in decoded text
  const chars = document.querySelectorAll('.sub-char');
  chars.forEach(el => {
    if (el.getAttribute('data-cipher') === cipherChar) {
      el.classList.add('letter-highlight');
    } else {
      el.classList.remove('letter-highlight');
    }
  });
  
  // Also highlight the key table border briefly
  const inputs = document.querySelectorAll('.sub-cell');
  inputs.forEach(el => {
    const labelEl = el.querySelector('.sub-cell-label');
    if (labelEl && labelEl.textContent === cipherChar) {
      el.style.borderColor = 'var(--terminal-amber)';
    } else {
      // Restore default
      const isPrefilled = el.classList.contains('prefilled');
      el.style.borderColor = isPrefilled ? 'var(--terminal-green)' : 'var(--border-color)';
    }
  });
}

function checkLevel2() {
  const correctAnswers = {
    'U': 'P', 'Y': 'A', 'K': 'R', 'V': 'N', 'G': 'V', 'M': 'L', 'D': 'C'
  };
  let isCorrect = true;
  for (let key in correctAnswers) {
    if ((l2PlayerMap[key] || '').toUpperCase() !== correctAnswers[key]) {
      isCorrect = false;
      break;
    }
  }
  
  if (isCorrect) {
    flashWorkspace('success');
    setTerminalStatus('DECODED SUCCESS', 'success');
    
    const cipherBox = document.getElementById('l2-ciphertext');
    cipherBox.className = "cipher-text decoded-text";
    cipherBox.textContent = l2Plaintext;
    
    showContinue(true);
  } else {
    flashWorkspace('error');
    setTerminalStatus('DECRYPTION FAILURE: CONTRADICTIONS DETECTED', 'error');
  }
}

// ==========================================================
// LEVEL 3 — ENIGMA ROTORS
// ==========================================================
const l3RotorCombos = [
  { combo: 'A-B-C', pos: [0, 1, 2] },
  { combo: 'T-U-R', pos: [19, 20, 17] }, // Correct setting
  { combo: 'M-C-K', pos: [12, 2, 10] },
  { combo: 'W-E-T', pos: [22, 4, 19] }
];
let selectedComboIdx = null;

function initLevel3() {
  selectedComboIdx = null;
  document.querySelectorAll('.choice-card').forEach(el => el.classList.remove('selected'));
  
  // Populate rotor strips with letters A-Z (duplicated to loop cleanly)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const rotorStrips = [
    document.getElementById('rotor-strip-1'),
    document.getElementById('rotor-strip-2'),
    document.getElementById('rotor-strip-3')
  ];
  
  rotorStrips.forEach(strip => {
    strip.innerHTML = "";
    // We add letter sequence with padding letters at front and back for view centering
    const padded = "Z" + alphabet + "A";
    for (let i = 0; i < padded.length; i++) {
      const letterDiv = document.createElement('div');
      letterDiv.className = 'rotor-letter';
      letterDiv.textContent = padded[i];
      strip.appendChild(letterDiv);
    }
    // Center on A by default (A is index 1 of padded string, corresponding to top = -40px)
    strip.style.top = '-40px';
  });

  // Draw initial static wiring diagram
  drawWiringSignal(false);
}

function selectRotorCombo(idx) {
  if (document.getElementById('continue-row').style.display === 'flex') return; // disabled
  
  selectedComboIdx = idx;
  
  // Highlight selection
  document.querySelectorAll('.choice-card').forEach((el, index) => {
    if (index === idx) el.classList.add('selected');
    else el.classList.remove('selected');
  });
  
  // Spin rotors to target combination letters
  const combo = l3RotorCombos[idx];
  const rotorStrips = [
    document.getElementById('rotor-strip-1'),
    document.getElementById('rotor-strip-2'),
    document.getElementById('rotor-strip-3')
  ];
  
  rotorStrips.forEach((strip, rotorIdx) => {
    const letterPos = combo.pos[rotorIdx];
    // Centering math: each letter is 40px high. 
    // Padded index of letterPos is letterPos + 1.
    // To center it, top should be - (letterPos * 40).
    const targetTop = -(letterPos * 40);
    strip.style.top = `${targetTop}px`;
    
    // Highlight letter
    const letters = strip.querySelectorAll('.rotor-letter');
    letters.forEach((letDiv, lIdx) => {
      if (lIdx === letterPos + 1) {
        letDiv.classList.add('selected');
      } else {
        letDiv.classList.remove('selected');
      }
    });
  });
}

function drawWiringSignal(isActive) {
  const svg = document.getElementById('rotor-signal-svg');
  svg.innerHTML = "";
  
  // Let's create beautiful curved electric wiring path representing letters flowing
  // Path goes from input (left) -> Rotor 1 -> Rotor 2 -> Rotor 3 -> Reflector (right) -> and back.
  const path1 = "M 20,45 C 80,45 100,20 150,20";
  const path2 = "M 150,20 C 180,20 200,65 250,65";
  const path3 = "M 250,65 C 280,65 310,30 370,30";
  const path4 = "M 370,30 C 430,30 450,15 480,45 C 450,75 430,60 370,60";
  const path5 = "M 370,60 C 310,60 280,15 250,15";
  const path6 = "M 250,15 C 200,15 180,75 150,75";
  const path7 = "M 150,75 C 100,75 80,45 20,45";
  
  const combinedPath = `${path1} ${path2} ${path3} ${path4} ${path5} ${path6} ${path7}`;
  
  svg.innerHTML = `
    <path d="${combinedPath}" class="wire-path ${isActive ? 'active' : ''}" />
    <!-- Key Lamp Indicators -->
    <circle cx="20" cy="45" r="5" fill="${isActive ? 'var(--terminal-green)' : 'var(--border-color)'}" />
    <circle cx="480" cy="45" r="5" fill="${isActive ? 'var(--terminal-amber)' : 'var(--border-color)'}" />
  `;
}

function checkLevel3() {
  if (selectedComboIdx === null) {
    setTerminalStatus('SELECT ROTOR COMBINATION FIRST', 'error');
    flashWorkspace('error');
    return;
  }
  
  if (selectedComboIdx === 1) { // T-U-R is correct
    // Activate wiring animation
    drawWiringSignal(true);
    setTerminalStatus('DECODING PATHWAYS...');
    
    setTimeout(() => {
      flashWorkspace('success');
      setTerminalStatus('DECODED SUCCESS', 'success');
      
      const cipherBox = document.getElementById('l3-ciphertext');
      cipherBox.textContent = "ENIGMA KEY IS T-U-R";
      cipherBox.classList.add('decoded-text');
      
      showContinue(true);
    }, 1500);
  } else {
    // Run failed animation
    drawWiringSignal(true);
    document.querySelector('.wire-path').style.stroke = 'var(--terminal-red)';
    setTerminalStatus('MISALIGNED COUPLING: PATHWAYS CLASH', 'error');
    
    setTimeout(() => {
      flashWorkspace('error');
      drawWiringSignal(false);
    }, 1200);
  }
}

// ==========================================================
// LEVEL 4 — CRIB DRAGGING
// ==========================================================
const l4Crib = "WETTER";
let l4Ciphertext = "";
let l4CorrectPos = 6;
let l4CurrentPos = 0;

// Drag state
let isDragging = false;
let dragStartX = 0;
let sliderStartLeft = 0;

function initLevel4() {
  // Programmatically generate ciphertext satisfying constraints (Exactly one position is clash-free, which is 6)
  l4Ciphertext = generateCribLevelCiphertext();
  
  // Build ciphertext blocks in UI
  const stripRow = document.getElementById('l4-ciphertext-strip');
  stripRow.innerHTML = "";
  for (let i = 0; i < l4Ciphertext.length; i++) {
    const block = document.createElement('div');
    block.className = 'cipher-char-block';
    block.textContent = l4Ciphertext[i];
    block.id = `l4-cipher-${i}`;
    stripRow.appendChild(block);
  }
  
  l4CurrentPos = 0;
  updateCribSliderPosition();
  setupCribDragEvents();
}

function generateCribLevelCiphertext() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 16;
  
  while (true) {
    let candidate = [];
    for (let i = 0; i < length; i++) {
      candidate.push(alphabet[Math.floor(Math.random() * 26)]);
    }
    
    // 1. Force target position (6) to have absolutely NO clashes
    for (let j = 0; j < l4Crib.length; j++) {
      if (candidate[l4CorrectPos + j] === l4Crib[j]) {
        const possible = alphabet.replace(l4Crib[j], "");
        candidate[l4CorrectPos + j] = possible[Math.floor(Math.random() * possible.length)];
      }
    }
    
    // 2. Verify: Ensure all other positions 0..10 (excluding 6) have AT LEAST one clash
    let isValid = true;
    for (let start = 0; start <= length - l4Crib.length; start++) {
      if (start === l4CorrectPos) continue;
      
      let hasClash = false;
      for (let j = 0; j < l4Crib.length; j++) {
        if (candidate[start + j] === l4Crib[j]) {
          hasClash = true;
          break;
        }
      }
      
      if (!hasClash) {
        isValid = false; // Found another valid alignment! Reject this candidate.
        break;
      }
    }
    
    if (isValid) {
      return candidate.join("");
    }
  }
}

function getCribLetterWidth() {
  const blocks = document.querySelectorAll('.cipher-char-block');
  if (blocks.length > 1) {
    const rect0 = blocks[0].getBoundingClientRect();
    const rect1 = blocks[1].getBoundingClientRect();
    return rect1.left - rect0.left;
  }
  return 41.3; // fallback
}

function setupCribDragEvents() {
  const slider = document.getElementById('l4-crib-slider');
  const track = document.getElementById('l4-drag-track');
  const container = document.getElementById('l4-crib-container');
  let containerLeft = 0;
  
  // Click on track to jump
  track.addEventListener('click', (e) => {
    if (e.target.closest('#l4-crib-slider')) return; // ignore clicks on slider itself
    const trackRect = track.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    
    // Compute letter width dynamically
    const letterWidth = getCribLetterWidth();
    const targetIndex = Math.round((clickX - 40) / letterWidth); // offset for track paddings
    const clampedIndex = Math.max(0, Math.min(10, targetIndex));
    
    l4CurrentPos = clampedIndex;
    updateCribSliderPosition();
  });

  // Mouse drag handlers
  slider.addEventListener('mousedown', (e) => {
    if (document.getElementById('continue-row').style.display === 'flex') return;
    isDragging = true;
    dragStartX = e.clientX;
    sliderStartLeft = slider.offsetLeft;
    slider.style.transition = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const newLeft = sliderStartLeft + deltaX;
    
    // Constrain slider inside track bounds
    const letterWidth = getCribLetterWidth();
    const maxLeft = 10 * letterWidth;
    const clampedLeft = Math.max(0, Math.min(maxLeft, newLeft));
    
    slider.style.left = `${clampedLeft}px`;
    
    // Update current position index real time
    const currentIdx = Math.round(clampedLeft / letterWidth);
    l4CurrentPos = currentIdx;
    
    document.getElementById('crib-position-txt').textContent = l4CurrentPos;
    validateCribClashesRealtime();
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    slider.style.transition = 'left 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Snap to nearest position
    updateCribSliderPosition();
  });

  // Touch events for mobile support
  slider.addEventListener('touchstart', (e) => {
    if (document.getElementById('continue-row').style.display === 'flex') return;
    isDragging = true;
    containerLeft = container.getBoundingClientRect().left;
    dragStartX = e.touches[0].clientX;
    sliderStartLeft = slider.offsetLeft;
    slider.style.transition = 'none';
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const letterWidth = getCribLetterWidth();
    const maxLeft = 10 * letterWidth;
    
    const cribSliderWidth = slider.offsetWidth;
    const rawLeft = e.touches[0].clientX - containerLeft - (cribSliderWidth / 2);
    const clampedLeft = Math.max(0, Math.min(maxLeft, rawLeft));
    
    slider.style.left = `${clampedLeft}px`;
    
    const currentIdx = Math.round(clampedLeft / letterWidth);
    l4CurrentPos = currentIdx;
    
    document.getElementById('crib-position-txt').textContent = l4CurrentPos;
    validateCribClashesRealtime();
  });

  window.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    slider.style.transition = 'left 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    updateCribSliderPosition();
  });
}

function moveCrib(dir) {
  if (document.getElementById('continue-row').style.display === 'flex') return;
  l4CurrentPos = Math.max(0, Math.min(10, l4CurrentPos + dir));
  updateCribSliderPosition();
}

function updateCribSliderPosition() {
  const slider = document.getElementById('l4-crib-slider');
  const letterWidth = getCribLetterWidth(); // matches the grid columns + gap width
  slider.style.left = `${l4CurrentPos * letterWidth}px`;
  
  document.getElementById('crib-position-txt').textContent = l4CurrentPos;
  validateCribClashesRealtime();
}

function validateCribClashesRealtime() {
  const slider = document.getElementById('l4-crib-slider');
  const statusTxt = document.getElementById('crib-status-txt');
  
  // Reset blocks highlight
  document.querySelectorAll('.cipher-char-block').forEach(el => el.classList.remove('colliding'));
  const cribBlocks = slider.querySelectorAll('.crib-char-block');
  cribBlocks.forEach(el => el.classList.remove('colliding'));

  let clashCount = 0;
  for (let j = 0; j < l4Crib.length; j++) {
    const cipherLetter = l4Ciphertext[l4CurrentPos + j];
    if (cipherLetter === l4Crib[j]) {
      clashCount++;
      // Highlight collision elements
      document.getElementById(`l4-cipher-${l4CurrentPos + j}`).classList.add('colliding');
      cribBlocks[j].classList.add('colliding');
    }
  }

  if (clashCount > 0) {
    slider.className = "crib-slider clash";
    statusTxt.textContent = `CONTRADICTION DETECTED (${clashCount} CLASHES)`;
    statusTxt.className = "crib-status-tag status-clash";
  } else {
    slider.className = "crib-slider valid";
    statusTxt.textContent = "VALID ALIGNMENT (0 CLASHES)";
    statusTxt.className = "crib-status-tag status-valid";
  }
}

function checkLevel4() {
  if (l4CurrentPos === l4CorrectPos) {
    flashWorkspace('success');
    setTerminalStatus('DECODED SUCCESS', 'success');
    
    // Show correct plaintext inside the ciphertext slots
    const stripRow = document.getElementById('l4-ciphertext-strip');
    const blocks = stripRow.querySelectorAll('.cipher-char-block');
    for (let j = 0; j < l4Crib.length; j++) {
      const block = blocks[l4CorrectPos + j];
      block.textContent = l4Crib[j];
      block.style.color = 'var(--terminal-green)';
      block.style.borderColor = 'var(--terminal-green)';
    }
    
    showContinue(true);
  } else {
    flashWorkspace('error');
    setTerminalStatus('DECRYPTION FAILURE: LOGICAL CONTRADICTION AT ALIGNMENT', 'error');
  }
}

// ==========================================================
// LEVEL 5 — THE BOMBE
// ==========================================================
// Letter values for each drum: T U R I N G (Index 0 to 5)
let l5Dials = ['A', 'A', 'A', 'A', 'A', 'A'];
const l5Solution = ['T', 'U', 'R', 'I', 'N', 'G'];

function initLevel5() {
  l5Dials = ['A', 'A', 'A', 'A', 'A', 'A'];
  for (let i = 0; i < 6; i++) {
    document.getElementById(`bombe-dial-${i}`).textContent = l5Dials[i];
  }
  document.getElementById('l5-message-display').innerHTML = `THE FATHER OF CS: _ _ _ _ _ _`;
  validateBombeConstraints();
}

function spinBombeDial(idx, dir) {
  if (document.getElementById('continue-row').style.display === 'flex') return;
  
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const curChar = l5Dials[idx];
  const curIdx = alphabet.indexOf(curChar);
  const nextIdx = (curIdx + dir + 26) % 26;
  l5Dials[idx] = alphabet[nextIdx];
  
  document.getElementById(`bombe-dial-${idx}`).textContent = l5Dials[idx];
  
  // Update decoded message blanks display
  const wordGuess = l5Dials.join("");
  document.getElementById('l5-message-display').innerHTML = `THE FATHER OF CS: <strong style="color:var(--terminal-amber)">${wordGuess}</strong>`;
  
  validateBombeConstraints();
}

function validateBombeConstraints() {
  const d = l5Dials;
  
  // Constraint 1: Drums 2 & 4 contain U and I respectively
  const c1 = (d[1] === 'U' && d[3] === 'I');
  
  // Constraint 2: Drum 1 immediately before Drum 2 alphabetically (D1 = D2 - 1)
  const code1 = d[0].charCodeAt(0);
  const code2 = d[1].charCodeAt(0);
  const c2 = (code1 === code2 - 1);
  
  // Constraint 3: Q < D3 < S (i.e. D3 must be R)
  const c3 = (d[2] > 'Q' && d[2] < 'S');
  
  // Constraint 4: D5 === N
  const c4 = (d[4] === 'N');
  
  // Constraint 5: D6 === G
  const c5 = (d[5] === 'G');
  
  // Constraint 6: No duplicate letter in pathway
  const uniqueDials = new Set(d);
  const c6 = (uniqueDials.size === 6);

  const constraints = [c1, c2, c3, c4, c5, c6];
  let allSatisfied = true;
  
  constraints.forEach((satisfied, idx) => {
    const item = document.getElementById(`const-${idx}`);
    const led = item.querySelector('.constraint-led');
    if (satisfied) {
      item.classList.add('active');
      led.classList.add('active');
    } else {
      item.classList.remove('active');
      led.classList.remove('active');
      allSatisfied = false;
    }
  });
  
  return allSatisfied;
}

function checkLevel5() {
  const allDone = validateBombeConstraints();
  
  if (allDone && l5Dials.join("") === "TURING") {
    flashWorkspace('success');
    setTerminalStatus('BOMBE CALIBRATION STABLE', 'success');
    
    const disp = document.getElementById('l5-message-display');
    disp.innerHTML = `THE FATHER OF CS: <strong style="color:var(--terminal-green)">TURING</strong>`;
    disp.classList.add('decoded-text');
    
    showContinue(true);
  } else {
    flashWorkspace('error');
    setTerminalStatus('BOMBE CIRCUIT ABORTED: VOLTAGE FLUCUATIONS DETECTED', 'error');
  }
}

// ==========================================================
// END CUTSCENE
// ==========================================================
function startEndCutscene() {
  const overlay = document.getElementById('cutscene-overlay');
  overlay.classList.add('active');
  
  endNarrativeIdx = 0;
  showNextCutsceneSlide();
}

function showNextCutsceneSlide() {
  if (endNarrativeIdx < endNarrativeSlides.length) {
    const textContent = endNarrativeSlides[endNarrativeIdx];
    const textContainer = document.getElementById('cutscene-text-content');
    
    // Reset and run typewriter
    textContainer.innerHTML = "";
    let index = 0;
    
    if (typedTextTimeout) clearTimeout(typedTextTimeout);
    
    function type() {
      if (index < textContent.length) {
        textContainer.textContent += textContent.charAt(index);
        index++;
        typedTextTimeout = setTimeout(type, typeSpeed);
      } else {
        // Finished typing this slide
        const cursor = document.createElement('span');
        cursor.className = 'narrative-cursor';
        textContainer.appendChild(cursor);
      }
    }
    type();
    
    // Update button text
    const btn = document.getElementById('cutscene-btn-primary');
    if (endNarrativeIdx === endNarrativeSlides.length - 1) {
      btn.textContent = "Complete";
    } else {
      btn.textContent = "Proceed";
    }
  } else {
    // Cutscene finished!
    showFinalCredits();
  }
}

function handleCutsceneNext() {
  // If still typing, skip typewriter to end of slide
  const textContent = endNarrativeSlides[endNarrativeIdx];
  const textContainer = document.getElementById('cutscene-text-content');
  const textLenWithoutCursor = textContainer.textContent.replace(/\s/g, '').length;
  const originalLenWithoutCursor = textContent.replace(/\s/g, '').length;
  
  if (textLenWithoutCursor < originalLenWithoutCursor) {
    // Skip typing
    if (typedTextTimeout) clearTimeout(typedTextTimeout);
    textContainer.textContent = textContent;
    const cursor = document.createElement('span');
    cursor.className = 'narrative-cursor';
    textContainer.appendChild(cursor);
  } else {
    // Go to next slide
    endNarrativeIdx++;
    if (endNarrativeIdx < endNarrativeSlides.length) {
      showNextCutsceneSlide();
    } else {
      showFinalCredits();
    }
  }
}

function showFinalCredits() {
  const folder = document.querySelector('.cutscene-folder');
  folder.innerHTML = `
    <div class="cutscene-stamp" style="color:#00ff88; border-color:#00ff88;">TRANSMISSION END</div>
    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: #2c241a;">THE IMITATION GAME</h2>
    <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; text-align: left;">
      You have successfully completed Bletchley Park decryption. You configured ciphers, cracked substitution tables, aligned rotors, dragged weather report cribs, and calibrated the Bombe.
    </p>
    <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; text-align: left; font-weight: bold;">
      This game stands as an ode to Alan Turing (1912–1954), whose logic laid the foundation for modern computer science and saved millions of lives in World War II.
    </p>
    
    <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: center; border-top: 1px solid rgba(44,36,26,0.2); padding-top: 1.5rem;">
      <button class="cutscene-btn" onclick="restartGame()">Play Again</button>
      <button class="cutscene-btn btn-share" onclick="shareGame()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle;">
          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
        </svg>
        Share Result
      </button>
    </div>
  `;
}

function shareGame() {
  const url = window.location.href;
  const text = `Just played 'The Imitation Game' — a browser puzzle about Alan Turing. Try it: ${url} #DEVChallenge`;
  
  // Copy to clipboard fallback
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied! Share anywhere.");
  }).catch(err => {
    // Fallback alert
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  });
}

function restartGame() {
  // Reload page to reset all states cleanly
  window.location.reload();
}

const levelHints = {
  1: "The shift value is a single digit. Think: how many letters forward does A need to move to become E?",
  2: "The letter X appears 5 times — it maps to E, the most common letter in English. Q appears 3 times and maps to T.",
  3: "The correct rotor setting spells out the first three letters of a significant word in cryptography history.",
  4: "Drag the crib all the way to position 6. Remember: Enigma can never encrypt a letter to itself.",
  5: "The six letters spell the surname of the man who built the Bombe. Start with T."
};

const levelAnswers = {
  1: "The shift is 3. Set SHIFT to 3 and click DECODE. Decoded: BLETCHLEY PARK",
  2: "Full key: X=E, Q=T, J=S, U=P, Y=A, K=R, V=N, G=V, M=L, D=C. Decoded: PATTERNS REVEAL SECRETS",
  3: "Select T-U-R. It spells TUR- from TURING.",
  4: "Slide the crib to position 6. That is the only position with zero letter clashes.",
  5: "Set dials to T, U, R, I, N, G in order (D1 through D6). The answer is TURING."
};

function showHint() {
  const hintBox = document.getElementById('hint-box');
  document.getElementById('hint-text').textContent = levelHints[currentLevel] || "No hint available.";
  hintBox.style.display = 'flex';
  hintBox.style.borderColor = 'var(--terminal-amber)';
  document.getElementById('hint-text').style.color = 'var(--terminal-amber)';
}

function revealAnswer() {
  const hintBox = document.getElementById('hint-box');
  document.getElementById('hint-text').textContent = "ANSWER: " + (levelAnswers[currentLevel] || "No answer available.");
  hintBox.style.display = 'flex';
  hintBox.style.borderColor = 'var(--terminal-red)';
  document.getElementById('hint-text').style.color = 'var(--terminal-red)';
}

function closeHint() {
  document.getElementById('hint-box').style.display = 'none';
}
