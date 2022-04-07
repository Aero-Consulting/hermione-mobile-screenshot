exports.getTestContext = function (context) {
	return context.type === 'hook' && /^"before each"/.test(context.title)
		? context.ctx.currentTest
		: context;
};
