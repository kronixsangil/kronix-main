let context;
let master;
let level = .85;
let effectsBus;
let generation = 0;

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
function bus() {
  const gain = context.createGain();
  gain.connect(master);
  return gain;
}
export function stopEffects() {
  generation++;
  window.speechSynthesis?.cancel();
  if (effectsBus) {
    effectsBus.disconnect();
    effectsBus = null;
  }
}
const melody = (notes, spacing, duration, gain = .28) =>
  notes.flatMap((pitch, i) => pitch ? [[pitch,i*spacing,duration,gain,'triangle'],
    [pitch*2,i*spacing,duration*.72,gain*.42,'sine']] : []);
const cues = {
  'faceoff-miss': [[164,0,.24,.29,'sawtooth',110],[82,0,.27,.24,'sine',55]],
  buzz: [[230,0,.09,.28,'square',440],[620,.09,.17,.30,'triangle']],
  complete: melody([392,494,587,784,0,587,660,784,988,0,784,988,1175,1568],.23,.55),
  intro: melody([262,330,392,523,0,392,523,659,784,0,659,784,1047],.24,.46),
  suspense: melody([98,0,104,0,98,0,117,0,98,0,104,0,98,0,123,0,98,0,104,0,98,0,123],.41,.64,.34),
  'steal-miss': [[129,0,.48,.35,'sawtooth',80],[62,0,.49,.30,'sine',45]],
  hit: [[784,0,.25,.42,'sine'],[1174.66,.01,.19,.20,'triangle'],[1568,.075,.37,.34,'sine'],[2093,.075,.29,.12,'triangle']],
  miss: [[129,0,.42,.32,'sawtooth',91],[162,0,.38,.23,'square',110],[62,0,.45,.32,'sine',45]],
  award: [[349,0,.21,.38,'triangle'],[466,.12,.23,.35,'triangle'],[587,.24,.25,.35,'triangle'],[698,.36,.48,.38,'triangle'],[932,.36,.48,.30,'sine'],[1175,.36,.53,.26,'sine']],
  round: [[262,0,.18,.34,'triangle'],[392,.10,.21,.30,'triangle'],[523,.22,.32,.32,'triangle'],[784,.22,.27,.23,'sine']],
};

function crowd(effect, now) {
  const applause = effect === 'clap';
  const duration = applause ? 3 : 2.2;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const samples = buffer.getChannelData(0);
  const hands = Array.from({length:12}, () => [Math.random(), 3 + Math.random()*5]);
  const voices = Array.from({length:11}, () => [92 + Math.random()*145, Math.random()*6, Math.random()*6]);
  for (let i=0; i<samples.length; i++) {
    const t = i/sampleRate;
    const fade = Math.min(1,t*8,(duration-t)*2);
    if (applause) {
      const claps = hands.reduce((sum,[offset,speed]) => sum + Math.exp(-62*((t*speed+offset)%1)),0);
      samples[i] = (Math.random()*2-1)*claps*fade*.21;
    } else {
      const value = voices.reduce((sum,[pitch,phase,pulse]) => {
        const laugh = effect === 'laugh' ? Math.pow(Math.max(0,Math.sin(t*26+pulse)),1.5) : 1;
        const carrier = pitch*t*6.283 + Math.sin(t*3+pulse)*2 + phase;
        return sum + laugh*(Math.sin(carrier) + .55*Math.sin(carrier*2) + .24*Math.sin(carrier*(effect === 'ah' ? 5 : 3)));
      },0);
      samples[i] = value*fade*.047;
    }
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(effectsBus);
  source.start(now);
}
export async function sound(effect) {
  if (!level) return;
  const current = generation;
  const resume = unlockSound();
  if (resume) await resume;
  if (context?.state !== 'running' || !level || current !== generation) return;
  effectsBus ||= bus();
  const now = context.currentTime;
  if (['ah','boo','laugh','clap'].includes(effect)) {
    crowd(effect, now);
    return;
  }
  if (effect === 'ole') {
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const voice = new SpeechSynthesisUtterance('¡Olé, piiingo!');
      voice.lang = 'es-CO';
      voice.volume = level;
      window.speechSynthesis.speak(voice);
    } else crowd('ah', now);
    return;
  }
  for (const [pitch, offset, length, peak, type, endPitch] of cues[effect] ?? []) {
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
    oscillator.connect(envelope).connect(effectsBus);
    oscillator.start(start);
    oscillator.stop(start + length);
  }
}
