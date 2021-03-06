
jsPsych.plugins['int-bind'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('int-bind', 'stimulus', 'audio');

  plugin.info = {
    name: 'int-bind',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The audio to be played.'
      },
      clock_diam: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Clock diameter',
        default: '',
        description: 'The diameter of the clock in pixels.'
      },
    }
  }

  plugin.trial = function(display_element, trial) {


    //Create a canvas element and append it to the DOM
    var canvas = document.createElement("canvas");
    display_element.appendChild(canvas); 
    
    //The document body IS 'display_element' (i.e. <body class="jspsych-display-element"> .... </body> )
    var body = document.getElementsByClassName("jspsych-display-element")[0];
    
    //Remove the margins and paddings of the display_element
    body.style.margin = 0;
    body.style.padding = 0;

    //Remove the margins and padding of the canvas
    canvas.style.margin = 0;
    canvas.style.padding = 0;   
    
    //Get the context of the canvas so that it can be painted on.
    var ctx = canvas.getContext("2d");

    //Declare variables for width and height, and also set the canvas width and height to the window width and height
    canvas.width = trial.clock_diam*2;
    canvas.height = trial.clock_diam*2;
    var middle_x = canvas.width / 2;
    var middle_y = canvas.height / 2;

    trial_data = {};

    function clear_screen() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // clock object
    var clock = {
      diameter: trial.clock_diam,
      radius: trial.clock_diam/2,
      theta: null,
      update_theta: function(delta_theta) {
        clock.theta = clock.theta + delta_theta;
        clock.theta = clock.theta % (Math.PI * 2);
      },
      draw_face: function() {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        // Circle
        ctx.beginPath();
        ctx.arc(middle_x, middle_y, clock.radius, 0, 2 * Math.PI);
        ctx.stroke();
        // Tick marks and numbers
        var tick_len = 2/30*clock.diameter;
        var i, tick_theta;
        for (i = 5; i <= 60; i += 5) {
          tick_theta = Math.PI/2 - 2*Math.PI*i/60;
          // Tick marks
          ctx.beginPath();
          ctx.moveTo(
            middle_x + clock.radius*Math.cos(tick_theta),
            middle_y - clock.radius*Math.sin(tick_theta)
          );
          ctx.lineTo(
            middle_x + (clock.radius + tick_len)*Math.cos(tick_theta),
            middle_y - (clock.radius + tick_len)*Math.sin(tick_theta)
          );
          ctx.stroke();
          // Numbers
          ctx.font = "5mm Arial";
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText(
            i,
            middle_x + (clock.radius + 2*tick_len)*Math.cos(tick_theta),
            middle_y - (clock.radius + 2*tick_len)*Math.sin(tick_theta)
          );
        }
      },
      fix_col: 'black',
      draw_fix: function() {
        var prior_ss = ctx.strokeStyle;
        ctx.strokeStyle = clock.fix_col;
        var fix_len = 2/30*clock.diameter/2;
        var x = [1, 0, -1, 0];
        var y = [0, 1, 0, -1];
        var i;
        for (i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(middle_x, middle_y);
          ctx.lineTo(
            middle_x + x[i]*fix_len,
            middle_y + y[i]*fix_len
          );
          ctx.stroke();
        }
        ctx.strokeStyle = prior_ss;
      },
      hand_col: 'black',
      draw_hand: function() {
        var hand_len = 11/30*clock.diameter;
        var prior_ss = ctx.strokeStyle;
        ctx.strokeStyle = clock.hand_col;
        ctx.beginPath();
        ctx.moveTo(middle_x, middle_y);
        ctx.lineTo(
          middle_x + hand_len*Math.cos(clock.theta),
          middle_y - hand_len*Math.sin(clock.theta)
        );
        ctx.stroke();
        ctx.strokeStyle = prior_ss;
      },
      period: 2560,
      stop: false,
      t_0: null, // when rotation began
      theta_0: null, // initial hand angle
      t_last: null,
      raf_id: null, // requestAnimationFrame ID
      animate: function() {
        timestamp = performance.now();
        if (clock.stop) {
          // stop animation
          window.cancelAnimationFrame(clock.raf_id);
          // draw empty face
          clear_screen();
          clock.draw_face();
          clock.draw_fix();
          // reset
          clock.stop = false;
          clock.t_last = null;
          clock.raf_id = null;
        } else {
          clock.raf_id = window.requestAnimationFrame(clock.animate);
          if (clock.t_0 == null) {
            // first call
            clock.t_0 = timestamp;
            clock.theta_0 = clock.theta;
            clock.t_last = timestamp;
          } else {
            // compute elapsed time and update theta
            var elapsed_ms = timestamp - clock.t_last;
            clock.t_last = timestamp;
            var delta_theta = elapsed_ms / clock.period * Math.PI * 2;
            clock.update_theta(-delta_theta);
          }
          // draw stimuli
          clear_screen();
          clock.draw_face();
          clock.draw_fix();
          clock.draw_hand();
        }
      }
    };

    // rotator object, which responds to keyboard input and moves the clock hand
    var rotator = {
      update_clock: function(direction) {
        fac = 0;
        if (direction == 'left') {
          fac = 1;
        } else if (direction == 'right') {
          fac = -1;
        }
        var delta_theta = fac * 2*Math.PI/500;
        clock.update_theta(delta_theta);
        // draw clock
        clear_screen();
        clock.draw_face();
        clock.draw_fix();
        clock.draw_hand();
      }
    };

    // load audio
    var context = jsPsych.pluginAPI.audioContext();
    if(context !== null){
      var source = context.createBufferSource();
      source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
      source.connect(context.destination);
    } else {
      var audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
      audio.currentTime = 0;
    }

    function ctrl_fcn(ctrl) {
      // this is the big control flow function. depending
      // on the value of ctrl, it initiates different parts
      // of the trial
      if (ctrl == 'start') { // begin a new trial
        // draw initial yellow cross
        clear_screen();
        clock.fix_col = 'yellow';
        clock.draw_face();
        clock.draw_fix();
        // wait 400 ms, then start rotating the clock hand
        clock.theta = Math.random()*Math.PI*2;
        setTimeout(function() {
          // begin rotating the clock hand
          clock.fix_col = 'black';
          clock.hand_col = 'black';
          window.requestAnimationFrame(clock.animate);
          // record response
          jsPsych.pluginAPI.getKeyboardResponse({
            valid_responses: jsPsych.ALL_KEYS,
            rt_method: 'performance',
            persist: false,
            allow_held_key: false,
            callback_function: function(info) {
              // compute clock theta at the time of response
              trial_data.rt_theta = ((info.rt - clock.t_0) / clock.period * Math.PI * 2) % (Math.PI * 2);
              ctrl_fcn('tone');
            }
          });
        }, 400);
      } else if (ctrl == 'tone') { // play the tone
        // schedule tone
        setTimeout(function() {
          // play the tone
          if(context !== null){
            startTime = context.currentTime;
            source.start(startTime);
          } else {
            audio.play();
          }
          // record cock hand angle of audio
          trial_data.tone_theta = clock.theta;
          // schedule end of clock rotation
          setTimeout(function() {
            clock.stop = true;
            // schedule beginning of estimation
            setTimeout(function() {
              ctrl_fcn('estimate');
            }, 1000)
          }, 1000);
        }, 250);
      } else if (ctrl == 'estimate') { // estimate the time of the tone
        // pass control to the rotator object
        jsPsych.pluginAPI.getKeyboardResponse({
          valid_responses: jsPsych.ALL_KEYS,
          rt_method: 'performance',
          persist: true,
          allow_held_key: true,
          callback_function: function(info) {
            if (info.key == 37) {
              rotator.update_clock('left');
            } else if (info.key == 39) {
              rotator.update_clock('right');
            } else if (info.key == 13) {
              // record estimated tone theta
              trial_data.est_theta = clock.theta;
              jsPsych.pluginAPI.cancelAllKeyboardResponses();
              ctrl_fcn('end');
            }
          }
        });
        clock.theta = trial_data.tone_theta;
        clock.hand_col = 'green';
        rotator.update_clock();
      } else if (ctrl == 'end') {
        end_trial();
      }
    }

    // store response
    var response = {
      rt: null,
      key: null
    };

    // function to end trial when it is time
    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // start the trial
    ctrl_fcn('start');

  };
  return plugin;
})();
