import connectMongoDB from "@/libs/mongodb";
import Point from "@/models/point";
import { NextResponse } from "next/server";
export const maxDuration = 60;

export async function GET() {
	await connectMongoDB();
	const points = await Point.find();
	return NextResponse.json(points);
}

export async function PATCH(req) {
	const { sprite, value } = await req.json();
	console.log({ sprite, value });
	return NextResponse.json({});
}

export async function POST(req) {
	const { player, sprite, value } = await req.json();
	await connectMongoDB();
	await Point.findOneAndUpdate({ sprite }, { value: parseInt(value) });
	return NextResponse.json({});
}