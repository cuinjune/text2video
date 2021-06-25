let commands = [];
let startTime = 0;
let videoLength = 0;
let ttsAudio = null;
let isCapturing = false;
let currentFrameTime = 0;
const maxNumWordsPerSubtitle = 18;
const blockWidthRatio = 1.0;
const blockHeightRatio = 1.0;
const subtitleHeightRatio = 0.25;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1280;
canvas.height = 720;
const corsPrefix = "http://localhost:8080/";

// elements
const textArea = document.getElementById("textArea");
const example = document.getElementById("example");
const preview = document.getElementById("preview");
const download = document.getElementById("download");

function drawImageInBlock(image, x, y, width, height) {
  const wrh = image.width / image.height;
  let newWidth = width;
  let newHeight = newWidth / wrh;
  if (newHeight > height) {
    newHeight = height;
    newWidth = newHeight * wrh;
  }
  const offsetX = newWidth < width ? ((width - newWidth) / 2) : 0;
  const offsetY = newHeight < height ? ((height - newHeight) / 2) : 0;
  ctx.drawImage(image, x + offsetX, y + offsetY, newWidth, newHeight);
}

function drawTextInBlock(text, x, y, width, height) {
  const paragraphs = text.split("\n");
  const lineHeight = ctx.measureText("M").width * 1.5;
  const textLines = [];
  for (let p = 0; p < paragraphs.length; p++) {
    let line = "";
    const words = paragraphs[p].split(" ");
    for (let w = 0; w < words.length; w++) {
      const testLine = line + words[w] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > width) {
        textLines.push(line.trim());
        line = words[w] + " ";
      }
      else {
        line = testLine;
      }
    }
    textLines.push(line.trim());
  }
  y = y - ((textLines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < textLines.length; i++) {
    ctx.fillStyle = "black";
    ctx.strokeText(textLines[i], x + width / 2, y + height / 2);
    ctx.fillStyle = 'white';
    ctx.fillText(textLines[i], x + width / 2, y + height / 2);
    y += lineHeight;
  }
}

function drawObjectsInBlock(objects) {
  const numObjects = objects.length;
  if (!numObjects) {
    return;
  }
  const blockMaxWidth = canvas.width * blockWidthRatio / numObjects;
  const blockMaxHeight = canvas.height;
  const blockOffsetX = blockMaxWidth * (1 - blockWidthRatio) / 2;
  const blockOffsetY = blockMaxHeight * (1 - blockHeightRatio) / 2;
  const blockWidth = blockMaxWidth * blockWidthRatio;
  const blockHeight = blockMaxHeight * blockHeightRatio;
  const drawObjectInBlock = typeof (objects[0]) === "string" ? drawTextInBlock : drawImageInBlock;
  for (let i = 0; i < numObjects; i++) {
    const x = i * blockMaxWidth + blockOffsetX + canvas.width * (1 - blockWidthRatio) / 2;
    const y = blockOffsetY;
    const width = blockWidth;
    const height = blockHeight;
    drawObjectInBlock(objects[i], x, y, width, height);
  }
}

function draw() {
  let elapsedTime = 0;
  if (!isCapturing) {
    const currentTime = new Date();
    elapsedTime = currentTime - startTime;
  }
  else {
    elapsedTime = currentFrameTime;
  }
  if (elapsedTime >= videoLength) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(50, 54, 57)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let images = [];
  let texts = [];
  let subtitle = "";

  for (const command of commands) {
    if (elapsedTime >= command.start) {
      if (elapsedTime < command.end) {
        switch (command.type) {
          case "audio":
            let audio = command.object;
            if (!isCapturing && audio && audio.paused) {
              audio.play();
              audio.onended = function () {
                audio = null;
              }
            }
            break;
          case "video":
            let video = command.object;
            if (video) {
              if (video.paused) {
                video.play();
                video.onended = function () {
                  video = null;
                }
              }
              else {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              }
            }
            break;
          case "image":
            const image = command.object;
            images.push(image);
            break;
          case "text":
            const text = command.value;
            texts.push(text);
            break;
          case "subtitle":
            subtitle = command.value;
            break;
        }
      }
      else {
        switch (command.type) {
          case "audio":
            let audio = command.object;
            if (!isCapturing && audio && !audio.paused) {
              audio.pause();
              audio = null;
            }
            break;
          case "video":
            let video = command.object;
            if (video && !video.paused) {
              video.pause();
              video = null;
            }
            break;
        }
      }
    }
  }
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.shadowColor = "black";
  ctx.shadowBlur = 10;

  if (images.length) {
    drawObjectsInBlock(images);
  }
  if (texts.length) {
    ctx.font = "bold 60px Helvetica";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.lineWidth = 6;
    drawObjectsInBlock(texts);
  }
  if (subtitle.length) {
    ctx.font = "45px Helvetica";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.lineWidth = 4.5;
    const width = canvas.width * blockWidthRatio;
    const height = canvas.height * subtitleHeightRatio;
    const x = canvas.width * (1 - blockWidthRatio) / 2;
    const y = canvas.height * (1 - subtitleHeightRatio);
    drawTextInBlock(subtitle, x, y, width, height);
  }
  if (!isCapturing) {
    requestAnimationFrame(draw);
  }
}

function getDistributedArray(n, max) {
  let a = [];
  let r = n;
  let c = Math.ceil(n / max); // get maximal number of elements in array
  let i = 0;
  while (r > 0) {
    let t = Math.ceil(r / c); // get max number below max
    a[i++] = t;
    r -= t;
    c--;
  }
  return a;
}

function pauseAllPlayingAudio() {
  if (ttsAudio && !ttsAudio.paused) {
    ttsAudio.pause();
    ttsAudio.currentTime = 0;
  }
  for (const command of commands) {
    if (command.type === "audio") {
      let audio = command.object;
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    }
  }
}

function pauseAllPlayingVideo() {
  for (const command of commands) {
    if (command.type === "video") {
      let video = command.object;
      if (video && !video.paused) {
        video.pause();
        video.volume = 0;
        video.currentTime = 0;
        video = null;
      }
    }
  }
}

async function postTextData(text, voiceId) {
  const url = "/api/v1/speech";
  const options = { method: "POST", headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, voiceId: voiceId }) };
  const res = await fetch(url, options);
  const json = await res.json();
  return json;
}

function getSelectedText(textArea) {
  if (typeof (textArea.selectionStart) === "undefined") {
    return "";
  }
  const selectedText = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd);
  if (selectedText) {
    textArea.focus();
  }
  return selectedText;
}

// textArea
textArea.addEventListener("input", function () {
  if (textArea.value.length) {
    example.innerText = "Clear Text";
    example.style.padding = "10px 37px";
  }
  else {
    example.innerText = "Show Example";
    example.style.padding = "10px 20px";
  }
});

async function makeCommands() {
  let text = getSelectedText(textArea) || textArea.value;
  if (!text.trim().length) {
    alert("Please type any text.");
    return "";
  }
  // remove all characters inside [] and also remove all [ or ]
  text = text.replace(/(?:\[.*?\]|[\[\]])/g, "");
  if (!text.trim().length) {
    alert("It looks like the text is wrapped in brackets. Please remove them.");
    return "";
  }
  if (text.length > 3000) {
    alert("The app currently supports the input text of up to 3,000 characters.");
    return "";
  }
  pauseAllPlayingAudio();
  pauseAllPlayingVideo();

  // sends the plain text and returns data containing formattedText, audioData, and markData
  const data = await postTextData(text, "Joanna");
  if (data.error) {
    alert("Error:", data.error);
    return "";
  }
  text = data.formattedText;
  commands = [];
  let plainText = "";
  let index = 0;
  let stack = [];
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === "[") {
      stack.push({ index: index, i: i });
    }
    else if (char == "]") { // should grab until (..)
      if (!stack.length) {
        alert(`Error: An unopened closing bracket found at index ${i}.`);
        return "";
      }
      i++;
      if (i < text.length && text.charAt(i) === "(") {
        const opi = i;
        let value = "";
        let type = "";
        let object = null;
        let isClosed = false;
        for (i++; i < text.length; i++) {
          const char = text.charAt(i);
          if (char === ")") {
            isClosed = true;
            break;
          }
          else {
            value += char;
          }
        }
        if (!isClosed) {
          alert(`Error: The closing parenthesis is missing after the opening parenthesis at index ${opi}.`);
          return "";
        }
        const values = value.split(",");
        for (let value of values) {
          value = value.trim();
          if (value.substring(0, 4) === "http") {
            const ext = value.split(".").pop();
            if (ext.substring(0, 3).toLowerCase() === "mp4" || ext.substring(0, 3).toLowerCase() === "mpg" || ext.substring(0, 3).toLowerCase() === "mp2" || ext.substring(0, 3).toLowerCase() === "mov" || ext.substring(0, 3).toLowerCase() === "avi") {
              type = "video";
              const videoLoadPromise = new Promise(resolve => {
                object = document.createElement("video");
                object.crossOrigin = "anonymous";
                object.oncanplay = resolve;
                object.onerror = function () {
                  alert(`Error: Could not load the video from ${value}`);
                  return "";
                };
                object.src = `${corsPrefix}${value}`;
              });
              console.log("loading video:", value);
              await videoLoadPromise;
              // object.play();
              // object.pause();
              object.volume = 0;
              object.currentTime = 0;
            }
            else if (ext.substring(0, 3).toLowerCase() === "png" || ext.substring(0, 3).toLowerCase() === "jpg" || ext.substring(0, 4).toLowerCase() === "jpeg" || ext.substring(0, 3).toLowerCase() === "gif" || ext.substring(0, 3).toLowerCase() === "svg") {
              type = "image";
              const imageLoadPromise = new Promise(resolve => {
                object = new Image();
                object.crossOrigin = "anonymous";
                object.onload = resolve;
                object.onerror = function () {
                  alert(`Error: Could not load the image from ${value}`);
                  return "";
                };
                object.src = value;
              });
              console.log("loading image:", value);
              await imageLoadPromise;
            }
            else if (ext.substring(0, 3).toLowerCase() === "mp3" || ext.substring(0, 3).toLowerCase() === "wav" || ext.substring(0, 3).toLowerCase() === "ogg") {
              type = "audio";
              const audioLoadPromise = new Promise(resolve => {
                object = new Audio();
                object.oncanplaythrough = resolve;
                object.onerror = function () {
                  alert(`Error: Could not load the audio from ${value}`);
                  return "";
                };
                object.src = value;
              });
              console.log("loading audio:", value);
              await audioLoadPromise;
            }
            else {
              type = "text";
              value = "";
              console.log(`Error: "${ext}" is not supported file extension.`);
            }
          }
          else {
            type = "text";
          }
          const command = {
            start: stack[stack.length - 1].index, // note: if start == end, it means [] is empty, should print error?
            end: index,
            type: type,
            value: value,
            object: object
          }
          commands.push(command);
        }
      }
      else { // opening parenthesis not found (ignore text inside the brackets)
        index = stack[stack.length - 1].index;
        plainText = plainText.substring(0, index);
        i--;
      }
      stack.pop();
    }
    else {
      plainText += char;
      index++;
    }
  }

  if (stack.length) {
    const i = stack[stack.length - 1].i;
    alert(`Error: An unclosed opening bracket found at index ${i}.`);
    return "";
  }

  if (!plainText.trim().length) {
    alert("Error: Cannot convert empty text to a speech audio.");
    return "";
  }

  const audioData = data.audioData;
  const audioSrc = "data:audio/mp3;base64," + audioData.fileContent;
  const audioLoadPromise = new Promise(resolve => {
    ttsAudio = new Audio();
    ttsAudio.oncanplaythrough = resolve;
    ttsAudio.onerror = function () {
      alert("Error: Could not load the speech audio.");
      return "";
    };
    ttsAudio.src = audioSrc;
  });
  await audioLoadPromise;
  videoLength = ttsAudio.duration * 1000;
  if (!videoLength) {
    alert("Error: The speech audio length is zero.");
    return "";
  }
  // later, maybe show this information to the user in the gui?
  console.log("The video length will be " + videoLength.toFixed(0) + "ms.");
  const markData = data.markData;

  for (const command of commands) {
    let foundStart = false;
    let foundEnd = false;
    for (const data of markData) {
      if (data.type === "word") {
        if (!foundStart && command.start < data.end) {
          command.start = data.time;
          foundStart = true;
        }
        if (foundStart && command.end < data.start) {
          command.end = data.time;
          foundEnd = true;
          break;
        }
      }
    }
    if (!foundStart) {
      command.start = videoLength;
    }
    if (!foundEnd) {
      command.end = videoLength;
    }
  }

  // processing the subtitles from sentences (should be improved later)
  for (let i = 0; i < markData.length; i++) {
    const data = markData[i];
    if (data.type === "sentence") {
      let words = [];
      let start = data.time;
      let end = 0;
      const type = "subtitle";
      const value = data.value;
      const object = null;
      for (i++; i < markData.length; i++) {
        const data = markData[i];
        if (data.type === "word") {
          words.push(data);
        }
        else if (data.type === "sentence") {
          end = data.time;
          i--;
          break;
        }
      }
      if (!end) {
        end = videoLength;
      }
      if (words.length > maxNumWordsPerSubtitle) {
        let arr = getDistributedArray(words.length, maxNumWordsPerSubtitle);
        let startWordIndex = 0;
        for (let i = 0; i < arr.length; i++) {
          const endWordIndex = startWordIndex + arr[i];
          const startWord = words[startWordIndex];
          let startTime = startWordIndex ? startWord.time : start;
          const startSubtitleIndex = startWord.start - data.start;
          let endTime = 0;
          let newValue = "";
          if (endWordIndex < words.length) {
            const endWord = words[endWordIndex]; // this is actually next to the end word
            endTime = endWord.time;
            const endSubtitleIndex = endWord.start - data.start;
            newValue = value.substring(startSubtitleIndex, endSubtitleIndex);
          }
          else {
            endTime = end;
            newValue = value.substring(startSubtitleIndex);
          }
          const command = {
            start: startTime,
            end: endTime,
            type: type,
            value: newValue,
            object: object
          }
          commands.push(command);
          startWordIndex = endWordIndex;
        }
      }
      else {
        const command = {
          start: start,
          end: end,
          type: type,
          value: value,
          object: object
        }
        commands.push(command);
      }
    }
  }
  commands = commands.sort((a, b) => a.start - b.start);
  return plainText;
}

// buttons
example.addEventListener("click", function () {
  if (example.innerText === "Clear Text") {
    textArea.value = "";
    example.innerText = "Show Example";
    example.style.padding = "10px 20px";
  }
  else if (example.innerText === "Show Example") {
    textArea.value = "Majority of part of the human brain is devoted towards processing the visual information. About 90% of the total information transmitted to your brain is visual. On top of that, your brain can process these visuals 60,000 times faster than text. The human brain is not only more used to seeing visuals but is also better at interpreting them.";
    example.innerText = "Clear Text";
    example.style.padding = "10px 37px";
    preview.click();
  }
});

preview.addEventListener("click", async function () {
  if (isCapturing) {
    alert("You cannot preview while the video is being rendered.");
    return;
  }
  if (preview.innerText === "Processing...") {
    console.log("The video is being processed.");
    return;
  }
  preview.innerText = "Processing...";
  preview.style.padding = "10px 24.5px";
  const plainText = await makeCommands();
  preview.innerText = "Preview Video";
  preview.style.padding = "10px 20px";
  if (!plainText) {
    return;
  }
  ttsAudio.play();
  ttsAudio.onended = function () {
    pauseAllPlayingAudio();
    pauseAllPlayingVideo();
  }
  startTime = new Date();
  draw();
});

download.addEventListener("click", async function () {
  if (isCapturing) {
    alert("The video is being rendered.");
    return;
  }
  isCapturing = true;
  pauseAllPlayingAudio();
  pauseAllPlayingVideo();
  const plainText = await makeCommands();
  if (!plainText) {
    isCapturing = false;
    return;
  }

  function onProgress(progress) {
    const convertingProgress = (progress * 100).toFixed(1) + "%";
    download.innerText = "Converting: " + convertingProgress;
  }

  function showVideoLink(url, size) {
    size = size ? (" [size: " + (size / 1024 / 1024).toFixed(1) + "meg]") : " [unknown size]";
    const a = document.createElement("a");
    a.href = url;
    let filename = url;
    const slashNdx = filename.lastIndexOf("/");
    if (slashNdx >= 0) {
      filename = filename.substr(slashNdx + 1);
    }
    a.download = filename;
    a.appendChild(document.createTextNode(filename + size));
    a.click(); // auto download
    download.innerText = "Download Video";
    console.log("Downloading Complete");
  }

  // start capturing
  const frameRate = 24;
  const frameTime = 1000 / frameRate;

  const capturerData = {
    format: "ffmpegserver",
    verbose: false,
    framerate: frameRate,
    onProgress: onProgress,
    name: "untitled",
    videoLength: videoLength,
    speechData: [],
    audioData: []
  }
  // multiple speech data can be used later
  capturerData.speechData.push({
    text: plainText,
    voiceId: "Joanna",
    start: 0,
    end: videoLength,
  });

  for (const command of commands) {
    if (command.type === "audio") {
      capturerData.audioData.push({
        url: command.value,
        start: command.start,
        end: command.end,
      });
    }
  }

  const capturer = new CCapture(capturerData);
  const captureStartTime = +new Date;
  currentFrameTime = 0;
  download.innerText = "Rendering: 0.0%";
  capturer.start();

  function capture() {
    if (currentFrameTime < videoLength) {
      draw();
      capturer.capture(canvas);
      currentFrameTime += frameTime;
      const renderingProgress = (Math.min(currentFrameTime / videoLength, 1) * 100).toFixed(1) + "%";
      download.innerText = "Rendering: " + renderingProgress;
      setTimeout(capture, 4);
    }
    else {
      download.innerText = "Rendering: 100.0%";
      capturer.stop();
      capturer.save(showVideoLink);
      const captureEndTime = +new Date;
      console.log("Compiled Video in " + (captureEndTime - captureStartTime) + "ms");
      isCapturing = false;
    }
  }
  capture();
});