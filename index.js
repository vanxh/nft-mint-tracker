require("dotenv").config();
const { Network, Alchemy } = require("alchemy-sdk");
const { WebhookClient, Colors } = require("discord.js");

const {
    contractAddress,
    mintTopic,
    zeroTopic,
    fromAddress,
} = require("./config");
const { EmbedBuilder } = require("@discordjs/builders");

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const webhook = new WebhookClient({
    url: process.env.DISCORD_WEBHOOK_URL,
});

const getNftMetadata = async (contractAddress, tokenId) => {
    const data = await alchemy.nft.getNftMetadata(contractAddress, tokenId);

    return {
        name: data.rawMetadata.name || data.title,
        image: data.media[0].gateway || data.media[0].raw,
        collection: {
            name: data.contract.name,
            symbol: data.contract.symbol,
            url: data.contract.openSea.externalUrl,
        },
    };
};

const onMintEvent = async (e) => {
    console.log("Mint event", e);

    try {
        const txHash = e.transactionHash;

        const data = await alchemy.core.getAssetTransfers({
            fromBlock: e.blockNumber,
            contractAddresses: [contractAddress],
            fromAddress: fromAddress,
            category: ["erc721"],
            order: "desc",
            withMetadata: true,
            maxCount: 5,
        });

        const transfer = data.find((t) => t.hash === txHash);
        const nft = await getNftMetadata(
            contractAddress,
            transfer.tokenId ?? transfer.erc721TokenId
        );

        await webhook.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: nft.collection.name ?? "Unknown Collection",
                        url:
                            nft.collection.url ??
                            `https://etherscan.io/${contractAddress}`,
                    })
                    .setColor(Colors.Blue)
                    .setDescription(`${nft.name} just minted`)
                    .setImage(nft.image)
                    .setTimestamp(),
            ],
        });
    } catch (e) {
        console.error(`Error tracking NFT mint`, e);
    }
};

alchemy.ws.on(
    {
        address: contractAddress,
        topics: [mintTopic, zeroTopic],
    },
    onMintEvent
);

console.log("Listening for mint events...");
