module.exports = class AssertViewResults {
  #results

  constructor (results) {
    this.#results = results || []
  }

  add (data) {
    this.#results.push(data)
  }

  hasFails () {
    return this.#results.some(res => res instanceof Error)
  }

  hasState (stateName) {
    return this.#results.some(res => res.stateName === stateName)
  }

  toRawObject () {
    return this.#results.map(res => ({ ...res }))
  }

  get () {
    return this.#results
  }
}
