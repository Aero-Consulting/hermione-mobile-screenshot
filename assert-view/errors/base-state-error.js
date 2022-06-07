module.exports = class BaseStateError extends Error {
	constructor (stateName, currImg = {}, refImg = {}, diffImg = {}) {
		super();

		this.name = this.constructor.name;
		this.stateName = stateName;
		this.currImg = currImg;
		this.refImg = refImg;
		this.diffImg = diffImg;
	}
};
