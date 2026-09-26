/* Background music.
   1. If the song file from config exists (assets/audio/belong-together.mp3), it plays on loop.
   2. Otherwise a soft music-box "Happy Birthday" (public-domain melody) is synthesised
      with Web Audio, so the site always has music. */
(function () {
  var CFG = window.BDAY || {};
  var AC = window.AudioContext || window.webkitAudioContext;
  var enabled = true, ducked = false, started = false;
  var VOLUME = 0.32, SONG_VOLUME = 0.75;

  /* ---------- real song (optional file) ---------- */
  var song = null, songOk = false, songChecked = false, songWaiters = [];
  if (CFG.song && CFG.song.file) {
    song = new Audio();
    song.loop = true;
    song.preload = "auto";
    song.volume = 0;
    song.addEventListener("canplay", function () { settle(true); }, { once: true });
    song.addEventListener("error", function () { settle(false); }, { once: true });
    song.src = CFG.song.file;
    setTimeout(function () { if (!songChecked) settle(song.readyState > 0); }, 4000);
  } else {
    songChecked = true;
  }
  function settle(ok) {
    if (songChecked) return;
    songChecked = true;
    songOk = ok;
    songWaiters.forEach(function (fn) { fn(); });
    songWaiters = [];
  }
  function whenChecked(fn) { songChecked ? fn() : songWaiters.push(fn); }

  // iOS Safari ignores audio.volume (always 1), so fades fall back to pause/play there
  var volumeWorks = (function () {
    try { var a = new Audio(); a.volume = 0.5; return Math.abs(a.volume - 0.5) < 0.01; } catch (e) { return false; }
  })();

  var fadeTimer = null;
  function fadeSong(target) {
    clearInterval(fadeTimer);
    if (!volumeWorks) {
      if (target === 0) song.pause(); else song.play().catch(function () {});
      return;
    }
    fadeTimer = setInterval(function () {
      var v = song.volume + (target > song.volume ? 0.04 : -0.04);
      if (Math.abs(target - song.volume) <= 0.04) {
        song.volume = target;
        clearInterval(fadeTimer);
        if (target === 0) song.pause();
      } else {
        song.volume = Math.max(0, Math.min(1, v));
      }
    }, 40);
  }

  /* ---------- music box fallback ---------- */
  var ctx, master, bus, loopTimer = null;
  var BEAT = 0.52;
  var MELODY = [
    [67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2],
    [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2],
    [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
    [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 3]
  ];
  var BASS = [48, 43, 43, 48, 48, 41, 43, 48];

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function makeImpulse(seconds, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function initBox() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    bus = ctx.createGain();
    bus.connect(master);
    var reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(2.8, 2.6);
    var wet = ctx.createGain();
    wet.gain.value = 0.45;
    bus.connect(reverb);
    reverb.connect(wet);
    wet.connect(master);
  }
  function tine(midi, t, gain, ring) {
    var f = freq(midi);
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    env.connect(bus);
    [[1, 1], [2, 0.28], [3.01, 0.12], [5.4, 0.05]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f * p[0];
      g.gain.value = p[1];
      o.connect(g); g.connect(env);
      o.start(t); o.stop(t + ring + 0.05);
    });
  }
  function scheduleSong(start) {
    var t = start;
    MELODY.forEach(function (n) { tine(n[0], t, 0.22, 1.8); t += n[1] * BEAT; });
    BASS.forEach(function (root, i) {
      var bt = start + (1 + i * 3) * BEAT;
      tine(root, bt, 0.12, 2.4);
      tine(root + 7, bt + BEAT, 0.06, 1.6);
      tine(root + 12, bt + 2 * BEAT, 0.05, 1.4);
    });
    return t - start;
  }
  function loopBox() {
    var len = scheduleSong(ctx.currentTime + 0.1);
    loopTimer = setTimeout(loopBox, (len + 3.2) * 1000);
  }

  var mode = null; // "song" | "box"
  function apply() {
    var on = enabled && !ducked;
    if (mode === "song") {
      if (on) { song.play().catch(function () {}); fadeSong(SONG_VOLUME); }
      else fadeSong(0);
    } else if (mode === "box" && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? VOLUME : 0, ctx.currentTime, 0.25);
    }
  }
  function startBox() {
    if (!AC) return;
    mode = "box";
    if (!ctx) initBox();
    if (ctx.state === "suspended") ctx.resume();
    if (!loopTimer) loopBox();
    apply();
  }

  window.Music = {
    // must be called from a user gesture (tap) so browsers allow audio
    start: function (onMode) {
      if (started) return;
      started = true;
      // iOS 17+: play through the ringer/silent switch like a music app would
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      // unlock both paths inside the gesture, then pick one
      if (song) song.play().then(function () { if (mode !== "song") song.pause(); }).catch(function () {});
      if (AC && !ctx) { initBox(); ctx.resume(); }
      whenChecked(function () {
        if (songOk) {
          mode = "song";
          song.currentTime = 0;
          apply();
        } else {
          startBox();
        }
        if (onMode) onMode(mode);
      });
    },
    toggle: function () { enabled = !enabled; apply(); return enabled; },
    duck: function (on) { ducked = on; apply(); },
    hasSong: function () { return songOk; },
    whenReady: whenChecked
  };
})();
