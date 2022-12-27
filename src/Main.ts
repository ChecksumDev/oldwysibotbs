import { TwitterApi } from "twitter-api-v2";
import { RefreshingAuthProvider } from "@twurple/auth";
import { promises as fs } from "fs";

import Bot from "./Bot.js";
import { config } from "dotenv";

config(); // init env variables

const twitter = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY as string,
    appSecret: process.env.TWITTER_APP_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const tokenData = JSON.parse(await fs.readFile("./auth.json", "utf-8"));
const twitchAuth = new RefreshingAuthProvider(
    {
        clientId: process.env.TWITCH_CLIENT_ID as string,
        clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
        onRefresh: async (newTokenData) =>
            await fs.writeFile(
                "./auth.json",
                JSON.stringify(newTokenData, null, 4),
                "utf-8"
            ),
    },
    tokenData
);

const bot = new Bot(twitter, twitchAuth);
await bot.connect();
