let context;
let master;
let level = .85;

export function setVolume(value) {
  level = Math.min(1, Math.max(0, value));
  if (master) master.gain.setTargetAtTime(level, context.currentTime, .02);
}

export function unlockSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (!context) {
    context = new Audio();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 9;
    limiter.attack.value = .003;
    master = context.createGain();
    master.gain.value = level;
    master.connect(limiter).connect(context.destination);
  }
  if (context.state === 'suspended') return context.resume().catch(() => {});
}

// Pitch, start offset, duration, peak gain, wave, optional ending pitch.
const cues = {
  hit: [[784,0,.25,.42,'sine'],[1174.66,.01,.19,.20,'triangle'],[1568,.075,.37,.34,'sine'],[2093,.075,.29,.12,'triangle']],
  miss: [[129,0,.42,.32,'sawtooth',91],[162,0,.38,.23,'square',110],[62,0,.45,.32,'sine',45]],
  award: [[349,0,.21,.38,'triangle'],[466,.12,.23,.35,'triangle'],[587,.24,.25,.35,'triangle'],[698,.36,.48,.38,'triangle'],[932,.36,.48,.30,'sine'],[1175,.36,.53,.26,'sine']],
  round: [[262,0,.18,.34,'triangle'],[392,.10,.21,.30,'triangle'],[523,.22,.32,.32,'triangle'],[784,.22,.27,.23,'sine']],
};

export async function sound(effect) {
  if (!level || !cues[effect]) return;
  const resume = unlockSound();
  if (resume) await resume;
  if (context?.state !== 'running' || !level) return;
  const now = context.currentTime;
  for (const [pitch, offset, length, peak, type, endPitch] of cues[effect]) {
    const start = now + offset;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(pitch, start);
    if (endPitch) oscillator.frequency.exponentialRampToValueAtTime(endPitch, start + length);
    envelope.gain.setValueAtTime(.001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + .012);
    if (effect === 'miss') envelope.gain.setValueAtTime(peak, start + length - .08);
    envelope.gain.exponentialRampToValueAtTime(.001, start + length);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + length);
  }
}
