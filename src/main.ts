import { TwitterApi } from "twitter-api-v2";
import { Client } from 'tmi.js'

import Bot from "./Bot.js";
import { config } from "dotenv";

config() // init env variables

const twitter = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY as string,
    appSecret: process.env.TWITTER_APP_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const twitch = new Client({
    'connection': {
        secure: true,
        reconnect: true,
    },
    'identity': {
        'username': process.env.TWITCH_USERNAME,
        'password': process.env.TWITCH_PASSWORD
    },
});

const bot = new Bot(twitter, twitch)

await bot.connect()