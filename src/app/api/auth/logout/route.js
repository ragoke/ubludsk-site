import axios from "axios";
import { NextResponse } from "next/server";

const revokeToken = async (access_token) => {
	const url = 'https://discord.com/api/v10/oauth2/token/revoke';
	const data = {
		client_id: process.env.DISCORD_CLIENT_ID,
		client_secret: process.env.DISCORD_CLIENT_SECRET,
		'token': access_token,
		'token_type_hint': 'access_token'
	};
	try {
		const response = await axios.post(url, data, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		return [response.data, null];
	} catch (error) {
		return [null, { status: error.response.status, data: error.response.data }];
	}
};

export async function GET(request) {
	const searchParams = request.nextUrl.searchParams;
	const access_token = searchParams.get('access_token');
	if (!access_token) {
		return NextResponse.json({ error: "No token provided" }, { status: 401 });
	}
	await revokeToken(access_token);
	return NextResponse.json({});
}