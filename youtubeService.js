const { google } = require('googleapis');
const util = require('util');
const fs = require('fs')

const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

let liveChatID;
let nextPageToken;
const intervalTime = 5000;
let interval;
let chatMessages = [];
let raffleUsersEntered = [];

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
  console.log('tokens', tokens)
  save('./tokens.json', JSON.stringify(tokens));
};

auth.on('tokens', () => {
  console.log('New tokens received');
  save('./tokens.json', JSON.stringify(tokens));
});

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

const getChatMessages = () => {
  const response = await youtube.liveChatMessages.list({
    auth,
    part: ['snippet', 'authorDetails'],
    liveChatId: liveChatID,
    pageToken: nextPage
  });
  const {data} = response;
  const newMessages = data.items;
  chatMessages.push(...newMessages);
  nextPage = data.nextPageToken;
  console.log('Total chat messages:', chatMessages.length);
  console.log('Messages:', ...newMessages);
}

youtubeService.startTrackingChat = async() => {
  interval = setInterval(getChatMessages, intervalTime);
}

const checkTokens = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    console.log('Setting tokens');
    return auth.setCredentials(tokens);
  }
  console.log('No tokens found');
}

checkTokens();

console.log("hi");

module.exports = youtubeService;