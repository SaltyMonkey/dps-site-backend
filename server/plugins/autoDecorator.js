/* eslint-disable unicorn/filename-case */
const fastifyPlugin = require("fastify-plugin");

const fs = require("fs");
const path = require("path");

/**
 * Decorate all files in folder
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {Object} options - autodecorator options
 * @param {string} options.folder - folder to read files in
 * @param {string[]} options.excludeIfNameContains - exclude flags to sikp files from decoration 

 */
async function autoDecorator(fastify, options) {
	const folder = options.folder;
	const ignore = options.excludeIfNameContains;

	const files = fs.readdirSync(folder);
	files.forEach((file) => {
		
		const filePath = path.join(folder, file);
		if (!ignore.includes(file[0])) {
			// eslint-disable-next-line global-require
			fastify.decorate((file).replace(".js", ""), require(filePath));
		}
	});

}

module.exports = fastifyPlugin(autoDecorator);