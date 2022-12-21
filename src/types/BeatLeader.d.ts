interface PlayerResponse {
    id?: string;
    name?: string;
    platform?: string;
    avatar?: string;
    country?: string;
    pp?: number;
    rank?: number;
    countryRank?: number;
    role?: string;
    socials?: PlayerSocial[];
    patreonFeatures?: PatreonFeatures;
    profileSettings?: ProfileSettings;
    clans?: ClanResponse[];
}

interface PlayerSocial {
    id: number;
    service: string;
    link: string;
    user: string;
    userId: string;
}

interface PatreonFeatures {
    id?: number;
    bio?: string;
    message?: string;
    leftSaberColor?: string;
    rightSaberColor?: string;
}

interface ProfileSettings {
    id?: number;
    bio?: string;
    message?: string;
    effectName?: string;
    profileAppearance?: string;
    hue?: number;
    saturation?: number;
    leftSaberColor?: string;
    rightSaberColor?: string;
}

interface ClanResponse {
    id?: number;
    tag?: string;
    color?: string;
}
