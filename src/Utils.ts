import { ApiClient } from "@twurple/api";

const twitchUrlRegex = /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/;

export function dysi(input: string): boolean {
    const sanitizedInput = input.replace(".", "");
    return sanitizedInput.includes("727");
}

export async function isStreamLive(twitch_api: ApiClient, userName: string) {
    const user = await twitch_api.users.getUserByName(userName);
    if (!user) {
        return false;
    }
    return (await user.getStream()) !== null;
}

export function getTwitchUsername(url: string): string | null {
    const match = url.match(twitchUrlRegex);
    return match ? match[1] : null;
}
