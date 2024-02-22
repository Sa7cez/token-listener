import 'dotenv/config'
import c from 'chalk'
import { log } from 'console'
import { readKeysOrAddresses } from './src/store/readers'
import { Address, Chain, Hex, TransactionReceipt, checksumAddress, createPublicClient, formatUnits, getContract, http, isAddressEqual, parseUnits } from 'viem'
import { fixed, shuffle, sleep } from './src/helpers'
import { config } from './config'
import { ERC20 } from './src/contracts/ERC20'
import { arbitrum, base, bsc, goerli, linea, mainnet, optimism, polygon, zkSync } from 'viem/chains'
import { Account } from './src/account'

const chains = [mainnet, optimism, polygon, arbitrum, zkSync, bsc, linea, base, goerli] as const

const modes = ['listen', 'test'] as const
export type Mode = (typeof modes)[number]

let keys: Hex[] = []
let receivers: Address[] = []

const precheck = async () => {
  log(c.bgMagenta('\n/* Precheck script requirements */'))

  keys = readKeysOrAddresses('keys.txt') as Hex[]
  if (keys.length === 0) throw new Error('Fill file /credentials/keys.txt')
  else log(c.yellow(`Fetch ${c.green.bold(keys.length)} private keys...`))

  receivers = readKeysOrAddresses('receivers.txt') as Address[]
  if (receivers.length === 0) throw new Error('Fill file /credentials/receivers.txt')
  else log(c.yellow(`Fetch ${c.green.bold(receivers.length)} receiver addresses...`))

  await Promise.all(
    chains.map(async (chain) => {
      const publicClient = createPublicClient({ chain, transport: http(config.RPCS[chain.network]) })
      const block = await publicClient.getBlockNumber().catch(() => false)
      if (block) log(c.green(`${chain.name} latest block:`), block)
      else {
        delete config.RPCS[chain.network]
        log(chain.name, c.red(`invalid RPC url :(`))
      }
    })
  )

  log(c.bgMagenta('/* precheck ended! */\n'))
}

const work = async (
  account: Account,
  mode: Mode = 'listen',
  value: bigint,
  token: { name: string; symbol: string; decimals: number },
  contractAddress: Address
): Promise<any> => {
  try {
    const contract = getContract({
      address: contractAddress,
      abi: ERC20,
      publicClient: account.viemClient,
      walletClient: account.viemClient
    })
    if (config.checkBalance || value === 0n) value = await contract.read.balanceOf([account.address])
    if (value === 0n) return

    // TODO claim mode
    // TODO approve mode
    // TODO custom mode

    if (mode == 'listen') {
      const estimateGas = await contract.estimateGas.transfer([account.receiver, value], { account: account.account })
      const gasPrice = await account.viemClient.getGasPrice()

      const decimals = config.gasMultiplier.toString().split('.')[1]?.length ?? 0
      const denominator = 10 ** decimals
      const multiply = (base: bigint) => (base * BigInt(Math.ceil(config.gasMultiplier * denominator))) / BigInt(denominator)

      return contract.write
        .transfer([account.receiver, value], {
          account: account.account,
          gasLimit: estimateGas,
          gasPrice: multiply(gasPrice)
        })
        .then((trx) =>
          account.l(
            c.green(`successfully send`),
            `${c.yellow(formatUnits(value, token.decimals))} ${token.symbol}`,
            `to ${c.yellow(account.receiver)}`,
            c.blue(`${account.viemClient.chain?.blockExplorers?.default.url}/tx/${trx}`)
          )
        )
    }
  } catch (e: any) {
    log('something wrong', e?.message || e)
    await sleep(10000)
    return work(account, mode, value, token, contractAddress)
  }
}

const workflow = async (keys: Hex[], mode: Mode, contractAddress: Address, chain: Chain) => {
  try {
    const accounts = keys.map(
      (key, i) =>
        new Account({
          key,
          chain,
          receiver: receivers[i] || shuffle(receivers)[0]
        })
    )

    const addressesForTracking = accounts.map((i) => checksumAddress(i.address))
    log(c.blue('Listen for events on contract for addresses:'), '\n' + addressesForTracking.join(', '), '\n')

    const publicClient = createPublicClient({ chain, transport: http(config.RPCS[chain.network]) })
    const contract = getContract({
      address: contractAddress,
      abi: ERC20,
      publicClient
    })
    const token = {
      name: await contract.read.name(),
      symbol: await contract.read.symbol(),
      decimals: await contract.read.decimals()
    }

    if (config.sendImmediately) for (const account of accounts) await work(account, mode, 0n, token, contractAddress)

    const unwatch = publicClient.watchContractEvent({
      address: contractAddress,
      abi: ERC20,
      eventName: 'Transfer',
      onLogs: (logs) => {
        logs.map(({ args }) => {
          if (!args.to || !args.from || !args.value) return

          try {
            if (addressesForTracking.includes(args.to)) {
              log(c.green(`${args.to}: received ${c.yellow(formatUnits(args.value, token.decimals))} ${token.symbol} from ${args.from}!`))
              work(accounts.find((i) => isAddressEqual(i.address, args.to as Address))!, mode, args.value, token, contractAddress)
            } else log(c.grey(`${args.to}: received ${c.yellow(formatUnits(args.value, token.decimals))} ${token.symbol} from ${args.from}`))
          } catch (e: any) {
            log('event error:', e)
          }
        })
      }
    })
  } catch (e: any) {
    log('workflow error:', e)
  }
}

const checkAndFindToken = async (address: Address): Promise<{ symbol: string; chain: Chain }> =>
  new Promise((resolve) =>
    Object.values(chains).map(async (chain) =>
      createPublicClient({
        chain,
        transport: http(config.RPCS[chain.network])
      })
        .readContract({
          address,
          abi: ERC20,
          functionName: 'symbol'
        })
        .then((symbol) => {
          log(c.green(`Find ${c.cyan(symbol)} token on ${chain?.name} chain by contract ${c.yellow(address)}`))
          resolve({ symbol, chain })
        })
        .catch(() => {})
    )
  )

const main = async (): Promise<any> => {
  await precheck()

  const mode: Mode = (process.argv[2] as Mode) || 'listen'

  switch (mode) {
    case 'listen':
      const contractAddress = process.argv[3] as Address
      if (!contractAddress) throw new Error('Please input contract address after listen command')

      const { symbol, chain } = await checkAndFindToken(contractAddress)
      if (!symbol || !chain) throw new Error(`Contract ${contractAddress} not found on all chains in chainlist`)

      log(c.bgMagenta('\n', fixed(`${keys.length} accounts start listening events, Wait & Withdraw ${symbol} tokens!`, 111, 'center')) + '\n')

      return workflow(keys, mode, contractAddress, chain)

    default:
      log(c.red(`Please input script mode in ${c.yellow('"npm run start MODE"')}, available modes:`), modes.join(', '))
      break
  }
}

// Execute the main function
main()
