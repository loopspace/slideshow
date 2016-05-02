var playlist;
var mouse = {x: 0, y: 0};

function init() {
    var cvs = document.getElementById('cvs');
    var ctx = cvs.getContext('2d');
    var body = document.querySelector('body');
    playlist = new Playlist(ctx,body);
    body.addEventListener('mousemove',
			  function(e) {

			      mouse.x = Math.floor(e.clientX/window.innerWidth*100+.5)/100;
			      mouse.y = Math.floor(e.clientY/window.innerHeight*100+.5)/100;
			      return false;
			  },
			  false);
    window.addEventListener('resize', setSize, false);
    setPlaylist(playlist);
    playlist.start();
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
}

function setPlaylist(p) {}

function Playlist (ctx,body) {
    var p = this;
    body.addEventListener('keydown',
			  function(e) {p.keypress(e); return false;},
			  false);
    body.addEventListener('click',
			  function(e) {p.mouseclick(e); return false;},
			  false);
    body.addEventListener('contextmenu',
			  function(e) {p.mouseclick(e); return false;},
			  false);
    this.elements = [];
    this.context = ctx;
    this.current = 0;
    this.paused = true;
    this.stime = Date.now();
    this.pausetime = Date.now();
    return this;
}

Playlist.prototype.keypress = function (e) {
    e.preventDefault();
    var k = e.keyCode;
    if (k == 37 || k == 8 || k == 33) {
	// left arrow, backspace, page-up
	this.previous();
    } else if (k == 39 || k == 32 || k == 13 || k == 34 || k == 78) {
	// right arrow, space, return, page-down, n
	this.next();
    } else if (k == 80) {
	// p
	this.pause();
    } else if (k == 76) {
	// l
	console.log(mouse);
    } else if (k == 48 || k == 38) {
	// 0, up
	this.restart();
    } else if (k == 40) {
	//
	this.finish();
    } else {
	console.log('New key: ' + k);
    }
    return false;
}

Playlist.prototype.mouseclick = function(e) {
    e.preventDefault();
    if (e.button == 0) {
	this.next();
    } else if (e.button == 2) {
	this.previous();
    }
}

Playlist.prototype.addElement = function(t) {
    if (t.type == 'video') {
	this.addVideo(t);
    } else if (t.type == 'img') {
	this.addImage(t);
    } else if (t.type == 'text') {
	this.addText(t);
    }
}

Playlist.prototype.addElements = function(s) {
    for (k in s) {
	this.addElement(s[k]);
    }
}

Playlist.prototype.addVideo = function(t) {
    var elt = document.createElement('video');
    var src;
    for (k in t.sources) {
	src = document.createElement('source');
	for (a in t.sources[k]) {
	    src.setAttribute(a,t.sources[k][a]);
	}
	elt.appendChild(src);
    }
    var p = this;
    var inplay;
    elt.addEventListener('ended',
			 function(e) {
			     inplay = false;
			 });
    this.elements.push(
	{
	    draw: function(dt) {
		var w = p.context.canvas.width;
		var h = p.context.canvas.height;
		p.clear();
		p.context.drawImage(elt,0,0,w,h);
		return inplay;
	    },
	    activate: function() {
		if (t.autoplay) {
		    p.paused = false;
		    elt.play();
		}
		inplay = true;
	    },
	    deactivate: function() {
		elt.pause();
	    },
	    pause: function() {
		elt.pause();
	    },
	    play: function() {
		elt.play();
	    },
	    atend: function() {
		if (t.loop) {
		    p.repeat();
		} else if (t.wait) {
		} else {
		    p.next();
		}
	    }
	}
    )
}

Playlist.prototype.addImage = function(t) {
    var elt = document.createElement('img');
    elt.setAttribute('src',t.src);
    var effect;
    if (t.effect) {
	effect = t.effect;
    } else {
	effect = function(dt,w,h) {
	    return {x: 0, y: 0, w: w, h: h}
	}
    }
    var p = this;
    this.elements.push(
	{
	    draw: function(dt) {
		var w = p.context.canvas.width;
		var h = p.context.canvas.height;
		p.clear();
		var c = effect(dt,w,h);
		p.context.drawImage(elt,c.x,c.y,c.w,c.h);
		if (t.duration && dt > t.duration) {
		    return false;
		} else {
		    return true;
		}
	    },
	    activate: function() {},
	    deactivate: function() {},
	    pause: function() {},
	    play: function() {},
	    atend: function() {
		if (!t.wait) {
		    p.next();
		}
	    },
	}
    )
}

Playlist.prototype.addText = function(t) {
    var p = this;
    var effect;
    if (t.effect) {
	effect = t.effect;
    } else {
	effect = function(dt,w,h,s) {
	    return {w: w/2, h: h/2, style: s}
	}
    }
    this.elements.push(
	{
	    draw: function(dt) {
		var w = p.context.canvas.width;
		var h = p.context.canvas.height;
		var c = effect(dt,w,h,t.style);
		p.clear(c.style.backgroundColour);
		p.setStyle(c.style);
		p.context.fillText(t.text,c.w,c.h);
	    },
	    activate: function() {},
	    deactivate: function() {},
	    pause: function() {},
	    play: function() {},
	    atend: function() {},
	}
    )
}

Playlist.prototype.start = function() {
    this.element = this.elements[this.current];
    this.element.activate();
    this.stime = Date.now();
}

Playlist.prototype.next = function() {
    if (this.current < this.elements.length-1) {
	this.element.deactivate();
	this.current++;
	this.element = this.elements[this.current];
	this.element.activate();
	this.stime = Date.now();
	this.pausetime = Date.now();
    }
}

Playlist.prototype.previous = function() {
    if (this.current > 0) {
	this.element.deactivate();
	this.current--;
	this.element = this.elements[this.current];
	this.element.activate();
	this.stime = Date.now();
	this.pausetime = Date.now();
    }
}

Playlist.prototype.repeat = function() {
    this.element.deactivate();
    this.element.activate();
    this.stime = Date.now();
}

Playlist.prototype.restart = function() {
    this.element.deactivate();
    this.current = 0;
    this.element = this.elements[this.current];
    this.element.activate();
    this.stime = Date.now();
}

Playlist.prototype.finish = function() {
    this.element.deactivate();
    this.current = this.elements.length - 1;
    this.element = this.elements[this.current];
    this.element.activate();
    this.stime = Date.now();
}

Playlist.prototype.draw = function() {
    var dt;
    if (this.paused) {
	dt = this.pausetime - this.stime;
    } else {
	dt = Date.now() - this.stime;
    }
    
    if (!this.element.draw(dt)) {
	this.element.atend();
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

Playlist.prototype.setStyle = function(s) {
    var ctx = this.context;
    for (k in s) {
	if (ctx[k]) {
	    ctx[k] = s[k];
	}
    }
}

Playlist.prototype.pause = function(b = !this.paused) {
    if (b) {
	this.paused = true;
	this.pausetime = Date.now();
	this.element.pause();
    } else {
	this.paused = false;
	this.stime += Date.now() - this.pausetime;
	this.element.play();
    }
}

