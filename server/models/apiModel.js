"use strict";

const mongoose = require("mongoose");

const apis = new mongoose.Schema({
	isActive: { type: Boolean, default: true },
	token: { type: String, unique: true },
	role: { type: Number, default: 0 }
});

apis.statics.getFromDb = async function (token) {
	return await this.findOne({
		token: token
	}, { _id: 1, role: 1 }).lean();
};

apis.statics.getFromDbLinked = async function (token) {
	return await this.findOne({
		token: token
	});
};

module.exports = mongoose.model("api", apis);