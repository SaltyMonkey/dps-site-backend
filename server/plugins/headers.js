const fastifyPlugin = require("fastify-plugin");

/**
 * Apply custom headers to responses
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {Object} options - plugin options
 * @param {Object[]} options.changeTo - array with headers
 * @param {string} options.changeTo[].header - header string
 * @param {string} options.changeTo[].value - header value
 */
async function customHeadersForReq(fastify, options) {
	const data = options.changeTo;

	fastify.addHook("onSend", async (_request, reply) => {
		for (const value of data) {
			reply.header(value.header, value.value);
		}
	});
}

module.exports = fastifyPlugin(customHeadersForReq);