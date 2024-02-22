## Token listener and sender

Listen token "Transfers events" by contract address and send it to yout another wallets.
Target chain will be selected automatically.

Supported chains: arbitrum, base, bsc, goerli, linea, mainnet, optimism, polygon, zkSync

## Files

- `credentials/keys.txt` - wallet for listening private keys
- `credentials/receivers.txt` - addresses for receiving 1 by 1 per line(or random/first receiver)

## Start modes

- `npm run listen CONTRACT_ADDRESS` - start listening events

## Test script

If you want test script in testnet:

- `npm run listen 0x326C977E6efc84E512bB9C30f76E30c160eD06FB` - listen LINK token in Goerli ETH

## One line

```bash

git clone https://github.com/Sa7cez/token-listener && cd token-listener && pnpm install

```

## Setup bot

1. Download ZIP and extract it to a folder (or better use [git](https://git-scm.com/) for getting updates)

2. Install [node.js](https://nodejs.org/en/) (LTS) and [pnpm](https://pnpm.io/installation) package manager

3. Open folder with the bot in `terminal` or `cmd`

```bash

cd <path to folder with script>

```

4. Install dependencies

```bash

pnpm install

```

5. Start

```bash

npm run start

```

6. Follow script UI and enjoy :)

## Donate

EVM: `0xac1c08185ba23b28ac0c723abbb93ab9dc00dead`
