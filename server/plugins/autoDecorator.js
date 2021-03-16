/* eslint-disable unicorn/filename-case */
const fastifyPlugin = require("fastify-plugin");

const fs = require("fs");
const path = require("path");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function autoDecorator(fastify, options) {
	const folder = options.folder;
	delete options.folder;
	const ignore = options.excludeIfNameContains;
	delete options.excludeIfNameContains;

	const files = fs.readdirSync(folder);
	files.forEach((file) => {
		
		const filePath = path.join(folder, file);
		if (!ignore.includes(file[0])) {
			// eslint-disable-next-line global-require
			fastify.decorate((file.toLowerCase()).replace(".js", ""), require(filePath));
		}
	});

}

// Wrapping a plugin function with fastify-plugin exposes the decorators,
// hooks, and middlewares declared inside the plugin to the parent scope.
module.exports = fastifyPlugin(autoDecorator);