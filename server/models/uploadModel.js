"use strict";

const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const alphabet = "abcdefghijklmnopqrstuvwxyz123456789";

const simplifiedView = {
	"id": 1,
	"uploadTime": 1,
	"bossId": 1,
	"areaId": 1,
	"fightDuration": 1,
	"partyDps": 1,
	"members.class": 1,
	"members.name": 1,
};

const upload = new mongoose.Schema({
	"id": {
		"type": String,
		"default": () => customAlphabet(alphabet, 25),
		"unique": true
	},
	"uploadTime": { "type": String, "default": () => {`${ Date.now()}`;} },
	"uploadSoftwareVersion": String,
	"region": String,
	"bossId": Number,
	"areaId": Number,
	"fightDuration": Number,
	"partyDps": String,
	"debuffUptime": [{
		"key": Number,
		"value": Number
	}],
	"isShame": Boolean,
	"uploader": { "type": mongoose.Schema.Types.ObjectId, "ref": "player"},
	"members": [
		{
			"id": { "type": mongoose.Schema.Types.ObjectId, "ref": "player", "autopopulate": true },
			"aggroPercent": Number,
			"playerAverageCritRate": Number,
			"playerDeathDuration": String,
			"playerDeaths": Number,
			"playerDps": String,
			"playerTotalDamage": String,
			"playerTotalDamagePercentage": Number,
			"buffUptime": [{
				"key": Number,
				"value": Number
			}],
			"skillLog": [
				{
					"skillAverageCrit": String,
					"skillAverageWhite": String,
					"skillCritRate": Number,
					"skillDamagePercent": Number,
					"skillHighestCrit": String,
					"skillHits": String,
					"skillCasts": String,
					"skillId": Number,
					"skillLowestCrit": String,
					"skillTotalDamage": String
				}
			]
		}
	],
});

upload.plugin(require("mongoose-autopopulate"));

upload.statics.getLatestRuns = async function (searchParams, amount) {
	let runs = [];
	runs = await upload.find(searchParams, simplifiedView).sort({ "$natural": -1 }).limit(amount).lean();
	return runs;
};

upload.statics.getCompleteRun = async function (searchParams) {
	return await upload.findOne(searchParams).lean();
};
module.exports = mongoose.model("upload", upload);