/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { TwitterApi } from "twitter-api-v2";
import { Client } from "tmi.js";
import { Data, WebSocket } from "ws"
import { dysi } from "./utils.js";

export default class Bot {
    private scores_websocket = "wss://api.beatleader.xyz/scores"

    private twitter: TwitterApi;
    private twitch: Client;
    private ws: WebSocket;

    constructor(twitter: TwitterApi, twitch: Client) {
        this.twitter = twitter;
        this.twitch = twitch;

        this.ws = new WebSocket(this.scores_websocket)
        this.setupWebsocket();
    }

    private setupWebsocket() {
        this.ws.addEventListener('open', () => {
            console.log("Connected to the BeatLeader websocket!");
        });

        this.ws.addEventListener('error', (err) => {
            console.warn(`An error occured on the BeatLeader websocket, reconnecting...\nError: ${err.message}`);
            this.connectWebsocket();
        });

        this.ws.addEventListener('close', () => {
            console.warn("Disconnected from the BeatLeader websocket, reconnecting");
            this.connectWebsocket();
        });

        // todo: Fix misuded promise here
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.ws.addEventListener('message', (event) => this.handle_message(event.data));
    }

    connectWebsocket() {
        setTimeout(() => {
            this.ws = new WebSocket(this.scores_websocket)
        }, 5000);
    }

    async handle_message(message: Data): Promise<void> {
        try {
            const data = JSON.parse(message.toString()) as WebsocketData
            const accuracy = data.accuracy * 100

            if (dysi(accuracy.toFixed(2).toString())) {
                const player = await fetch(`https://api.beatleader.xyz/player/${data.player.id}?stats=false`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json()) as PlayerResponse

                const twitter_social = player.socials ? player.socials?.find((social: PlayerSocial) => social.service === 'Twitter') : null;
                const twitch_social = player.socials ? player.socials?.find((social: PlayerSocial) => social.service === 'Twitch') : null;

                const username = twitter_social ? `@${twitter_social.link.split('/').pop()}` : player.name
                const tweet = `${username} just got a ${accuracy.toFixed(2)}% on ${data.leaderboard.song.name} (${data.leaderboard.difficulty.difficultyName}) by ${data.leaderboard.song.author}!`

                const replay_url = `https://replay.beatleader.xyz/?scoreId=${data.id}`

                if (twitch_social) {
                    const twitch_username = `@${twitch_social.link.split('/').pop()}`;

                    await this.twitch.join(`${twitch_username}`);
                    await this.twitch.say(`${twitch_username}`, `! WYSI ${accuracy.toFixed(2)}% accuracy`);
                    await this.twitch.part(`${twitch_username}`)
                }

                await this.twitter.v2.tweet(`#WYSI! ${tweet} ${twitch_social?.link || ""} ${replay_url}`)
                console.log(`✔️    ${tweet} ${replay_url} ${twitch_social?.link || ""}`)
            } else {
                console.log(`❌    ${data.player.name} just got a ${accuracy.toFixed(2)}% on ${data.leaderboard.song.name} (${data.leaderboard.difficulty.difficultyName}) by ${data.leaderboard.song.author}!`)
            }
        } catch (err) {
            console.error(err)
        }
    }

    async connect(): Promise<void> {
        console.log("Connecting to Twitter");

        const twitter_user = await this.twitter.currentUserV2();
        console.log(`Logged into Twitter as ${twitter_user.data.username}\n`);

        console.log("Connecting to Twitch");
        await this.twitch.connect();

        const twitch_user = this.twitch.getUsername()
        console.log(`Logged into twitch as ${twitch_user}`);
    }
}
