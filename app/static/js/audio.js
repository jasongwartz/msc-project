// Generated by CoffeeScript 1.10.0

/*
Author: Jason Gwartz
2016
 */
var Instrument, JGAnalyser, LoadedSample, analyser, bar, beat, beat_increment, context, main, phrase, playing, startPlayback, tempo,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

context = null;

analyser = null;

phrase = 1;

beat = 0;

bar = 1;

tempo = 500.0;

playing = false;

LoadedSample = (function() {
  function LoadedSample(file, stretch) {
    var request;
    this.file = file;
    this.stretch = stretch != null ? stretch : null;
    request = new XMLHttpRequest();
    request.open('GET', this.file, true);
    request.responseType = 'arraybuffer';
    request.onload = (function(_this) {
      return function() {
        _this.data = request.response;
        return context.decodeAudioData(_this.data, function(decoded) {
          return _this.decoded = decoded;
        }, function(e) {
          return console.log("Error loading:" + this.file + e);
        });
      };
    })(this);
    request.send();
  }

  LoadedSample.prototype.play = function(output, n) {
    var source;
    if (isNaN(n)) {
      return;
    }
    source = context.createBufferSource();
    source.buffer = this.decoded;
    source.playbackRate.value = (function(_this) {
      return function() {
        if (_this.stretch != null) {
          return _this.decoded.duration / (tempo / 1000 * _this.stretch);
        } else {
          return 1;
        }
      };
    })(this)();
    source.connect(output);
    source.start(n);
    return [n, source];
  };

  return LoadedSample;

})();

Instrument = (function() {
  Instrument.instances = [];

  Instrument.maxFrequency = null;

  function Instrument(name, data, output) {
    this.name = name;
    this.data = data;
    if (Instrument.maxFrequency == null) {
      Instrument.computeMaxFrequency();
    }
    Instrument.instances.push(this);
    this.pattern = [];
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = Instrument.maxFrequency;
    this.gain = context.createGain();
    this.filter.connect(this.gain);
    this.gain.connect(output);
  }

  Instrument.prototype.load = function() {
    if (this.data.beat_stretch != null) {
      return this.sample = new LoadedSample(this.data.file, this.data.beat_stretch);
    } else {
      return this.sample = new LoadedSample(this.data.file);
    }
  };

  Instrument.prototype.is_loaded = function() {
    return this.sample.decoded != null;
  };

  Instrument.prototype.add = function(b) {
    if (indexOf.call(this.pattern, b) < 0) {
      return this.pattern.push(b);
    }
  };

  Instrument.prototype.play = function(time) {
    var i, j, len, previous_buffer, ref, results;
    previous_buffer = null;
    ref = this.pattern;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results.push(((function(_this) {
        return function() {
          var b;
          b = (i - 1) * tempo / 1000 + time;
          if ((previous_buffer != null) && (previous_buffer[0] + _this.sample.decoded.duration >= b)) {
            previous_buffer[1].stop(b);
          }
          return previous_buffer = _this.sample.play(_this.filter, b);
        };
      })(this))());
    }
    return results;
  };

  Instrument.prototype.tryout = function(time) {
    return this.sample.play(this.filter, time);
  };

  Instrument.reset = function() {
    var i, j, len, ref, results;
    ref = Instrument.instances;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results.push(i.pattern = []);
    }
    return results;
  };

  Instrument.computeMaxFrequency = function() {
    return Instrument.maxFrequency = context.sampleRate / 2;
  };

  Instrument.compute_filter = function(rate) {
    var minValue, mult, numberOfOctaves;
    minValue = 40;
    numberOfOctaves = Math.log(Instrument.maxFrequency / minValue) / Math.LN2;
    mult = Math.pow(2, numberOfOctaves * (rate - 1.0));
    return Instrument.maxFrequency * mult;
  };

  return Instrument;

})();

JGAnalyser = (function() {
  function JGAnalyser() {
    this.draw = bind(this.draw, this);
    this.node = context.createAnalyser();
    this.node.fftSize = 2048;
    this.bufferLength = this.node.fftSize;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.canvas = document.getElementById("visual");
    this.HEIGHT = 30;
    this.WIDTH = $(this.canvas).parent().width();
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.canvasCtx = this.canvas.getContext("2d");
    this.canvasCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
  }

  JGAnalyser.prototype.set_black = function() {
    return this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
  };

  JGAnalyser.prototype.set_red = function() {
    return this.canvasCtx.strokeStyle = 'rgb(255, 0, 0)';
  };

  JGAnalyser.prototype.draw = function() {
    var drawVisual, i, j, ref, sliceWidth, v, x, y;
    this.WIDTH = $(this.canvas).parent().width();
    this.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    drawVisual = requestAnimationFrame(this.draw);
    this.node.getByteTimeDomainData(this.dataArray);
    this.canvasCtx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.beginPath();
    sliceWidth = this.WIDTH * 1.0 / this.bufferLength;
    x = 0;
    for (i = j = 0, ref = this.bufferLength; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      v = this.dataArray[i] / 128.0;
      y = v * this.HEIGHT / 2;
      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
    return this.canvasCtx.stroke();
  };

  return JGAnalyser;

})();

startPlayback = function() {
  var instrument, j, k, len, len1, ref, ref1, s;
  Instrument.reset();
  ref = SoundNode.canvas_instances;
  for (j = 0, len = ref.length; j < len; j++) {
    s = ref[j];
    s.phrase_eval();
  }
  ref1 = Instrument.instances;
  for (k = 0, len1 = ref1.length; k < len1; k++) {
    instrument = ref1[k];
    instrument.play(context.currentTime);
  }
  beat_increment();
  analyser.set_black();
  setTimeout(function() {
    return analyser.set_red();
  }, tempo * 16 - tempo * 2);
  return setTimeout(function() {
    return startPlayback();
  }, tempo * 16);
};

beat_increment = function() {
  beat += 1;
  update_beat_labels();
  switch (false) {
    case !(bar === 4 && beat === 4):
      beat = 0;
      bar = 1;
      return phrase += 1;
    case !(bar !== 4 && beat === 4):
      beat = 0;
      bar += 1;
      return setTimeout(function() {
        return beat_increment();
      }, tempo);
    default:
      return setTimeout(function() {
        return beat_increment();
      }, tempo);
  }
};

main = function() {
  var final_gain, output_chain;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
  output_chain = context.createGain();
  final_gain = context.createGain();
  analyser = new JGAnalyser();
  analyser.draw();
  output_chain.connect(analyser.node);
  analyser.node.connect(final_gain);
  final_gain.connect(context.destination);
  return $.getJSON("static/sampledata.json", function(result) {
    var d, i, init_samples, j, k, len, len1, ref, ref1, sample_data, v;
    sample_data = result;
    for (d in sample_data) {
      v = sample_data[d];
      new Instrument(d, v, output_chain);
    }
    ref = Instrument.instances;
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      i.load();
    }
    ref1 = Instrument.instances;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      i = ref1[k];
      SoundNode.tray_instances.push(new SoundNode(i));
    }
    ui_init();
    init_samples = function() {
      var l, len2, ready, ref2;
      ready = true;
      ref2 = Instrument.instances;
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        i = ref2[l];
        if (!i.is_loaded()) {
          ready = false;
        }
      }
      if (!ready) {
        console.log("Still loading: " + ((function() {
          var len3, m, ref3, results;
          ref3 = Instrument.instances;
          results = [];
          for (m = 0, len3 = ref3.length; m < len3; m++) {
            i = ref3[m];
            if (!i.is_loaded()) {
              results.push(" " + i.name);
            }
          }
          return results;
        })()));
        return setTimeout(init_samples, 100);
      } else {
        return console.log("All samples loaded.");
      }
    };
    return init_samples();
  });
};
