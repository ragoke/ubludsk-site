import axios from "axios";
import { NextResponse } from "next/server";
// import connectMongoDB from "@/libs/mongodb";
// import Player from "@/models/player";

const getTokens = async (code) => {
	const data = {
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URL + 'api/auth/callback/'
	};
	try {
		const response = await axios.post('https://discord.com/api/v10/oauth2/token', data, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		});

		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};

const ubludskGuildId = '1211777494559096933';
const getUserGuildData = async (access_token) => {
	const url = `https://discord.com/api/v10/users/@me/guilds/${ubludskGuildId}/member`;
	try {
		const response = await axios.get(url, {
			headers: {
				'Authorization': `Bearer ${access_token}`,
			},
		});
		return [response.data, null];
	} catch (error) {
		return [null, { status: error.response.status, data: error.response.data }];
	}
};

const getUserAvatar = async (userId, avatarHash) => {
	const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
	try {
		const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
		const buffer = Buffer.from(response.data, 'binary').toString('base64');
		const base64Image = `data:image/png;base64,${buffer}`;
		return [base64Image, null];
	} catch (error) {
		return [null, error];
	}
};


export async function GET(request) {
	const redirectUrl = new URL(process.env.NEXT_PUBLIC_REDIRECT_URL, request.url);

	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');

	const [tokens, getToken_error] = await getTokens(code);
	if (getToken_error) {
		redirectUrl.searchParams.append('error', "Тебе нужно заново войти");
		return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
	}

	const [userGuildData, getUserGuildData_error] = await getUserGuildData(tokens.access_token);
	if (getUserGuildData_error) {
		// redirectUrl.searchParams.append('error', "Тебя нет в дискорде Ублюдска");
		redirectUrl.searchParams.append('error', "Произошла ошибка сервера. Тебе нужно заново войти");
		return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
	}
	const userId = userGuildData.user.id;
	const nick = userGuildData.nick || userGuildData.user.global_name;
	// const avatar = await getUserAvatar(userGuildData.user.id, userGuildData.avatar || userGuildData.user.avatar);
	const roles = JSON.stringify(userGuildData.roles);
	const accessToken = JSON.stringify({
		userId,
		token: tokens.access_token,
		expires_in: tokens.expires_in
	});
	// await connectMongoDB();
	// const candidate = await Player.findOne({ nick: data.nick || data.user.global_name });
	// if (!candidate) {
	// 	await Player.create({
	// 		nick: data.nick || data.user.global_name,
	// 		avatar: data.avatar || data.user.avatar,
	// 		roles: data.roles,
	// 		access_token: getTokenData.access_token,
	// 	});
	// }
	// await Player.findOneAndUpdate({ nick: data.nick || data.user.global_name }, { roles: data.roles });
	redirectUrl.searchParams.append('nick', nick);
	// redirectUrl.searchParams.append('avatar', avatar);
	redirectUrl.searchParams.append('roles', roles);
	redirectUrl.searchParams.append('accessToken', accessToken);
	return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
}