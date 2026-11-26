let context;
export function unlockSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  context ||= new Audio();
  if (context.state === 'suspended') context.resume().catch(() => {});
}
const cues = {
  hit: [[659,0,.13],[880,.075,.15],[1175,.15,.25]],
  miss: [[164,0,.24,'sawtooth'],[110,.1,.31,'sawtooth']],
  award: [[392,0,.16],[523,.09,.17],[659,.18,.2],[784,.28,.26],[1047,.37,.4]],
  round: [[330,0,.12],[440,.12,.12],[587,.24,.23]],
};
export function sound(effect) {
  if (context?.state !== 'running' || !cues[effect]) return;
  for (const [pitch, offset, length, type = 'triangle'] of cues[effect]) {
    const start = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = pitch;
    volume.gain.setValueAtTime(.001, start);
    volume.gain.exponentialRampToValueAtTime(type === 'sawtooth' ? .07 : .14, start + .018);
    volume.gain.exponentialRampToValueAtTime(.001, start + length);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + length);
  }
}
