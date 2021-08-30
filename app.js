/* eslint-disable node/no-missing-require */
/* eslint-disable no-process-exit */
"use strict";

const fs = require("fs");
const path = require("path");
const config = require("./server/config.js");

//!TODO: Remove dat simple hack (contact Gl0 for updated shinra logic)
const convertWhitelistInObject = (whitelist) => {
	let objView = {};
	for (const element of whitelist) {
		objView[element.AreaId] = {
			bosses: element.BossIds,
			hp: element.Hp
		};
	}

	return objView;
};

let opts = {
	trustProxy: config.server.serverTrustProxy,
	maxParamLength: config.server.serverMaxParamLength,
	onConstructorPoisoning: "remove",
	onProtoPoisoning: "remove",
	ignoreTrailingSlash: true
};

if(process.platform === "linux") {
	opts.logger = {
		level: "error",
		file: "/var/log/teralogs-errors.log"
	};
}
else {
	opts.logger = true;
}

if (config.server.secureServer) {
	opts.https.key = fs.readFileSync(config.server.httpsKeyPath);
	opts.https.cert = fs.readFileSync(config.server.httpsCertPath);
}

const fastify = require("fastify")(opts);

fastify.register(require("fastify-sensible"));

fastify.register(require("./server/plugins/routeList.js"));
fastify.register(require("./server/plugins/headers.js"), { changeTo: [ { header: "Permissions-Policy", value: "interest-cohort=()" }, { header: "X-Powered-By", value: "Hamsters" }, { header: "Access-Control-Allow-Origin", value: "*"} ]});
fastify.register(require("./server/plugins/mongoose.js"), { connectionString: config.server.dbConnectionString, poolSize: config.server.dbPoolSize });
fastify.register(require("./server/plugins/autoDecorator.js"), { folder: path.resolve(__dirname, "./server/models"), excludeIfNameContains: ["_"] });
fastify.register(require("./server/plugins/serverStatsReporter.js"), { botName: "DPS backend", title: "Server stats", discordWebHook: config.server.discordWebHook, cronString: config.server.cronString, maxDelaysForCalc: 50000 });
fastify.register(require("./server/plugins/serverStatusChangeReporter.js"), { botName: "DPS backend", discordWebHook: config.server.discordWebHook });

//set global and/or bloated schemas
fastify.addSchema(require("./server/routes/v1/sharedSchemas/statusResponse"));

//init static routes
fastify.register(require("./server/routes/icon.js"));
fastify.register(require("./server/routes/stats.js"));
fastify.register(require("./server/routes/api.js"));
fastify.register(require("./server/routes/cors.js"));

// Shinra servertime link wrapper
fastify.register(require("./server/routes/shinraTime.js"));

//init versioned api routes
fastify.register(require("./server/routes/v1/whitelist.js"), { prefix: "/v1", whitelist: config.whitelist });
fastify.register(require("./server/routes/v1/search.js"), { prefix: "/v1", apiConfig: config.apiConfig, regionsList: config.regionsList });
fastify.register(require("./server/routes/v1/upload.js"), { prefix: "/v1", apiConfig: config.apiConfig, regions: config.regions, whitelist: convertWhitelistInObject(config.whitelist), analyze: config.uploadAnalyze });
fastify.register(require("./server/routes/v1/control.js"), { prefix: "/v1", apiConfig: config.apiConfig });

const start = async () => {
	try {
		await fastify.listen(config.server.secureServer ? 443 : config.server.serverPort, config.server.serverIp);
	} catch (error) {
		console.log(error);
		// eslint-disable-next-line no-magic-numbers
		process.exit(1);
	}
};
start();

module.exports = fastify;