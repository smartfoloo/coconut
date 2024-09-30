const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { videos: [] });
});

app.get('/search', async (req, res) => {
  const query = req.query.q;
  const searchType = req.query.type;
  let videos = [];

  if (searchType === 'search' && query) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `${query} music`,
          type: 'video',
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 5,
        },
      });

      videos = response.data.items.filter(item =>
        item.snippet.title.toLowerCase().includes('music') ||
        item.snippet.title.toLowerCase().includes('song')
      ).map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.default.url,
      }));

    } catch (error) {
      console.error('Error fetching YouTube data:', error);
    }
  } else if (searchType === 'url' && query) {
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = query.match(urlPattern);
    if (match) {
      const videoId = match[1];
      videos.push({
        title: 'Video from URL',
        videoId: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      });
    }
  }

  res.render('index', { videos });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
