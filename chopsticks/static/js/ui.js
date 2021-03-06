// Generated by CoffeeScript 2.3.1
/*
Author: Jason Gwartz
2016
*/
var init_soundnode, ui_init, update_beat_labels, upload_sample, xy_compute;

// Page-load UI code
$(document).ready(function() {
  var ios;
  if (/Safari/.test(navigator.userAgent)) {
    true; // TODO: figure out way to handle refresh-needed bug
  }
  ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (ios) {
    $("#ios-start").modal().on("hidden.bs.modal", function() {
      return main();
    });
  } else {
    main();
  }
  return document.addEventListener("visibilitychange", function() {
    // Uses the PageVisibility API
    if (typeof context === "undefined" || context === null) {
      return;
    }
    if (context.state === "running") {
      return context.suspend();
    } else {
      return context.resume();
    }
  });
});

// Core UI code: initialises the tray with all available nodes,
//   and sets up the canvas with necessary listeners and events,
//   defines behavior for all interactions between nodes
init_soundnode = function(n) {
  $(n.html).appendTo((function() {
    var category_tray;
    category_tray = $(`#sn-${n.category}`);
    if (category_tray.length) {
      return category_tray;
    } else {
      $(`<h3 class="accordion-category">${n.category}</h3>`).appendTo($("#sn-accordion"));
      return $(`<div id=sn-${n.category} ></div>`).appendTo($("#sn-accordion"));
    }
  })()).draggable({
    helper: "clone"
  }).data("SoundNode", n).on("click", function() {
    return $(this).data("SoundNode").instrument.tryout(context.currentTime);
  });
  return $("#sn-accordion").accordion("refresh");
};

ui_init = function() {
  var j, k, len, len1, n, playing, ref, ref1, w;
  // Activate the accordion for the SoundNode objects in the tray
  $("#sn-accordion").accordion({
    heightStyle: "content",
    animate: 100,
    collapsible: true,
    active: false
  });
  ref = SoundNode.tray_instances;
  for (j = 0, len = ref.length; j < len; j++) {
    n = ref[j];
    // add sound nodes to tray
    init_soundnode(n);
  }
  ref1 = [new IfConditional(), new ForLoop()];
  for (k = 0, len1 = ref1.length; k < len1; k++) {
    w = ref1[k];
    
    // add wrappers to tray
    $(w.html).appendTo($("#wrapper-tray")).draggable({
      helper: "clone"
    }).data("Wrapper", w);
  }
  // Init the canvas, draggable/droppable events and click listeners
  //   for the canvas and the node duplicates created on drop
  playing = false; // defined at ui_init() call time, accessed in .drop() below
  $("#node-canvas").droppable({
    hoverClass: "node-canvas-hover",
    tolerance: "pointer",
    drop: function(evt, ui) {
      var new_sn, sn;
      if (!playing) {
        // init playback on first node drop
        playing = true;
        startPlayback();
      }
      if (ui.draggable.hasClass("on-canvas")) {
        return;
      }
      // code path for node-wrappers
      if (ui.draggable.hasClass("node-wrapper")) {
        return ui.draggable.clone().appendTo("#node-canvas").addClass("on-canvas").draggable().data("Wrapper", ui.draggable.data("Wrapper")).position({
          of: evt // code path for Sound Nodes
        });
      } else {
        // adding a new sound node to the canvas
        sn = ui.draggable.data("SoundNode");
        new_sn = new SoundNode(sn.instrument);
        SoundNode.canvas_instances.push(new_sn);
        return $(new_sn.html).appendTo($("#node-canvas")).addClass("on-canvas").data("SoundNode", new_sn).data("live", true).position({
          of: evt
        }).each(function() {
          return xy_compute(this);
        }).draggable({
          helper: "original",
          scope: "canvas",
          distance: 15,
          drag: function(evt, ui) {
            // implemented only for one instance of a SoundNode at a time
            return xy_compute(this);
          },
          stop: function(evt, ui) {
            return $(evt.toElement).one('click', function(e) {
              return e.stopImmediatePropagation();
            });
          }
        // source: http://stackoverflow.com/questions/3486760/
        // how-to-avoid-jquery-ui-draggable-from-also-triggering-click-event
        }).on("click", function(e) {
          var ns;
          if (!$(e.target).hasClass("node-toggle")) {
            return;
          }
          ns = $(this).find(".node-sample");
          if ($(this).data("live")) {
            ns.addClass("node-disabled");
            return $(this).data("live", false);
          } else {
            ns.removeClass("node-disabled");
            return $(this).data("live", true);
          }
        }).droppable({
          accept: ".node-wrapper",
          greedy: true,
          tolerance: "pointer",
          drop: function(evt, ui) {
            if (ui.draggable.hasClass("on-canvas")) {
              w = ui.draggable;
            } else {
              w = ui.draggable.clone();
            }
            return w.appendTo($(this).find(".wrappers")).position({
              of: $(this).find(".node-sample"),
              my: "bottom",
              at: "top"
            }).css("top", "0px").data("Wrapper", ui.draggable.data("Wrapper")).data({
              "live": true
            // .data() calls may be duplicated if node was
            // already on canvas, but are necessary if not
            }).on("click", "*:not(input,select)", function() {
              if ($(this).parent().data("live")) {
                return $(this).parent().addClass("node-disabled").data("live", false);
              } else {
                return $(this).parent().removeClass("node-disabled").data("live", true);
              }
            }).on("click", "input", function() {
              return $(this).focus();
            });
          }
        }).find(".wrappers").sortable({
          stop: function(evt, ui) {}
        });
      }
    }
  });
  // Drop node back on tray to disable
  // done sorting
  return $("#node-tray").droppable({
    scope: "canvas",
    drop: function(evt, ui) {
      return ui.draggable.remove();
    }
  });
};

// UI Utility Functions
xy_compute = function(t) {
  var canvas, gain, lpf, sn;
  // Parameter input is a jQuery object, including .data parameter of
  //   node's corresponding SoundNode lang object
  canvas = $("#node-canvas");
  sn = $(t).find(".node-sample");
  // gain is currently based on SoundNode
  // may consider changing it to node-container
  gain = 1 - (sn.offset().top - canvas.offset().top) / canvas.height();
  lpf = Instrument.compute_filter(sn.offset().left / canvas.width());
  $(t).data().SoundNode.instrument.gain.gain.value = gain;
  return $(t).data().SoundNode.instrument.filter.frequency.value = lpf;
};

// Upload sample from desktop
upload_sample = function(fp_list) {
  var reader, uploaded;
  uploaded = new Instrument(fp_list[0].name.split(".")[0], {
    "category": "Uploaded"
  // This is a hack to avoid globals - maybe give up?
  }, Instrument.instances[0].gain.context.destination);
  uploaded.sample = new LoadedSample();
  reader = new FileReader();
  reader.onload = function(file) {
    var sn;
    uploaded.sample.decode(file.target.result);
    sn = new SoundNode(uploaded);
    init_soundnode(sn);
    return SoundNode.tray_instances.push(sn);
  };
  return reader.readAsArrayBuffer(fp_list[0]);
};

update_beat_labels = function() {
  var i, n, ref, results;
  ref = {
    "phrase": phrase,
    "beat": beat,
    "bar": bar
  };
  results = [];
  for (n in ref) {
    i = ref[n];
    // Small function to set UI labels to values at call-time
    results.push($(`#${n}_label`).text(i));
  }
  return results;
};
