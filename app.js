/* eslint-disable node/no-missing-require */
/* eslint-disable no-process-exit */
"use strict";

const fs = require("fs");
const path = require("path");
const conf = require("./server/server.json");
const dpsData = require("./server/dpsData.js");

//!TODO: Remove dat simple hack (contact Gl0 for updated shinra logic)
const convertWhitelistInObject = (whitelist) => {
	let objView = {};
	whitelist.forEach(element => {
		objView[element.AreaId] = element.BossIds;
	});

	return objView;
};

let opts = {
	trustProxy: conf.serverTrustProxy,
	maxParamLength: conf.serverMaxParamLength,
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

if (conf.secureServer) {
	opts.https.key = fs.readFileSync(conf.httpsKeyPath);
	opts.https.cert = fs.readFileSync(conf.httpsCertPath);
}

const fastify = require("fastify")(opts);

fastify.register(require("fastify-sensible"));

fastify.register(require("./server/plugins/routeList.js"));
fastify.register(require("./server/plugins/headers.js"), { changeTo: [ { header: "Permissions-Policy", value: "interest-cohort=()" }, { header: "X-Powered-By", value: "Hamsters" }, { header: "Access-Control-Allow-Origin", value: "*"}, { header: "Access-Control-Allow-Headers", value: "*"} ]});
fastify.register(require("./server/plugins/mongoose.js"), { connectionString: conf.dbConnectionString, poolSize: conf.dbPoolSize });
fastify.register(require("./server/plugins/autoDecorator.js"), { folder: path.resolve(__dirname, "./server/models"), excludeIfNameContains: ["_"] });
fastify.register(require("./server/plugins/serverStatsReporter.js"), { botName: "DPS backend", title: "Server stats", discordWebHook: conf.discordWebHook, cronString: conf.cronString, maxDelaysForCalc: 50000 });
fastify.register(require("./server/plugins/serverStatusChangeReporter.js"), { botName: "DPS backend", discordWebHook: conf.discordWebHook });

//set global and/or bloated schemas
fastify.addSchema(require("./server/routes/v1/sharedSchemas/statusResponse"));

//init static routes
fastify.register(require("./server/routes/icon.js"));
fastify.register(require("./server/routes/stats.js"));
fastify.register(require("./server/routes/api.js"));
fastify.register(require("./server/routes/cors.js"));

//init versioned api routes
fastify.register(require("./server/routes/v1/whitelist.js"), { prefix: "/v1", whitelist: dpsData.whitelist });
fastify.register(require("./server/routes/v1/search.js"), { prefix: "/v1", apiConfig: dpsData.apiConfig, regionsList: dpsData.regionsList });
fastify.register(require("./server/routes/v1/upload.js"), { prefix: "/v1", apiConfig: dpsData.apiConfig, regions: dpsData.regions, whitelist: convertWhitelistInObject(dpsData.whitelist), analyze: dpsData.uploadAnalyze });
fastify.register(require("./server/routes/v1/control.js"), { prefix: "/v1", apiConfig: dpsData.apiConfig });

const start = async () => {
	try {
		await fastify.listen(conf.secureServer ? 443 : conf.serverPort, conf.serverIp);
	} catch (error) {
		// eslint-disable-next-line no-magic-numbers
		process.exit(1);
	}
};
start();

module.exports = fastify;