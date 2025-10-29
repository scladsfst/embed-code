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
  const baseStyles = `
    .audio-container{font-family:Arial,sans-serif;display:flex;justify-content:center;width:100%;min-height:max-content}
    #plyr-audio{pointer-events:none}
    .plyr--audio .plyr__controls{background:transparent!important}
    .audio-player-container{display:flex;align-items:center;max-width:100%;width:90%;background-color:transparent;border-radius:10px;flex-wrap:wrap;justify-content:center;opacity:0;transition:opacity 0.3s ease}
    .audio-player-container.loaded{opacity:1}
    .play-btn{cursor:pointer;width:100%;background:none;border:none}
    .play-btn img{width:100%;height:auto;object-fit:contain;margin-bottom:1em;max-width:500px}
    .speed-btn{color:#fff;border:none;width:3em;height:3em;padding:0.5em;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background-color:#efefef;box-sizing:border-box}
    .speed-btn img{width:100%;height:auto;border-radius:50%;object-fit:cover;max-width:none}
    .audio-time{color:#888;font-weight:bold;text-align:center;font-size:1em}
    .audio-loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#666;font-size:14px;display:none}
    .audio-error{color:#e74c3c;text-align:center;padding:1em;font-size:14px;display:none}
    @media (max-width:768px){.audio-player-container{width:100%}.speed-btn{width:2.5em;height:2.5em;padding:0.325em}}
  `;

  const optimizedScript = `
    (function(){
      'use strict';
      let player,isLoaded=false,retryCount=0;
      const maxRetries=3;
      
      function initializePlayer(){
        const elements={
          playButton:document.getElementById('play-btn'),
          playImg:document.getElementById('play-img'),
          speedButton:document.querySelector('.speed-btn'),
          speedImg:document.getElementById('speed-img'),
          audioTime:document.getElementById('audio-time'),
          audioElement:document.getElementById('audio-player'),
          plyrAudio:document.getElementById('plyr-audio'),
          container:document.querySelector('.audio-player-container'),
          loading:document.querySelector('.audio-loading'),
          error:document.querySelector('.audio-error')
        };
        
        if(!elements.audioElement||!elements.playButton) return false;
        
        try{
          player=new Plyr(elements.audioElement,{
            controls:['progress'],
            seekTime:0,
            disableContextMenu:true,
            loadSprite:false,
            iconUrl:'',
            blankVideo:'data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAG1wNDJpc29t'
          });
          
          player.speed=1.5;
          elements.speedImg.src='https://host.the30x.com/runs.svg';
          
          const playImage='https://host.the30x.com/play.svg';
          const playImageGray='https://host.the30x.com/gray.svg';
          
          elements.plyrAudio.style.display='block';
          
          elements.playButton.addEventListener('click',function(){
            if(player.playing){
              player.pause();
              elements.playImg.src=playImage;
            }else{
              player.play();
              elements.playImg.src=playImageGray;
            }
          });
          
          elements.speedButton.addEventListener('click',function(){
            const currentSpeed=player.speed;
            if(currentSpeed===1){
              player.speed=1.5;
              elements.speedImg.src='https://host.the30x.com/runs.svg';
            }else{
              player.speed=1;
              elements.speedImg.src='https://host.the30x.com/run.svg';
            }
          });
          
          player.on('timeupdate',function(){
            const current=player.currentTime;
            const duration=player.duration;
            if(duration&&!isNaN(duration)){
              const remaining=duration-current;
              elements.audioTime.textContent=formatTime(remaining);
            }
          });
          
          player.on('ready',function(){
            elements.container.classList.add('loaded');
            elements.loading.style.display='none';
            isLoaded=true;
          });
          
          player.on('error',function(){
            showError('Failed to load audio');
          });
          
          return true;
        }catch(e){
          console.warn('Player initialization failed:',e);
          return false;
        }
      }
      
      function formatTime(seconds){
        if(!seconds||isNaN(seconds))return '0:00';
        const minutes=Math.floor(seconds/60);
        const secs=Math.floor(seconds%60);
        return minutes+':'+(secs<10?'0':'')+secs;
      }
      
      function showError(message){
        const loading=document.querySelector('.audio-loading');
        const error=document.querySelector('.audio-error');
        if(loading)loading.style.display='none';
        if(error){
          error.textContent=message;
          error.style.display='block';
        }
      }
      
      function loadPlyr(){
        if(typeof Plyr!=='undefined'){
          initializePlayer();
          return;
        }
        
        if(retryCount>=maxRetries){
          showError('Failed to load player after multiple attempts');
          return;
        }
        
        retryCount++;
        const script=document.createElement('script');
        script.src='https://cdn.plyr.io/3.7.8/plyr.polyfilled.js';
        script.onload=function(){
          setTimeout(initializePlayer,100);
        };
        script.onerror=function(){
          setTimeout(loadPlyr,1000*retryCount);
        };
        document.head.appendChild(script);
      }
      
      function preloadImages(){
        const images=['https://host.the30x.com/play.svg','https://host.the30x.com/gray.svg','https://host.the30x.com/runs.svg','https://host.the30x.com/run.svg'];
        images.forEach(function(src){
          const img=new Image();
          img.src=src;
        });
      }
      
      if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',function(){
          preloadImages();
          loadPlyr();
        });
      }else{
        preloadImages();
        loadPlyr();
      }
      
      
    })();
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Custom Audio Player</title>
<link rel="preconnect" href="https://cdn.plyr.io">
<link rel="preconnect" href="https://host.the30x.com">
<link rel="dns-prefetch" href="//cdn.plyr.io">
<link rel="dns-prefetch" href="//host.the30x.com">
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css">
<style>${baseStyles}</style>
</head>
<body>
<div class="audio-container">
<div class="audio-player-container">
<div class="audio-loading">Loading...</div>
<div class="audio-error"></div>
<button class="play-btn" id="play-btn">
<img id="play-img" src="https://host.the30x.com/play.svg" alt="Play Button">
</button>
<div class="speed-btn">
<img id="speed-img" src="https://host.the30x.com/runs.svg" alt="Speed Icon">
</div>
<div id="plyr-audio" class="plyr">
<audio id="audio-player" controls preload="metadata">
<source src="https://host.the30x.com/audio/${filename}" type="audio/mp3">
</audio>
</div>
<div class="audio-time" id="audio-time">0:00</div>
</div>
</div>
<script>${optimizedScript}</script>
</body>
</html>`;

  return html.replace(/\s+/g, " ").trim();
}
