import fs from 'node:fs/promises';
const original=await fs.readFile('index.html','utf8');
const cover=`<section class="flight-cover" aria-labelledby="cover-title">
  <div id="flight-scene" aria-hidden="true"></div>
  <div class="flight-shade" aria-hidden="true"></div>
  <div class="flight-copy">
    <p class="flight-edition">Fieldnotes / Australia / 2024–2026</p>
    <h1 id="cover-title">A continent.<br>A million wings.<br><em>Look closer.</em></h1>
    <p>Australia, through a birdwatcher’s eyes.<br>Follow the sightings. Find the seasons.<br>Discover what lies beyond our view.</p>
    <a class="flight-enter" href="#atlas">Enter the field journal <span aria-hidden="true">↘</span></a>
  </div>
  <div class="flight-caption"><span>Evening flight</span><p>An imagined flock.<br>A real story awaits below.</p></div>
  <div class="flight-bottom"><span>Move your pointer to shift the perspective</span><button id="flight-pause" type="button" aria-pressed="false">Pause motion</button><a href="index.html">← Original version</a></div>
</section>`;
const output=original.replace('<title>','<title>Cinematic preview · ').replace('</head>','<link rel="stylesheet" href="experiments/cinematic.css">\n<script type="module" src="experiments/flight.js"></script>\n</head>').replace('<body>','<body class="cinematic">').replace(/    <section class="cover"[\s\S]*?    <\/section>/,cover);
await fs.writeFile('cinematic.html',output);
console.log('Cinematic preview built. Original index.html untouched.');
