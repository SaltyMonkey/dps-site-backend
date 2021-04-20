"use strict";

const mongoose = require("mongoose");

const upload = new mongoose.Schema({
	runId: {
		type: String,
		unique: true
	},
	encounterUnixEpoch: Number,
	region: String,
	bossId: Number,
	huntingZoneId: Number,
	isMultipleHeals: Boolean,
	isMultipleTanks: Boolean,
	fightDuration: Number,
	partyDps: String,
	debuffDetail: [],
	isShame: Boolean,
	isP2WConsums: Boolean,
	uploader: { type: mongoose.Schema.Types.ObjectId, ref: "player", autopopulate: true },
	members: [
		{
			userData: { type: mongoose.Schema.Types.ObjectId, ref: "player", autopopulate: true },
			aggro: Number,
			playerAverageCritRate: Number,
			playerDeathDuration: String,
			playerDeaths: Number,
			roleType: Number,
			playerDps: String,
			playerTotalDamage: String,
			playerTotalDamagePercentage: Number,
			buffDetail: [],
			skillLog: [
				{
					skillAverageCrit: String,
					skillAverageWhite: String,
					skillCritRate: Number,
					skillDamagePercent: Number,
					skillHighestCrit: String,
					skillHits: String,
					skillCasts: String,
					skillId: Number,
					skillLowestCrit: String,
					skillTotalDamage: String,
					skillTotalCritDamage: String
				}
			]
		}
	],
}, { useNestedStrict: true });

upload.plugin(require("mongoose-autopopulate"));

upload.statics.getLatestRuns = async function (data, amount) {
	console.log(data);
	let matchStage = {
		$match: {
			region: data.region
		}
	};

	if(data.encounterUnixEpoch) matchStage["$match"].encounterUnixEpoch = data.encounterUnixEpoch;
	if(data.bossId) matchStage["$match"].bossId = data.bossId;
	if(data.huntingZoneId) matchStage["$match"].huntingZoneId = data.huntingZoneId;
	// eslint-disable-next-line no-prototype-builtins
	if(data.hasOwnProperty("isShame")) matchStage["$match"].isShame = data.isShame;
	// eslint-disable-next-line no-prototype-builtins
	if(data.hasOwnProperty("isP2WConsums")) matchStage["$match"].isP2WConsums = data.isP2WConsums;
	// eslint-disable-next-line no-prototype-builtins
	if(data.hasOwnProperty("isMultipleHeals")) matchStage["$match"].isShame = data.isShame;
	// eslint-disable-next-line no-prototype-builtins
	if(data.hasOwnProperty("isMultipleTanks")) matchStage["$match"].isP2WConsums = data.isP2WConsums;

	let postMatchStep = { $match: {"members": { $elemMatch: {}}}};

	if(data.playerClass) postMatchStep["$match"]["members"]["$elemMatch"].playerClass = data.playerClass;
	if(data.playerServer) postMatchStep["$match"]["members"]["$elemMatch"].playerServer = data.playerServer;
	if(data.roleType) postMatchStep["$match"]["members"]["$elemMatch"].roleType = data.roleType;

	let agregationTemplate = [
		{
			"$project": {
				"region": 1,
				"runId": 1,
				"bossId": 1,
				"huntingZoneId": 1,
				"encounterUnixEpoch": 1,
				"fightDuration": 1,
				"isP2WConsums": 1,
				"isMultipleHeals": 1,
				"isMultipleTanks": 1,
				"isShame": 1,
				"partyDps": 1,
				"members.userData": 1,
				"members.playerDps": 1,
				"members.roleType": 1
			}
		},
		matchStage,
		{
			"$unwind": { "path": "$members" }
		},
		{
			"$lookup": {
				"from": "players",
				"localField": "members.userData",
				"foreignField": "_id",
				"as": "player"
			}
		},
		{
			$unwind: { path: "$player" }
		},
		{
			$addFields: {
				"members.playerClass": "$player.playerClass",
				"members.playerName": "$player.playerName",
				"members.playerServer": "$player.playerServer"
			}
		},
		{
			$group: {
				_id: "$_id", 
				members: { $push: "$members"},
				bossId: { $first: "$bossId"},
				debuffDetail: { $first: "$debuffDetail"},
				encounterUnixEpoch: { $first: "$encounterUnixEpoch"},
				huntingZoneId: { $first: "$huntingZoneId"},
				isShame: { $first: "$isShame" },
				isMultipleTanks: { $first: "$isMultipleTanks" },
				isMultipleHeals: { $first: "$isMultipleHeals" },
				isP2WConsums: { $first: "$isP2WConsums" },
				runId: { $first: "$runId" },
				region: { $first: "$region" },
				fightDuration: { $first: "$fightDuration" },
				partyDps: { $first: "$partyDps" },
			}
		}
	];

	if(Object.keys(postMatchStep["$match"]["members"]["$elemMatch"]).length > 0) agregationTemplate.push(postMatchStep);
	return await this.aggregate(agregationTemplate).sort({ "encounterUnixEpoch": -1 }).limit(amount);
};

upload.statics.getCompleteRun = async function (id) {
	return await (this.findOne({ runId: id })).lean({ autopopulate: true });
};

upload.statics.getTopRuns = async function (data, limit) {
	let matchStage = {
		$match: {
			region: data.region,
			bossId: data.bossId,
			huntingZoneId: data.huntingZoneId,
			encounterUnixEpoch: data.encounterUnixEpoch,
			isP2WConsums: false,
			isMultipleHeals: false,
			isMultipleTanks: false,
			isShame: false
		}
	};

	let matchCaseSecond = {
		$match: {
			playerClass: data.playerClass,
		}
	};

	if(data.playerServer) {
		matchCaseSecond["$match"]["playerServer"] = data.playerServer;
		delete data.playerServer;
	}
	if(data.roleType) {
		matchCaseSecond["$match"]["roleType"] = data.roleType;
		delete data.roleType;
	}

	return await this.aggregate(
		[
			{
				"$project": {
					"region": 1,
					"runId": 1,
					"bossId": 1,
					"huntingZoneId": 1,
					"encounterUnixEpoch": 1,
					"fightDuration": 1,
					"isP2WConsums": 1,
					"isMultipleHeals": 1,
					"isMultipleTanks": 1,
					"isShame": 1,
					"members.userData": 1,
					"members.playerDps": 1,
					"members.roleType": 1
				}
			}, 
			matchStage,
			{
				"$unwind": {
					"path": "$members"
				}
			}, {
				"$lookup": {
					"from": "players",
					"localField": "members.userData",
					"foreignField": "_id",
					"as": "player"
				}
			}, {
				"$project": {
					"runId": 1,
					"playerName": {
						"$arrayElemAt": [
							"$player.playerName", 0
						]
					},
					"playerClass": {
						"$arrayElemAt": [
							"$player.playerClass", 0
						]
					},
					"playerServer": {
						"$arrayElemAt": [
							"$player.playerServer", 0
						]
					},
					"playerId": {
						"$arrayElemAt": [
							"$player._id", 0
						]
					},
					"playerDps": "$members.playerDps",
					"roleType": "$members.roleType",
					"fightDuration": 1
				}
			}, 
			matchCaseSecond,
			{
				"$group": {
					_id: "$playerId",
					dps: { "$addToSet": { playerDps: "$playerDps", runId: "$runId", fightDuration: "$fightDuration"} }, 
					playerName: { $first: "$playerName" },
					playerClass: { $first: "$playerClass" },
					playerServer: { $first: "$playerServer" }
				}
			},
			{
				$project: {
					playerName:  "$playerName" ,
					playerClass:  "$playerClass" ,
					playerServer:  "$playerServer",
					playerDps: {
						$filter: {
							input: "$dps",
							as: "item",
							cond: { $eq: ["$$item.playerDps", { $max: "$dps.playerDps" }] }
						}
					}
				}
			},
			{
				$project: {
					"playerName": 1,
					"playerClass": 1,
					"playerServer": 1,
					"playerDps": {
						"$arrayElemAt": [
							"$playerDps.playerDps", 0
						]
					},
					"runId": {
						"$arrayElemAt": [
							"$playerDps.runId", 0
						]
					},
					"fightDuration": {
						"$arrayElemAt": [
							"$playerDps.fightDuration", 0
						]
					},
				}
			},
			{
				$sort: {
					playerDps: -1
				}
			}, {
				$limit: limit
			}
		]
	).collation( { locale: "en_US", numericOrdering: true });
};

upload.statics.getFromDbLinked = async function (runId) {
	return await this.findOne({
		runId: runId
	});
};

upload.statics.getFromDb = async function (searchParams) {
	return await this.findOne(searchParams, { _id: 1 }).lean();
};
module.exports = mongoose.model("upload", upload);