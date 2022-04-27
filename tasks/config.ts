type pathParams = {
    act: string;
    scene: string;
    bg: string;
    format: string;
    formatColor: string;
    coverColor: string;
    logo: string;
    ribbon: string;
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
// the id of the nft will be added to this url, in the example e.g. https://hashlips/nft/1 for NFT with id 1
export const baseImageUri = "Placeholder";

export const formatNames = ["Vinyl", "8track", "Casette"];
export const coverNames = [
    "Cover Art Color 1",
    "Cover Art Color 2",
    "Cover Art Color 3",
    "Cover Art Color 4",
    "Cover Art Color 5",
];
export const formatColorNames = [
    "Color 1",
    "Color 2",
    "Color 3",
    "Color 4",
    "Color 5",
    "Supercharged", // todo not how sc works
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
export const ribbonNames = [
    "Ribbon 1",
    "Ribbon 2",
    "Ribbon 3",
    "Ribbon 4",
    "Ribbon 5",
];
export const backgroundNames = [
    "Off White",
    "Egg Shell",
    "Water Stained",
    "Creased",
    "Chaos",
    "Supercharged",
];

export const actPathNames = ["acti", "actii", "actiii"];

export const scenePathNames = [
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
    "13", //TODO alchemy
    "14", //TODO alchemy
    "15", //TODO alchemy
    "16", //TODO hidden
];

export const formatColorPathNames = ["1", "2", "3", "4", "5"];

export const coverColorPathNames = ["1", "2", "3", "4", "5"];

export const ribbonPathNames = ["1", "2", "3", "4", "5"];

export const logoPathNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const bgPathNames = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6", // TODO SC
];

export const formatPathNames = [
    "vinyl",
    "8track",
    "cassette", // TODO CD?
];

export function dnaToPathParams(dna: number[]): pathParams {
    const params = {
        act: actPathNames[dna[0] - 1],
        scene: scenePathNames[dna[1] - 1],
        bg: bgPathNames[dna[2] - 1],
        format: formatPathNames[dna[3] - 1],
        formatColor: formatColorPathNames[dna[4] - 1],
        coverColor: coverColorPathNames[dna[5] - 1],
        logo: logoPathNames[dna[6] - 1],
        ribbon: ribbonPathNames[dna[7] - 1],
    };
    // console.log({params, actPathNames, dna})
    return params;
}

export const coverPath = (params: pathParams) =>
    `coverArt/${params.act}_${params.format}_scene_${params.scene}_dist1_color${params.coverColor}.png`;
export const formatPath = (params: pathParams) =>
    `format/${params.act}_${params.format}_master_scene_${params.scene}_color${params.formatColor}.png`;
export const logoPath = (params: pathParams) =>
    `logos/${params.act}_${params.format}_master_logo_${params.logo}_color${params.formatColor}.png`;
export const ribbonsPath = (params: pathParams) =>
    `ribbons/${params.act}_${params.format}_master_ribbon${params.ribbon}_color${params.formatColor}.png`;
export const bgPath = (params: pathParams) => `backgrounds/paper${params.bg}`;
export const nullPath = (params: pathParams) => null;

/*
  RARITY CONFIGURATION
*/

const backgroundTable = [
    { weight: 8000, id: 1 },
    { weight: 5000, id: 2 },
    { weight: 3000, id: 3 },
    { weight: 2500, id: 4 },
    { weight: 1500, id: 5 },
    { weight: 1000, id: 6 },
];

const formatTable = [
    { weight: 2500, id: 1 },
    { weight: 7000, id: 2 },
    { weight: 11500, id: 3 },
];

const colorTable = [
    { weight: 16000, id: 1 },
    { weight: 2000, id: 2 },
    { weight: 1100, id: 3 },
    { weight: 775, id: 4 },
    { weight: 125, id: 5 },
    { weight: 1000, id: 6 },
];

const coverartTable = [
    { weight: 9000, id: 1 },
    { weight: 6000, id: 2 },
    { weight: 4200, id: 3 },
    { weight: 1000, id: 4 },
    { weight: 800, id: 5 },
];

const ribbonTable = [
    { weight: 9000, id: 1 },
    { weight: 6000, id: 2 },
    { weight: 4200, id: 3 },
    { weight: 1000, id: 4 },
    { weight: 800, id: 5 },
];

const logoTable = [
    { weight: 5800, id: 1 },
    { weight: 5793, id: 2 },
    { weight: 4000, id: 3 },
    { weight: 2000, id: 4 },
    { weight: 1888, id: 5 },
    { weight: 1200, id: 6 },
    { weight: 222, id: 7 },
    { weight: 88, id: 8 },
    { weight: 9, id: 9 },
];

const actTable = [
    { weight: 9000, id: 1 },
    { weight: 7000, id: 2 },
    { weight: 5000, id: 3 },
];

const sceneTable = [
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
    { weight: 1687, id: 12 },
    { weight: 250, id: 13 },
    { weight: 250, id: 14 },
    { weight: 250, id: 15 },
    { weight: 6, id: 16 },
];

export const rarityTables = [
    actTable,
    sceneTable,
    backgroundTable,
    formatTable,
    colorTable,
    coverartTable,
    logoTable,
    ribbonTable,
];

2-7-3-3-1-2-5-1