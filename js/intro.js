/* Intro: each letter of "HAPPY BIRTHDAY!" is launched like a firework,
   bursts into view, then inflates into a balloon and floats away.
   Adapted from the reference, with a warm pink→gold hue range and
   crisp rendering on high-DPI screens. */
(function () {
  var c = document.getElementById("c");
  var ctx = c.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var w, h, hw, hh;
  var opts, calc;
  var Tau = Math.PI * 2, TauQuarter = Tau / 4;
  var letters = [];
  var rafId = null;
  var running = false;

  function computeOpts() {
    w = window.innerWidth;
    h = window.innerHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    hw = w / 2;
    hh = h / 2;

    // size letters so the longest line spans ~80% of the width on phones
    var lines = (window.BDAY && window.BDAY.introLines) || ["HAPPY", "BIRTHDAY!"];
    var longest = Math.max.apply(null, lines.map(function (s) { return s.length; }));
    var scale = Math.max(0.6, Math.min(1.5, (w * 0.8) / (longest * 38), h / 560));

    opts = {
      strings: (window.BDAY && window.BDAY.introLines) || ["HAPPY", "BIRTHDAY!"],
      charSize: 34 * scale,
      charSpacing: 38 * scale,
      lineHeight: 50 * scale,

      fireworkPrevPoints: 10,
      fireworkBaseLineWidth: 5,
      fireworkAddedLineWidth: 8,
      fireworkSpawnTime: 180,
      fireworkBaseReachTime: 22,
      fireworkAddedReachTime: 12,
      fireworkCircleBaseSize: 22 * scale,
      fireworkCircleAddedSize: 12 * scale,
      fireworkCircleBaseTime: 14,
      fireworkCircleAddedTime: 10,
      fireworkCircleFadeBaseTime: 14,
      fireworkCircleFadeAddedTime: 8,
      fireworkBaseShards: 5,
      fireworkAddedShards: 5,
      fireworkShardPrevPoints: 3,
      fireworkShardBaseVel: 6,
      fireworkShardAddedVel: 2,
      fireworkShardBaseSize: 3,
      fireworkShardAddedSize: 3,
      gravity: 0.1,
      upFlow: -0.2,
      letterContemplatingWaitTime: 180,
      balloonSpawnTime: 40,
      balloonBaseInflateTime: 2,
      balloonAddedInflateTime: 2,
      balloonBaseSize: 22 * scale,
      balloonAddedSize: 20 * scale,
      balloonBaseVel: 1.0,
      balloonAddedVel: 0.4,
      balloonBaseRadian: -(Math.PI / 2 - 0.5),
      balloonAddedRadian: -1
    };

    calc = {
      totalWidth: opts.charSpacing * Math.max.apply(null, opts.strings.map(function (s) { return s.length; }))
    };

    ctx.font = "700 " + opts.charSize + "px Fraunces, Georgia, serif";
  }

  function Letter(char, x, y) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.dx = -ctx.measureText(char).width / 2;
    this.dy = +opts.charSize / 2;
    this.fireworkDy = this.y - hh;

    // rose-gold sweep: dusty rose (345) → rose gold → warm peach (~20)
    var t = (x + calc.totalWidth / 2) / calc.totalWidth;
    var hue = (345 + t * 35) % 360;

    this.color = "hsl(" + hue + ",62%,66%)";
    this.lightAlphaColor = "hsla(" + hue + ",78%,light%,alp)";
    this.lightColor = "hsl(" + hue + ",70%,light%)";
    this.alphaColor = "hsla(" + hue + ",70%,68%,alp)";

    this.reset();
  }
  Letter.prototype.reset = function () {
    this.phase = "firework";
    this.tick = 0;
    this.spawned = false;
    this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;
    this.reachTime = (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) | 0;
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
    this.prevPoints = [[0, hh, 0]];
  };
  Letter.prototype.step = function () {
    var i, proportion, armonic;
    if (this.phase === "firework") {
      if (!this.spawned) {
        ++this.tick;
        if (this.tick >= this.spawningTime) {
          this.tick = 0;
          this.spawned = true;
        }
      } else {
        ++this.tick;
        var linearProportion = this.tick / this.reachTime,
          armonicProportion = Math.sin(linearProportion * TauQuarter),
          x = linearProportion * this.x,
          y = hh + armonicProportion * this.fireworkDy;

        if (this.prevPoints.length > opts.fireworkPrevPoints) this.prevPoints.shift();
        this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

        var lineWidthProportion = 1 / (this.prevPoints.length - 1);
        for (i = 1; i < this.prevPoints.length; ++i) {
          var point = this.prevPoints[i], point2 = this.prevPoints[i - 1];
          ctx.strokeStyle = this.alphaColor.replace("alp", i / this.prevPoints.length);
          ctx.lineWidth = point[2] * lineWidthProportion * i;
          ctx.beginPath();
          ctx.moveTo(point[0], point[1]);
          ctx.lineTo(point2[0], point2[1]);
          ctx.stroke();
        }

        if (this.tick >= this.reachTime) {
          this.phase = "contemplate";
          this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
          this.circleCompleteTime = (opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random()) | 0;
          this.circleCreating = true;
          this.circleFading = false;
          this.circleFadeTime = (opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random()) | 0;
          this.tick = 0;
          this.tick2 = 0;
          this.shards = [];

          var shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0,
            angle = Tau / shardCount,
            cos = Math.cos(angle), sin = Math.sin(angle),
            sx = 1, sy = 0;
          for (i = 0; i < shardCount; ++i) {
            var x1 = sx;
            sx = sx * cos - sy * sin;
            sy = sy * cos + x1 * sin;
            this.shards.push(new Shard(this.x, this.y, sx, sy, this.alphaColor));
          }
        }
      }
    } else if (this.phase === "contemplate") {
      ++this.tick;
      if (this.circleCreating) {
        ++this.tick2;
        proportion = this.tick2 / this.circleCompleteTime;
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
        ctx.fillStyle = this.lightAlphaColor.replace("light", 50 + 50 * proportion).replace("alp", proportion);
        ctx.beginPath();
        ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
        ctx.fill();
        if (this.tick2 > this.circleCompleteTime) {
          this.tick2 = 0;
          this.circleCreating = false;
          this.circleFading = true;
        }
      } else if (this.circleFading) {
        ctx.fillStyle = this.lightColor.replace("light", 86);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        ++this.tick2;
        proportion = this.tick2 / this.circleFadeTime;
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = this.lightAlphaColor.replace("light", 100).replace("alp", 1 - armonic);
        ctx.arc(this.x, this.y, this.circleFinalSize, 0, Tau);
        ctx.fill();
        if (this.tick2 >= this.circleFadeTime) this.circleFading = false;
      } else {
        ctx.fillStyle = this.lightColor.replace("light", 86);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
      }

      for (i = 0; i < this.shards.length; ++i) {
        this.shards[i].step();
        if (!this.shards[i].alive) {
          this.shards.splice(i, 1);
          --i;
        }
      }

      if (this.tick > opts.letterContemplatingWaitTime) {
        this.phase = "balloon";
        this.tick = 0;
        this.spawning = true;
        this.spawnTime = (opts.balloonSpawnTime * Math.random()) | 0;
        this.inflating = false;
        this.inflateTime = (opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random()) | 0;
        this.size = (opts.balloonBaseSize + opts.balloonAddedSize * Math.random()) | 0;
        var rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
          vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
        this.vx = Math.cos(rad) * vel;
        this.vy = Math.sin(rad) * vel;
      }
    } else if (this.phase === "balloon") {
      ctx.strokeStyle = this.lightColor.replace("light", 82);
      ctx.lineWidth = 1;
      if (this.spawning) {
        ++this.tick;
        ctx.fillStyle = this.lightColor.replace("light", 86);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        if (this.tick >= this.spawnTime) {
          this.tick = 0;
          this.spawning = false;
          this.inflating = true;
        }
      } else if (this.inflating) {
        ++this.tick;
        proportion = this.tick / this.inflateTime;
        var bx = (this.cx = this.x),
          by = (this.cy = this.y - this.size * proportion);
        ctx.fillStyle = this.alphaColor.replace("alp", proportion);
        ctx.beginPath();
        generateBalloonPath(bx, by, this.size * proportion);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, this.y);
        ctx.stroke();
        ctx.fillStyle = this.lightColor.replace("light", 86);
        ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        if (this.tick >= this.inflateTime) {
          this.tick = 0;
          this.inflating = false;
        }
      } else {
        this.cx += this.vx;
        this.cy += this.vy += opts.upFlow;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        generateBalloonPath(this.cx, this.cy, this.size);
        ctx.fill();
        // tiny highlight so balloons read as glossy
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.ellipse(this.cx - this.size * 0.14, this.cy - this.size * 0.7, this.size * 0.06, this.size * 0.12, -0.4, 0, Tau);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.lineTo(this.cx, this.cy + this.size);
        ctx.stroke();
        ctx.fillStyle = this.lightColor.replace("light", 86);
        ctx.fillText(this.char, this.cx + this.dx, this.cy + this.dy + this.size);
        if (this.cy + this.size < -hh || this.cx < -hw || this.cy > hw) this.phase = "done";
      }
    }
  };

  function Shard(x, y, vx, vy, color) {
    var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
    this.vx = vx * vel;
    this.vy = vy * vel;
    this.x = x;
    this.y = y;
    this.prevPoints = [[x, y]];
    this.color = color;
    this.alive = true;
    this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
  }
  Shard.prototype.step = function () {
    this.x += this.vx;
    this.y += this.vy += opts.gravity;
    if (this.prevPoints.length > opts.fireworkShardPrevPoints) this.prevPoints.shift();
    this.prevPoints.push([this.x, this.y]);
    var lineWidthProportion = this.size / this.prevPoints.length;
    for (var k = 0; k < this.prevPoints.length - 1; ++k) {
      var point = this.prevPoints[k], point2 = this.prevPoints[k + 1];
      ctx.strokeStyle = this.color.replace("alp", k / this.prevPoints.length);
      ctx.lineWidth = k * lineWidthProportion;
      ctx.beginPath();
      ctx.moveTo(point[0], point[1]);
      ctx.lineTo(point2[0], point2[1]);
      ctx.stroke();
    }
    if (this.prevPoints[0][1] > hh) this.alive = false;
  };

  function generateBalloonPath(x, y, size) {
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size / 4, y - size, x, y - size);
    ctx.bezierCurveTo(x + size / 4, y - size, x + size / 2, y - size / 2, x, y);
  }

  function buildLetters() {
    letters.length = 0;
    for (var i = 0; i < opts.strings.length; ++i) {
      for (var j = 0; j < opts.strings[i].length; ++j) {
        letters.push(new Letter(
          opts.strings[i][j],
          j * opts.charSpacing + opts.charSpacing / 2 - (opts.strings[i].length * opts.charSpacing) / 2,
          i * opts.lineHeight + opts.lineHeight / 2 - (opts.strings.length * opts.lineHeight) / 2
        ));
      }
    }
  }

  function anim() {
    if (!running) return;
    rafId = requestAnimationFrame(anim);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(hw, hh);
    var done = true;
    for (var l = 0; l < letters.length; ++l) {
      letters[l].step();
      if (letters[l].phase !== "done") done = false;
    }
    if (done) for (var m = 0; m < letters.length; ++m) letters[m].reset();
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      // phone address bars show/hide on scroll and fire resize with only a height change;
      // rebuild the letters only when the width really changes (e.g. rotation)
      var widthChanged = window.innerWidth !== w;
      computeOpts();
      if (widthChanged) buildLetters();
      else letters.forEach(function (l) { l.fireworkDy = l.y - hh; });
    }, 120);
  }

  window.Intro = {
    start: function () {
      computeOpts();
      buildLetters();
      running = true;
      anim();
      window.addEventListener("resize", onResize);
    },
    stop: function () {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    }
  };
})();
