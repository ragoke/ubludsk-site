import axios from "axios";
import connectMongoDB from "@/libs/mongodb";
import Player from "@/models/player";
import { NextResponse } from "next/server";

const getToken = async (code) => {
	const data = {
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URL + 'api/auth/callback/'
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

const getUserData = async (accessToken) => {
	try {
		const response = await axios.get('https://discord.com/api/users/@me/guilds/1211777494559096933/member', {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});
		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};

export async function GET(request) {
	const redirectUrl = new URL(process.env.NEXT_PUBLIC_REDIRECT_URL);

	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');

	const [getTokenData, getToken_error] = await getToken(code);
	if (!getTokenData || getTokenData.error || getToken_error) {
		console.log(getToken_error);
		return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
	}

	const [data] = await getUserData(getTokenData.access_token);
	console.log(data);
	if (!data) {
		redirectUrl.searchParams.append('error', 'Тебя нет в дискорде Ублюдска');
		return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
	}
	await connectMongoDB();
	const candidate = await Player.findOne({ access_token: getTokenData.access_token });
	if (!candidate) {
		await Player.create({
			nick: data.nick || data.user.global_name,
			avatar: data.avatar || data.user.avatar,
			roles: data.roles,
			access_token: access_token,
		});
	}
	if (JSON.stringify(data.roles) !== JSON.stringify(candidate.roles)) {
		await Player.findOneAndUpdate({ nick: candidate.nick }, { roles: data.roles });
	}
	// (data.roles.includes('1211781664955437207') || data.roles.includes('1212633560947892234'))
	redirectUrl.searchParams.append('nick', data.nick || data.user.global_name);
	redirectUrl.searchParams.append('avatar', data.avatar || data.user.avatar);
	redirectUrl.searchParams.append('roles', JSON.stringify(data.roles));
	redirectUrl.searchParams.append('access_token', access_token);
	const next_response = NextResponse.redirect(redirectUrl.toString(), { status: 302 });
	next_response.cookies.set('refresh_token', getTokenData.refresh_token, { httpOnly: true });
	return next_response;
}