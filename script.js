var playlist;
var DOMURL = window.URL || window.webkitURL || window;

function init() {
    var cvs = document.getElementById('cvs');
    var ctx = cvs.getContext('2d');
    var body = document.querySelector('body');
    body.addEventListener('keydown', keypress, false);
    body.addEventListener('click', mouseclick, false);
    body.addEventListener('contextmenu', mouseclick, false);
    window.addEventListener('resize', setSize, false);
    playlist = new Playlist('playlist',ctx);
    setSize();
    window.requestAnimationFrame(draw);
}

window.addEventListener('load', init, false);

function draw() {
    playlist.draw();
    window.requestAnimationFrame(draw);
}

function setSize() {
    var cvs = document.getElementById('cvs');
    var w = window.innerWidth;
    var h = window.innerHeight;
    cvs.width = w;
    cvs.height = h;
    playlist.setElement();
}

function keypress(e) {
    e.preventDefault();
    var k = e.keyCode;
    console.log(e.keyCode);
    if (k == 37 || k == 8 || k == 33) {
	// left arrow, backspace, page-up
	playlist.previous();
    } else if (k == 39 || k == 32 || k == 13 || k == 34 || k == 78) {
	// right arrow, space, return, page-down, n
	playlist.next();
    } else if (k == 80) {
	// p
	playlist.pause();
    }
    return false;
}

function mouseclick(e) {
    e.preventDefault();
    if (e.button == 0) {
	playlist.next();
    } else if (e.button == 2) {
	playlist.previous();
    }
    console.log(e.button);
}

function Playlist (id,ctx) {
    var dv = document.getElementById(id);
    this.elements = dv.children;
    this.context = ctx;
    this.current = 0;
    this.setElement(this.current);
    this.nelts = dv.children.length;
    this.paused = true;
    return this;
}

Playlist.prototype.setElement = function(n = this.current) {
    this.element = this.elements[this.current];
    if (this.element) {
	this.tag = this.element.tagName;
	if (this.element.getAttribute('autoplay')) {
	    this.pause(false);
	}
	if (this.tag == "svg") {
	    var img = new Image();
	    var svg = new Blob([this.element.outerHTML], {type: 'image/svg+xml;charset=utf-8'});
	    var url = DOMURL.createObjectURL(svg);
	    img.src = url;
	    this.tag = 'IMG';
	    this.element = img;
	}
	console.log(this.tag);
	if (this.tag == 'SPAN') {
	    var ctx = this.context;
	    var style = window.getComputedStyle(this.element);
	    ctx.textAlign = style.getPropertyValue('text-align');
	    ctx.font = style.getPropertyValue('font-size') + ' ' + style.getPropertyValue('font-family');
	    ctx.fillStyle = style.getPropertyValue('color');
	    this.background = style.getPropertyValue('background-color');
	} else {
	    this.background = null;
	}
    }
}

Playlist.prototype.next = function() {
    if (this.current < this.elements.length-1) {
	this.pause(true);
	this.current++;
	this.setElement(this.current);
    }
}

Playlist.prototype.previous = function() {
    if (this.current > 0) {
	this.pause(true);
	this.current--;
	this.setElement(this.current);
    }
}

Playlist.prototype.draw = function() {
    var elt = this.element;
    var ctx = this.context;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    if (this.tag == 'VIDEO') {
	this.clear();
	ctx.drawImage(elt,0,0,w,h);
    } else if (this.tag == 'IMG') {
	this.clear();
	ctx.drawImage(elt,0,0,w,h);
    } else if (this.tag == 'SPAN') {
	this.clear(this.background);
	ctx.fillText(elt.innerHTML,w/2,h/2);
    }
}

Playlist.prototype.clear = function(c) {
    var ctx = this.context;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    if (c) {
	ctx.fillStyle = c;
	ctx.fillRect(0,0,w,h);
    } else {
	ctx.clearRect(0,0,w,h);
    }
    ctx.restore();
}


Playlist.prototype.pause = function(b = !this.paused) {
    if (this.tag == 'VIDEO') {
	if (b) {
	    this.paused = true;
	    this.elements[this.current].pause();
	} else {
	    this.paused = false;
	    this.elements[this.current].play();
	}
    }
}
