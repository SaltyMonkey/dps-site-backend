const fastifyPlugin = require("fastify-plugin");
const mongoose = require("mongoose");

/**
 * Decorate mongoose and connect to database 
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {Object} options - autodecorator options
 * @param {string} options.connectionString - database connection string
 * @param {string} options.poolSize - database connection pool size
 */
async function mongooseConnector(fastify, options) {
	const str = options.connectionString;
	const poolSize = options.poolSize;

	let x = await mongoose.connect(str, { 
		maxPoolSize: poolSize
	});
	
	fastify.decorate("mongoose", x);
	
	fastify.addHook("onClose", async () => {
		await fastify.mongoose.disconnect();
	});
}

module.exports = fastifyPlugin(mongooseConnector);