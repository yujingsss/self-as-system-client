let c;
const bank = ['0','1','2','3','4','5','6','7','8','9',
'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
let button, captureButton;
let capturing = false;
let filename = [];
let capture;
let slitX = 0;

let pg;

let likeImg;

let noiseMax = 2;
let phase = 0;
let zoff = 0;
let loopStep;

let mediaObj;
let accountObj;

let particles = [];
let pNum;
let dRange = 120;

let socket;
let mouseR, mouseG, mouseB;

function preload() {
    mediaObj = loadJSON("../data/media.json");
    accountObj = loadJSON("../data/account_history.json");
    likeImg = loadImage("../images/like-05.png");
  }

function setup() {
    //canvas
    c = createCanvas(int(windowWidth * 2 /3), int(windowHeight * 3 / 4));
    c.id('maincanvas');

    mouseR = int(random(20,255));
    mouseG = int(random(20,255));
    mouseB = int(random(20,255));

    // socket = io.connect('http://localhost:3000');
    socket = io();
    socket.on('multiMouse', newDrawing);

    pg = createGraphics(width, height);

    loopStep = TWO_PI/125;
    
    //likes
    pNum = Math.floor(width/10);
    for (let i = 0; i < pNum; i++) {
        particles.push(new Particle());
    }

    //buttons
    button = select('#saveButton');
    button.mousePressed(()=>{
        randomFileName();
        saveCanvas(c, filename.join(''), 'jpg');
    });
    captureButton = select('#captureButton');
    captureButton.mousePressed(()=>{
        capturing =! capturing;

        if (capturing == false) {
            capture.stop();
            console.log(capture);
            clear();
            slitX = 0;
        } else {
            cursor(ARROW);
            //camera capture
            capture = createCapture(VIDEO, (ready) => {
                capture.size(width, height);
                slitX = 0;
            });
            //add for iphone compatibility
            capture.elt.setAttribute('playsinline', '');
            capture.hide();
            background(0);
            perlinNoiseLoop();
        }
    });

    pixelDensity(1);
    frameRate(24);

    background(0);
    textAlign(CENTER);
    textSize(12);
    noCursor();
    imageMode(CENTER);
}

function draw() {
    if (capturing == true) {
        capture.loadPixels();
        pg.image(capture,0,0);
        pg.filter(GRAY);

        let w = int(width);
        let h = int(height);
        copy(pg, int(w / 2), 0, 5, h, slitX, 0, 5, h);
        slitX += 1;
        slitX = slitX > width ? 0 : slitX;
    } else {
        perlinNoiseLoop();
        likeSystem();
        // image(likeImg, mouseX, mouseY);
    }
}

function newDrawing(data) {
    noStroke();
    fill(data.r,data.g,data.b);
    circle(data.x,data.y,20);
}

function mouseMoved() {
    let data = {
        x: mouseX,
        y: mouseY, 
        r: mouseR,
        g: mouseG,
        b: mouseB
    }
    socket.emit('multiMouse', data);

    noStroke();
    fill(mouseR, mouseG, mouseB);
    circle(mouseX,mouseY,20);
}

function randomFileName() {
    filename = [];
    for (let i = 0; i < bank.length; i++) {
        let newfilename;
        newfilename = bank[floor(random(bank.length))];
        filename.push(newfilename);
    }
}

function perlinNoiseLoop() {
    background(0);
    translate(width/2, height/2);
    let loopIndex = 0;
    for (let a = 0; a < TWO_PI; a += loopStep) {
        loopIndex++;
        let xoff = map(cos(a + phase), -1, 1, 0, noiseMax);
        let yoff = map(sin(a + phase), -1, 1, 0, noiseMax);
        let r = map(noise(xoff, yoff, zoff), 0, 1, width/5, height/4);
        let x = r * cos(a);
        let y = r * sin(a);
        dataText(mediaObj, accountObj, x, y, loopIndex);
    }
    phase += 0.03;
    zoff += 0.03;
    resetMatrix();
}

function dataText(data1, data2,coordx, coordy, index) {
    let mediaLength = data1.stories.length;
    let accountLength = data2.login_history.length;

    let takenAt = [];
    let path = [];
    let cookieName = [];
    let ipAddress = [];
    for (i = 0; i < mediaLength; i++) {
        takenAt[i] = data1.stories[i].taken_at;
        path[i] = data1.stories[i].path;
    }
    for (j = 0; j < accountLength; j ++) {
        cookieName[j] = data2.login_history[j].cookie_name;
        ipAddress[j] = data2.login_history[j].ip_address;
    }

    let mediaIndex = index % mediaLength;
    let accountIndex = index % accountLength;
    fill(255, 0, 161);
    text(`${takenAt[mediaIndex]}`, coordx, coordy);
    fill(121,3,235);
    text(`${path[mediaIndex]}`, coordx, coordy+12);
    fill(19,255,0);
    text(`${ipAddress[accountIndex]} && ${cookieName[accountIndex]}`, coordx, coordy+24);
}
function likeSystem() {
    dRange = map(mouseX,0,width,100,200);
    particles.forEach((p, index)=> {
      p.update();
      p.draw();
      p.checkParticles(particles.slice(index));
    });
}
class Particle {
    constructor () {
      this.pos = createVector(random(width),random(height));
      this.size = 15;
      this.vel = createVector(random(-2,2),random(-2,2));
    }
    update() {
      this.pos.add(this.vel);
      this.edges();
    }
    draw() {
      image(likeImg, this.pos.x, this.pos.y, this.size, this.size);
    }
    edges() {
      if (this.pos.x < 0 || this.pos.x > width) {
        this.vel.x *= -1;
      }
      if (this.pos.y < 0 || this.pos.y > height) {
        this.vel.y *= -1;
      }
    }
    checkParticles(particles) {
      particles.forEach(particle=> {
        stroke(255, 18, 79);
        strokeWeight(0.5);
        const d = dist(this.pos.x, this.pos.y, particle.pos.x, particle.pos.y);
        const dmouse = dist(mouseX, mouseY, particle.pos.x, particle.pos.y);
        if (d < dRange) {
            line(this.pos.x, this.pos.y, particle.pos.x, particle.pos.y);
        }
        if (dmouse < dRange) {
            line(mouseX, mouseY, particle.pos.x, particle.pos.y);
        }
      });
    }
  }

function keyPressed(event){
    if (event.key == 's') {
        randomFileName();
        saveCanvas(c, filename.join(''), 'jpg');
    }
    if (event.key == 'c') {
        capturing =! capturing;
        if (capturing == false) {
            capture.stop();
            clear();
            slitX = 0;
        } else {
            cursor(ARROW);
            //camera capture
            capture = createCapture(VIDEO, (ready) => {
                capture.size(width, height);
                slitX = 0;
            });
            //add for iphone compatibility
            capture.elt.setAttribute('playsinline', '');
            capture.hide();
            background(0);
            perlinNoiseLoop();
        }
    }
}