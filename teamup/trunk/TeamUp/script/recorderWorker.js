/* The MIT License (MIT)
 *
 * Copyright (c) 2013 Matt Diamond
 *               2014 Mp3 support with libmp3lame-js by Antti Keränen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

importScripts("libmp3lame.js");
var mp3codec;

var recLength = 0,
  recBuffersL = [],
  recBuffersR = [],
  recBuffersMono = [],
  sampleRate;

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
	  /*
	  mp3codec = Lame.init();
	  Lame.set_mode(mp3codec, Lame.MONO);
	  Lame.set_num_channels(mp3codec, 1);
	  Lame.set_out_samplerate(mp3codec, 44100);
	  Lame.set_bitrate(mp3codec, 64);
	  Lame.init_params(mp3codec);
	  */
      init(e.data.config);
      break;
    case 'record':
	  /*
	  var mp3data= Lame.encode_buffer_ieee_float(mp3codec, e.data.buffer[0], e.data.buffer[1]);
      recordMono(mp3data.data);
	  */
	  recordMono(e.data.buffer[0]);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'exportmp3':
      exportmp3(e.data.type);
      break;
	case 'finish':
	  /*
	  var mp3data = Lame.encode_flush(mp3codec);
	  record([mp3data.data, mp3data.data]);
	  Lame.close(mp3codec);
	  mp3codec=null;
	  */
	  break;
    case 'getBuffer':
      getBuffer();
      break;
	case 'getMonoBuffer':
	  getMonoBuffer();
	  break;
    case 'clear':
      clear();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
}

function record(inputBuffer){
  recBuffersL.push(inputBuffer[0]);
  recBuffersR.push(inputBuffer[1]);
  recLength += inputBuffer[0].length;
}

function recordMono(inputBuffer){
  recBuffersMono.push(inputBuffer);
  recLength += inputBuffer.length;
}

function exportWAV(type){
  var bufferL = mergeBuffers(recBuffersL, recLength);
  var bufferR = mergeBuffers(recBuffersR, recLength);
  var interleaved = interleave(bufferL, bufferR);
  var dataview = encodeWAV(interleaved);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}

function exportmp3(type) {
  var floatbuffer = mergeBuffers(recBuffersMono, recLength);
  var uint8buf = new Uint8Array(floatbuffer);
  var audioBlob = new Blob([uint8buf], { type: type });
  this.postMessage(audioBlob);
}

function getMonoBuffer() {
  var buf=mergeBuffers(recBuffersMono, recLength);
  this.postMessage(buf);
}

function getBuffer() {
  var buffers = [];
  buffers.push( mergeBuffers(recBuffersL, recLength) );
  buffers.push( mergeBuffers(recBuffersR, recLength) );
  this.postMessage(buffers);
}

function clear(){
  recLength = 0;
  recBuffersL = [];
  recBuffersR = [];
}

function mergeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
