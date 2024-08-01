import connectMongoDB from "@/libs/mongodb";
import Point from "@/models/point";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		await connectMongoDB();
		const points = await Point.find();
		return NextResponse.json(points);
	} catch (error) {
		return NextResponse.json({ error: "Not Found" }, { status: 404 });
	}
}

export async function PATCH(req) {
	try {
		const { sprite, value } = await req.json();
		console.log({ sprite, value });
		return NextResponse.json({});
	} catch (error) {
		return NextResponse.json({ error: "Bad Request" }, { status: 400 });
	}
}

export async function POST(req) {
	const { player, sprite, value } = await req.json();
	await connectMongoDB();
	await Point.findOneAndUpdate({ sprite }, { value: parseInt(value) });
	return NextResponse.json({ message: "Point value changed" }, { status: 200 });
}