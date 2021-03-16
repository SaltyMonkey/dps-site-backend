const fastifyPlugin = require("fastify-plugin");
const mongoose = require("mongoose");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function mongooseConnector(fastify, options) {
	const str = options.connectionString;
	const poolSize = options.poolSize;

	let x = await mongoose.connect(str, { 
		poolSize: poolSize,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true
	});
	
	fastify.decorate("mongoose", x);
	
	fastify.addHook("onClose", async () => {
		await fastify.mongoose.disconnect();
	});
}

// Wrapping a plugin function with fastify-plugin exposes the decorators,
// hooks, and middlewares declared inside the plugin to the parent scope.
module.exports = fastifyPlugin(mongooseConnector);