class RuntimeConfig {
	extend (data) {
		Object.assign(this, data);

		return this;
	}
}

const runtimeConfig = new RuntimeConfig();

exports.getInstance = () => runtimeConfig;
