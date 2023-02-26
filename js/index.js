// get dom
let gif = document.getElementById("gif");
gif.style.top = "500px;";

function getMedia() {
  console.log("click getMedia()");
  navigator.mediaDevices
    .getUserMedia({ video: false, audio: true })
    .then((stream) => {
      console.log(stream);
      start_microphone(stream);
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

function show_some_data(given_typed_array, num_row_to_display, label) {
  var size_buffer = given_typed_array.length;
  var index = 0;

  //   console.log("__________ " + label);

  if (label === "time") {
    // for (; index < num_row_to_display && index < size_buffer; index += 1) {
    //   var curr_value_time = given_typed_array[index] / 128 - 1.0;
    //   console.log(curr_value_time);
    // }
  } else if (label === "frequency") {
    for (; index < num_row_to_display && index < size_buffer; index += 1) {
      if (given_typed_array[index] > 100) {
        console.log(given_typed_array[index]);
      }
    }
  } else {
    throw new Error("ERROR - must pass time or frequency");
  }
}

function process_microphone_buffer(event) {
  var i, N, inp, microphone_output_buffer;

  microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now
}

function start_microphone(stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  var BUFF_SIZE_RENDERER = 16384;

  var audioInput = null,
    microphone_stream = null,
    gain_node = null,
    script_processor_node = null,
    script_processor_analysis_node = null,
    analyser_node = null;
  gain_node = audioContext.createGain();
  gain_node.gain.value = 0;
  gain_node.connect(audioContext.destination);

  microphone_stream = audioContext.createMediaStreamSource(stream);
  microphone_stream.connect(gain_node);

  script_processor_node = audioContext.createScriptProcessor(
    BUFF_SIZE_RENDERER,
    1,
    1
  );
  script_processor_node.onaudioprocess = process_microphone_buffer;

  microphone_stream.connect(script_processor_node);

  // --- enable volume control for output speakers

  //   document.getElementById("volume").addEventListener("change", function () {
  //     var curr_volume = this.value;
  //     gain_node.gain.value = curr_volume;

  //     console.log("curr_volume ", curr_volume);
  //   });

  // --- setup FFT

  script_processor_analysis_node = audioContext.createScriptProcessor(
    2048,
    1,
    1
  );
  script_processor_analysis_node.connect(gain_node);

  analyser_node = audioContext.createAnalyser();
  analyser_node.smoothingTimeConstant = 0;
  analyser_node.fftSize = 2048;

  microphone_stream.connect(analyser_node);

  analyser_node.connect(script_processor_analysis_node);

  var buffer_length = analyser_node.frequencyBinCount;

  var array_freq_domain = new Uint8Array(buffer_length);
  var array_time_domain = new Uint8Array(buffer_length);

  console.log("buffer_length " + buffer_length);

  script_processor_analysis_node.onaudioprocess = function () {
    // get the average for the first channel
    analyser_node.getByteFrequencyData(array_freq_domain);
    analyser_node.getByteTimeDomainData(array_time_domain);

    // draw the spectrogram
    if (microphone_stream.playbackState == microphone_stream.PLAYING_STATE) {
      show_some_data(array_freq_domain, 5, "frequency");
      show_some_data(array_time_domain, 5, "time"); // store this to record to aggregate buffer/file
    }
  };
}

// control DOM

// function startAnalysis() {
//   const AudioContext = window.AudioContext || window.webkitAudioContext;
//   let audioContext = new AudioContext();
//   const oscillator = audioContext.createOscillator();
//   const gainNode = audioContext.createGain();

//   oscillator.type = "sine"; // 正弦波
//   oscillator.frequency.value = 140; // A4 頻率
//   oscillator.detune.value = 0; // 解諧
//   gainNode.gain.value = 1; // 音量

//   oscillator.connect(gainNode);
//   oscillator.start(); // 啟動音源
//   gainNode.connect(audioContext.destination);
// }