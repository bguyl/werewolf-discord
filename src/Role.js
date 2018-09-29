module.exports = class Role {
  /**
   * Role constructor. Represent a Werewolfs role
   * @param string name
   * @param string description
   * @param string imageUrl
   */
  constructor (name, description, imageUrl) {
    this.name = name
    this.description = description
    this.imageUrl = imageUrl
    this.channel = {}
  }
}
