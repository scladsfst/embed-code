import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Validate request
    if (!req) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { filename, content, enableTracking } = body;
    if (!filename || !content) {
      return NextResponse.json(
        {
          message: "Missing required fields: filename and content are required",
        },
        { status: 400 }
      );
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { message: "GitHub token not configured" },
        { status: 500 }
      );
    }

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
        console.error("Error getting file content:", error);
        return NextResponse.json(
          { message: "Error checking existing file" },
          { status: 500 }
        );
      }
    }

    // Upload or update the audio file
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: "mr-rony356",
        repo: "Eric-Audio-button",
        path: audioFilePath,
        message: `Upload ${filename}`,
        content: Buffer.from(content, "base64").toString("base64"),
        sha,
        committer: {
          name: "mr-rony356",
          email: "committer@example.com",
        },
        author: {
          name: "mr-rony356",
          email: "author@example.com",
        },
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { message: "Error uploading file to GitHub" },
        { status: 500 }
      );
    }

    const htmlContent = generateHTML(filename, enableTracking);
    const htmlFilename = `${filename.split(".").slice(0, -1).join(".")}.html`;
    const htmlFilePath = `embeded/${htmlFilename}`;

    // Get the current SHA of the HTML file if it exists
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
        console.error("Error getting HTML file content:", error);
        return NextResponse.json(
          { message: "Error checking existing HTML file" },
          { status: 500 }
        );
      }
    }

    // Create or update the HTML file
    try {
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
    } catch (error: any) {
      console.error("Error uploading HTML file:", error);
      return NextResponse.json(
        { message: "Error uploading HTML file to GitHub" },
        { status: 500 }
      );
    }

    const audioLink = `https://host.the30x.com/${audioFilePath}`;
    const htmlLink = `https://host.the30x.com/${htmlFilePath}`;

    return NextResponse.json({
      audioLink,
      htmlLink,
      htmlContents: htmlContent,
      success: true,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

function generateHTML(filename: string, enableTracking: boolean): string {
  const baseUrl = "https://host.the30x.com";
  const audioUrl = `${baseUrl}/audio/${filename}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Embedded audio player" />
    <title>Audio Player</title>
    
    <!-- Preload critical assets -->
    <link rel="preload" href="https://cdn.plyr.io/3.7.8/plyr.css" as="style" />
    <link rel="preload" href="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js" as="script" />
    <link rel="preload" href="${baseUrl}/play.svg" as="image" />
    <link rel="preload" href="${baseUrl}/runs.svg" as="image" />
    <link rel="preload" href="${audioUrl}" as="audio" />
    
    <!-- Plyr CSS -->
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
    
    <style>
      :root {
        --player-width: min(90%, 500px);
        --button-size: 3em;
        --mobile-button-size: 2.5em;
      }

      .audio-container {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        width: 100%;
        min-height: max-content;
        margin: 1rem 0;
      }

      .audio-player-container {
        display: flex;
        align-items: center;
        width: var(--player-width);
        background-color: transparent;
        border-radius: 10px;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }

      .play-btn {
        cursor: pointer;
        width: 100%;
        background: none;
        border: none;
        padding: 0;
        transition: transform 0.2s ease;
      }

      .play-btn:hover {
        transform: scale(1.02);
      }

      .play-btn:focus-visible {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }

      .play-btn img {
        width: 100%;
        height: auto;
        object-fit: contain;
        margin-bottom: 1em;
        max-width: 500px;
      }

      .speed-btn {
        color: #fff;
        border: none;
        width: var(--button-size);
        height: var(--button-size);
        padding: 0.5em;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background-color: #efefef;
        transition: background-color 0.2s ease;
      }

      .speed-btn:hover {
        background-color: #e0e0e0;
      }

      .speed-btn:focus-visible {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }

      .speed-btn img {
        width: 100%;
        height: auto;
        border-radius: 50%;
        object-fit: cover;
      }

      .audio-time {
        color: #666;
        font-weight: 600;
        text-align: center;
        font-size: 1em;
        min-width: 4em;
      }

      .plyr--audio .plyr__controls {
        background: transparent !important;
      }

      #plyr-audio {
        pointer-events: none;
        width: 100%;
      }

      .loading {
        opacity: 0.5;
        pointer-events: none;
      }

      @media (max-width: 768px) {
        .audio-player-container {
          width: 100%;
        }
        .speed-btn {
          width: var(--mobile-button-size);
          height: var(--mobile-button-size);
          padding: 0.325em;
        }
      }

      /* Loading animation */
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }

      .loading-animation {
        animation: pulse 1.5s infinite;
      }
    </style>
  </head>
  <body>
    <div class="audio-container">
      <div class="audio-player-container">
        <button class="play-btn" id="play-btn" aria-label="Play audio">
          <img id="play-img" src="${baseUrl}/play.svg" alt="Play Button" />
        </button>
        <button class="speed-btn" id="speed-btn" aria-label="Change playback speed">
          <img id="speed-img" src="${baseUrl}/runs.svg" alt="Speed Icon" />
        </button>
        <div id="plyr-audio" class="plyr">
          <audio id="audio-player" controls preload="metadata">
            <source src="${audioUrl}" type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
        <div class="audio-time" id="audio-time" aria-live="polite">0:00</div>
      </div>
    </div>

    <!-- Plyr JavaScript -->
    <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js" defer></script>
    <script>
      (function() {
        // Error handling utility
        function handleError(error, context) {
          console.error(\`Error in \${context}:\`, error);
          // You could add error reporting here
        }

        // Initialize player when DOM is ready
        document.addEventListener("DOMContentLoaded", () => {
          try {
            const elements = {
              playButton: document.getElementById("play-btn"),
              playImg: document.getElementById("play-img"),
              speedButton: document.getElementById("speed-btn"),
              speedImg: document.getElementById("speed-img"),
              audioTime: document.getElementById("audio-time"),
              audioElement: document.getElementById("audio-player"),
              plyrAudio: document.getElementById("plyr-audio")
            };

            // Validate all elements exist
            Object.entries(elements).forEach(([key, element]) => {
              if (!element) {
                throw new Error(\`Required element \${key} not found\`);
              }
            });

            // Initialize Plyr with error handling
            let player;
            try {
              player = new Plyr(elements.audioElement, {
                controls: ["progress"],
                seekTime: 0,
                disableContextMenu: true,
                loadSprite: false,
                iconUrl: null,
                blankVideo: null
              });
            } catch (error) {
              handleError(error, "Plyr initialization");
              return;
            }

            // Constants
            const PLAYBACK_SPEEDS = {
              normal: 1,
              fast: 1.5
            };

            const IMAGES = {
              play: "${baseUrl}/play.svg",
              playGray: "${baseUrl}/gray.svg",
              speedNormal: "${baseUrl}/run.svg",
              speedFast: "${baseUrl}/runs.svg"
            };

            // Set initial state
            player.speed = PLAYBACK_SPEEDS.fast;
            elements.speedImg.src = IMAGES.speedFast;
            elements.plyrAudio.style.display = "block";

            // Play/Pause handler
            elements.playButton.addEventListener("click", () => {
              try {
                if (player.playing) {
                  player.pause();
                  elements.playImg.src = IMAGES.play;
                  ${enableTracking ? `trackEvent('pause');` : ""}
                } else {
                  player.play();
                  elements.playImg.src = IMAGES.playGray;
                  ${enableTracking ? `trackEvent('play');` : ""}
                }
              } catch (error) {
                handleError(error, "play/pause handler");
              }
            });

            // Speed control handler
            elements.speedButton.addEventListener("click", () => {
              try {
                const newSpeed = player.speed === PLAYBACK_SPEEDS.normal 
                  ? PLAYBACK_SPEEDS.fast 
                  : PLAYBACK_SPEEDS.normal;
                
                player.speed = newSpeed;
                elements.speedImg.src = newSpeed === PLAYBACK_SPEEDS.fast 
                  ? IMAGES.speedFast 
                  : IMAGES.speedNormal;
                
                ${
                  enableTracking
                    ? `trackEvent('speed_change', { speed: newSpeed });`
                    : ""
                }
              } catch (error) {
                handleError(error, "speed control handler");
              }
            });

            // Time update handler
            player.on("timeupdate", () => {
              try {
                updateTimer();
              } catch (error) {
                handleError(error, "time update handler");
              }
            });

            // Error handling for audio element
            elements.audioElement.addEventListener("error", (e) => {
              handleError(e, "audio element");
              elements.audioTime.textContent = "Error loading audio";
            });

            // Loading state handling
            elements.audioElement.addEventListener("loadstart", () => {
              elements.playButton.classList.add("loading");
            });

            elements.audioElement.addEventListener("canplay", () => {
              elements.playButton.classList.remove("loading");
            });

            function updateTimer() {
              const currentTime = player.currentTime;
              const duration = player.duration;
              const remainingTime = duration - currentTime;
              elements.audioTime.textContent = formatTime(remainingTime);
            }

            function formatTime(seconds) {
              if (isNaN(seconds)) return "0:00";
              const minutes = Math.floor(seconds / 60);
              const secs = Math.floor(seconds % 60);
              return \`\${minutes}:\${secs < 10 ? "0" : ""}\${secs}\`;
            }

            ${
              enableTracking
                ? `
            function trackEvent(action, data = {}) {
              try {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                  'event': 'audio_action',
                  'action': action,
                  'audio_title': document.title,
                  ...data
                });
              } catch (error) {
                handleError(error, "tracking");
              }
            }
            `
                : ""
            }

          } catch (error) {
            handleError(error, "main initialization");
          }
        });
      })();
    </script>
  </body>
</html>`;

  return htmlContent;
}
