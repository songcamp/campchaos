import '@nomiclabs/hardhat-web3'
import { task } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
const fs = require('fs')

const saveMetadata = (outputdir: string, _metadata: any, edition: string) => {
    fs.writeFileSync(`${outputdir}/${edition}.json`, JSON.stringify(_metadata))
}
task('generate-metadata', 'Generate metadata files')
    .addParam<string>('desc', 'Token description')
    .addParam<string>('qty', 'Amount')
    .addParam<string>('start', 'Token ID start')
    .addParam<string>('max', 'Total supply')
    .addParam<string>('output', 'output folder')
    .addParam<string>('image', 'still image')
    .setAction(async (taskArgs, { ethers }) => {
      
        
        
    for (let index = 0; index < taskArgs.qty; index++) {
        const tokenId = parseInt(taskArgs.start) + index
        const metadata = {
            name: `Pack #${index + 1}`,
            description: taskArgs.desc,
            image: taskArgs.image,
            animation_url: taskArgs.animation,
            // external_url: taskArgs.ws,
            attributes: [
                {
                    trait_type: 'Pack Number',
                    value: `${tokenId} of ${taskArgs.max}`
                },
            ],
            releaseDate: '06/03/2022',
            manifestedBy: 'Songcamp'
        }
        
        saveMetadata(taskArgs.output, metadata, tokenId.toString())
    }

    })
