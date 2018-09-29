const Discord = require('discord.js')
const Role = require('./Role')
const Player = require('./Player')

// Channel permissions
// 265280 -> See and can write (during the day)
// 263168 -> See but can't write (during the night)

module.exports = class Game {
  /**
   * Game constructor. Represent a Werewolfs game
   * @param {Discord.Message} discordMessage The message used to join the game
   * @param {Discord.User} discordUser The owner of the game
   */
  constructor (discordMessage, discordUser) {
    this.id = Game.count++
    this.message = discordMessage
    this.guild = this.message.guild
    this.owner = discordUser
    this.players = [new Player(discordUser)]
    this.werewolfs = []
    this.channels = {
      village: {},
      werewolfs: {},
      witch: {},
      fortuneTeller: {},
      thief: {},
      savior: {},
      piedPiper: {},
      whiteWerewolf: {},
      raven: {},
      sisters: {},
      brothers: {},
      judgeStutterer: {},
      fox: {},
      players: []
    }
    this.roles = []
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
    this.players.push(new Player(discordUser))
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
    let playerIdx = this.players.findIndex(p => p.user.id === discordUser.id)
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
  async start () {
    this.started = true
    this.message.delete()
    this.roles = await this.createRoles()
    let playersRights = [this.everyonePerms]

    for (let i = 0; i < this.nbPlayers; i++) {
      playersRights.push({ allow: 263168, id: this.players[i].user.id }) // Allow players to see the channel
      await this.guild.createChannel( // Create the `user only` channel
        `${this.players[i].user.username}__${this.id}`,
        'text',
        [this.everyonePerms, { allow: 263168, id: this.players[i].user.id }]
      ).then(async c => {
        c.setParent(await this.getGamesCategory(this.guild))
        this.players[i].channel = c
      })
      this.players[i].role = this.roles.pop()
      this.players[i].role.channel.overwritePermissions(this.players[i].user, { VIEW_CHANNEL: true })
      this.players[i].channel.send(
        new Discord.RichEmbed()
          .setTitle('Your role is:' + this.players[i].role.name)
          .setDescription(this.players[i].role.description)
          .setImage(this.players[i].role.imageUrl)
        )
    }

    this.guild.createChannel(`village__${this.id}`, 'text', playersRights).then(async c => {
      c.setParent(await this.getGamesCategory(this.guild))
      this.channels.village = c
    })
  }

  /**
   * Fill the roles array
   * @returns {Array<Role>}
   */
  async createRoles () {
    const werewolf = new Role(
      'Werewolf',
      'Each night, the werewolves pick 1 (this can change with the Personnages expansion pack) player to kill. The ' +
      'victim can be anyone except the Moderator, including other werewolves. The next day, they pretend to be a ' +
      'villager and try to seem unsuspicious. The number of werewolves in a game varies depending on the number of ' +
      'players.',
      'https://www.loups-garous-en-ligne.com/jeu/assets/images/miniatures/carte2_90_90.png'
    )
    const werewolfsChan = this.guild.createChannel(`werewolfs__${this.id}`, 'text', [this.everyonePerms])
      .then(async c => {
        c.setParent(await this.getGamesCategory(this.guild))
        this.channels.werewolfs = c
        werewolf.channel = c
      })

    const ordinaryTownsfolk = new Role(
      'Ordinary townsfolk',
      'They don\'t have any special power except thinking and the right to vote.',
      'https://www.loups-garous-en-ligne.com/jeu/assets/images/miniatures/carte1_90_90.png'
    )

    const fortuneTeller = new Role(
      'Fortune teller',
      'Each night, they can discover the real identity of a player. They must help the other villagers but discretely' +
      ' to not be found by werewolves.',
      'https://www.loups-garous-en-ligne.com/jeu/assets/images/miniatures/carte3_90_90.png'
    )
    const fortuneTellerChan = this.guild.createChannel(`fortune-teller__${this.id}`, 'text', [this.everyonePerms])
      .then(async c => {
        c.setParent(await this.getGamesCategory(this.guild))
        this.channels.fortuneTeller = c
        fortuneTeller.channel = c
      })

    const witch = new Role(
      'Witch',
      'She has two potions: One to save the werewolves\'s victim and one to eliminate a player. She can only use each' +
      ' potion once during the game. She can use both 2 potions during the same night. She can save herself if she ' +
      'has been attacked by the werewolves on the first night. ',
      'https://www.loups-garous-en-ligne.com/jeu/assets/images/miniatures/carte5_90_90.png'
    )
    const witchChan = this.guild.createChannel(`witch__${this.id}`, 'text', [this.everyonePerms])
      .then(async c => {
        c.setParent(await this.getGamesCategory(this.guild))
        this.channels.witch = c
        witch.channel = c
      })

    await Promise.all([werewolfsChan, fortuneTellerChan, witchChan])
    return shuffle([werewolf, werewolf, ordinaryTownsfolk, ordinaryTownsfolk, fortuneTeller, witch])
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

  /**
   * Return most voted player on a message
   * @param {Discord.Message} messageDiscord
   * @param {HashMap} hashMapReactionJoueur
   * @returns {Discord.MessageReaction} player
   */    
  returnMostVoted (messageVote,hashMapReactionJoueur) {
    let arrayVote = messageVote.reactions
    let lengthVote = arrayVote.length
    let tabReactionGagnant = []
    let reactionGagnant
    let max = 0
    for (let i=0;i<lengthVote-1;i++){
      if(arrayVote[i].count == max){
        tabReactionGagnant.push(arrayVote[i])
      }
      else if (arrayVote[i].count > max){
        max = arrayVote[i].count
        tabReactionGagnant = []
        tabReactionGagnant.push(arrayVote[i]);
      }
    }

    //if we have the same numbers of votes for two or more player, we picked on randomly

    return reactionGagnant;

  }
}
module.exports.count = 0

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle (a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
