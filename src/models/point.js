import { Schema, model, models } from "mongoose";

const PointSchema = new Schema({
	name: { type: String },
	sprite: { type: String, required: true },
	value: { type: Schema.Types.Number, required: true },
	prevValue: { type: Schema.Types.Number, required: true },
	updatedAt: { type: Date, required: true }
});

const Point = models.Point || model('Point', PointSchema);

export default Point;