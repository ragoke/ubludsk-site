import { Schema, model, models } from "mongoose";

const PlayerSchema = new Schema({
	nick: { type: String, required: true, unique: true },
	avatar: { type: String },
	admin: { type: Boolean },
	access_token: { type: String, unique: true },
});

const Player = models.Player || model('Player', PlayerSchema);

export default Player;