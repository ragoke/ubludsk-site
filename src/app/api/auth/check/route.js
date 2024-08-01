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
		return [[response.data, access_token], null];
	} catch (error) {
		return [null, error.response];
	}
};

const refreshTokenAndGetNewData = async (refresh_token) => {
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
		if (!response.data) {
			return [null, 401];
		}
		const [newData, error] = await getUserData(response.data.access_token);
		if (error) {
			return [null, 403];
		}
		return [[newData, response.data.refresh_token], null];
	} catch (error) {
		return [null, error.response.data];
	}
};

export async function GET(request) {
	const cookieStore = cookies();

	const searchParams = request.nextUrl.searchParams;
	const access_token = searchParams.get('access_token');
	if (!access_token) {
		return NextResponse.json({ error: "No token provided" }, { status: 401 });
	}
	await connectMongoDB();
	const candidate = await Player.findOne({ access_token });
	if (!candidate) {
		const [data] = await getUserData(access_token);
		if (!data) {
			const [result, error] = await refreshTokenAndGetNewData(cookieStore.get('refresh_token') || '');
			if (error === 401) {
				return NextResponse.json("Тебе нужно заново войти", { status: 401 });
			} else if (error === 403) {
				return NextResponse.json("Тебя нет в дискорде Ублюдска", { status: 403 });
			}
			await Player.create({
				nick: result[0].nick || result[0].user.global_name,
				avatar: result[0].avatar || result[0].user.avatar,
				roles: result[0].roles,
				access_token: result[0][0][1]
			});
			return NextResponse.json({
				nick: result[0].nick || result[0].user.global_name,
				avatar: result[0].avatar || result[0].user.avatar,
				roles: result[0].roles,
				access_token: result[0][0][1]
			}).cookies.set('refresh_token', result[0][2].refresh_token);
		}
		return NextResponse.json({
			nick: data[0].nick || data[0].user.global_name,
			avatar: data[0].avatar || data[0].user.avatar,
			roles: data[0].roles,
			access_token: data[1].access_token
		});
	} else {
		const [data] = await getUserData(access_token);
		if (!data) {
			const [result, error] = await refreshTokenAndGetNewData(cookieStore.get('refresh_token') || '');
			if (error === 401) {
				return NextResponse.json("Тебе нужно заново войти", { status: 401 });
			} else if (error === 403) {
				return NextResponse.json("Тебя нет в дискорде Ублюдска", { status: 403 });
			}
			if (JSON.stringify(data[0].roles) !== JSON.stringify(candidate.roles)) {
				await Player.findOneAndUpdate({ nick: candidate.nick }, { roles: data[0].roles });
			}
			console.log('2');
			return NextResponse.json({
				nick: result[0].nick,
				avatar: result[0].avatar,
				roles: result[0].roles,
				access_token: result[0][1].access_token
			});
		}
		return NextResponse.json({
			nick: candidate.nick,
			avatar: candidate.avatar,
			roles: data[0].roles,
			access_token: data[1]
		});
	}
}