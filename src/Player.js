module.exports = class Player {
  /**
   * Player constructor. Represent a Werewolfs player
   * @param {Discord.User} discordUser
   */
  constructor (discordUser) {
    this.user = discordUser
    this.role = {}
    this.channel = {}
  }
}
