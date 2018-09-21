'use strict'
const fs = require('fs')
const readline = require('readline')
const Discord = require('discord.js');
const client = new Discord.Client();
const pkg = require('../package.json')

// Initialize the bot
getToken().then((token) => {
  console.log('Succesfully get token. Connecting ...')
  client.login(token);
})

/**
 * Read the Discord Bot Token from config.json or ask it to the user and save it.
 * @returns string
 */
async function getToken() {
  // Create an empty structure
  let config = {}

  // Try to read the token field from the config file
  try {
    config = require('./config.json')
    if (config.token) { return Promise.resolve(config.token) }
    console.log('The field "token" is empty or doesn\'t exist.')
  }
  catch (err) {
    console.warn("The file config.json doen't exist. Creating one ...")
  }

  // Ask the token to the user
  const rl = readline.createInterface({input: process.stdin, output: process.stdout})
  config.token = await new Promise(resolve => {
    rl.question('What is your Discord Token ? ', (answer) => {
      rl.close()
      resolve(answer)
    })
  })

  // Save the token in the config file
  fs.writeFileSync('./src/config.json', JSON.stringify(config))
  return Promise.resolve(config.token)
}

//==== Bot events ====//
client.on('ready', () => {
  console.log(`
  The Werewolfs of Millers Hollow - Discord Bot
  v${pkg.version}
  Ready !
  `)
})

