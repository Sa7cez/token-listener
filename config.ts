const alchemy = process.env.ALCHEMY_KEY || ''
const ankr = process.env.ANKR_KEY || ''

export const config: any = {
  // Send event value or full checked balance
  checkBalance: true,

  // Multiply gas price?
  gasMultiplier: 1.5,

  // Set RPC URLs for each needed chain
  RPCS: {
    homestead: 'https://eth-mainnet.g.alchemy.com/v2/' + alchemy,
    matic: 'https://polygon-mainnet.g.alchemy.com/v2/' + alchemy,
    arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/' + alchemy,
    optimism: 'https://opt-mainnet.g.alchemy.com/v2/' + alchemy,
    'zksync-era': 'https://rpc.ankr.com/zksync_era/' + ankr,
    bsc: 'https://rpc.ankr.com/bsc/' + ankr,
    'linea-mainnet': 'https://rpc.ankr.com/linea/' + ankr,
    base: 'https://rpc.ankr.com/base/' + ankr,
    avalanche: 'https://rpc.ankr.com/avalanche/' + ankr,
    goerli: undefined
  }
}
