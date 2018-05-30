This is the source for my lil bot [@kristiantunes](https://twitter.com/kristiantunes), which tweets the last thing I listened to via last.fm.

It's kind of a hot mess, code-wise, but it might be useful to someone in the future if they want to do something similar.

## Setup

1. `yarn install`
2. `cp .env.example .env` (and populate values)
3. `node index.js`

There's a number of env variables that make this whole thing work:

- `TWITTER_CONSUMER_KEY`: Twitter app consumer key
- `TWITTER_CONSUMER_SECRET`: Twitter app consumer secret
- `TWITTER_ACCESS_TOKEN_KEY`: Auth token key for a Twitter user (the account that will tweet)
- `TWITTER_ACCESS_TOKEN_SECRET`: Auth token secret for a Twitter user
- `LASTFM_USER`: The last.fm user to get recently played tracks from
- `LASTFM_API_KEY`: A last.fm API key
- `HEADER_AUTH_KEY`: A simple query param value to check against when a request is made to the server
- `HOUR_OFFSET`: ...

`HOUR_OFFSET` is a terrible way of offsetting your current time against whatever Last.fm's server time value is -- you're going to have to tweak this manually to make sure that your server's current time lines up with Last.fm's current time, so that the server knows when a song is "recent". Sorry -- this sucks. I'm open to fixes on it, but it's working for me so I'm not going to touch it 😬

## Usage

1. Deploy to heroku or something similar (remember to provide env var values)
2. Set up a recurring cron/something similar to hit `/?auth={your HEADER_AUTH_KEY value}` on your deployed instance
3. See tweets appear ✨

## Todos

- Allow customization of "last played" value - right now it checks for a song in the last 30min, but it could be used every minute/every hour, etc

