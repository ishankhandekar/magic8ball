window.addEventListener("DOMContentLoaded", () => {
 soundToggle.checked = true;
  soundEffectToggle.checked = true;
  themeSelect.value = "purple";

  // 2. Fire the events to trigger the logic you've already written
  soundToggle.dispatchEvent(new Event('change'));
  soundEffectToggle.dispatchEvent(new Event('change'));
  themeSelect.dispatchEvent(new Event('change'));
  }
); 

const AppState = {
  IDLE: 'IDLE',
  VALIDATING: 'VALIDATING',
  STIRRING: 'STIRRING',
  REVEALING: 'REVEALING'
};

let currentState = AppState.IDLE;

let buttonState = 1;

window.addEventListener("load", () => {
  const container = document.getElementById("pageLoadContainer");
  container.classList.add("show");
});
const revealSound = document.getElementById("reveal");
const clickSound = document.getElementById("press");
const errorSound = document.getElementById("error");
const resetSound = document.getElementById("reset");
const audio = document.getElementById("ambient");


audio.loop = true;
audio.volume = 0.5;

let started = false;

async function startAudio() {   
  if (started) return;
  started = true;

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch (e) {
    started = false; // allow retry if it failed
    console.log("Audio failed:", e);
  }
}

window.addEventListener("click", startAudio, { once: true });

const loadScreen = document.getElementById("loadInScreen");

window.addEventListener("click", () => {
  loadScreen.classList.add("fade-out");
});

const orb = document.querySelector(".orb");

let energy = 0;
let lastX = 0;
let lastY = 0;

let locked = false;

function updateFill() {
  orb.style.setProperty("--fill", energy + "%");
}

// hover turbulence input
orb.addEventListener("mousemove", (e) => {
  if (currentState !== AppState.STIRRING) return; 
  if (locked) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  const speed = Math.sqrt(dx * dx + dy * dy);

  const fillFactor = energy / 100;

// harder at start, easier later

const sensitivity = 0.2 + fillFactor * 1;

energy += speed * 0.05 * sensitivity;

  // clamp just below full so we control the snap
  if (energy >= 98) {
    snapToFull();
    return;
  }

  energy = Math.min(98, energy);

  lastX = e.clientX;
  lastY = e.clientY;

  updateFill();
});

// 🧲 SNAP + LOCK
function snapToFull() {
  energy = 100;
  updateFill();

  locked = true;

  orb.classList.add("full");

  if (currentState === AppState.STIRRING) {
    triggerReveal(); 
  }
  // optional “click” feel re-trigger (visual pop)
  orb.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.05)" },
      { transform: "scale(1)" }
    ],
    {
      duration: 250,
      easing: "ease-out"
    }
  );
}

// slow decay only if NOT locked
function decay() {
  if (!locked) {
    energy *= 0.99;
    if (energy < 0.05) energy = 0;
        updateFill();
    }

  requestAnimationFrame(decay);
}

decay();







 


document.getElementById("askBtn").addEventListener("click", () => {
  
  if (buttonState === 1) {
    handleAskClick(document.getElementById("question").value);
  } else {
    console.log("im here");
    resetOrb();
    resetSound.currentTime = 0;
  resetSound.play().catch(() => {});
  }
});

document.addEventListener('keydown', (e) => {
  console.log("key was pressed");
  if (e.key === 'Enter' && buttonState === 1) {
            handleAskClick(document.getElementById("question").value.trim());
        } else if (e.key === 'r' && buttonState === 0) {
            resetOrb();
        }
 });

async function handleAskClick(question) {
  if (currentState !== AppState.IDLE) return; // Prevent double-clicks

  
  
  // STEP 1: VALIDATE
  currentState = AppState.VALIDATING;
  console.log("Validating...");

  if (isValid(question) !== 0) {
    handleInvalid(isValid(question)); // Call your "Invalid" function
    return;
  }

  // STEP 2: START STIRRING
  currentState = AppState.STIRRING;
  promptHeader.innerText = "Stir the surface of the orb...";
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
  swapText();
  document.getElementById("question").readOnly = true;
  document.getElementById("question").classList.add("disabled");
document.getElementById("btnIcon").innerText = "settings_backup_restore";
buttonState = 0;
  // We wait for your mousemove logic to set 'locked = true' 
  // Once 'locked' is true in your existing code, we trigger the reveal
}

function isValid(input) {
  const text = input.trim().toLowerCase();
  
  // 1. BLANK CHECK
  if (!text) return "2";

  // 2. GIBBERISH / REPEATED CHARS
  // /(.)\1{2,}/ matches 3 in a row. Let's block 4+ to allow words like 'bee' but block 'aaaaa'
  if (/(.)\1{3,}/.test(text)) return 1;

  // 3. CLEANING & WORD COUNT
  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  // Block if it's less than 3 words (e.g., "Is it" is too short, "Is it raining" is good)
  if (words.length < 3) return 1;

  // 4. SYMBOL/NUMBER CHECK
  // If the question is mostly numbers or symbols, it's garbage
  const alphaOnly = text.replace(/[^a-z]/g, '');
  if (alphaOnly.length < text.length * 0.5) return 1;

  // 5. VOWEL CHECK (Detects "hshshs" or "pfft")
  const hasVowels = /[aeiouy]/.test(text);
  if (!hasVowels) return 1;

  // 6. STRICT YES/NO STARTERS
  // Added "Was, Were, May, Shall" and cleaned up contractions
  const yesNoStarters = [
    "is", "can", "will", "do", "should", "am", "are", "does", "could", "would", 
    "was", "were", "may", "shall", "must", "isn't", "can't", "won't", "don't", "shouldn't", "did"
  ];
  
  // Remove punctuation from the first word before checking (e.g. "Is," -> "is")
  const firstWord = words[0].replace(/[^a-z]/g, '');
  
  if (!yesNoStarters.includes(firstWord)) return 3;

  return 0; // Valid!
}



// Function to handle the "Scolding"
async function handleInvalid(code) {
  
  let message = "";

  // 1. Decide the message based on the code
  if (code === "2") {
    // Blank Check
    const options = [
      "The Orb requires a written question.", 
      "You must speak for the Orb to listen.", 
      "Silence provides no answers. Type your query."
    ];
    message = options[Math.floor(Math.random() * options.length)];
} 
else if (code === 1) {
    // Gibberish / Too Short / Repeated
    const options = [
      "That is not a valid question. Try again.", 
      "The spirits do not understand that gibberish.", 
      "Use real words to consult the Orb."
    ];
    message = options[Math.floor(Math.random() * options.length)];
} 
else if (code === 3) {
    // Not a Yes/No question
    const options = [
      "Ask a question that can be answered with Yes or No.", 
      "The Orb only answers Yes or No questions.", 
      "Rephrase your query for a Yes or No response."
    ];
    message = options[Math.floor(Math.random() * options.length)];
}

  // 2. Visual Sequence
  currentState = AppState.VALIDATING;
  promptHeader.innerText = message;
  swapText();
  orb.classList.add("orb-error");
  errorSound.currentTime = 0;
  errorSound.play().catch(() => {});
  // 3. The 3-second wait
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 4. Cleanup
  orb.classList.remove("orb-error");
  currentState = AppState.IDLE;
  swapText(); 
}


function resetOrb() {
  // 1. Reset the logic
  
  locked = false;
  currentState = AppState.IDLE;

  // 2. Reset the visuals
  updateFill(); // Goes back to 0%
  orb.classList.remove("full");
  
  // 3. Clear the text
  const textElement = document.getElementById("mainHeader");
  textElement.classList.remove("fade-in-blur");
  textElement.innerText = "Consult the Orb"; 
  swapText();
  
  // 4. Show the input bar again
  document.getElementById("question").classList.remove("disabled");
  document.getElementById("question").value = "";
  document.getElementById("question").readOnly = false;
  document.getElementById("btnIcon").innerText = "change_history";
  document.querySelector(".orb").classList.remove("revealed");
  buttonState = 1;
}

function swapText() {
  const main = document.getElementById('mainHeader');
  const prompt = document.getElementById('promptHeader');

  // Check the current state of one to determine the swap
  const isMainVisible = window.getComputedStyle(main).opacity === "1";

  if (isMainVisible) {
    // Fade main out, fade prompt in
    main.style.opacity = "0";
    main.style.pointerEvents = "none";
    
    prompt.style.opacity = "1";
    prompt.style.pointerEvents = "auto";
  } else {
    // Fade prompt out, fade main in
    main.style.opacity = "1";
    main.style.pointerEvents = "auto";
    
    prompt.style.opacity = "0";
    prompt.style.pointerEvents = "none";
  }
}



async function triggerReveal() {
  currentState = AppState.REVEALING;

  // 1. Pick a random answer
  const answers = [
    "IT IS CERTAIN", "THE ORB SEES IT", "WITHOUT A DOUBT", "DEFINITELY SO",
     "AS I SEE IT, YES", "MOST LIKELY", 
    "YES", "SIGNS POINT TO YES", "REPLY HAZY, TRY AGAIN", "ASK AGAIN LATER",
    "BETTER NOT TELL YOU NOW", "CANNOT PREDICT NOW", "CONCENTRATE AND ASK AGAIN",
    "DON'T COUNT ON IT", "MY REPLY IS NO", "MY SOURCES SAY NO",
    "VERY DOUBTFUL"
  ];
  
  const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
  
  
  // 2. Set the text before the animation starts
  const textElement = document.querySelector(".answer-text");
  textElement.innerText = randomAnswer;

  // 3. Wait for the suspense
  await new Promise(r => setTimeout(r, 1500)); 
  
 
   
  orb.classList.add("revealed"); // Fades in the text via CSS

  revealSound.currentTime = 0;
  revealSound.play().catch(() => {});

  await new Promise(r => setTimeout(r, 1500)); 

  promptHeader.innerText = "Tap to reset...";
 
}

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const settingsOverlay = document.getElementById("settingsOverlay");

function openSettings() {
  settingsPanel.classList.add("open");
  settingsOverlay.classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeSettingsPanel() {
  settingsPanel.classList.remove("open");
  settingsOverlay.classList.remove("visible");
  document.body.style.overflow = "";
}

settingsBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsPanel);
settingsOverlay.addEventListener("click", closeSettingsPanel);

const soundToggle = document.getElementById("soundToggle");
const soundEffectToggle = document.getElementById("soundEffectToggle");
const themeSelect = document.getElementById("themeSelect");

soundToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    startAudio();
  } else {
    audio.pause();
    started = false;
  }
  localStorage.setItem("orb-sound", e.target.checked);
});

soundEffectToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    [revealSound, clickSound, errorSound, resetSound].forEach(s => {
  s.muted = false;
});
  } else {
    [revealSound, clickSound, errorSound, resetSound].forEach(s => {
  s.muted = true;
});
  }
  localStorage.setItem("orb-sound-effect", e.target.checked);
});

themeSelect.addEventListener("change", (e) => {
  localStorage.setItem("orb-theme", e.target.value);
  applyTheme(e.target.value);
});

function applyTheme(theme) {
  orb.classList.remove("orb-error");
  
  if (theme === "purple") {
    document.body.classList.add("purple");
    document.body.classList.remove("green");
    document.documentElement.style.setProperty("--primary", "#8b5cf6");
    document.documentElement.style.setProperty("--orb-blue", "#8b5cf6");
  } else if (theme === "green") {
    document.body.classList.add("green");
    document.body.classList.remove("purple");
    
    document.documentElement.style.setProperty("--primary", "#34d399");
  document.documentElement.style.setProperty("--orb-blue", "#10b981");
  } else {
    document.body.classList.remove("green");
    document.body.classList.remove("purple");
    document.documentElement.style.setProperty("--primary", "#007bff");
    document.documentElement.style.setProperty("--orb-blue", "#3b82f6");
  }
}

