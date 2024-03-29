import { TwitterApi } from "twitter-api-v2";
import { Data, MessageEvent } from "ws";
import { dysi, getTwitchUsername, isStreamLive } from "./Utils.js";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { ApiClient, HelixUser } from "@twurple/api";
import { PersistentWebSocket } from "./PersistentWebSocket.js";

export default class Bot {
    private scores_websocket = "wss://api.beatleader.xyz/scores";

    private twitter: TwitterApi;

    private twitch_auth: RefreshingAuthProvider;
    private twitch_api: ApiClient;
    private twitch_bot: ChatClient;

    constructor(twitter: TwitterApi, authProvider: RefreshingAuthProvider) {
        this.twitter = twitter;
        this.twitch_auth = authProvider;

        this.twitch_api = new ApiClient({ authProvider: this.twitch_auth });
        this.twitch_bot = new ChatClient({
            authProvider: this.twitch_auth,
            channels: ["checksum__"],
        });

        // Start the PersistentWebSocket with the handle_message callback
        new PersistentWebSocket(this.scores_websocket, this.handle_message, this)
    }

    async handle_message(message: MessageEvent): Promise<void> {
        try {
            const data = JSON.parse(message.data.toString()) as WebsocketData;

            const replay_url = `https://replay.beatleader.xyz/?scoreId=${data.id}`;
            const accuracy = data.accuracy * 100;

            if (dysi(accuracy.toFixed(2).toString())) {
                const player = (await fetch(
                    `https://api.beatleader.xyz/player/${data.player.id}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                    }
                ).then((res) => res.json()));

                const { twitter_social, twitch_social } = this.extractSocials(player);

                const display_name = twitter_social
                    ? `@${twitter_social.link.split("/").pop()}`
                    : player.name;

                let clip: string | null = null;
                let reaction_clip: string | null = null;

                if (twitch_social) {
                    const twitch_username = `${getTwitchUsername(twitch_social.link)}`;
                    const twitch_user = await this.twitch_api.users.getUserByName(
                        twitch_username
                    );

                    if (twitch_user) {
                        // Join the channel
                        await this.twitch_bot.join(`${twitch_user?.name}`);

                        if (await isStreamLive(this.twitch_api, twitch_user.name)) {
                            await new Promise((f) => setTimeout(f, 10000));

                            // Create a clip if they are streaming after 10 seconds
                            clip = await this.createClip(clip, twitch_user);

                            // wait for clip to process (if it does)
                            await new Promise((f) => setTimeout(f, 15000));

                            // Post the message into the chat, along with the clip if applicable.
                            await this.twitch_bot.say(
                                `${twitch_user.name}`,
                                `! WYSI ${accuracy.toFixed(2)}% accuracy! ${clip
                                    ? `https://clips.twitch.tv/${clip}`
                                    : "(no clip, not streaming / no perms)"
                                }`
                            );
                        }

                        if (clip) {
                            // wait for 20 seconds to account for reaction time.
                            await new Promise((f) => setTimeout(f, 20000));

                            // take a reaction clip for the streamers (likely) reaction to the bot.
                            reaction_clip = await this.createClip(clip, twitch_user);

                            // first clip worked, second one will also likely work, so we wait for it to process.
                            await new Promise((f) => setTimeout(f, 20000));
                        }

                        // Leave the channel
                        this.twitch_bot.part(`${twitch_user.name}`);
                    }
                }

                const tweet = `${display_name} just got a ${accuracy.toFixed(2)}% on ${data.leaderboard.song.name
                    } (${data.leaderboard.difficulty.difficultyName}) by ${data.leaderboard.song.author
                    }!`;

                await this.twitter.v2.tweet(
                    `#WYSI! ${tweet}${clip
                        ? ` https://clips.twitch.tv/${clip} `
                        : twitch_social
                            ? ` ${twitch_social.link} `
                            : " "
                    }${replay_url}`
                );

                console.log(
                    `✔️    ${tweet} ${replay_url} ${clip
                        ? ` https://clips.twitch.tv/${clip} `
                        : twitch_social
                            ? ` ${twitch_social.link} `
                            : " "
                    }`
                );


                // send info to Discord
                await this.analytics(display_name, data, accuracy, replay_url, clip, reaction_clip, twitter_social, twitch_social);

            } else {
                console.log(
                    `❌    ${data.player.name} just got a ${accuracy.toFixed(2)}% on ${data.leaderboard.song.name} (${data.leaderboard.difficulty.difficultyName}) by ${data.leaderboard.song.author}!`
                );
            }
        } catch (err) {
            console.error(err);
        }
    }

    public extractSocials(player: { socials: any[]; }) {
        const twitter_social = player.socials
            ? player.socials?.find((social) => social.service === "Twitter")
            : null;

        const twitch_social = player.socials
            ? player.socials?.find((social) => social.service === "Twitch")
            : null;
        return { twitter_social, twitch_social };
    }

    public async analytics(
        username: string,
        data: WebsocketData,
        accuracy: number,
        replay_url: string,
        clip: string | null,
        reaction_clip: string | null,
        twitter_social: any,
        twitch_social: any
    ) {
        const embeds = [
            {
                title: "WHEN YOU SEE IT!",
                description: `**Map**: (${data.leaderboard.song.id}) ${data.leaderboard.song.name} (${data.leaderboard.difficulty.difficultyName}) by ${data.leaderboard.song.author}`,
                url: replay_url,
                image: {
                    url: data.leaderboard.song.coverImage,
                },
                thumbnail: {
                    url: data.player.avatar
                },
                fields: [
                    {
                        name: "Player",
                        value: `${data.player.name}`,
                        inline: true,
                    },
                    {
                        name: "Accuracy",
                        value: `${accuracy.toFixed(2)}%`,
                        inline: true,
                    },
                    {
                        name: "Twitter",
                        value: twitter_social ? `${twitter_social.link}` : "N/A",
                        inline: true,
                    },
                    {
                        name: "Twitch",
                        value: twitch_social ? twitch_social.link : "N/A",
                        inline: true,
                    },
                    {
                        name: "Twitch Clip",
                        value: clip ? `https://clips.twitch.tv/${clip}` : "N/A",
                        inline: true,
                    },
                    {
                        name: "Twitch Reaction Clip",
                        value: reaction_clip ? `https://clips.twitch.tv/${reaction_clip}` : "N/A",
                        inline: true,
                    },
                ],
                color: 0xff69b4,
                timestamp: new Date(),
            },
        ];

        await fetch(process.env.DISCORD_WEBHOOK as string, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds,
            }),
        }).catch(e => console.error(e));
    }

    private async createClip(clip: string | null, twitch_user: HelixUser) {
        try {
            clip = await this.twitch_api.clips.createClip({
                channelId: twitch_user.id,
            });
        } catch (error) {
            return null;
        }

        return clip;
    }

    async connect(): Promise<void> {
        console.log("Connecting to Twitter");

        const twitter_user = await this.twitter.currentUserV2();
        console.log(`Logged into Twitter as ${twitter_user.data.username}\n`);

        console.log("Connecting to Twitch");
        await this.twitch_bot.connect();
    }
}
