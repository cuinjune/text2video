document.getElementById("start").addEventListener("click", function () {
  var frameRate = 24;
  const videoLength = 0.1 * 60000;
  const frameTime = 1000 / frameRate;
  var numFrames = videoLength / frameTime;

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  canvas.width = 1280;
  canvas.height = 720;

  var progressElem = document.getElementById("progress");
  var progressNode = document.createTextNode("");
  progressElem.appendChild(progressNode);

  function onProgress(progress) {
    progressNode.nodeValue = (progress * 100).toFixed(1) + "%";
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
    a.appendChild(document.createTextNode(url + size));
    document.body.appendChild(a);
  }

  var capturer = new CCapture({
    format: 'ffmpegserver',
    verbose: false,
    framerate: frameRate,
    onProgress: onProgress,
    name: "untitled",
    videoLength: videoLength,
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