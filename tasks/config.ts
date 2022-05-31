type pathParams = {
    isAlchemy: boolean;
    isChaos: boolean;
    isPainting: boolean;
    act: string;
    scene: string;
    paper: string;
    bg: string;
    superchargedBg: string;
    format: string;
    formatColor: string;
    coverColor: string;
    logo: string;
    logoColor: string;
    ribbon: string;
    ribbonColor: string;
};

// image width in pixels
export const width = 1000;
// image height in pixels
export const height = 1000;

export const waveBase =
    "ipfs://QmYRTuAA61E2kM9izfS13qk8JXTeKPYDWXvtHqqTykwQ7F/";
export const mp3Base = "ipfs://QmUbtVMriquE1RAL2rdNnA8Yd5GKfZamnPN9zbn8uCbivD/";

/* 
METADATA NAMES
*/

// description for NFT in metadata file
export const description = "Chaos";
// base url to use in metadata file
export const baseImageUri = "Placeholder";

export const paperNames = ["Off White", "Stone", "Duck Egg", "Solid White"];

export const backgroundNames = [
    "None",
    "Electric Wash",
    "Eau du Nil",
    "Root Chaos",
    "Cai",
    "Paloma",
    "Cronenberg",
];

export const superchargedBackgroundNames = [
    "Jolly Wrancher",
    "Fresa Xerox",
    "Maple Syrup",
    "Purp Blast",
    "Folded Mint",
];

export const formatNames = ["Vinyl", "8track", "Cassette"];

export const formatColorNames = [
    "Dark",
    "Sacramento",
    "Clay",
    "Plum Jam",
    "Port",
    "Light",
    "Dark", // Alchemy
    "Light", // Alchemy
];

export const coverNames = [
    "Gilded",
    "Marbled",
    "Drupe",
    "Pome",
    "Original",
    "Alchemy", // only accessible by override
];

export const superchargedCoverNames = [
    "Jolly Wrancher",
    "Fresa Xerox",
    "Maple Syrup",
    "Purp Blast",
    "Folded Mint",
    "Alchemy"
];

export const ribbonNames = [
    "None",
    "Twist",
    "Corners",
    "Tilted Frame",
    "Fuzzy Twist",
    "Bow Tie",
];

export const ribbonColorNames = [
    "Vanda",
    "Club Pink",
    "Key Lime",
    "Sunbird",
    "Camp Blue",
];

export const logoNames = [
    "Arch Serif",
    "Solar Serif",
    "Grid Sans",
    "Solar Roswell",
    "Chaos",
    "Chaos Serif",
    "Solar Sans",
    "Beacon Sans",
    "Arch Roswell",
];

export const logoColorNames = [
    "Dark",
    "Sacramento",
    "Clay",
    "Plum Jam",
    "Port",
    "Light",
];

export const actNames = ["I", "II", "III"];

export const sceneNames = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "Alchemy I",
    "Alchemy II",
    "Alchemy III",
];

const actPathNames = ["acti", "actii", "actiii"];

const scenePathNames = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "1", // alchemy
    "2", // alchemy
    "3", // alchemy
];

const formatColorPathNames = ["1", "2", "3", "4", "5", "6", "1", "2"];

const coverColorPathNames = ["1", "2", "3", "4", "5"];

const ribbonPathNames = ["None", "1", "2", "3", "4", "5"];

const ribbonColorPathNames = ["1", "2", "3", "4", "5"];

const logoPathNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const logoColorPathNames = ["1", "2", "3", "4", "5", "6"];

const paperPathNames = [
    "background_paper-1",
    "background_paper-2",
    "background_paper-3",
    "background_whitelayer",
];

const bgPathNames = ["None", "1", "2", "3", "1", "2", "3"];

const superchargedBgPathNames = ["1", "2", "3", "4", "5"];

const formatPathNames = ["vinyl", "8trk", "cs"];

const isAlchemy = (dna: number[]): boolean => dna[1] >= 12;
const isChaosOrPaint = (dna: number[]): boolean => dna[3] > 0;
const isChaos = (dna: number[]): boolean => [1, 2, 3].indexOf(dna[3]) > -1;
const isPainting = (dna: number[]): boolean => [4, 5, 6].indexOf(dna[3]) > -1;

export function applyOverrides(dna: number[], supercharged: boolean): number[] {
    if (isAlchemy(dna)) {
        dna[5] = 6; // Set text color to alchemy black
        dna[6] = 5; // Set cover art to alchemy
    }

    if (isPainting(dna)) {
        dna[2] = 3; // - set paper to white
        dna[9] = 5; // - set logo to white
        if (isAlchemy(dna)) {
            // Set text color to alchemy white
            dna[5] = 7;
        } else {
            // Set text color to regular white
            dna[5] = 5;
        }
    }

    if (supercharged) {
        dna[9] = 5; // - set logo to white
        dna[5] = 5; // - set text color to regular white
    }
    return dna;
}

export function dnaToPathParams(dna: number[]): pathParams {
    const params = {
        isAlchemy: isAlchemy(dna),
        isChaos: isChaos(dna),
        isPainting: isPainting(dna),
        act: actPathNames[dna[0]],
        scene: scenePathNames[dna[1]],
        paper: paperPathNames[dna[2]],
        bg: bgPathNames[dna[3]],
        superchargedBg: superchargedBgPathNames[dna[3]],
        format: formatPathNames[dna[4]],
        formatColor: formatColorPathNames[dna[5]],
        coverColor: coverColorPathNames[dna[6]],
        logo: logoPathNames[dna[7]],
        ribbon: ribbonPathNames[dna[8]],
        logoColor: logoColorPathNames[dna[9]],
        ribbonColor: ribbonColorPathNames[dna[10]],
    };
    return params;
}

export function dnaToAttributeNames(
    dna: number[],
    supercharged: boolean
): { [key: string]: any } {
    const params = {
        Act: actNames[dna[0]],
        Scene: sceneNames[dna[1]],
        Paper: paperNames[dna[2]],
        Background: supercharged
            ? superchargedBackgroundNames[dna[3]]
            : backgroundNames[dna[3]],
        Layout: formatNames[dna[4]],
        "Layout Color": formatColorNames[dna[5]],
        "Cover Art Color": supercharged
            ? superchargedCoverNames[dna[6]]
            : coverNames[dna[6]],
        Logo: logoNames[dna[7]],
        "Logo Color": logoColorNames[dna[9]],
        Ribbon: ribbonNames[dna[8]],
        "Ribbon Color":
            ribbonNames[dna[8]] === "None" ? "None" : ribbonColorNames[dna[10]],
    };
    return params;
}

export const paperPath = (params: pathParams) => `paper/${params.paper}.png`;
export const bgPath = (params: pathParams) =>
    params.isPainting
        ? params.isAlchemy
            ? `backgrounds alchemy/alchemy_${params.act}_${params.format}_backgrounds-${params.bg}.png`
            : `backgrounds (painting, chaos)/painting_${params.act}_${params.format}_background-${params.bg}.png`
        : params.isChaos
        ? `backgrounds (painting, chaos)/chaos_${params.act}_${params.format}_background-${params.bg}.png`
        : `None`;
export const superchargedBgPath = (params: pathParams) =>
    params.isAlchemy
        ? `backgrounds supercharged/backgrounds_alchemy_supercharged-${params.superchargedBg}.png`
        : `backgrounds supercharged/supercharged_${params.act}_${params.format}_background-${params.superchargedBg}.png`;
export const formatPath = (params: pathParams) =>
    params.isAlchemy
        ? params.isPainting
            ? `formats alechmy/alchemy_${params.act}_${params.format}_light-${params.scene}.png`
            : `formats alechmy/alchemy_${params.act}_${params.format}_dark-${params.scene}.png`
        : params.isPainting
        ? `formats supercharged/supercharged_${params.act}_${params.format}_scene-${params.scene}.png`
        : `formats regular/${params.act}_${params.format}_scene-${params.scene}_color-${params.formatColor}.png`;
export const superchargedFormatPath = (params: pathParams) =>
    params.isAlchemy
        ? `formats alechmy/alchemy_${params.act}_${params.format}_light-${params.scene}.png`
        : `formats supercharged/supercharged_${params.act}_${params.format}_scene-${params.scene}.png`;
export const coverPath = (params: pathParams) =>
    params.isAlchemy
        ? `cover art alchemy/alchemy_${params.act}_${params.format}-${params.scene}.png`
        : `cover art regular/${params.act}_${params.format}_scene-${params.scene}_color-${params.coverColor}.png`;
export const superchargedCoverPath = (params: pathParams) =>
    params.isAlchemy
        ? `cover art alchemy/alchemy_${params.act}_${params.format}-${params.scene}.png`
        : `cover art supercharged/supercharged_${params.act}_${params.format}_scene_${params.scene}_color-${params.coverColor}.png`;
export const logoPath = (params: pathParams) =>
    params.isAlchemy
        ? params.isPainting
            ? `Logos Full/alchemy_${params.act}_${params.format}_logo_light_${params.logo}.png`
            : `Logos Full/alchemy_${params.act}_${params.format}_logo_dark_${params.logo}.png`
        : params.isPainting
        ? `logos supercharged/supercharged_${params.act}_${params.format}_logo-${params.logo}.png`
        : `logos/${params.act}_${params.format}_logo-${params.logo}_color-${params.logoColor}.png`;
export const superchargedLogoPath = (params: pathParams) =>
    params.isAlchemy
        ? `Logos Full/alchemy_${params.act}_${params.format}_logo_light_${params.logo}.png`
        : `logos supercharged/supercharged_${params.act}_${params.format}_logo-${params.logo}.png`;
export const ribbonsPath = (params: pathParams) =>
    params.isAlchemy
        ? `ribbons alchemy/alchemy_${params.act}_${params.format}_ribbon-${params.ribbon}_color-${params.ribbonColor}.png`
        : `ribbons regular/${params.act}_${params.format}_ribbon-${params.ribbon}_color-${params.ribbonColor}.png`;

export const nullPath = (params: pathParams) => null;

/*
  RARITY CONFIGURATION
*/

const paperTable = [
    { weight: 7000, id: 0 },
    { weight: 5000, id: 1 },
    { weight: 4000, id: 2 },
    { weight: 0, id: 3 }, // Solid white only accessible by override
];

const backgroundTable = [
    { weight: 16000, id: 0 }, // None
    { weight: 2000, id: 1 }, // Chaos 1
    { weight: 1111, id: 2 }, // Chaos 2
    { weight: 702, id: 3 }, // Chaos 3
    { weight: 777, id: 4 }, // Painting 1
    { weight: 333, id: 5 }, // Painting 2
    { weight: 77, id: 6 }, // Painting 3
];

const superchargedBackgroundTable = [
    { weight: 30, id: 0 },
    { weight: 25, id: 1 },
    { weight: 25, id: 2 },
    { weight: 15, id: 3 },
    { weight: 5, id: 4 },
];

const formatTable = [
    { weight: 4200, id: 0 },
    { weight: 6300, id: 1 },
    { weight: 10500, id: 2 },
];

const formatColorTable = [
    { weight: 6050, id: 0 },
    { weight: 2300, id: 1 },
    { weight: 2300, id: 2 },
    { weight: 2300, id: 3 },
    { weight: 2300, id: 4 },
    { weight: 0, id: 5 }, // White only accessible by override
    { weight: 0, id: 6 }, // Alchemy colors only accessible by override
    { weight: 0, id: 7 }, // Alchemy colors only accessible by override
];

const coverartColorTable = [
    { weight: 5500, id: 0 },
    { weight: 5500, id: 1 },
    { weight: 4200, id: 2 },
    { weight: 4200, id: 3 },
    { weight: 800, id: 4 },
];

const ribbonTable = [
    { weight: 12000, id: 0 },
    { weight: 6443, id: 1 },
    { weight: 1111, id: 2 },
    { weight: 777, id: 3 },
    { weight: 444, id: 4 },
    { weight: 225, id: 5 },
];

const ribbonColorTable = [
    { weight: 4444, id: 0 },
    { weight: 3333, id: 1 },
    { weight: 1111, id: 2 },
    { weight: 94, id: 3 },
    { weight: 18, id: 4 },
];

const logoTable = [
    { weight: 9, id: 0 },
    { weight: 88, id: 1 },
    { weight: 222, id: 2 },
    { weight: 1200, id: 3 },
    { weight: 1888, id: 4 },
    { weight: 2000, id: 5 },
    { weight: 4000, id: 6 },
    { weight: 5793, id: 7 },
    { weight: 5800, id: 8 },
];

const logoColorTable = [
    { weight: 11111, id: 0 },
    { weight: 59, id: 1 },
    { weight: 3600, id: 2 },
    { weight: 1000, id: 3 },
    { weight: 230, id: 4 },
    { weight: 0, id: 5 }, // Only accessible by override
];

const actTable = [
    { weight: 9000, id: 0 },
    { weight: 7000, id: 1 },
    { weight: 5000, id: 2 },
];

const superchargedSceneTable = [
    { weight: 1687, id: 0 },
    { weight: 1687, id: 1 },
    { weight: 1687, id: 2 },
    { weight: 1687, id: 3 },
    { weight: 1687, id: 4 },
    { weight: 1687, id: 5 },
    { weight: 1687, id: 6 },
    { weight: 1687, id: 7 },
    { weight: 1687, id: 8 },
    { weight: 1687, id: 9 },
    { weight: 1687, id: 10 },
    { weight: 1687, id: 11 },
    { weight: 250, id: 12 },
    { weight: 250, id: 13 },
    { weight: 250, id: 14 },
];

const sceneTable = [
    { weight: 1687, id: 0 },
    { weight: 1687, id: 1 },
    { weight: 1687, id: 2 },
    { weight: 1687, id: 3 },
    { weight: 1687, id: 4 },
    { weight: 1687, id: 5 },
    { weight: 1687, id: 6 },
    { weight: 1687, id: 7 },
    { weight: 1687, id: 8 },
    { weight: 1687, id: 9 },
    { weight: 1687, id: 10 },
    { weight: 1687, id: 11 },
    { weight: 250, id: 12 },
    { weight: 250, id: 13 },
    { weight: 250, id: 14 },
];

export const hiddenFolder = 'Hidden Songs 1 of 1s/'

export const hiddenImages = [
    'hidden_scene_I.png',
    'hidden_scene_II.png',
    'hidden_scene_III.png',
]
export const rarityTables = [
    actTable,
    sceneTable,
    paperTable,
    backgroundTable,
    formatTable,
    formatColorTable,
    coverartColorTable,
    logoTable,
    ribbonTable,
    logoColorTable,
    ribbonColorTable,
];

export const superchargedRarityTables = [
    actTable,
    superchargedSceneTable,
    paperTable,
    superchargedBackgroundTable,
    formatTable,
    formatColorTable,
    coverartColorTable,
    logoTable,
    ribbonTable,
    logoColorTable,
    ribbonColorTable,
];
