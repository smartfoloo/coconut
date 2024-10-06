let songs = [];
let likedSongs = [];
const defaultImage = './assets/default.png';

let currentSongIndex = -1;
let isPlaying = false;
let isPlayingLikedSongs = false; // New variable to track if we are playing liked songs

const songImage = document.getElementById('song-image');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const playPauseButton = document.getElementById('play-pause');
const audio = new Audio();

async function fetchSongs() {
  const response = await fetch('/songs.json');
  songs = await response.json();
  loadSongs();
  setupPagination();
  loadLikedSongs(); // Load liked songs on fetch
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
        <button id="like-button-${start + index}" onclick="addToLikedSongs(${start + index})">
          <ion-icon name="${likeIcon}" style="color: ${likeColor}"></ion-icon>
        </button>
      </div>
    `;
    songsContainer.appendChild(songItem);
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
  isPlayingLikedSongs = fromLikedSongs; // Update the source of the current songs

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
  const currentIndex = isPlayingLikedSongs ? currentSongIndex : currentSongIndex; // This should already be correct based on the song list you're playing
  const songList = isPlayingLikedSongs ? likedSongs : songs; // Select the right song list based on the context

  if (currentIndex >= 0 && currentIndex < songList.length - 1) {
    playSong(songList[currentIndex + 1].id, isPlayingLikedSongs); // Pass the context
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
  const progress = document.getElementById('progress');
  progress.value = (audio.currentTime / audio.duration) * 100;

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
    alert(`${songToAdd.title} added to liked songs.`);
    likeButton.innerHTML = '<ion-icon name="heart"></ion-icon>';
    likeButton.style.color = '#ed8796';
  } else {
    const updatedLikedSongs = likedSongs.filter(song => song.id !== songToAdd.id);
    localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
    alert(`${songToAdd.title} removed from liked songs.`);
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
        <button onclick="removeFromLikedSongs(${index})">
          <ion-icon name="heart"></ion-icon>
        </button>
      </div>
    `;
    likedSongsContainer.appendChild(songItem);
  });
}

function removeFromLikedSongs(index) {
  likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
  likedSongs.splice(index, 1);
  localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  loadLikedSongs();
}

document.getElementById('search-bar').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
  );
  loadSongs(filteredSongs);
});

audio.addEventListener('timeupdate', updateProgressBar);
playPauseButton.addEventListener('click', handlePlayPause);
document.getElementById('next-song').addEventListener('click', playNextSong);
document.getElementById('prev-song').addEventListener('click', playPrevSong);

fetchSongs();
loadLikedSongs();
