import axios from "axios";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/libs/mongodb";
import Player from "@/models/player";

const getUserData = async (access_token) => {
	try {
		const response = await axios.get('https://discord.com/api/users/@me/guilds/1211777494559096933/member', {
			headers: {
				'Authorization': `Bearer ${access_token}`,
			},
		});
		return [response.data, null];
	} catch (error) {
		return [null, error.response];
	}
};

const refreshToken = async (refresh_token) => {
	const data = {
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,
		grant_type: 'refresh_token',
		'refresh_token': refresh_token
	};
	try {
		const response = await axios.post('https://discord.com/api/oauth2/token', data, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		});
		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};

export async function GET(request) {
	const cookieStore = cookies();

	const searchParams = request.nextUrl.searchParams;
	const access_token = searchParams.get('access_token') || '';
	if (!access_token) {
		return NextResponse.json({ error: "No token provided" }, { status: 401 });
	}
	await connectMongoDB();
	const candidate = await Player.findOne({ access_token });
	if (!candidate) {
		await Player.create({
			nick: data.nick || data.user.global_name,
			avatar: data.avatar || data.user.avatar,
			admin: (data.roles.includes('1211781664955437207') || data.roles.includes('1212633560947892234')),
			access_token: access_token,
		});
		const [data] = await getUserData(access_token);
		if (!data) {
			const [resultRefresh, refreshToken_error] = await refreshToken(cookieStore.get('refresh_token') || '');
			if (refreshToken_error || !resultRefresh) {
				return NextResponse.json("Тебе нужно заново войти", { status: 401 });
			}
			const [data] = await getUserData(resultRefresh.access_token);
			if (!data) {
				return NextResponse.json("Тебя нет в дискорде Ублюдска", { status: 403 });
			}
			return NextResponse.json("Тебя нет в дискорде Ублюдска", { status: 403 });
		}
		return NextResponse.json({
			nick: data.nick || data.user.global_name,
			avatar: data.avatar || data.user.avatar,
			admin: (data.roles.includes('1211781664955437207') || data.roles.includes('1212633560947892234')),
			access_token: access_token
		});
	} else {
		return NextResponse.json({
			nick: candidate.nick,
			avatar: candidate.avatar,
			admin: candidate.admin,
			access_token: access_token
		});
	}
}