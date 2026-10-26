type AudioBufferLike = {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

export function encodePcmWav(audioBuffer: AudioBufferLike, targetSampleRate = 16_000) {
  const sourceRate = Math.max(1, audioBuffer.sampleRate);
  const sourceLength = audioBuffer.length;
  const targetLength = Math.max(1, Math.ceil(sourceLength * targetSampleRate / sourceRate));
  const buffer = new ArrayBuffer(44 + targetLength * 2);
  const view = new DataView(buffer);
  let offset = 0;
  const writeString = (value: string) => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset++, value.charCodeAt(index)); };
  const writeUint32 = (value: number) => { view.setUint32(offset, value, true); offset += 4; };
  const writeUint16 = (value: number) => { view.setUint16(offset, value, true); offset += 2; };

  writeString("RIFF"); writeUint32(36 + targetLength * 2); writeString("WAVE"); writeString("fmt ");
  writeUint32(16); writeUint16(1); writeUint16(1); writeUint32(targetSampleRate); writeUint32(targetSampleRate * 2);
  writeUint16(2); writeUint16(16); writeString("data"); writeUint32(targetLength * 2);

  const channels = Array.from({ length: Math.max(1, audioBuffer.numberOfChannels) }, (_, channel) => audioBuffer.getChannelData(channel));
  for (let frame = 0; frame < targetLength; frame += 1) {
    const sourcePosition = Math.min(sourceLength - 1, frame * sourceRate / targetSampleRate);
    const sourceFrame = Math.floor(Math.max(0, sourcePosition));
    const nextFrame = Math.min(sourceLength - 1, sourceFrame + 1);
    const fraction = sourcePosition - sourceFrame;
    const sample = channels.reduce((sum, channel) => sum + (channel[sourceFrame] * (1 - fraction) + channel[nextFrame] * fraction), 0) / channels.length;
    const clipped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true); offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}
