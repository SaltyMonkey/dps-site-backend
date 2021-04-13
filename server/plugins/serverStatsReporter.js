const fastifyPlugin = require("fastify-plugin");
const nodeShedule = require("node-schedule");
const fetch = require("node-fetch");
const humanizeDuration = require("humanize-duration");

const symbolServerTiming = Symbol("ServerTiming");

const sendDataAsPost = async (data, url) => {
	try { await fetch(url, data); }
	// eslint-disable-next-line no-empty
	catch (error) { }
};

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function serverStatsReporter(fastify, options) {
	const cronString = options.cronString;
	const discordWebHook = options.discordWebHook;
	const botName = options.botName;
	const title = options.title;
	const maxDelaysForCalc = options.maxDelaysForCalc;

	const dynamicStats = {
		errors: {
			"5xx": 0,
			"4xx": 0,
			"timeouts": 0
		},
		requests: 0,
		serverDelays: []
	};

	fastify.addHook("onError", async (_request, reply) => {
		if (reply.statusCode >= 400)
			dynamicStats.errors["4xx"] += 1;
		else if (reply.statusCode >= 500)
			dynamicStats.errors["5xx"] += 1;
	});

	fastify.addHook("onRequest", async (req) => {
		dynamicStats.requests += 1;
		req[symbolServerTiming] = Date.now();
	});

	fastify.addHook("onSend", async (req) => {
		dynamicStats.serverDelays.push(Date.now() - req[symbolServerTiming]);
		if (dynamicStats.serverDelays.length > maxDelaysForCalc) dynamicStats.serverDelays.shift();
	});

	nodeShedule.scheduleJob(cronString, async () => {
		const uptimeProcess = process.uptime();
		const procMem = process.memoryUsage();

		const processStats = [
			`Node.Js version: ${process.version}`,
			`Resident set: ${Math.round(procMem.rss / Math.pow(1024, 2))}MB`,
			`Total heap: ${Math.round(procMem.heapTotal / Math.pow(1024, 2))}MB`,
			`Used heap: ${Math.round(procMem.heapUsed / Math.pow(1024, 2))}MB`,
			`Uptime: ${humanizeDuration(uptimeProcess, { round: true })}`,
		];

		const apiUptime = [
			`4xx errors: ${dynamicStats.errors["4xx"]}`,
			`5xx errors: ${dynamicStats.errors["5xx"]}`,
			`Timeouts: ${dynamicStats.errors["timeouts"]}`,
			`Requests: ${dynamicStats.requests}`,
			`Min server delay: ${Math.round(Math.min(...dynamicStats.serverDelays))}ms`,
			`Max server delay: ${Math.round(Math.max(...dynamicStats.serverDelays))}ms`,
		];

		const obj = {
			method: "POST",
			body: JSON.stringify({
				username: botName,
				embeds: [{
					title: `:tools: ${title} :tools:`,
					color: 392279,
					timestamp: new Date().toISOString(),
					footer: {
						text: "by SaltyMonkey"
					},
					fields: [
						{
							name: ":gear: Process stats",
							value: processStats.join("\n")
						},
						{
							name: ":gear: API stats",
							value: apiUptime.join("\n")
						}

					]
				}]
			}),
			headers: { "Content-Type": "application/json" },
		};

		await sendDataAsPost(obj, discordWebHook);

		dynamicStats.errors["4xx"] = 0;
		dynamicStats.errors["5xx"] = 0;
		dynamicStats.errors["timeouts"] = 0;
		dynamicStats.requests = 0;
		dynamicStats.serverDelays = [];
	});
}
module.exports = fastifyPlugin(serverStatsReporter);