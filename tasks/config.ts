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
// description for NFT in metadata file
export const description = "Chaos";
// base url to use in metadata file
// the id of the nft will be added to this url, in the example e.g. https://hashlips/nft/1 for NFT with id 1
export const baseImageUri = "Placeholder";

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

export const formatColorPathNames = ["1", "2", "3", "4", "5"];

export const coverColorPathNames = ["1", "2", "3", "4", "5"];

export const ribbonPathNames = ["1", "2", "3", "4", "5"];

export const logoPathNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

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
