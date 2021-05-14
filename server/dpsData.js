const serversPerRegion = require("./dpsData/serversPerRegion.js");
const regions = require("./dpsData/serversPerRegion.js");
const list = require("./dpsData/whitelist.js");

const serversShapeConverter = () => {
	let retObj = {};
	for (const region of Object.keys(regions.data)) {
		for (const server of regions.data[region]) {
			retObj[server] = region;
		}
	}

	return retObj;
};

module.exports = {
	"apiConfig": {
		"allowAnonymousUpload": false,
		"maxAllowedTimelineUploadTimeSec": 20,
		"maxAllowedTimeDiffSec": 180,
		"maxDurationSec": 1800,
		"topPlacesAmount": 100,
		"latestRunsAmount": 45,
		"recentRunsAmount": 100,
		"minMembersCount": 3,
		"maxMembersCount": 30,
		"minPartyDps": 2000000,
		"maxBossHpDiffPerc": 20,
		"authCheckHeader": "X-Auth-Token",
		"latestCacheTimeSecs": 60,
		"searchCacheTimeSecs": 60,
		"topCacheTimeSecs": 10800
	},
	"uploadAnalyze": {
		"minMultipleTanksTriggerAmount": 2,
		"minMultipleHealersTriggerAmount": 2,
		"p2wAbnormals": [33, 77002, 77003, 77004, 77005, 5020013, 14400002, 14400001, 14400003, 16300015, 16300013, 5030004],
		"tankAbnormals": [10153040, 10153041, 10153042, 10153044, 10153571, 10200, 10201, 401400],
		"roleType": {
			"Brawler": {
				"abns": [[10153561], 2],
				"default": 1
			},
			"Warrior": {
				"abns": [[100200, 100201], 1],
				"default": 2
			},
			"Berserker": {
				"abns": [[401400], 1],
				"default": 2
			}
		},
		"isShameDeathsAmount": 10
	},
	"whitelist": list,
	"regions": serversShapeConverter(serversPerRegion),
	"regionsList": Object.keys(serversPerRegion.data)
};