'use strict'

module.exports = class WrongPlatformError extends Error {
  constructor (message) {
    super()

    this.name = this.constructor.name
    this.message =
      message || 'Wrong platform, assertMobileView works only for mobile apps'
  }
}
