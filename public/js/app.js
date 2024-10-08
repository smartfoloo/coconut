let songs = [];
let likedSongs = [];
const defaultImage = './assets/default.png';
let currentSongIndex = -1;
let isPlaying = false;
let isPlayingLikedSongs = false;

const songImage = document.getElementById('song-image');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const playPauseButton = document.getElementById('play-pause');
const audio = new Audio();
const progress = document.getElementById('progress');

const CACHE_NAME = 'coconut-cache';

async function fetchSongs() {
  const response = await fetch('/songs.json');
  songs = await response.json();
  loadSongs();
  setupPagination();
  loadLikedSongs();
  loadOfflineSongs();
}

function loadSongs(songsToLoad = songs, page = 1, limit = 30) {
  const songsContainer = document.getElementById('songs-container');
  songsContainer.innerHTML = '';

  const start = (page - 1) * limit;
  const paginatedSongs = songsToLoad.slice(start, start + limit);
  likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

  paginatedSongs.forEach((song, index) => {
    const isLiked = likedSongs.some(likedSong => likedSong.id === song.id);
    const likeIcon = isLiked ? 'heart' : 'heart-outline';
    const likeColor = isLiked ? '#ed8796' : 'var(--text)';

    const songItem = document.createElement('div');
    songItem.className = 'song-item';
    songItem.id = song.id;

    const downloadButtonId = `download-button-${song.id}`;

    songItem.innerHTML = `
      <div class="song-item-left">
        <button onclick="playSong('${song.id}', false)">
          <ion-icon name="play"></ion-icon>
        </button>
        <img src="./assets/images/${song.id}.jpeg" alt="${song.title}">
        <div class="song-item-info">
          <p class="song-title">${song.title}</p>
          <p class="song-artist">${song.artist}</p>
        </div>
      </div>
      <div class="song-item-right">
        <button id="${downloadButtonId}" onclick="downloadSong('${song.id}')">
          <ion-icon name="arrow-down-circle-outline"></ion-icon>
        </button>
        <button id="like-button-${start + index}" onclick="addToLikedSongs(${start + index})">
          <ion-icon name="${likeIcon}" style="color: ${likeColor}"></ion-icon>
        </button>
      </div>
    `;
    songsContainer.appendChild(songItem);
    updateDownloadButton(song.id);
  });
}

function updateDownloadButton(songId) {
  const downloadButton = document.getElementById(`download-button-${songId}`);
  caches.open(CACHE_NAME).then(cache => {
    cache.match(`/assets/songs/${songId}.mp3`).then(response => {
      if (response) {
        downloadButton.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon>';
      }
    });
  });
}

function downloadSong(songId) {
  const audioUrl = `/assets/songs/${songId}.mp3`;
  const imageUrl = `/assets/images/${songId}.jpeg`;

  console.log(`Fetching audio from: ${audioUrl}`);
  console.log(`Fetching image from: ${imageUrl}`);

  Promise.all([
    fetch(audioUrl),
    fetch(imageUrl)
  ]).then(responses => {
    const [audioResponse, imageResponse] = responses;

    const cachePromises = [];

    if (audioResponse.ok) {
      const audioCachePromise = caches.open(CACHE_NAME).then(cache => {
        return cache.put(audioUrl, audioResponse.clone());
      });
      cachePromises.push(audioCachePromise);
    } else {
      console.error(`Failed to download audio: ${audioResponse.status}`);
    }

    if (imageResponse.ok) {
      const imageCachePromise = caches.open(CACHE_NAME).then(cache => {
        return cache.put(imageUrl, imageResponse.clone());
      });
      cachePromises.push(imageCachePromise);
    } else {
      console.error(`Failed to download image: ${imageResponse.status}`);
    }

    return Promise.all(cachePromises); 
  }).then(() => {
    updateDownloadButton(songId); 
  }).catch(error => {
    console.error('Error during downloading:', error);
  });
}


function setupPagination() {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(songs.length / 30);
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.innerText = i;
    pageButton.onclick = () => loadSongs(songs, i);
    paginationContainer.appendChild(pageButton);
  }
}

function playSong(songId, fromLikedSongs = false) {
  const song = fromLikedSongs ? likedSongs.find(song => song.id === songId) : songs.find(song => song.id === songId);
  if (!song) return;

  currentSongIndex = fromLikedSongs ? likedSongs.findIndex(s => s.id === song.id) : songs.findIndex(s => s.id === song.id);
  isPlayingLikedSongs = fromLikedSongs;

  audio.src = `./assets/songs/${song.id}.mp3`;
  songImage.src = `./assets/images/${song.id}.jpeg`;
  songTitle.innerText = song.title;
  songArtist.innerText = song.artist;
  playPauseButton.innerHTML = '<ion-icon name="pause"></ion-icon>';

  updateMediaSession(song);

  isPlaying = true;
  audio.play();
}

function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: '',
      artwork: [
        { src: songImage.src, sizes: '640x640', type: 'image/jpeg' },
        { src: defaultImage, sizes: '128x128', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', handlePlayPause);
    navigator.mediaSession.setActionHandler('pause', handlePlayPause);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevSong);
    navigator.mediaSession.setActionHandler('nexttrack', playNextSong);
  }
}

function handlePlayPause() {
  if (isPlaying) {
    audio.pause();
    playPauseButton.innerHTML = '<ion-icon name="play"></ion-icon>';
    isPlaying = false;
  } else {
    audio.play();
    playPauseButton.innerHTML = '<ion-icon name="pause"></ion-icon>';
    isPlaying = true;
  }
}

function playNextSong() {
  const currentIndex = isPlayingLikedSongs ? currentSongIndex : currentSongIndex;
  const songList = isPlayingLikedSongs ? likedSongs : songs;

  if (currentIndex >= 0 && currentIndex < songList.length - 1) {
    playSong(songList[currentIndex + 1].id, isPlayingLikedSongs);
  }
}

function playPrevSong() {
  const currentIndex = isPlayingLikedSongs ? currentSongIndex : currentSongIndex;
  const songList = isPlayingLikedSongs ? likedSongs : songs;

  if (currentIndex > 0) {
    playSong(songList[currentIndex - 1].id, isPlayingLikedSongs);
  }
}

function updateProgressBar() {
  if (audio.duration) {
    progress.value = (audio.currentTime / audio.duration) * 100;
  }

  if (audio.ended) {
    playNextSong();
  }
}

function addToLikedSongs(index) {
  likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
  const songToAdd = songs[index];
  const alreadyLiked = likedSongs.some(song => song.id === songToAdd.id);
  const likeButton = document.querySelector(`#like-button-${index}`);

  if (!alreadyLiked) {
    likedSongs.push(songToAdd);
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    likeButton.innerHTML = '<ion-icon name="heart"></ion-icon>';
    likeButton.style.color = '#ed8796';
  } else {
    const updatedLikedSongs = likedSongs.filter(song => song.id !== songToAdd.id);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    likeButton.innerHTML = '<ion-icon name="heart-outline"></ion-icon>';
    likeButton.style.color = 'var(--text)';
  }
}

function loadLikedSongs() {
  const likedSongsContainer = document.getElementById('liked-songs-container');
  likedSongsContainer.innerHTML = '';

  likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

  likedSongs.forEach((song, index) => {
    const songItem = document.createElement('div');
    songItem.className = 'song-item';
    songItem.id = song.id;

    const downloadButtonId = `download-button-${song.id}`;

    songItem.innerHTML = `
      <div class="song-item-left">
        <button onclick="playSong('${song.id}', true)">
          <ion-icon name="play"></ion-icon>
        </button>
        <img src="./assets/images/${song.id}.jpeg" alt="${song.title}">
        <div class="song-item-info">
          <p class="song-title">${song.title}</p>
          <p class="song-artist">${song.artist}</p>
        </div>
      </div>
      <div class="song-item-right">
        <button id="${downloadButtonId}" onclick="downloadSong('${song.id}')">
          <ion-icon name="arrow-down-circle-outline"></ion-icon>
        </button>
        <button onclick="removeFromLikedSongs(${index})">
          <ion-icon name="heart"></ion-icon>
        </button>
      </div>
    `;
    likedSongsContainer.appendChild(songItem);
    updateDownloadButton(song.id);
  });
}

function removeFromLikedSongs(index) {
  likedSongs.splice(index, 1);
  localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  loadLikedSongs();
}

function loadOfflineSongs() {
  const offlineSongsContainer = document.getElementById('offline-songs-container');
  offlineSongsContainer.innerHTML = '';

  // Open the cache
  caches.open(CACHE_NAME).then(cache => {
    console.log('Cache opened:', cache);

    // Get all cached requests
    cache.keys().then(cachedRequests => {
      console.log('Cached requests:', cachedRequests);

      cachedRequests.forEach(request => {
        const songId = request.url.split('/').pop().replace('.mp3', '');
        console.log('Song ID from request:', songId);

        // Find the corresponding song from the songs array
        const song = songs.find(s => s.id === songId);
        console.log('Found song:', song);

        if (song) {
          const songItem = document.createElement('div');
          songItem.className = 'song-item';
          songItem.id = song.id;

          songItem.innerHTML = `
            <div class="song-item-left">
              <button onclick="playSong('${song.id}', false)">
                <ion-icon name="play"></ion-icon>
              </button>
              <img src="./assets/images/${song.id}.jpeg" alt="${song.title}">
              <div class="song-item-info">
                <p class="song-title">${song.title}</p>
                <p class="song-artist">${song.artist}</p>
              </div>
            </div>
          `;
          // Append song item to offline songs container
          offlineSongsContainer.appendChild(songItem);
          console.log('Appended song item to offline container:', songItem);
        } else {
          console.log('No song found for ID:', songId);
        }
      });
    }).catch(error => {
      console.error('Error fetching cached requests:', error);
    });
  }).catch(error => {
    console.error('Error opening cache:', error);
  });
}



audio.addEventListener('timeupdate', updateProgressBar);
progress.addEventListener('input', () => {
  const progressValue = progress.value;
  const duration = audio.duration || 0;
  audio.currentTime = (progressValue / 100) * duration;
});
playPauseButton.addEventListener('click', handlePlayPause);
document.getElementById('next-song').addEventListener('click', playNextSong);
document.getElementById('prev-song').addEventListener('click', playPrevSong);

fetchSongs();
