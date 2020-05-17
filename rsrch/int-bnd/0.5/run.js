
var timeline = [];

timeline.push({
	type: 'fullscreen',
	fullscreen_mode: true
});

baseline_operant_instructions = [
	'Watch the clock.',
	'Press the space bar whenever you feel like it.',
	'When the clock hand turns green, use the left and right arrow keys to move it to where it was when you pressed space.',
	'When you are satisfied with your selection, press enter.'
];

baseline_tone_instructions = [
	'Watch the clock.',
	'Press the space bar whenever you feel like it.',
	'After you press the space bar, you will hear a tone.',
	'When the clock hand turns green, use the left and right arrow keys to move it to where it was when the tone began.',
	'When you are satisfied with your selection, press enter.'	
];

operant_instructions = [
	'Watch the clock.',
	'Press the space bar whenever you feel like it.',
	'After you press the space bar, you will hear a tone.',
	'When the clock hand turns green, use the left and right arrow keys to move it to where it was when the tone began.',
	'When you are satisfied with your selection, press enter.'	
];

baseline_operant_block = [{
		type: 'instructions',
		pages: baseline_operant_instructions,
		show_clickable_nav: true,
		post_trial_gap: 1000
	}, {
		type: 'int-bind',
		clock_diam: 200,
		tone_file: 'tone.mp3',
		tone: false,
		hand_inc: 0.05
	}
];

baseline_tone_block = [{
		type: 'instructions',
		pages: baseline_tone_instructions,
		show_clickable_nav: true,
		post_trial_gap: 1000
	}, {
		type: 'int-bind',
		clock_diam: 200,
		tone_delay: 1000,
		tone_file: 'tone.mp3',
		key_press: false,
		hand_inc: 0.05
	}
];

operant_block = [{
		type: 'instructions',
		pages: operant_instructions,
		show_clickable_nav: true,
		post_trial_gap: 1000
	}, {
		type: 'int-bind',
		clock_diam: 200,
		tone_file: 'tone.mp3',
		hand_inc: 0.05
	}
];

// Randomize blocks
blocks = jsPsych.randomization.repeat(
	[
		baseline_operant_block,
		baseline_tone_block,
		operant_block
	], 1
);

var i;
for (i = 0; i < blocks.length; i++) {
	timeline = timeline.concat(blocks[i]);
}

jsPsych.init({
	timeline: timeline
});