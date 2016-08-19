###
Author: Jason Gwartz
2016
###

canvas_init = ->

  glob = @ # to pass global vars to evt listeners

  $("#node-canvas").droppable({
    hoverClass: "node-canvas-hover",
    tolerance: "pointer",
    drop: (evt, ui) ->
      if ui.draggable.hasClass("on-canvas")
        return
      # code path for node-wrappers
      if ui.draggable.hasClass("node-wrapper")
      
        ui.draggable.clone().appendTo("#node-canvas")
          .addClass("on-canvas")
          .draggable()
          .data("Wrapper", ui.draggable.data("Wrapper"))
          .position(
            {
              of: evt
            }
          )
          #.data("live": true)
          # .on("click", "*:not(input,select)", ->
          #   if $(@).parent().data("live")
          #     $(@).parent().addClass("node-disabled")
          #       .data("live", false)
          #   else
          #     $(@).parent().removeClass("node-disabled")
          #       .data("live", true)
          #   )
          
      else # code path for Sound Nodes
        # adding a new sound node to the canvas
        sn = ui.draggable.data("SoundNode")
        new_sn = new SoundNode(sn.instrument)
        SoundNode.canvas_instances.push(new_sn)

        $(new_sn.html).appendTo($("#node-canvas"))
          .addClass("on-canvas")
          .data("SoundNode", new_sn)
          .data("live", true)
          .position(
            {
              of: evt
            }
          )
          .draggable(
            {
              helper:"original",
              scope:"canvas",
              distance: 15
              drag: (evt, ui) ->
                canvas = $("#node-canvas")
                sn = $(@).find(".node-sample")
                
                gain = 1 - (
                  sn.offset().top - canvas.offset().top
                ) / canvas.height()
                # gain is currently based on SoundNode
                # may consider changing it to node-container
                $(@).data()
                  .SoundNode.instrument
                  .gain.gain.value = gain
                
                lpf = Instrument.compute_filter(
                  sn.offset().left / canvas.width()
                  )

                $(@).data()
                  .SoundNode.instrument
                  .filter.frequency.value = lpf
              start: (evt, ui) ->
              stop: (evt, ui) ->
            }
          )
          .droppable(
            {
              accept: ".node-wrapper",
              greedy: true,
              tolerance:"pointer",
              drop: (evt, ui) ->
                if ui.draggable.hasClass("on-canvas")
                  w = ui.draggable
                else
                  w = ui.draggable.clone()

                w.appendTo($(this).find(".wrappers"))
                  .position(
                    {
                      of: $(this).find(".node-sample"),
                      my: "bottom",
                      at: "top"
                    }
                  ).css("top", "0px")
                  .data("Wrapper", ui.draggable.data("Wrapper"))
                  .data("live": true)
                  # .data() calls may be duplicated if node was
                    # already on canvas, but are necessary if not
                  .on("click", "*:not(input,select)", ->
                    if $(@).parent().data("live")
                      $(@).parent().addClass("node-disabled")
                        .data("live", false)
                    else
                      $(@).parent().removeClass("node-disabled")
                        .data("live", true)
                  )
            }
          )
          .find(".wrappers").sortable(
            {
              stop: (evt, ui) ->
                # done sorting
            }
          )
          .parent().find(".node-sample").on("click", (e) ->
            if $(@).hasClass(".ui-draggable-dragging")
              return # this doesn't solve the issue
            if $(@).parent().data("live")
              $(@).addClass("node-disabled")
                .parent().data("live", false)
            else
              $(@).removeClass("node-disabled")
                .parent().data("live", true)
            )
            
      if not glob.playing
        # init playback on first node drop
        glob.playing = true
        startPlayback(output_chain)
  })

  # Drop node back on tray to disable
  $("#node-tray").droppable({
    scope:"canvas",
    drop: (evt, ui) ->
      # Handles children of wrapper
      sn = ui.draggable.find(".node-sample").data("SoundNode")
      ui.draggable.remove()
  })

ui_init = ->

  canvas_init() # changed to happen in ui_init call, not on document.ready()

  # add sound nodes to tray
  $(n.html).appendTo($("#sn-tray"))
    .draggable(
      {
        helper:"clone"
      }
    )
    .data("SoundNode", n) for n in SoundNode.tray_instances

  # add wrappers to tray
  $(w.html).appendTo($("#wrapper-tray"))
    .draggable(
      {
        helper:"clone"
      }
    ).data("Wrapper", w) for w in [new IfConditional(), new ForLoop()]


update_beat_labels = ->
  $("##{ n }_label").text(i) for n, i of {
    "phrase": phrase,
    "beat": beat,
    "bar": bar
  }