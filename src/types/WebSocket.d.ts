// ? All explicit "any"s are likely always null, but are set
// ? like this just in case.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Leaderboard {
    id: string;
    song: Song;
    difficulty: Difficulty;
    scores: any;
    changes: any;
    qualification: any;
    reweight: any;
    leaderboardGroup: any;
    plays: number;
}

interface Song {
    id: string;
    hash: string;
    name: string;
    description: any;
    subName: string;
    author: string;
    mapper: string;
    mapperId: number;
    coverImage: string;
    downloadUrl: string;
    bpm: number;
    duration: number;
    tags: any;
    createdTime: string;
    uploadTime: number;
    difficulties: Difficulty[];
}

interface Difficulty {
    id: number;
    value: number;
    mode: number;
    difficultyName: string;
    modeName: string;
    status: number;
    modifierValues: ModifierValues;
    nominatedTime: number;
    qualifiedTime: number;
    rankedTime: number;
    stars: any;
    type: number;
    njs: number;
    nps: number;
    notes: number;
    bombs: number;
    walls: number;
    maxScore: number;
    duration: number;
}

interface ModifierValues {
    modifierId: number;
    da: number;
    fs: number;
    ss: number;
    sf: number;
    gn: number;
    na: number;
    nb: number;
    nf: number;
    no: number;
    pm: number;
    sc: number;
    sa: number;
}

interface Player {
    id: string;
    name: string;
    platform: string;
    avatar: string;
    country: string;
    pp: number;
    rank: number;
    countryRank: number;
    role: string;
    socials: any;
    patreonFeatures: any;
    profileSettings: any;
    comments: any;
}

interface WebsocketData {
    myScore: any;
    leaderboard: Leaderboard;
    weight: number;
    accLeft: number;
    accRight: number;
    id: number;
    baseScore: number;
    modifiedScore: number;
    accuracy: number;
    playerId: string;
    pp: number;
    bonusPp: number;
    rank: number;
    countryRank: number;
    country: string;
    fcAccuracy: number;
    fcPp: number;
    replay: string;
    modifiers: string;
    badCuts: number;
    missedNotes: number;
    bombCuts: number;
    wallsHit: number;
    pauses: number;
    fullCombo: boolean;
    platform: string;
    maxCombo: number;
    hmd: number;
    controller: number;
    leaderboardId: string;
    timeset: string;
    timepost: number;
    replaysWatched: number;
    player: Player;
}
