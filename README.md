# Text2Video
<img src="screenshot.png" alt="screenshot" width="1000"/>

## Description

**Text2Video** is a software tool that converts text to video for a more engaging learning experience.

I started this project because during this semester, I have been given many reading assignments and I felt frustration in reading long text. For me, it was very time and energy consuming to learn something through reading. So I imagined, "What if there was a tool that turns text into something more engaging such as a video, wouldn't it improve my learning experience?"

I did some research and found a number of articles and studies supporting that videos can be more effective in learning than text for many people including the following data:

* The human brain can process visuals 60,000 times faster than text.
* Viewers retain 95% of a video’s message compared to 10% when reading text.
* 65% of people consider themselves to be visual learners.

I created a prototype web application that takes text as an input and generates a video as an output.

Here's the [Live Demo on Heroku](https://text-to-video.herokuapp.com/).

I plan to further work on the project targeting young college students who are aged between 18 to 23 because they tend to prefer learning through videos over books based on the survey I found.

The technologies I used for the project are HTML, CSS,  Javascript, Node.js, CCapture.js,  ffmpegserver.js, Amazon Polly, Python, Flask, gevent,  spaCy, and Pixabay API.

## Source Code
* Client & Node.js server (Javascript): https://github.com/cuinjune/text2video
* Flask server (Python): https://github.com/cuinjune/text2video-flask

## Setup

1. Installation of Node.js is required.
2. Run the following commands in the Terminal.
```
 git clone https://github.com/cuinjune/text2video.git
 cd text2video
 npm install
 npm start
```
3. Open your web browser and navigate to http://localhost:8080

## Author
* [Zack Lee](https://www.cuinjune.com/about): an MPS Candidate at [NYU ITP](https://itp.nyu.edu).
