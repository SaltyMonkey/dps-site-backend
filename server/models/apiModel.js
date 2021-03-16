"use strict";

const mongoose = require("mongoose");

const apis = new mongoose.Schema({
	"isActive": { "type": Boolean, "default": true },
	"token": { "type": String, "unique": true },
	"role": { "type": Number, "default": 0 }
});

apis.statics.isRoleAdmin = async function (token) {
	const dbLink = await this.findOne({
		token: token.trim()
	}).lean();

	if (!dbLink) return false;

	if (dbLink.role !== 2) return false;

	return true;
};

apis.statics.getFromDb = async function (token) {
	return await this.findOne({
		token: token.trim()
	}, { "_id": 1 }).lean();
};

apis.statics.getFromDbLinked = async function (token) {
	return await this.findOne({
		token: token.trim()
	});
};

module.exports = mongoose.model("api", apis);