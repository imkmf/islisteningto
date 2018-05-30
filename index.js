const axios = require('axios');
require('dotenv').config();
const {DateTime} = require('luxon');
const express = require('express');
const parseString = require('xml2js').parseString;
const Twitter = require('twitter');

const HOUR_OFFSET = parseInt(process.env.HOUR_OFFSET) || -7;
const PORT = process.env.PORT || 5000;
const app = express();

[
  'process.env.HOUR_OFFSET',
  'process.env.TWITTER_CONSUMER_KEY',
  'process.env.TWITTER_CONSUMER_SECRET',
  'process.env.TWITTER_ACCESS_TOKEN_KEY',
  'process.env.TWITTER_ACCESS_TOKEN_SECRET',
  'process.env.LASTFM_USER',
  'process.env.LASTFM_API_KEY',
  'process.env.HEADER_AUTH_KEY',
].forEach(key => {
  if (!eval(key)) {
    console.error(`Missing ${key} in env`);
  }
});

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const tweet = (res, string) => {
  console.log('Posting tweet');
  client
    .post('statuses/update', {status: string})
    .then(() => {
      res.sendStatus(200);
      res.end();
    })
    .catch(function(error) {
      throw error;
    });
};

const trackWithinLastHour = track => {
  const date = DateTime.fromFormat(track.date, 'dd LLLL yyyy, HH:ss');
  const correctedDate = date.plus({hours: HOUR_OFFSET});
  const now = DateTime.local();
  console.log(`Comparing now ${now} and track date ${correctedDate}`);
  const minutesAgo = now.diff(correctedDate, 'minutes');
  return minutesAgo.values.minutes < 30;
};

const parseTrack = track => ({
  artist: track.artist[0]._,
  name: track.name[0],
  date: track.date ? track.date[0]._ : null,
  url: track.url[0],
});

const parseXmlResponse = (res, {data}) => {
  console.log('Parsing response');
  parseString(data, function(err, result) {
    console.log('Got result');
    const {lfm: {recenttracks}} = result;
    const tracksData = recenttracks[0].track;
    const tracks = tracksData.map(parseTrack);
    const mostRecentTrack = tracks.find(t => t.date);
    if (trackWithinLastHour(mostRecentTrack)) {
      console.log('Found new track');
      const artistString = `'${mostRecentTrack.name}' by ${
        mostRecentTrack.artist
      }`.slice(0, 120);
      const trimmedString =
        artistString.length > 120
          ? [artistString.slice(0, 120), '...'].join('')
          : artistString;
      const string = `🎧 ${trimmedString}\n${mostRecentTrack.url}`;
      tweet(res, string);
    } else {
      console.log('New track not found, skipping...');
      res.sendStatus(200);
      res.end();
    }
  });
};

const requestUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${
  process.env.LASTFM_USER
}&api_key=${process.env.LASTFM_API_KEY}`;

const requestXml = (req, res) => {
  console.log('Making request');
  axios.get(requestUrl).then(response => parseXmlResponse(res, response));
};
app.get('/', (req, res) => {
  const {auth} = req.query;
  if (auth && auth == process.env.HEADER_AUTH_KEY) {
    requestXml(req, res);
  } else {
    res.sendStatus(401);
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
