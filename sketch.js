var midiOutputs;
var midiInputs;
var deviceName;
var cmd;
var pitch = '';
var velocity = '';
const NOTE_ON = 9;
const NOTE_OFF = 8;

var colors = ['#ff00ff', '#ffff00', '#00ffff'];

function setup() {
  createCanvas(400, 400, WEBGL);
  startMIDI();
  pixelDensity(1); // Set pixel density to 1 for consistent rendering
}

function startMIDI() {
  // load MIDI devices and watch for hardware changes
  if (!('requestMIDIAccess' in navigator)) {
    print('This browser doesn\'t support WebMIDI');
  } else {
    navigator.requestMIDIAccess().then((midi) => {
      parseMidiDevices(midi);
      midi.onstatechange = (e) => parseMidiDevices(e.target);
    });
  }
}

function parseMidiDevices(midi) {
    //adding different midi inputs! this could be something
  // grab first MIDI device.
  // needs more code to support multiples
  midiInputs = midi.inputs.values().next().value;
  print(midiInputs);
  midiOutputs = midi.outputs.values().next().value;
  deviceInName = midiInputs.name;

  if (midiInputs) {
    // listen for midi input
    midiInputs.onmidimessage = (msg) => {
      // get data from MIDI message
      cmd = msg.data[0] >> 4;
      pitch = msg.data[1];
      velocity = (msg.data.length > 2) ? msg.data[2] : 0;
    };
  }
  //here automatically updates midi info given into variables
}

function draw() {
  background(colors[pitch % colors.length]);
  fill(0);
  text(
    // 'Device: ' + deviceInName + '\n' +
    'Command: ' + ((cmd == NOTE_ON) ? "NOTE_ON" : "NOTE_OFF") + '\n' +
    'Pitch: ' + pitch + '\n' +
    'Velocity: ' + velocity + '\n', 10, 20);
}