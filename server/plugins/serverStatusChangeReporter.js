
const fastifyPlugin = require("fastify-plugin");
const fetch = require("node-fetch");

const sendDataAsPost = async (data, url) => {
	try { await fetch(url, data); }
	// eslint-disable-next-line no-empty
	catch (error) { }
};

/**
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function serverStatusChangeReporter(fastify, options) {
	const discordWebHook = options.discordWebHook;
	const botName = options.botName;

	fastify.addHook("onReady", async () => {
		const obj = {
			method: "POST",
			body: JSON.stringify({
				username: botName,
				embeds: [
					{
						description: ":white_check_mark: Server started",
						color: 392279
					}
				]
			}),
			headers: { "Content-Type": "application/json" },
		};
		await sendDataAsPost(obj, discordWebHook);

	});

	const closeHandler = async () => {
		const obj = {
			method: "POST",
			body: JSON.stringify({
				username: botName,
				embeds: [
					{
						description: ":octagonal_sign: Server stopped",
						color: 16515072
					}
				]
			}),
			headers: { "Content-Type": "application/json" },
		};
		await sendDataAsPost(obj, discordWebHook);
		// eslint-disable-next-line no-process-exit
		process.exit(0);
	};

	const closeHandlerBySignal = async () => {
		try {
			await fastify.close();
		}
		catch (error) {
			// eslint-disable-next-line no-process-exit
			process.exit(0);
		}
	};

	fastify.addHook("onClose", closeHandler);
	process.once("SIGINT", closeHandlerBySignal);
	process.once("SIGTERM", closeHandlerBySignal);
}
module.exports = fastifyPlugin(serverStatusChangeReporter);