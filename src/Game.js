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
    this.werewolfs = []
    this.mainChannel = {}
    this.started = false
    this.everyone = this.guild.roles.find(r => r.name === '@everyone')
    this.everyonePerms = { deny: 515136, id: this.everyone.id } // Deny the permission to see a channel for @everyone
  }

  /**
   * Get the current number of players
   * @returns integer
   */
  get nbPlayers () {
    return this.players.length
  }

  /**
   * Add the player to the current game
   * @param {Discord.User} discordUser
   */
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

  /**
   * Remove the player from the current game
   * @param {Discord.User} discordUser
   */
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

  /**
   * Start a game
   */
  start () {
    this.started = true
    this.message.delete()
    let playersRights = [this.everyonePerms]

    for (let i = 0; i < this.nbPlayers; i++) {
      playersRights.push({ allow: 263168, id: this.players[i].id }) // Allow players to see the channel
    }

    this.guild.createChannel(`village#${this.id}`, 'text', playersRights).then(async c => {
      c.setParent(await this.getGamesCategory(this.guild))
      this.mainChannel = c
    })
  }

  /**
   * Get the games category or create it
   * @param {Discord.Guild} guild
   * @returns {Promise<Discord.Channel>}
   */
  async getGamesCategory (guild) {
    if (this.gamesCat) { return Promise.resolve(this.gamesCat) }
    this.gamesCat = guild.channels.find(c => (c.name.toLowerCase() === 'games' && c.type === 'category'))
    if (!this.gamesCat) {
      this.gamesCat = guild.createChannel('games', 'category')
      return this.gamesCat
    }
    return Promise.resolve(this.gamesCat)
  }
}
module.exports.count = 0
