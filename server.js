const express = require('express');
const path = require('path');

const youtubeService = require('./youtubeService');
const twitchService = require('./twitchService');

const server = express();

server.use(express.urlencoded({
	extended: true
}));

server.use('/img', express.static('img'));

server.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/index.html'))
);

// Youtube routes
server.get('/auth-yt', (req, res) => {
	youtubeService.getCode(res);
});

server.get('/callback-yt', (req, res) => {
	const {code} = req.query;
	youtubeService.getTokensWithCode(code);
	res.redirect('/');
});

server.get('/find-active-chat-yt', (req, res) => {
	youtubeService.findActiveChat();
	res.redirect('/');
});

server.post('/start-raffle-yt', (req, res) => {
	console.log(req.body);
	youtubeService.startRaffle(req.body);
	res.redirect('/');
})

// Twitch routes
server.get('/auth', (req, res) => {
	twitchService.getCode(res);
});

server.get('/callback', (req, res) => {
	const {code} = req.query;
	twitchService.getTokensWithCode(code);
	res.redirect('/');
});

server.listen(3000, () => console.log('Server is ready!'));
