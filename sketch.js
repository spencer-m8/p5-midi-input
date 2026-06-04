let theShader;
// Vertex shader: Handles the geometry layout on the screen
const vert = `
  precision highp float; // Use high precision for floating point numbers
  attribute vec3 aPosition; // Receive the vertex position from p5.js
  void main() {
    gl_Position = vec4(aPosition, 1.0); // Map vertices to the full clip space
  }
`;

// Fragment shader: Calculates the color and logic for every pixel
const frag = `
  precision highp float; // Use high precision for fractal calculations
  uniform vec2 u_resolution; // The width and height of the canvas
  uniform float u_time; // Time variable that resets every loop cycle
  uniform float u_zoom; // Dynamic magnification factor from the draw loop
  uniform float u_opacity; // Transparency level for the fade-in/out effect
  uniform float u_seed; // Unique seed value for each sequence iteration
  uniform float u_rotation; // Rotation angle sent from the p5.js draw loop

  // Function to generate a smooth rainbow color palette
  vec3 getRainbow(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5); // Baseline brightness for the colors
    vec3 b = vec3(0.5, 0.5, 0.5); // Contrast/Intensity of the color waves
    vec3 c = vec3(1.0, 1.0, 1.0); // Frequency of the color oscillations
    vec3 d = vec3(0.0, 0.33, 0.67); // RGB phase offsets to create the rainbow
    return a + b * cos(6.28318 * (t + d)); // Standard cosine-based color palette
  }

  // Creates radial symmetry and ensures a vertex points upwards
  vec2 fold(vec2 p, float n) {
    float r = length(p); // Calculate the distance from the center point
    float a = atan(p.y, p.x) - 1.5708; // Calculate angle and rotate by 90 deg (PI/2)
    float tau = 6.28318; // Constant representing 2 * PI (a full circle)
    a = mod(a, tau / n) - tau / (n * 2.0); // Partition the circle into n slices
    a = abs(a); // Mirror the coordinates within each slice
    return vec2(cos(a), sin(a)) * r; // Revert back to 2D Cartesian coordinates
  }

  void main() {
    // Normalize coordinates so the center is (0,0) and range is approx -1 to 1
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    // Determine the number of mirror planes (3 to 8) based on the seed
    float numMirrors = 3.0 + mod(u_seed, 6.0); 
    p = fold(p, numMirrors); // Apply the upward-aligned radial symmetry

    // Apply rotation to the coordinate space (the "camera" rotation)
    float cosR = cos(u_rotation); // Calculate cosine of the rotation angle
    float sinR = sin(u_rotation); // Calculate sine of the rotation angle
    p = vec2(p.x * cosR - p.y * sinR, p.x * sinR + p.y * cosR); // Standard 2D rotation matrix

    p *= u_zoom; // Scale the coordinate space by the current zoom level
    
    float t = u_time * 0.05; // Set a slow time constant for the animation
    vec3 color = vec3(0.0); // Start with a black canvas
    
    // Create a unique positional shift for the fractal based on the seed
    vec2 shift = vec2(0.8 + sin(u_seed * 1.5) * 0.1, 0.8 + cos(u_seed * 0.7) * 0.1);

    // Fractal loop: Iterate 7 times to create recursive complexity
    for(int i = 0; i < 7; i++) {
        // Fold the coordinate space based on inversion and movement
        p = abs(p) / dot(p, p) - (shift + sin(t * 2.0 + u_seed) * 0.05);
        
        // Generate "Cantor Dust" visual particles using fract logic
        float dust = smoothstep(0.3, 0.0, length(fract(p * 2.0) - 0.5));
        
        // Shift colors dynamically based on time, seed, and distance
        float colorShift = t + float(i) * 0.1 + length(p) * 0.2 + u_seed * 0.1;
        vec3 dustColor = getRainbow(colorShift); // Assign a rainbow hue
        
        float intensity = pow(float(i + 1), 1.5); // Increase light for deeper layers
        color += dustColor * dust * intensity * 0.2; // Add dust glow to the total color
        
        // Render the neon transfinite lines using a specific thickness
        float line = 0.1 / abs(p.x + p.y + sin(t * 10.0 + float(i) + u_seed));
        color += getRainbow(colorShift + 0.5) * line * 0.5; // Add lines with offset hue
    }

    color *= 0.8; // Apply a master brightness multiplier
    color *= smoothstep(5.0, 0.0, length(p)); // Apply a soft vignette to the edges
    
    // Final output: Apply the opacity factor for smooth transitions
    gl_FragColor = vec4(color * u_opacity, 1.0); 
  }
`;

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
  theShader = createShader(vert, frag);
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
  //background(colors[pitch % colors.length]);
  fill(0);
  shader(theShader); // Tell p5.js to use this specific shader

  let absoluteTime = millis() / 1000.0; // Convert current time to seconds
  
  let cycleDuration = 78.5; // Define the total length of one sequence
  let t = absoluteTime % cycleDuration; // Calculate the current time within the loop
  
  let loopSeed = floor(absoluteTime / cycleDuration); // Track the number of cycles completed
  
  let zoomPulse = sin(t * 0.1); // Generate a slow-moving sine wave for zooming
  let currentZoom = map(zoomPulse, 1, -1, 0.1, 3.0); // Map the sine wave to zoom levels (0.3 limit)

  // --- Automatic Rotation Logic ---
  let rotationAngle = 0; // Initialize rotation angle to zero
  let rotationStart = 47.12; // Start rotation during the 2nd zoom-in (approx 47.1s)
  if (t > rotationStart) { // Check if we have passed the rotation threshold
    randomSeed(pitch * 999); // Use loop seed to ensure consistent randomness per cycle
    let direction = random() > 0.5 ? 1 : -1; // Randomly choose clockwise or counter-clockwise
    // Map time from the start point to the end of the loop to an angle (0 to 90 degrees)
    rotationAngle = direction /* pitch*/ * map(t, rotationStart, 78.5, 0, PI * 0.5); //adding pitch multiplication
  }
  
  let opacity = 0.0; // Set initial transparency to zero
  
  if (t < 1.0) {
    opacity = 0.0; // Keep the screen black for the first second
  } else if (t < 16.0) {
    opacity = map(t, 1.0, 16.0, 0.0, 1.0); // Gradually fade in over 15 seconds
  } else if (t < 73.5) {
    opacity = 1.0; // Keep full brightness during the main sequence
  } else if (t < 78.5) {
    opacity = map(t, 73.5, 78.5, 1.0, 0.0); // Fade out over the final 5 seconds
  }

  loopSeed = pitch;

  // Set the uniform values to be sent to the GPU
  theShader.setUniform("u_resolution", [width, height]); // Send canvas dimensions
  theShader.setUniform("u_time", t); // Send the looping time value
  theShader.setUniform("u_zoom", currentZoom); // Send the current zoom state
  theShader.setUniform("u_opacity", opacity); // Send the current visibility level
  theShader.setUniform("u_seed", float(loopSeed)); // Send the cycle-specific seed
  theShader.setUniform("u_rotation", rotationAngle); // Send the calculated rotation angle
  
  // Render a full-screen quad to display the shader
  quad(-1, -1, 1, -1, 1, 1, -1, 1); 
  /*text(
    // 'Device: ' + deviceInName + '\n' +
    'Command: ' + ((cmd == NOTE_ON) ? "NOTE_ON" : "NOTE_OFF") + '\n' +
    'Pitch: ' + pitch + '\n' +
    'Velocity: ' + velocity + '\n', 10, 20);
    */
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas size if the browser is resized
}