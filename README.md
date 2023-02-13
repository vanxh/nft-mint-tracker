# NFT Mint Tracker

## Setup

### Step 1

Create `.env` with ALCHEMY_API_KEY (you can get that at [alchemy](https://alchemy.com)) and DISCORD_WEBHOOK_URL (discord webhook uri to post the nft mint notification to).

Your `.env` should look like this:
```env
ALCHEMY_API_KEY=""
DISCORD_WEBHOOK_URL=""
```

### Step 2

Update `contractAddress` in `config.js` with contract address of nft whose mints you want to track.

### Step 3

Update `mintTopic` in `config.js` with mint topic of nft contract, you can find it in transaction logs on etherscan (it is Topic 0).

### Step 4

Install modules with npm:
```shell
npm install
```
or yarn:
```shell
yarn install
```

### Step 5

Run the project:
```shell
node index.js
```