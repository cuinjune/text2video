
async function postTextData(text, voiceId) {
  const url = "/api/v1/speech";
  const options = { method: "POST", headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, voiceId: voiceId }) };
  const res = await fetch(url, options);
  const json = await res.json();
  return json;
}


document.getElementById("preview").addEventListener("click", async function () {

  const text = document.getElementById("textarea").value;
  if (text) {
    let commands = [];
    let plainText = "";
    let index = 0;
    let stack = [];

    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (char === "[") {
        stack.push({index: index, i: i});
      }
      else if (char == "]") { // should grab until (..)
        if (stack.length) {
          i++;
          if (i < text.length && text.charAt(i) === "(") {
            const opi = i;
            let url = "";
            let isClosed = false;
            for (i++; i < text.length; i++) {
              const char = text.charAt(i);
              if (char === ")") {
                isClosed = true;
                break;
              }
              else {
                url += char;
              }
            }
            if (isClosed) {
              const command = {
                start: stack[stack.length - 1].index,
                end: index,
                url: url
              }
              commands.push(command);
              stack.pop();
            }
            else {
              alert(`Error: The closing parenthesis is missing after the opening parenthesis at index ${opi}.`);
              return;
            }
          }
          else {
            alert(`Error: Parentheses are missing after the closing bracket at index ${i}.`);
            return;
          }
        }
        else {
          alert(`Error: An unopened closing bracket found at index ${i}.`);
          return;
        }
      }
      else {
        plainText += char;
        index++;
      }
    }
    if (stack.length) {
      const i = stack[stack.length - 1].i;
      alert(`Error: An unclosed opening bracket found at index ${i}.`);
      return;
    }

    console.log(commands);

    const data = await postTextData(plainText, "Kimberly");
    if (data.error) {
      alert("Error:", data.error);
      return;
    }

    const audioData = data.audioData;
    const audioSrc = "data:audio/mp3;base64," + audioData.fileContent;
    const audio = new Audio();
    audio.src = audioSrc;
    audio.load();
    audio.play();

    const markData = data.markData;
    console.log(markData);
  }
  else {
    alert("Please type any text to preview the video.");
  }
});



document.getElementById("start").addEventListener("click", function () {
  var frameRate = 24;
  const videoLength = 0.1 * 60000;
  const frameTime = 1000 / frameRate;
  var numFrames = videoLength / frameTime;

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 1280;
  canvas.height = 720;

  var progressElem = document.getElementById("progress");
  progressElem.innerHTML = "";
  var progressNode = document.createTextNode("");
  progressElem.appendChild(progressNode);

  var videoLinkElem = document.getElementById("videoLink");
  videoLinkElem.innerHTML = "";

  function onProgress(progress) {
    progressNode.nodeValue = (progress * 100).toFixed(1) + "%";
    if (progress == 1) {
      progressElem.innerHTML = "";
    }
  }

  function showVideoLink(url, size) {
    size = size ? (" [size: " + (size / 1024 / 1024).toFixed(1) + "meg]") : " [unknown size]";
    var a = document.createElement("a");
    a.href = url;
    var filename = url;
    var slashNdx = filename.lastIndexOf("/");
    if (slashNdx >= 0) {
      filename = filename.substr(slashNdx + 1);
    }
    a.download = filename;
    a.appendChild(document.createTextNode(filename + size));
    videoLinkElem.appendChild(a);
  }

  var capturer = new CCapture({
    format: 'ffmpegserver',
    verbose: false,
    framerate: frameRate,
    onProgress: onProgress,
    name: "untitled",
    videoLength: videoLength,
    speechData: [
      {
        text: "Hello World!",
        voiceId: "Kimberly",
        start: 0
      },
      {
        text: "My name is Zack!",
        voiceId: "Kimberly",
        start: 2000
      }
    ],
    audioData: [
      {
        url: "http://s5.qhres.com/static/465f1f953f1e6ff2.mp3",
        start: 1000
      },
      {
        url: "https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3",
        start: 3000
      }
    ]
  });
  const start_time = +new Date;

  capturer.start();
  let frameNum = 0;
  function capture() {
    if (frameNum < numFrames) {
      const index = frameNum / numFrames;
      ctx.fillStyle = "yellow";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.rect(canvas.width * index, 20, 50, 30);
      ctx.stroke();
      capturer.capture(canvas);
      frameNum++;
      setTimeout(capture, 4);
    }
    else {
      capturer.stop();
      capturer.save(showVideoLink);
      const end_time = +new Date;
      console.log("Compiled Video in " + (end_time - start_time) + "ms");
    }
  }
  capture();
});