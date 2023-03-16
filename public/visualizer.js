////////////////////////////////////////////////////////////////////////////////////////////////////
// Uses the p5 sound library to implement the audiovisualizer                                     //
////////////////////////////////////////////////////////////////////////////////////////////////////

// let song1;
// let song2;
// let song3;
let fft;
let mic;

let w;
console.log("in visualizer.js");


// function preload() {
//   soundFormats('mp3');
//   // song1 = loadSound('assets/better_off_alone.mp3');
//   // song2 = loadSound('assets/island.mp3');
//   // song3 = loadSound('assets/endlessly.mp3');
// }

function setup() {
  createCanvas(windowWidth, windowHeight);

  window.parent.postMessage({type: 'resize', width: width, height: height}, '*');

  mic = new p5.AudioIn();
  mic.start();

  angleMode(DEGREES);
  fft = new p5.FFT(0.9, 512);
  fft.setInput(mic);
  w = windowWidth / 512;
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
  w = windowWidth / 512;
}

function keyTyped() {
}

function draw() {
  console.log('in draw');
  colorMode(RGB);
  background(34, 34, 34);
  let spectrum = fft.analyze();
  let waves = fft.waveform();
  noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    let amp = spectrum[i];
    let energy = fft.getEnergy(i);
    let newWaveForm = map(waves[i], -1, 1, 0, 255);
    let y = map(amp, 0, spectrum.length, windowHeight, 0);
    let x = map(i, 0, spectrum.length, i, windowWidth * w);

    let ampMeasure = map(amp, 0, spectrum.length, 0, 255);

    ////////////////////////////
    // DIFFERENT COLOR THEMES //
    ////////////////////////////

    // LESS STROBE-Y
    // More blue-centric color theme
    // fill(255 - energy, newWaveForm, energy);

    // More purple-centric color theme
    // fill(newWaveForm, 255 - energy, energy);

    // MORE STROBE-Y
    // More strobe-y purple-centric color theme
    // fill(newWaveForm, 255 - energy, ampMeasure);

    // More strobe-y green-centric color theme
    // fill(ampMeasure, newWaveForm, 255 - energy);

    // !!! Strobe-y orange-green theme !!!
    fill(newWaveForm, ampMeasure, 255 - energy);

    // Strobe-y light blue-purple theme
    // fill(newWaveForm, ampMeasure, energy);

    rect(x, y, w, windowHeight - y/4);
    // rect(x, y, w, y)
  }
}