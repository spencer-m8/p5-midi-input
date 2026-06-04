let output;// output to send things to other file
let frequency;

function setup() {
    WebMidi
  .enable()
  .then(onEnabled)
  .catch(err => alert(err));
}

function onEnabled() {
  //WebMIDI Example Output Setup:
  
  console.log("WebMIDI Enabled");
  
  // Inputs
  WebMidi.inputs.forEach(input => console.log("Input: ",input.manufacturer, input.name));
  
  // Outputs
  WebMidi.outputs.forEach(output => console.log("Output: ",output.manufacturer, output.name));
  
  //Looking at the first output available to us
  console.log(WebMidi.outputs[0]);

  //assign that output as the one we will use later
  myOutput = WebMidi.outputs[0];
}
let random;

function draw() {
    if ((frequency % 60) == 0) {
        random = random(10, 90);
        myOutput.playNote(random, {duration: 200});
        console.log(random);
    }
    frequency++;
}