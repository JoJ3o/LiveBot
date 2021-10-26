const express = require('express');
const path = require('path');

const youtubeService = require('./youtubeService');

const server = express();

server.get('/', (req, res) => 
  res.sendFile(path.join(__dirname, '/index.html'))
);

server.get('/auth', (req, res) => {
    youtubeService.getCode(res);
  }
);

server.get('/callback', (req, res) => {
    const {code} = req.query;
    youtubeService.getTokensWithCode(code);
    res.redirect('/');
  }
);

server.listen(3000, () => console.log('Server is ready!'));