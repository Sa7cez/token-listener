import { hex } from './helpers'
import { createWalletClient, http, WalletClient, Hex, PrivateKeyAccount, Chain, publicActions, PublicActions, Transport, extractChain, Address } from 'viem'
import * as chains from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export interface AccountOptions {
  key: Hex
  chain: Chain
  receiver: Address
}

export class Account {
  address: Hex
  key: Hex
  account: PrivateKeyAccount
  receiver: Address
  viemClient: WalletClient<Transport, Chain> & PublicActions
  chain: Chain = chains.polygon

  constructor(options: AccountOptions) {
    this.key = options.key
    this.receiver = options.receiver
    this.account = privateKeyToAccount(this.key)

    this.viemClient = createWalletClient({
      account: this.account,
      chain: options.chain || this.chain,
      transport: http()
    }).extend(publicActions)

    this.address = options?.key ? (this.account.address.toLowerCase() as Hex) : (('0x' + '0'.repeat(40)) as Hex)
  }

  l(...args: any[]): false {
    args = Array.from(args)
    args.unshift(hex(this.address))
    return console.log.apply(console, args) as unknown as false
  }

  switchChain = (chain: Chain | number) => {
    if (typeof chain === 'number')
      chain = extractChain({
        chains: Object.values(chains),
        id: chain as any
      })

    if (!chain) return this.l('chain', chain, 'not supported')

    this.viemClient = createWalletClient({
      account: this.account,
      chain: chain,
      transport: http(chain.rpcUrls.default.http[0], {
        retryCount: 15,
        retryDelay: 200,
        timeout: 20_000
      })
    }).extend(publicActions)

    return this.viemClient
  }
}
