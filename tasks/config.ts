type pathParams = {
    isAlchemy: boolean;
    act: string;
    scene: string;
    bg: string;
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

/* 
METADATA NAMES
*/

// description for NFT in metadata file
export const description = "Chaos";
// base url to use in metadata file
export const baseImageUri = "Placeholder";

export const paperNames = [
    "Off White",
    "Egg Shell",
    "Water Stained",
    "Solid White",
];

export const backgroundNames = [
    "None",
    "Chaos Background 1",
    "Chaos Background 2",
    "Chaos Background 3",
    "Alchemy Background 1",
    "Alchemy Background 2",
    "Alchemy Background 3",
];

export const formatNames = ["Vinyl", "8track", "Casette"];

export const formatColorNames = [
    "Black",
    "Green",
    "Orange",
    "Pink",
    "Red",
    "White",
    "Black", // Alchemy
    "White", // Alchemy
];

export const coverNames = [
    "Cover Art Color 1",
    "Cover Art Color 2",
    "Cover Art Color 3",
    "Cover Art Color 4",
    "Cover Art Color 5",
];

export const ribbonNames = [
    "None",
    "Ribbon 1",
    "Ribbon 2",
    "Ribbon 3",
    "Ribbon 4",
    "Ribbon 5",
];

export const ribbonColorNames = [
    "Color 1",
    "Color 2",
    "Color 3",
    "Color 4",
    "Color 5",
];

export const logoNames = [
    "Logo 1",
    "Logo 2",
    "Logo 3",
    "Logo 4",
    "Logo 5",
    "Logo 6",
    "Logo 7",
    "Logo 8",
    "Logo 9",
];

export const logoColorNames = [
    "Color 1",
    "Color 2",
    "Color 3",
    "Color 4",
    "Color 5",
];

export const actNames = ["Act I", "Act II", "Act III"];

export const sceneNames = [
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
    "Alchemy 1",
    "Alchemy 2",
    "Alchemy 3",
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

const formatColorPathNames = ["1", "2", "3", "4", "5","6", "1", "2"];

const coverColorPathNames = ["1", "2", "3", "4", "5"];

const ribbonPathNames = [
    "None",
    "1",
    "2",
    "3",
    "4",
    "5",
];

const ribbonColorPathNames = ["1", "2", "3", "4", "5"];

const logoPathNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const logoColorPathNames = ["1", "2", "3", "4", "5"];

const paperPathNames = ["1", "2", "3", "4"];

const bgPathNames = ["None", "1", "2", "3", "1", "2", "3"];

const formatPathNames = [
    "vinyl",
    "8track",
    "cassette",
];

const isAlchemy = (dna: number[]): boolean => dna[1] >= 12;
const isChaosOrPaint = (dna: number[]): boolean => dna[3] > 0;

export function applyOverrides(dna: number[]): number[] {
    if (isAlchemy(dna)) {
        dna[5] = 6 // Set text color to alchemy black
    }

    if (isChaosOrPaint(dna)) {
        dna[2] = 3; // - set paper to white
        dna[9] = 5; // - set logo to white
        if (isAlchemy(dna)) {
            // Set text color to alchemy white
            dna[5] = 7
        } else {
            // Set text color to regular white
            dna[5] = 5
        }
    }
    return dna;
}

export function dnaToPathParams(dna: number[]): pathParams {
    const params = {
        isAlchemy: isAlchemy(dna),
        act: actPathNames[dna[0]],
        scene: scenePathNames[dna[1]],
        paper: paperPathNames[dna[2]],
        bg: bgPathNames[dna[3]],
        format: formatPathNames[dna[4]],
        formatColor: formatColorPathNames[dna[5]],
        coverColor: coverColorPathNames[dna[6]],
        logo: logoPathNames[dna[7]],
        logoColor: logoColorPathNames[dna[8]],
        ribbon: ribbonPathNames[dna[9]],
        ribbonColor: ribbonColorPathNames[dna[10]],
    };
    return params;
}

export const paperPath = (params: pathParams) => `paper/paper${params.bg}`;
export const bgPath = (params: pathParams) => `backgrounds/bg${params.bg}`;
export const coverPath = (params: pathParams) =>
    params.isAlchemy
        ? `coverArt/alchemy_${params.act}_${params.format}-${params.scene}`
        : `coverArt/${params.act}_${params.format}_scene-${params.scene}_color-${params.coverColor}.png`;
export const formatPath = (params: pathParams) =>
    params.isAlchemy
        ? `format/alchemy_${params.act}_${params.format}-${params.scene}`
        : `format/${params.act}_${params.format}_scene-${params.scene}_color-${params.formatColor}.png`;
export const logoPath = (params: pathParams) =>
    params.isAlchemy
        ? `logos/alchemy_${params.act}_${params.format}_logo-${params.logo}`
        : `logos/${params.act}_${params.format}_logo-${params.logo}_color-${params.logoColor}.png`;
export const ribbonsPath = (params: pathParams) =>
    params.isAlchemy
        ? `ribbons/alchemy_${params.act}_${params.format}_master_ribbon-${params.ribbon}_color-${params.ribbonColor}.png`
        : `ribbons/${params.act}_${params.format}_ribbon-${params.ribbon}_color-${params.ribbonColor}.png`;
export const nullPath = (params: pathParams) => null;

/*
  RARITY CONFIGURATION
*/

const paperTable = [
    { weight: 8000, id: 0 },
    { weight: 5000, id: 1 },
    { weight: 3000, id: 2 },
    { weight: 0, id: 3 }, // Solid white only accessible by override
];

const backgroundTable = [
    { weight: 8000, id: 0 }, // None
    { weight: 5000, id: 1 }, // Chaos 1
    { weight: 3000, id: 2 }, // Chaos 2
    { weight: 2500, id: 3 }, // Chaos 3
    { weight: 1000, id: 4 }, // Painting 1
    { weight: 1000, id: 5 }, // Painting 2
    { weight: 1000, id: 6 }, // Painting 3
];

const formatTable = [
    { weight: 2500, id: 0 },
    { weight: 7000, id: 1 },
    { weight: 11500, id: 2 },
];

const formatColorTable = [
    { weight: 16000, id: 0 },
    { weight: 2000, id: 1 },
    { weight: 1100, id: 2 },
    { weight: 775, id: 3 },
    { weight: 125, id: 4 },
    { weight: 0, id: 5 }, // White only accessible by override
    { weight: 0, id: 6 }, // Alchemy colors only accessible by override
    { weight: 0, id: 7 }, // Alchemy colors only accessible by override
];

const coverartColorTable = [
    { weight: 9000, id: 0 },
    { weight: 6000, id: 1 },
    { weight: 4200, id: 2 },
    { weight: 1000, id: 3 },
    { weight: 800, id: 4 },
];

const ribbonTable = [
    { weight: 9000, id: 0 },
    { weight: 6000, id: 1 },
    { weight: 4200, id: 2 },
    { weight: 1000, id: 3 },
    { weight: 800, id: 4 },
    { weight: 800, id: 5 },
];

const ribbonColorTable = [
    { weight: 9000, id: 0 },
    { weight: 6000, id: 1 },
    { weight: 4200, id: 2 },
    { weight: 1000, id: 3 },
    { weight: 800, id: 4 },
];

const logoTable = [
    { weight: 5800, id: 0 },
    { weight: 5793, id: 1 },
    { weight: 4000, id: 2 },
    { weight: 2000, id: 3 },
    { weight: 1888, id: 4 },
    { weight: 1200, id: 5 },
    { weight: 222, id: 6 },
    { weight: 88, id: 7 },
    { weight: 9, id: 8 },
];

const logoColorTable = [
    { weight: 9000, id: 0 },
    { weight: 6000, id: 1 },
    { weight: 4200, id: 2 },
    { weight: 1000, id: 3 },
    { weight: 800, id: 4 },
];

const actTable = [
    { weight: 9000, id: 0 },
    { weight: 7000, id: 1 },
    { weight: 5000, id: 2 },
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
