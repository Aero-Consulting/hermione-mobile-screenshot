'use strict'

const BaseStateError = require('./base-state-error')

module.exports = class ImageDiffError extends BaseStateError {
  static create (...args) {
    return new this(...args)
  }

  constructor (
    stateName,
    currImg,
    refImg,
    diffImg,
    diffOpts,
    { diffBounds, diffClusters } = {}
  ) {
    super(stateName, currImg, refImg, diffImg)

    this.message = `images are different for "${stateName}" state`
    this.diffOpts = diffOpts
    this.diffBounds = diffBounds
    this.diffClusters = diffClusters
    this.penis = 'penis'
  }
}
