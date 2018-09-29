'use strict'
const fs = require('fs')
const readline = require('readline')
const Discord = require('discord.js')
const client = new Discord.Client()
const pkg = require('../package.json')

// Initialize the bot
getToken().then((token) => {
  console.log('Succesfully get token. Connecting ...')
  client.login(token)
})

/**
 * Read the Discord Bot Token from config.json or ask it to the user and save it.
 * @returns string
 */
async function getToken () {
  // Create an empty structure
  let config = {}

  // Try to read the token field from the config file
  try {
    config = require('./config.json')
    if (config.token) { return Promise.resolve(config.token) }
    console.log('The field "token" is empty or doesn\'t exist.')
  } catch (err) {
    console.warn("The file config.json doen't exist. Creating one ...")
  }

  // Ask the token to the user
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
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

// ==== Bot events ==== //
let games = []

client.on('ready', () => {
  console.log(`
  The Werewolfs of Millers Hollow - Discord Bot
  v${pkg.version}
  Ready !
  `)
})

client.on('message', command => {
  // Verify is the author own a game. If he do, he can't create a new one.
  // The owner is the only who can start a game
  let game = games.find(g => g.owner.id === command.author.id)
  if (command.content === '!create' && !game) {
    createGame(command)
  } else if (command.content === '!start' && game && !game.started) {
    command.delete()
    game.start()
  }
})

client.on('messageReactionAdd', (msgReaction, user) => {
  if (user.id === client.user.id) { return } // If it's the bot itself, ignore

  // Find the game the message is a attached to
  // TODO: Check the reaction type
  let game = games.find(g => g.message.id === msgReaction.message.id)
  if (game) {
    game.addPlayer(user)
  }
})

client.on('messageReactionRemove', (msgReaction, user) => {
  // Find the game the message is a attached to
  let game = games.find(g => g.message.id === msgReaction.message.id)
  if (game) {
    game.removePlayer(user)
  }
})

// ==== Bot functions ==== //
const Game = require('./Game')

/**
 * Create a Game object in the games array and send a creation game message
 * @param {Discord.Message} command
 */
function createGame (command) {
  command.channel.send(
    new Discord.RichEmbed()
      .setTitle('Create a game')
      .setDescription(`Want to join ?\n 0/6`)
      .setColor(0xFF0000)
  ).then(message => {
    message.react('👍')
    games.push(new Game(message, command.author))
    command.delete()
  })
}
