class Wrapper
  # If condition, on_beats, for loop
  @instances = []
  constructor: (@check, @sound_node, @div) -> # TODO: create subclasses?
    Wrapper.instances.push(this)


# TODO: conditional not yet implemented
if_conditional = new Wrapper( (condition_to_check, input) ->
  input = (parseInt(i) for i in input.replace(/\D/g," ").split(" "))
  if condition_to_check is "phrase"
    # var phrase is singleton from other .js file
    return (phrase + 1) in input # returns true if playing on next phrase
  else if condition_to_check is "beat"
    @sound_node.instrument.play(i) for i in input # TODO: implement
    return true # If no phrase specified, assume to be true
)

# TODO: for loop not yet implemented
for_loop = new Wrapper( (number_loops, loop_block) ->
  if loop_block is "phrase"
    pass()
  else if loop_block is "bars"
    pass()
  else if loop_block is "beats"
    pass()
)

class SoundNode
  @tray_instances = []
  @canvas_instances = []
  constructor: (@instrument) ->
    @id = @instrument.name
    @wrappers = []
    @html = """
      <div class="node node-sample" id="#{ @instrument.name }">
        <h2>#{ @instrument.name }</h2>
      </div>"""

  get_wrappers: ->
    w = $("#{ @instrument.name }").parentsUntil("#node-canvas")
    console.log(w)
  phrase_eval: ->
    for w in wrappers
      w.check() #### TODO: Implement
