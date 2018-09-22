const Discord = require('discord.js')

// Channel permissions
// 265280 -> See and can write (during the day)
// 263168 -> See but can't write (during the night)

module.exports = class Game {
  constructor (discordMessage, discordUser) {
    this.id = Game.count++
    this.message = discordMessage
    this.guild = this.message.guild
    this.owner = discordUser
    this.players = []
    this.mainChannel = {}
    this.started = false
    this.everyone = this.guild.roles.find(r => r.name === '@everyone')
    this.everyonePerms = { deny: 515136, id: this.everyone.id } // Deny the permission to see a channel for @everyone
  }

  get nbPlayers () {
    return this.players.length
  }

  addPlayer (discordUser) {
    if (this.started) { return }
    this.players.push(discordUser)
    this.message.edit(
      new Discord.RichEmbed()
        .setTitle('Create a game')
        .setDescription(`Want to join ?\n ${this.nbPlayers}/6\n`)
        .setColor(0xff0000)
    )
  }

  removePlayer (discordUser) {
    if (this.started) { return }
    let playerIdx = this.players.findIndex(p => p.id === discordUser.id)
    if (playerIdx > -1) {
      this.players.splice(playerIdx) // Remove the player from the list
      this.message.edit(
        new Discord.RichEmbed()
          .setTitle('Create a game')
          .setDescription(`Want to join ?\n ${this.nbPlayers}/6\n`)
          .setColor(0xff0000)
      )
    }
  }

  start () {
    this.started = true
    this.message.delete()
    this.guild.createChannel(`game#${this.id}`, 'text', [
      { allow: 263168, id: this.owner.id }, // Allow the game's owner to see the channel
      this.everyonePerms
    ])
  }
}
module.exports.count = 0
