function setup() {
    createCanvas(800, 600);
}

let number = 0;
let x = 0;
let y = 0;
let oldX = 0;
let oldY = 0;

let lineCoords = [];

function draw() {
    background(220);
    oldX = x;
    oldY = y;
    x = mouseX;
    y = mouseY;
    lineCoords.push([oldX, oldY, x, y])
    for (let i = 0; i < lineCoords.length; i++) {
        line(lineCoords[i][0], lineCoords[i][1], lineCoords[i][2], lineCoords[i][3]);
    }

}

function mousePressed() {
    removeElements();
}