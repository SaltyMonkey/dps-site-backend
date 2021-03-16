const fastifyPlugin = require("fastify-plugin");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function customHeadersForReq(fastify, options) {
	const data = options.changeTo;

	fastify.addHook("onSend", async (_request, reply) => {
		data.forEach(value => {
			reply.header(value.header, value.value);
		});
	});
}

module.exports = fastifyPlugin(customHeadersForReq);