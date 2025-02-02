import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { filename, content } = await req.json();

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    const audioFilePath = `audio/${filename}`;

    // Get the current SHA of the file if it exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: "mr-rony356",
        repo: "Eric-Audio-button",
        path: audioFilePath,
      });
      if (!Array.isArray(data) && "sha" in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }

    // Upload or update the audio file
    await octokit.repos.createOrUpdateFileContents({
      owner: "mr-rony356",
      repo: "Eric-Audio-button",
      path: audioFilePath,
      message: `Upload ${filename}`,
      content: Buffer.from(content, "base64").toString("base64"),
      sha, // Include the SHA if the file already exists
      committer: {
        name: "mr-rony356",
        email: "committer@example.com",
      },
      author: {
        name: "mr-rony356",
        email: "author@example.com",
      },
    });

    const htmlContent = generateHTML(filename);

    const htmlFilename = `${filename.split(".").slice(0, -1).join(".")}.html`;
    const htmlFilePath = `embeded/${htmlFilename}`;

    let htmlSha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: "mr-rony356",
        repo: "Eric-Audio-button",
        path: htmlFilePath,
      });
      if (!Array.isArray(data) && "sha" in data) {
        htmlSha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update the HTML file
    await octokit.repos.createOrUpdateFileContents({
      owner: "mr-rony356",
      repo: "Eric-Audio-button",
      path: htmlFilePath,
      message: `Create HTML for ${filename}`,
      content: Buffer.from(htmlContent).toString("base64"),
      sha: htmlSha,
      committer: {
        name: "mr-rony356",
        email: "committer@example.com",
      },
      author: {
        name: "mr-rony356",
        email: "author@example.com",
      },
    });

    const audioLink = `https://host.the30x.com/${audioFilePath}`;
    const htmlLink = `https://host.the30x.com/${htmlFilePath}`;
    const htmlContents = generateHTML(filename);

    return NextResponse.json({ audioLink, htmlLink, htmlContents });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}

function generateHTML(filename: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Custom Audio Player</title>
      <!-- Plyr CSS -->
      <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
      <style>
        .audio-container {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          width: 100%;
          min-height: max-content;
        }
        #plyr-audio {
          pointer-events: none;
        }
        .plyr--audio .plyr__controls {
          background: transparent !important;
        }
        .audio-player-container {
          display: flex;
          align-items: center;
          max-width: 100%;
          width: 90%;
          background-color: transparent;
          padding: 1em;
          border-radius: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .play-btn {
          cursor: pointer;
          width: 100%;
          background: none;
          border: none;
        }
        .play-btn img {
          width: 100%;
          height: auto;
          object-fit: contain;
          margin-bottom: 1em;
        }
        .speed-btn {
          color: #fff;
          border: none;
          width: 3em;
          height: 3em;
          padding: 0.5em;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background-color: #efefef;
        }
        .speed-btn img {
          width: 100%;
          height: auto;
          border-radius: 50%;
          object-fit: cover;
        }
        .audio-time {
          color: #888;
          font-weight: bold;
          text-align: center;
          font-size: 1em;
          width: 100%;
          margin-top: 0.5em;
        }
        @media (max-width: 768px) {
          .audio-player-container {
            width: 100%;
          }
         
        }
      </style>
    </head>
    <body>
      <div class="audio-container">
        <div class="audio-player-container">
          <button class="play-btn" id="play-btn">
            <img id="play-img" src="https://host.the30x.com/play.svg" alt="Play Button" />
          </button>
          <div class="speed-btn">
            <img id="speed-img" src="https://host.the30x.com/runs.svg" alt="Speed Icon" />
          </div>
          <div id="plyr-audio" class="plyr">
            <audio id="audio-player" controls>
              <source src="https://host.the30x.com/audio/${filename}" type="audio/mp3" />
            </audio>
          </div>
          <div class="audio-time" id="audio-time">0:00</div>
        </div>
      </div>
      <!-- Plyr JavaScript -->
      <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
      <script>
        document.addEventListener("DOMContentLoaded", () => {
          const playButton = document.getElementById("play-btn");
          const playImg = document.getElementById("play-img");
          const speedButton = document.querySelector(".speed-btn");
          const speedImg = document.getElementById("speed-img");
          const audioTime = document.getElementById("audio-time");
          const audioElement = document.getElementById("audio-player");
          const plyrAudio = document.getElementById("plyr-audio");

          const player = new Plyr(audioElement, {
            controls: ["progress"],
            seekTime: 0,
            disableContextMenu: true,
          });

          // Set initial speed to 1.5x
          player.speed = 1.5;
          speedImg.src = "https://host.the30x.com/runs.svg";

          const playImage = "https://host.the30x.com/play.svg";
          const playImageGray = "https://host.the30x.com/gray.svg"; // Replace with the actual path of the gray image

          plyrAudio.style.display = "block"; // Show the Plyr controls

          playButton.addEventListener("click", () => {
            if (player.playing) {
              player.pause();
              playImg.src = playImage;
              dataLayer.push({
                'event': 'audio_action',
                'action': 'pause',
                'audio_title': document.title
              });
            } else {
              player.play();
              playImg.src = playImageGray;
              dataLayer.push({
                'event': 'audio_action',
                'action': 'play',
                'audio_title': document.title
              });
            }
          });

          speedButton.addEventListener("click", () => {
            const currentPlaybackRate = player.speed;
            if (currentPlaybackRate === 1) {
              player.speed = 1.5;
              speedImg.src = "https://host.the30x.com/runs.svg";
              dataLayer.push({
                'event': 'audio_action',
                'action': 'speed_change',
                'speed': 1.5,
                'audio_title': document.title
              });
            } else {
              player.speed = 1;
              speedImg.src = "https://host.the30x.com/run.svg";
              dataLayer.push({
                'event': 'audio_action',
                'action': 'speed_change',
                'speed': 1,
                'audio_title': document.title
              });
            }
          });

          player.on("timeupdate", updateTimer);

          function updateTimer() {
            const currentTime = player.currentTime;
            const duration = player.duration;
            const remainingTime = duration - currentTime;
            audioTime.textContent = \`\${formatTime(remainingTime)}\`;
          }

          function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${minutes}:\${secs < 10 ? "0" : ""}\${secs}\`;
          }
        });

        // HTML5 audio listener for GTM
        (function() {
          var divisor = 10;
          var audios_status = {};
          function eventHandler(e) {
            switch (e.type) {
              case 'timeupdate':
                audios_status[e.target.id].current = Math.round(e.target.currentTime);
                var pct = Math.floor(100 * audios_status[e.target.id].current / e.target.duration);
                for (var j in audios_status[e.target.id]._progress_markers) {
                  if (pct >= j && j > audios_status[e.target.id].greatest_marker) {
                    audios_status[e.target.id].greatest_marker = j;
                  }
                }
                if (audios_status[e.target.id].greatest_marker && !audios_status[e.target.id]._progress_markers[audios_status[e.target.id].greatest_marker]) {
                  audios_status[e.target.id]._progress_markers[audios_status[e.target.id].greatest_marker] = true;
                  dataLayer.push({
                    'event': 'audio',
                    'audioPlayerAction': 'Progress %' + audios_status[e.target.id].greatest_marker,
                    'audioTitle': decodeURIComponent(e.target.currentSrc.split('/')[e.target.currentSrc.split('/').length - 1])
                  });
                }
                break;
              case 'play':
                dataLayer.push({
                  'event': 'audio',
                  'audioPlayerAction': 'play',
                  'audioTitle': decodeURIComponent(e.target.currentSrc.split('/')[e.target.currentSrc.split('/').length - 1])
                });
                break;
              case 'pause':
                dataLayer.push({
                  'event': 'audio',
                  'audioPlayerAction': 'pause',
                  'audioTitle': decodeURIComponent(e.target.currentSrc.split('/')[e.target.currentSrc.split('/').length - 1]),
                  'audioValue': audios_status[e.target.id].current
                });
                break;
              case 'ended':
                dataLayer.push({
                  'event': 'audio',
                  'audioPlayerAction': 'finished',
                  'audioTitle': decodeURIComponent(e.target.currentSrc.split('/')[e.target.currentSrc.split('/').length - 1])
                });
                break;
              default:
                break;
            }
          }
          var audios = document.getElementsByTagName('audio');
          for (var i = 0; i < audios.length; i++) {
            var audioTagId;
            if (!audios[i].getAttribute('id')) {
              audioTagId = 'html5_audio_' + Math.random().toString(36).slice(2);
              audios[i].setAttribute('id', audioTagId);
            } else {
              audioTagId = audios[i].getAttribute('id');
            }
            audios_status[audioTagId] = {};
            audios_status[audioTagId].greatest_marker = 0;
            audios_status[audioTagId]._progress_markers = {};
            for (var j = 0; j < divisor; j++) {
              audios_status[audioTagId]._progress_markers[(j + 1) * (100 / divisor)] = false;
            }
            audios[i].addEventListener('timeupdate', eventHandler);
            audios[i].addEventListener('play', eventHandler);
            audios[i].addEventListener('pause', eventHandler);
            audios[i].addEventListener('ended', eventHandler);
          }
        })();
      </script>
    </body>
  </html>
  `;
}
