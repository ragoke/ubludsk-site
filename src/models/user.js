import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
	userId: { type: String, required: true, unique: true },
	nick: { type: String, required: true },
	roles: { type: [String], required: true },
	updatedAt: { type: Date, required: true }
});

export default models.User || model('User', userSchema);