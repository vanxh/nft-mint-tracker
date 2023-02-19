require("dotenv").config();
const { Network, Alchemy } = require("alchemy-sdk");
const { WebhookClient, Colors, hyperlink } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { promisify } = require("util");

const {
    contractAddress,
    mintTopic,
    zeroTopic,
    fromAddress,
} = require("./config");

const wait = promisify(setTimeout);

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const webhook = new WebhookClient({
    url: process.env.DISCORD_WEBHOOK_URL,
});

const truncateAddress = (address) => {
  if (address.length < 10) {
    throw new Error("Invalid Ethereum address.");
  }
  const prefix = address.slice(0, 6);
  const suffix = address.slice(-4);
  return `${prefix}...${suffix}`;
};

const getNftMetadata = async (contractAddress, tokenId) => {
    const data = await alchemy.nft.getNftMetadata(contractAddress, tokenId);

    return {
        name: data.rawMetadata.name || data.title,
        image: data.media[0].gateway || data.media[0].raw,
        tokenId: data.tokenId,
        collection: {
            name: data.contract.name,
            symbol: data.contract.symbol,
            url: data.contract.openSea.externalUrl,
            image: data.contract.openSea?.imageUrl,
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

        const transfer = data.transfers.find((t) => t.hash === txHash);
        const nft = await getNftMetadata(
            contractAddress,
            transfer.tokenId ?? transfer.erc721TokenId
        );

        await wait(2 * 60 * 1000);
        await webhook.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: nft.name,
                        url: `https://opensea.io/assets/ethereum/${contractAddress}/${nft.tokenId}`,
                    })
                    .setColor(Colors.Blue)
                    .setDescription(
                        `${nft.name} just minted`
                    )
                    .addFields([
                        {
                            name: "Minter",
                            value: hyperlink(
                                `${truncateAddress(transfer.to)}`,
                                `https://etherscan.io/address/${transfer.to}`
                            ),
                        },
                    ])
                    .setImage(nft.image)
                    .setFooter({
                        text: `Powered by ABC`,
                        iconURL: nft.collection.image,
                    })
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
