import c from 'chalk'
import { log } from 'console'
import { Address, isAddressEqual } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Color address
export const hex = (address: string | `0x${string}`) => c.hex('#' + address.slice(-6))(address) + c.white(':')

export const fixed = (name: string | number, len = 25, direction: 'left' | 'right' | 'center' = 'right') => {
  name = String(name).slice(0, len)
  const left = len - name.length + 1
  const line =
    direction === 'left'
      ? name + ' '.repeat(left)
      : direction === 'right'
      ? ' '.repeat(left) + name
      : ' '.repeat(Math.floor(left / 2)) + name + ' '.repeat(Math.ceil(left / 2))

  return line
}

// Randoms
export const randomInt = (value: number) => Math.floor(Math.random() * value)

export const randomRange = (min: number, max: number) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const randomInRange = (min: string | number, max: string | number, decimalPlaces: number) => {
  let rand = Math.random() * (+max - +min) + +min
  let power = Math.pow(10, decimalPlaces)
  return Math.floor(rand * power) / power
}

export const randomId = (length = 17, charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') =>
  Array.from({ length: length }, () => {
    let index = Math.floor(Math.random() * charset.length)
    return charset[index]
  }).join('')

export const getRandomDate = () => {
  const maxDate = Date.now()
  const timestamp = Math.floor(Math.random() * maxDate)
  return new Date(timestamp)
}

// Arrays helpers
export const shuffle = (array: any[]) => (array ? array.sort(() => (Math.random() > 0.5 ? 1 : -1)) : array)

export const removeDublicates = (array: any[], field: string) => array.filter((v, i, a) => a.findIndex((v2) => v2[field] === v[field]) === i)

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] =>
  Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize))

// Sleep some time
export const wait = async (time: number, message: string = ''): Promise<string> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(message), time)
  })
export const sleep = async (time: number, message: boolean | string | null = null, prefix = '', mixer = -1) => {
  if (mixer === -1 || mixer > time) mixer = Math.floor(time / 3)
  time = randomRange(Number(time) - mixer, Number(time) + mixer)
  if (message)
    log(
      (prefix ? `${prefix} ` : '') +
        c.gray(typeof message === 'string' ? `sleep ${(time / 1000).toFixed(0)} s. | ${message}` : `sleep ${(time / 1000).toFixed(2)} seconds...`)
    )
  return wait(time, message as string)
}

// EVM
export const findKeyByAddress = (keys: string[], address: Address) =>
  keys.find((key) => isAddressEqual(privateKeyToAccount(key as Address).address, address)) as Address
