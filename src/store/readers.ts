import fs from 'fs'
import path from 'path'
import { Proxy, TwitterAccount } from './types'
import { shuffle } from '../helpers'

const credentialsFolderPath = './credentials/'

const fileExists = (filename: string): boolean => {
  try {
    fs.accessSync(path.join(credentialsFolderPath, filename))
    return true
  } catch (err) {
    return false
  }
}

const filterValidKeys = (keyStrings: string[]): string[] => keyStrings.filter((keyString) => /^(0x)?[0-9a-fA-F]{40,64}$/.test(keyString))

const filterValidProxies = (proxyStrings: string[]): Proxy[] =>
  proxyStrings.map((proxy) => {
    // const url = proxy.split('|||')[0]
    return {
      url: proxy.split('|||')[0],
      link: proxy.split('|||')[1]
    }
  })

const filterTwitterAccounts = (data: string[]): Record<string, TwitterAccount> => {
  const twitterAccounts: Record<string, TwitterAccount> = {}
  data.forEach((line) => {
    let [username, password, email, auth_token, other] = line.split(';')
    if (username.length > 5) {
      if (!/[a-fA-F0-9]{40}/.test(auth_token)) auth_token = other
      twitterAccounts[username] = { username, password, email, auth_token }
    }
  })
  return twitterAccounts
}

const createFileIfNotExists = (filename: string, exampleData: string) => {
  const exist = fileExists(filename)
  if (!exist) return fs.writeFileSync(path.join(credentialsFolderPath, filename), exampleData)
  return false
}

const readFile = <T>(filename: string, filterFunction: (data: string[]) => T, exampleData: string): T => {
  if (createFileIfNotExists(filename, exampleData)) return [] as T
  const fileContents = fs.readFileSync(path.join(credentialsFolderPath, filename), 'utf-8')
  const lines = [...new Set(fileContents.split('\n'))].map((i) => i.trim())
  return filterFunction(lines)
}

const readAccounts = <T>(filename: string, filterFunction: (data: string[]) => T, exampleData: string): T => {
  try {
    return readFile(filename, filterFunction, exampleData)
  } catch (err) {
    console.error(err)
    return {} as T
  }
}
const writeAccounts = <T>(filename: string, data: string[]): string[] => {
  try {
    fs.writeFileSync(path.join(credentialsFolderPath, filename), data.join('\n'))
    return data
  } catch (err) {
    console.error(err)
    return [] as string[]
  }
}

// Readers
const exampleTwitterAccount = 'exampleUsername;examplePassword;exampleEmail@example.com;exampleAuthToken'
export const readTwitterAccounts = () =>
  Object.values(readAccounts<Record<string, TwitterAccount>>('twitters.txt', filterTwitterAccounts, exampleTwitterAccount))

const exampleKey = ''
export const readKeysOrAddresses = (filename = 'keys.txt') => {
  const keys = [...new Set(readAccounts<string[]>(filename, filterValidKeys, exampleKey))].map((key) => (!key.startsWith('0x') ? `0x${key}` : key))
  writeAccounts(filename, keys)
  return keys
}

const proxyExample = 'http://login:password@fast.travchisproxies.com:9090'
export const readProxies = () => readAccounts<Proxy[]>('proxies.txt', filterValidProxies, proxyExample)
export const randomProxy = () => shuffle(readProxies())[0]

// Other
export const deleteTwitterAccount = (searchQuery: string) => {
  const filename = 'twitters.txt'

  // Read the existing Twitter accounts from the file
  const existingAccounts = readTwitterAccounts()

  // Check if the account with the provided username exists
  if (existingAccounts.find((account) => account.username === searchQuery || account.auth_token === searchQuery)) {
    // Filter out the account to be deleted
    const updatedAccounts = existingAccounts.filter((account) => account.username !== searchQuery && account.auth_token !== searchQuery)

    // Convert the updated accounts back to a string
    const updatedAccountsString = updatedAccounts.map((account) => `${account.username};${account.password};${account.email};${account.auth_token}`).join('\n')

    // Write the updated accounts back to the file
    fs.writeFileSync(path.join(credentialsFolderPath, filename), updatedAccountsString, 'utf-8')
    return searchQuery
  } else {
    console.log(`Twitter account with username '${searchQuery}' not found.`)
    return false
  }
}
