const { google } = require('googleapis');
const util = require('util');
const fs = require('fs')

const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

let liveChatID;
let nextPage;
const intervalTime = 10000;
let interval;
let chatMessages = [];
let raffleUsersEntered = [];
let raffleStarted = false;

const save = async(path, data) => {
  await writeFilePromise(path, data);
  console.log('Succesfully saved');
};

const read = async path => {
  const fileContents = await readFilePromise(path);
  return JSON.parse(fileContents);
};

const youtube = google.youtube('v3');

const Oauth2 = google.auth.OAuth2;

const clientID = "702193958045-mog7ismh8cv9j9gipkjkrj6h0rhkf6rh.apps.googleusercontent.com";
const clientSecret = "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";
const redirectURI = "http://localhost:3000/callback";

const scope = [
  'https://www.googleapis.com/auth/youtube.readonly'
];

const auth = new Oauth2(clientID, clientSecret, redirectURI);

const youtubeService = {};

youtubeService.getCode = response => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope
  })
  response.redirect(authUrl);
};

youtubeService.getTokensWithCode = async code => {
  const credentials = await auth.getToken(code);
  youtubeService.authorize(credentials);
};

youtubeService.authorize = ({tokens}) => {
  auth.setCredentials(tokens);
  console.log('Succesfully set credentials');
  console.log('tokens', tokens);
  save('./tokens.json', JSON.stringify(tokens));
};

auth.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('Succesfully set tokens')
    save('./tokens.json', JSON.stringify(tokens));
  }
});

const checkTokens = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    auth.setCredentials(tokens);
    console.log('tokens set');
  } else {
    console.log('no tokens set');
  }
};


// API Calls
youtubeService.findActiveChat = async() => {
  const response = await youtube.liveBroadcasts.list({
    auth,
    part: 'snippet',
    broadcastStatus: 'active'
  });
  const latestChat = response.data.items[0];
  liveChatID = latestChat.snippet.liveChatId;
  console.log('Chat ID found', liveChatID)
}

const respond = (newMessages, data) => {
  newMessages.forEach(message => {
    const messageText = message.snippet.displayMessage.toLowerCase();
    const author = message.authorDetails.displayName;
    console.log('Message: ', messageText, 'Author: ', author);
    if (messageText == data.enterMessage && !raffleUsersEntered.includes(author)) {
      raffleUsersEntered.push(author);
    }
  });
}

const getChatMessages = async(raffleData) => {
  console.log('Get chat');
  const response = await youtube.liveChatMessages.list({
    auth,
    part: ['snippet', 'authorDetails'],
    liveChatId: liveChatID,
    maxResults: 2000,
    pageToken: nextPage
  });
  const {data} = response;
  const newMessages = data.items;
  nextPage = data.nextPageToken;
  if (raffleStarted) {
    chatMessages.push(...newMessages);
    respond(newMessages, raffleData);
  }
  raffleStarted = true;
  console.log('Total chat messages:', chatMessages.length);
}

const startTrackingChat = async(data) => {
  console.log("Start raffle");
  interval = setInterval(function() { getChatMessages(data); }, intervalTime);
}

const stopTrackingChat = async() => {
  console.log('Stop raffle');
  clearInterval(interval);
  raffleStarted = false;
  console.log(raffleUsersEntered);
  raffleUsersEntered = [];
}

youtubeService.startRaffle = async(data) => {
  console.log('Start');
  console.log(data.duration * 60 * 1000);
  startTrackingChat(data);
  setTimeout(stopTrackingChat, (data.duration * 60 * 1000));
}

// Print variables
youtubeService.getVariable = () => {
  console.log(raffleUsersEntered);
}

checkTokens();

module.exports = youtubeService;