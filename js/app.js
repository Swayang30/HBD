(function () {
  "use strict";

  var CFG = window.BDAY;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // lighter effects on phones so everything stays smooth on mid-range devices
  var small = window.matchMedia("(max-width: 600px)").matches;
  var PALETTE = ["#f6c1bc", "#e3a99a", "#b76e79", "#f8e3d8", "#fff4ee", "#9a5663"];

  function $(sel) { return document.querySelector(sel); }
  function fill(str) { return String(str || "").split("{name}").join(CFG.name); }

  document.title = fill("Happy Birthday, {name}");

  /* ---------------- Music ducking (videos, mic, Spotify can all ask for quiet) ---------------- */
  var duckReasons = {};
  function duck(reason, on) {
    if (on) duckReasons[reason] = true; else delete duckReasons[reason];
    window.Music.duck(Object.keys(duckReasons).length > 0);
  }

  /* ---------------- Animated background gradient ----------------
     Same mechanic as the reference (two colours drifting towards new
     random targets), in deep mauve / cocoa-rose tones. */
  (function gradientBg() {
    var el = $("#gradient");
    var colors = [
      [42, 15, 28],  // midnight rose
      [62, 20, 42],  // deep plum
      [80, 30, 54],  // mulberry
      [56, 18, 40],  // wine
      [92, 38, 60],  // dusky rose
      [70, 24, 46],  // berry
      [48, 16, 34],  // aubergine
      [100, 44, 64], // rose shadow
      [66, 26, 40],  // cocoa rose
      [36, 12, 26]   // night
    ];
    var idx = [0, 1, 2, 3], step = 0, speed = reduceMotion ? 0 : 0.0035;
    function mix(a, b, t) {
      return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
    }
    function paint() {
      el.style.background = "linear-gradient(120deg, " + mix(colors[idx[0]], colors[idx[1]], step) + " 0%, " + mix(colors[idx[2]], colors[idx[3]], step) + " 100%)";
    }
    function tick() {
      step += speed;
      if (step >= 1) {
        step %= 1;
        idx[0] = idx[1]; idx[2] = idx[3];
        idx[1] = (idx[1] + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
        idx[3] = (idx[3] + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
      }
      paint();
    }
    paint();
    if (speed) setInterval(tick, 50);
  })();

  /* ---------------- Scene switching ---------------- */
  var current = $("#intro");
  var onEnter = {};
  try { history.replaceState({ scene: "intro" }, ""); } catch (e) {}
  function go(id, focusSel, fromHistory) {
    var next = document.getElementById(id);
    if (!next || next === current) return;
    if (!fromHistory) { try { history.pushState({ scene: id }, ""); } catch (e) {} }
    current.classList.remove("show");
    next.classList.add("show");
    next.scrollTop = 0;
    current = next;
    if (onEnter[id]) onEnter[id]();
    var f = next.querySelector(focusSel || "button");
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 700);
  }

  /* ---------------- Confetti ---------------- */
  function burst(opts) {
    if (!window.confetti) return;
    window.confetti(Object.assign({ colors: PALETTE, disableForReducedMotion: true }, opts));
  }

  /* ---------------- 1. Intro ---------------- */
  var startWrap = $("#start-btn-container");
  var startBtn = $("#start-btn");
  function showStartButton() { startWrap.classList.add("show"); }

  var fontsReady = (document.fonts && document.fonts.load)
    ? Promise.all([document.fonts.load('700 40px "Fraunces"'), document.fonts.load('italic 700 40px "Fraunces"'), document.fonts.load('700 20px "Caveat"')])
    : Promise.resolve();
  var fontsOrTimeout = Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1800); })]);

  fontsOrTimeout.then(beginIntro, beginIntro);
  function beginIntro() {
    if (reduceMotion) {
      $("#c").style.display = "none";
      $("#introStatic").style.display = "block";
      setTimeout(showStartButton, 600);
      return;
    }
    window.Intro.start();
    setTimeout(showStartButton, 6500);
  }

  var soundBtn = $("#soundBtn");
  soundBtn.addEventListener("click", function () {
    var on = window.Music.toggle();
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Music on. Tap to mute" : "Music off. Tap to play");
  });

  startBtn.addEventListener("click", function () {
    window.Music.start(function (mode) {
      if (mode === "song") {
        var np = $("#nowPlaying");
        $("#npTitle").textContent = CFG.song.title + ", " + CFG.song.artist;
        np.hidden = false;
        requestAnimationFrame(function () { np.classList.add("show"); });
      }
    });
    soundBtn.classList.add("show");
    startWrap.classList.remove("show");
    go("stage", "#openBtn");
    setTimeout(function () { window.Intro.stop(); }, 1300);
    startCelebration();
  });

  /* ---------------- Fireworks ---------------- */
  var fireworks = null;
  var FW_BASE = {
    autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5,
    particles: small ? 36 : 50, traceLength: 3, explosion: 5, intensity: small ? 18 : 30, flickering: 50,
    hue: { min: 340, max: 359 },
    delay: { min: 30, max: 60 },
    rocketsPoint: { min: 30, max: 70 },
    lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
    brightness: { min: 62, max: 85 },
    decay: { min: 0.015, max: 0.03 },
    mouse: { click: false, move: false, max: 1 }
  };
  function startFireworks() {
    var FW = window.Fireworks && (window.Fireworks.Fireworks || window.Fireworks.default || window.Fireworks);
    if (!FW || reduceMotion) return;
    try {
      fireworks = new FW($(".fireworks"), FW_BASE);
      fireworks.start();
      // the library only accepts hues 0-360, so alternate between rose and peach-gold ranges
      if (fireworks.updateOptions) {
        var rose = true;
        setInterval(function () {
          rose = !rose;
          fireworks.updateOptions({ hue: rose ? { min: 340, max: 359 } : { min: 8, max: 28 } });
        }, 1800);
      }
    } catch (e) { fireworks = null; }
  }
  function boostFireworks(on) {
    if (!fireworks || !fireworks.updateOptions) return;
    fireworks.updateOptions(on
      ? { intensity: small ? 38 : 55, opacity: 0.75, explosion: small ? 6 : 8, delay: { min: 15, max: 30 } }
      : { intensity: FW_BASE.intensity, opacity: FW_BASE.opacity, explosion: FW_BASE.explosion, delay: FW_BASE.delay });
  }

  /* ---------------- Floating outline hearts (from the reference) ---------------- */
  function startHearts() {
    if (reduceMotion) return;
    var layer = $("#hearts");
    var NS = "http://www.w3.org/2000/svg";
    var count = 0;
    function spawn() {
      var W = window.innerWidth, H = window.innerHeight;
      var size = Math.random() * 20 + 20;
      var startX = Math.random() * (W - size * 1.2);
      var endX = Math.min(Math.max(startX + (Math.random() - 0.5) * W * 0.48, 0), W - size * 1.2);
      var duration = (12 + Math.random() * 3) * 1000;
      var color = Math.random() < 0.6 ? "#f6c1bc" : "#e3a99a";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("width", size); svg.setAttribute("height", size);
      svg.setAttribute("class", "heart-outline");
      svg.style.filter = "drop-shadow(0 0 10px " + color + "aa)";
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d",
        "M" + size / 2 + "," + size * 0.85 + " C" + size * 0.1 + "," + size * 0.6 + " " + size * 0.1 + "," + size * 0.2 + " " + size / 2 + "," + size * 0.35 +
        " C" + size * 0.9 + "," + size * 0.2 + " " + size * 0.9 + "," + size * 0.6 + " " + size / 2 + "," + size * 0.85);
      path.setAttribute("stroke", color); path.setAttribute("fill", "none"); path.setAttribute("stroke-width", "2.5");
      svg.appendChild(path);
      layer.appendChild(svg);
      count++;
      var t0 = null;
      (function frame(now) {
        if (!t0) t0 = now;
        var t = Math.min((now - t0) / duration, 1);
        svg.style.transform = "translate(" + (startX + (endX - startX) * t) + "px," + (H - size - (H + 50) * t) + "px) scale(" + (1 + 0.15 * t) + ")";
        svg.style.opacity = 0.18 + 0.65 * (1 - Math.abs(t - 0.55));
        if (t < 1) requestAnimationFrame(frame); else { svg.remove(); count--; }
      })(performance.now());
    }
    (function flow() {
      if (count < (small ? 5 : 7) && !document.hidden) spawn();
      setTimeout(flow, Math.random() * 1300 + 900);
    })();
  }

  /* ---------------- Falling rose-gold petals ---------------- */
  function startPetals() {
    if (reduceMotion) return;
    var layer = $("#petals");
    var NS = "http://www.w3.org/2000/svg";
    var fills = ["#f6c1bc", "#e3a99a", "#d18e82", "#f8e3d8", "#b76e79"];
    var count = 0;
    function spawn() {
      var W = window.innerWidth, H = window.innerHeight;
      var size = 12 + Math.random() * 14;
      var x0 = Math.random() * W;
      var sway = 30 + Math.random() * 60;
      var spin = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360);
      var duration = (10 + Math.random() * 6) * 1000;
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", size); svg.setAttribute("height", size);
      svg.setAttribute("class", "petal");
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", "M12 1C19 6 21 15 12 23C3 15 5 6 12 1Z");
      p.setAttribute("fill", fills[(Math.random() * fills.length) | 0]);
      p.setAttribute("opacity", "0.85");
      svg.appendChild(p);
      layer.appendChild(svg);
      count++;
      var t0 = null;
      (function frame(now) {
        if (!t0) t0 = now;
        var t = Math.min((now - t0) / duration, 1);
        var x = x0 + Math.sin(t * Math.PI * 3) * sway;
        var y = -30 + (H + 60) * t;
        svg.style.transform = "translate(" + x + "px," + y + "px) rotate(" + spin * t + "deg) rotateX(" + (t * 540) + "deg)";
        svg.style.opacity = t < 0.1 ? t * 10 : (t > 0.85 ? (1 - t) / 0.15 : 1);
        if (t < 1) requestAnimationFrame(frame); else { svg.remove(); count--; }
      })(performance.now());
    }
    (function flow() {
      if (count < (small ? 6 : 9) && !document.hidden) spawn();
      setTimeout(flow, 900 + Math.random() * 1400);
    })();
  }

  /* ---------------- Glitter trail that follows her finger / cursor ---------------- */
  function startSparkles() {
    if (reduceMotion) return;
    var layer = $("#sparkles");
    var last = 0;
    function spark(x, y, spread) {
      var s = document.createElement("span");
      s.className = "spark";
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", (Math.random() - 0.5) * spread + "px");
      s.style.setProperty("--dy", (Math.random() * 0.7 + 0.3) * spread * 0.8 + "px");
      layer.appendChild(s);
      setTimeout(function () { s.remove(); }, 950);
    }
    window.addEventListener("pointermove", function (e) {
      var now = performance.now();
      if (now - last < 45) return;
      last = now;
      spark(e.clientX, e.clientY, 40);
    }, { passive: true });
    window.addEventListener("pointerdown", function (e) {
      for (var i = 0; i < 6; i++) spark(e.clientX, e.clientY, 80);
    }, { passive: true });
  }

  /* ---------------- Typewriter: type → pause → delete → repeat ---------------- */
  function loopTypewriter(el, text, typeMs, deleteMs, holdMs) {
    var i = 0, deleting = false, chars = Array.from(text);
    (function tick() {
      el.textContent = chars.slice(0, i).join("");
      if (!deleting && i === chars.length) { deleting = true; return setTimeout(tick, holdMs); }
      if (deleting && i === 0) { deleting = false; return setTimeout(tick, typeMs * 4); }
      i += deleting ? -1 : 1;
      setTimeout(tick, deleting ? deleteMs : typeMs);
    })();
  }

  /* ---------------- CurvedLoop (vanilla port of reactbits.dev/text-animations/curved-loop) ---------------- */
  function curvedLoop(root, opts) {
    var speed = opts.speed || 2;
    var curveAmount = opts.curveAmount == null ? 400 : opts.curveAmount;
    var dir = opts.direction || "left";
    var interactive = opts.interactive !== false;

    var hasTrailing = /\s| $/.test(opts.text);
    var text = (hasTrailing ? opts.text.replace(/\s+$/, "") : opts.text) + " ";

    var measure = root.querySelector(".cl-measure");
    var textPath = root.querySelector("textPath");
    var path = root.querySelector("path");
    path.setAttribute("d", "M-100,40 Q500," + (40 + curveAmount) + " 1540,40");

    measure.textContent = text;
    var spacing = measure.getComputedTextLength();
    if (!spacing) return;
    textPath.textContent = new Array(Math.ceil(1800 / spacing) + 2 + 1).join(text);

    var offset = -spacing;
    var dragging = false, lastX = 0, vel = 0, lastT = performance.now();
    function wrap(v) {
      if (v <= -spacing) v += spacing;
      if (v > 0) v -= spacing;
      return v;
    }
    function set() { textPath.setAttribute("startOffset", offset + "px"); }
    set();
    root.classList.add("ready");

    if (!reduceMotion) {
      (function step(now) {
        var dt = Math.min(64, now - lastT); lastT = now;
        if (!dragging && current.id === "stage") {
          offset = wrap(offset + (dir === "right" ? speed : -speed) * (dt / 16.67));
          set();
        }
        requestAnimationFrame(step);
      })(performance.now());
    }

    if (!interactive) return;
    root.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; vel = 0;
      root.classList.add("dragging");
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
    });
    root.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      // convert screen px to SVG user units so dragging tracks the finger
      var scale = 1440 / root.getBoundingClientRect().width;
      var dx = (e.clientX - lastX) * scale;
      lastX = e.clientX; vel = dx;
      offset = wrap(offset + dx);
      set();
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove("dragging");
      if (vel !== 0) dir = vel > 0 ? "right" : "left";
    }
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);
    root.addEventListener("pointerleave", end);
  }

  /* ---------------- 2. Celebrate ---------------- */
  function startCelebration() {
    startFireworks();
    startHearts();
    startPetals();
    startSparkles();
    fontsOrTimeout.then(function () {
      var small = window.innerWidth < 600;
      curvedLoop($("#curvedLoop"), { text: fill(CFG.curvedText), speed: small ? 1.6 : 2, curveAmount: small ? 220 : 300 });
    });
    setTimeout(function () { burst({ particleCount: 200, spread: 120, origin: { y: 0.17 } }); }, 700);
    loopTypewriter($(".tw"), fill(CFG.topMessage), 90, 45, 1600);
  }

  /* ---------------- Letter: envelope → typed letter ---------------- */
  var overlay = $("#fancyOverlay");
  var envStage = $("#envelopeStage");
  var envelope = $("#envelope");
  var shell = $("#fancyModal");
  var closeBtn = $("#fancyClose");
  var typeEl = $("#fancyType");
  var openBtn = $("#openBtn");
  var LETTER_MS = 28;
  var typingTimer = null;
  var envelopeOpened = false;

  function buildChars() {
    typeEl.classList.remove("typed");
    typeEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    Array.from(fill(CFG.letter)).forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "char"; s.textContent = ch;
      frag.appendChild(s);
    });
    typeEl.appendChild(frag);
    typeEl.setAttribute("aria-label", fill(CFG.letter));
  }
  function startTyping() {
    var nodes = typeEl.querySelectorAll(".char");
    var i = 0, prev = null;
    if (typingTimer) clearInterval(typingTimer);
    if (reduceMotion) {
      nodes.forEach(function (n) { n.classList.add("show"); });
      typeEl.classList.add("typed");
      return;
    }
    typingTimer = setInterval(function () {
      if (i < nodes.length) {
        if (prev) prev.classList.remove("cursor");
        nodes[i].classList.add("show", "cursor");
        prev = nodes[i++];
      } else {
        clearInterval(typingTimer); typingTimer = null;
        typeEl.classList.add("typed");
      }
    }, LETTER_MS);
  }
  function showLetter() {
    envStage.classList.add("gone");
    shell.classList.add("show");
    buildChars();
    startTyping();
    burst({ particleCount: 80, spread: 90, startVelocity: 35, origin: { y: 0.55 } });
    setTimeout(function () { closeBtn.focus(); }, 300);
  }
  function openModal() {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    if (envelopeOpened) { showLetter(); return; }
    envStage.classList.remove("gone");
    setTimeout(function () { envelope.focus(); }, 200);
  }
  envelope.addEventListener("click", function () {
    if (envelopeOpened) return;
    envelopeOpened = true;
    envelope.classList.add("opened");
    setTimeout(showLetter, reduceMotion ? 100 : 1500);
  });
  function closeModal(then) {
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    shell.classList.remove("show");
    setTimeout(function () {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      if (typeof then === "function") then(); else openBtn.focus();
    }, 380);
  }
  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay && envelopeOpened) closeModal();
  });
  $("#galleryBtn").addEventListener("click", function () {
    closeModal(function () { go("gallery", "#nextImg"); });
  });

  /* ---------------- Lightbox ---------------- */
  var lightbox = $("#lightbox");
  var lightboxImg = $("#lightboxImg");
  var lightboxReturn = null;
  function openLightbox(src, caption) {
    lightboxReturn = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = caption || "";
    $("#lightboxCap").textContent = caption || "";
    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    $("#lightboxClose").focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    if (lightboxReturn) lightboxReturn.focus();
  }
  lightbox.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (lightbox.classList.contains("show")) closeLightbox();
    else if (overlay.classList.contains("show") && envelopeOpened) closeModal();
  });

  /* ---------------- 3. Photo cube ---------------- */
  var cube = $("#cube");
  var faces = cube.querySelectorAll(".face");
  var pips = document.querySelectorAll(".pip");
  CFG.photos.forEach(function (p, i) {
    if (!faces[i]) return;
    faces[i].querySelector(".face-blur").style.backgroundImage = "url('" + (p.blur || p.src.replace(/\.jpg$/i, "-blur.jpg")) + "')";
    var img = faces[i].querySelector("img");
    img.src = p.src;
    img.alt = fill(p.caption);
    faces[i].querySelector("figcaption").textContent = fill(p.caption);
  });

  var turns = 0;
  function frontIndex() { return ((turns % 4) + 4) % 4; }
  function renderCube() {
    cube.style.transform = "translateZ(calc(var(--size) * -0.5)) rotateY(" + turns * -90 + "deg)";
    var idx = frontIndex();
    pips.forEach(function (p, i) { p.classList.toggle("on", i === idx); });
    cube.setAttribute("aria-label", "Photo " + (idx + 1) + " of 4: " + fill(CFG.photos[idx].caption) + ". Press Enter to view full size.");
  }
  function next() { turns++; renderCube(); }
  function prev() { turns--; renderCube(); }
  $("#nextImg").addEventListener("click", next);
  $("#prevImg").addEventListener("click", prev);

  // gestures are read on the flat stage around the cube: once the cube has turned,
  // browsers no longer hit-test its rotated 3D faces reliably
  var stageEl = $(".gallery-stage");
  var wheelLock = false;
  stageEl.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    ((e.deltaY || e.deltaX) > 0 ? next : prev)();
    setTimeout(function () { wheelLock = false; }, 500);
  }, { passive: false });

  // one swipe turns exactly one face, however long the swipe is
  var dragging = false, downX = 0, moved = false, turned = false;
  stageEl.addEventListener("pointerdown", function (e) {
    dragging = true; moved = false; turned = false;
    downX = e.clientX;
    try { stageEl.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stageEl.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - downX;
    if (Math.abs(dx) > 8) moved = true;
    if (!turned && Math.abs(dx) > 40) { turned = true; (dx < 0 ? next : prev)(); }
  });
  stageEl.addEventListener("click", function () {
    if (moved) return;
    var p = CFG.photos[frontIndex()];
    openLightbox(p.src, fill(p.caption));
  });
  stageEl.addEventListener("pointerup", function (e) {
    dragging = false;
    try { stageEl.releasePointerCapture(e.pointerId); } catch (_) {}
  });
  stageEl.addEventListener("pointercancel", function () { dragging = false; });
  cube.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      var p = CFG.photos[frontIndex()];
      openLightbox(p.src, fill(p.caption));
    }
  });
  document.addEventListener("keydown", function (e) {
    if (current.id !== "gallery" || lightbox.classList.contains("show")) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
  renderCube();

  $("#toBest").addEventListener("click", function () { go("best", "#toVideos"); });

  /* ---------------- 4. Best moment spotlight ---------------- */
  var bestImg = $("#bestImg");
  bestImg.src = CFG.best.src;
  bestImg.alt = fill(CFG.best.tag);
  $("#bestTag").textContent = fill(CFG.best.tag);
  $(".best-photo").addEventListener("click", function () { openLightbox(CFG.best.src, fill(CFG.best.tag)); });

  var quoteEl = $("#bestQuote");
  var quoteWords = fill(CFG.best.quote).split(/\s+/);
  var hlFrom = (function () {
    // highlight from the last "love" to the end ("the love of my life.")
    for (var i = quoteWords.length - 1; i >= 0; i--) if (/^love/i.test(quoteWords[i])) return i;
    return quoteWords.length;
  })();
  quoteEl.setAttribute("aria-label", fill(CFG.best.quote));
  quoteWords.forEach(function (w, i) {
    var s = document.createElement("span");
    s.className = "w" + (i >= hlFrom ? " hl" : "");
    s.textContent = w;
    s.setAttribute("aria-hidden", "true");
    quoteEl.appendChild(s);
    if (i < quoteWords.length - 1) quoteEl.appendChild(document.createTextNode(" "));
  });
  var bestShown = false;
  onEnter.best = function () {
    var words = quoteEl.querySelectorAll(".w");
    if (bestShown) return;
    bestShown = true;
    words.forEach(function (w, i) {
      setTimeout(function () { w.classList.add("in"); }, (reduceMotion ? 0 : 1300) + i * (reduceMotion ? 0 : 130));
    });
    setTimeout(function () {
      burst({ particleCount: 90, spread: 70, startVelocity: 30, origin: { y: 0.35 }, shapes: ["circle"], scalar: 0.8 });
    }, 900);
  };

  $("#toVideos").addEventListener("click", function () { go("videos", ".phone"); });

  /* ---------------- 5. Videos ---------------- */
  var phones = document.querySelectorAll(".phone");
  document.querySelectorAll(".reel figcaption").forEach(function (c, i) { c.textContent = fill(CFG.videoCaptions[i] || ""); });
  function anyPlaying() {
    return Array.prototype.some.call(phones, function (p) { return !p.querySelector("video").paused; });
  }
  phones.forEach(function (phone, i) {
    var v = phone.querySelector("video");
    var label = i === 0 ? "first" : "second";
    phone.addEventListener("click", function () {
      if (v.paused) {
        phones.forEach(function (other) { var ov = other.querySelector("video"); if (ov !== v && !ov.paused) ov.pause(); });
        v.play();
      } else v.pause();
    });
    v.addEventListener("play", function () {
      phone.classList.add("playing");
      phone.setAttribute("aria-label", "Pause " + label + " video");
      duck("video", true);
    });
    function stopped() {
      phone.classList.remove("playing");
      phone.setAttribute("aria-label", "Play " + label + " video");
      if (!anyPlaying()) duck("video", false);
    }
    v.addEventListener("pause", stopped);
    v.addEventListener("ended", function () { v.currentTime = 0; stopped(); });
  });
  function pauseAllVideos() { phones.forEach(function (p) { p.querySelector("video").pause(); }); }

  $("#toScratch").addEventListener("click", function () { pauseAllVideos(); go("scratch", "#toFinale"); });

  /* ---------------- 6. Scratch card ---------------- */
  $("#ticketTitle").textContent = fill(CFG.scratch.title);
  $("#ticketReveal").textContent = fill(CFG.scratch.reveal);
  $("#ticketFine").textContent = fill(CFG.scratch.fine);
  var scratchReady = false, scratchDone = false;
  onEnter.scratch = function () {
    if (scratchReady) return;
    scratchReady = true;
    requestAnimationFrame(initScratch);
  };
  function initScratch() {
    var canvas = $("#scratchCanvas");
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // rose-gold foil coating
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#9a5663");
    g.addColorStop(0.25, "#e4a896");
    g.addColorStop(0.42, "#fff0e6");
    g.addColorStop(0.6, "#d18e82");
    g.addColorStop(0.8, "#b76e79");
    g.addColorStop(1, "#f2c2b3");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // glitter specks
    for (var i = 0; i < 260; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.5) + ")";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
    ctx.fillStyle = "rgba(28,13,18,0.78)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 700 " + Math.round(w / 13) + "px Fraunces, Georgia, serif";
    ctx.fillText("Scratch here", w / 2, h / 2 - 8);
    ctx.font = "700 " + Math.round(w / 18) + "px Caveat, cursive";
    ctx.fillText("for your gift ✦", w / 2, h / 2 + w / 13);

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(34, w / 9);

    var down = false, lx = 0, ly = 0, strokes = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      // the ticket is slightly rotated; map through its unrotated size
      return [(e.clientX - r.left) * (w / r.width), (e.clientY - r.top) * (h / r.height)];
    }
    function scratchTo(x, y) {
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
      lx = x; ly = y;
      if (++strokes % 8 === 0) checkCleared();
    }
    function checkCleared() {
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var clear = 0, total = 0;
      for (var i = 3; i < data.length; i += 4 * 24) { total++; if (data[i] === 0) clear++; }
      if (clear / total > 0.5) reveal();
    }
    function reveal() {
      if (scratchDone) return;
      scratchDone = true;
      canvas.classList.add("done");
      burst({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
      boostFireworks(true);
      setTimeout(function () { boostFireworks(false); }, 4000);
    }
    canvas.addEventListener("pointerdown", function (e) {
      down = true;
      var p = pos(e); lx = p[0]; ly = p[1];
      scratchTo(p[0], p[1]);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    canvas.addEventListener("pointermove", function (e) { if (down) { var p = pos(e); scratchTo(p[0], p[1]); } });
    canvas.addEventListener("pointerup", function () { down = false; checkCleared(); });
    canvas.addEventListener("pointercancel", function () { down = false; });
    // keyboard / screen-reader users can reveal directly
    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute("aria-label", "Scratch card. Press Enter to reveal.");
    canvas.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); } });
    if (reduceMotion) reveal();
  }

  $("#toFinale").addEventListener("click", function () { go("finale", "#wishBtn"); });

  /* ---------------- 7. Finale ---------------- */
  $("#finalMsg").textContent = fill(CFG.finalMessage);
  $("#signoff").textContent = fill(CFG.signoff);
  $("#songTitle").textContent = CFG.song.title;
  $("#songArtist").textContent = CFG.song.artist;

  var finaleStarted = false;
  onEnter.finale = function () {
    setTimeout(function () { burst({ particleCount: 120, spread: 100, origin: { y: 0.3 } }); }, 600);
    if (finaleStarted) return;
    finaleStarted = true;
    loopTypewriter($("#text"), fill(CFG.finalTitle), 120, 90, 1400);
    window.Music.whenReady(mountSongPlayer);
  };

  // With the song file present the card just shows it's playing; otherwise mount
  // the official Spotify player so she can play the real track.
  function mountSongPlayer() {
    var slot = $("#spotifySlot");
    if (window.Music.hasSong()) {
      $(".song-kicker").textContent = "Now playing, our song";
      return;
    }
    var link = document.createElement("a");
    link.className = "spotify-link";
    link.href = CFG.song.spotifyUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Open in Spotify";

    var host = document.createElement("div");
    slot.appendChild(host);
    var mounted = false;
    window.onSpotifyIframeApiReady = function (IFrameAPI) {
      mounted = true;
      IFrameAPI.createController(host, { uri: CFG.song.spotifyUri, width: "100%", height: 152 }, function (ctrl) {
        ctrl.addListener("playback_update", function (e) { duck("spotify", e && e.data && !e.data.isPaused); });
      });
    };
    var s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    s.onerror = function () { slot.innerHTML = ""; slot.appendChild(link); };
    document.body.appendChild(s);
    setTimeout(function () { if (!mounted) { slot.innerHTML = ""; slot.appendChild(link); } }, 8000);
  }

  var cakeWrap = $("#cakeWrap");
  var wishBtn = $("#wishBtn");
  var wishNote = $("#wishNote");
  var lit = true;
  var mic = null;

  function stopMic() {
    if (!mic) return;
    cancelAnimationFrame(mic.raf);
    clearTimeout(mic.timeout);
    mic.stream.getTracks().forEach(function (t) { t.stop(); });
    if (mic.ctx.close) mic.ctx.close();
    mic = null;
    cakeWrap.classList.remove("listening");
    duck("mic", false);
  }
  function listenForBlow() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !AC) {
      wishNote.textContent = "Now tap the cake to blow them out ✨";
      return;
    }
    wishNote.textContent = "Close your eyes, make a wish…";
    var ctx = new AC();
    if (ctx.resume) ctx.resume();
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      if (!lit) { stream.getTracks().forEach(function (t) { t.stop(); }); if (ctx.close) ctx.close(); return; }
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      var src = ctx.createMediaStreamSource(stream);
      var an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      var buf = new Float32Array(an.fftSize);
      var hot = 0;
      mic = { stream: stream, ctx: ctx, raf: 0, timeout: 0 };
      duck("mic", true);
      cakeWrap.classList.add("listening");
      wishBtn.querySelector(".btn-inner").textContent = "Listening… or tap the cake";
      wishNote.textContent = "…now blow into your phone 🌬️";
      (function sample() {
        an.getFloatTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        var rms = Math.sqrt(sum / buf.length);
        hot = rms > 0.12 ? hot + 1 : Math.max(0, hot - 1);
        if (hot > 7) { blowOut(); return; }
        mic.raf = requestAnimationFrame(sample);
      })();
      mic.timeout = setTimeout(function () {
        stopMic();
        wishBtn.querySelector(".btn-inner").textContent = "Make a wish, then blow";
        if (lit) wishNote.textContent = "Tap the cake to blow them out ✨";
      }, 25000);
    }).catch(function () {
      if (ctx.close) ctx.close();
      wishNote.textContent = "Now tap the cake to blow them out ✨";
    });
  }
  function blowOut() {
    if (!lit) return;
    lit = false;
    stopMic();
    cakeWrap.classList.add("out");
    cakeWrap.setAttribute("aria-label", "Birthday cake, candles blown out");
    wishNote.textContent = fill(CFG.wishMade);
    wishBtn.querySelector(".btn-inner").textContent = "Light the candles again";
    var end = Date.now() + 2500;
    (function frame() {
      burst({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
      burst({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(function () {
      burst({ particleCount: 160, spread: 160, startVelocity: 45, origin: { y: 0.35 } });
    }, 400);
    boostFireworks(true);
    setTimeout(function () { boostFireworks(false); }, 7000);
  }
  function relight() {
    lit = true;
    cakeWrap.classList.remove("out");
    cakeWrap.setAttribute("aria-label", "Birthday cake with three lit candles. Tap to blow them out.");
    wishNote.textContent = "";
    wishBtn.querySelector(".btn-inner").textContent = "Make a wish, then blow";
  }
  wishBtn.addEventListener("click", function () {
    if (!lit) { relight(); return; }
    if (mic) return;
    listenForBlow();
  });
  cakeWrap.addEventListener("click", blowOut);
  cakeWrap.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blowOut(); }
  });

  $("#replayBtn").addEventListener("click", function () { window.location.reload(); });

  window.addEventListener("popstate", function (e) {
    var stay = function () { try { history.pushState({ scene: current.id }, ""); } catch (_) {} };
    // back closes whatever is open on top first
    if (lightbox.classList.contains("show")) { closeLightbox(); stay(); return; }
    if (overlay.classList.contains("show")) {
      if (envelopeOpened) closeModal();
      else { overlay.classList.remove("show"); overlay.setAttribute("aria-hidden", "true"); }
      stay();
      return;
    }
    var target = e.state && e.state.scene;
    if (current.id === "intro") return;
    // never go back to the intro once the celebration has started
    if (!target || target === "intro") { if (current.id !== "stage") go("stage", "#openBtn", true); stay(); return; }
    pauseAllVideos();
    go(target, null, true);
  });
})();
