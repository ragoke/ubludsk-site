import axios from "axios";
import { NextResponse } from "next/server";
import connectToDatabase from "@/libs/mongodb";
import User from "@/models/user";

const ubludskGuildId = '1211777494559096933';
const CACHE_DURATION = 60 * 1000;

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

const localizeSeconds = (n) => {
	const forms = ['секунду', 'секунды', 'секунд'];
	const form = (n % 10 === 1 && n % 100 !== 11) ? 0 :
		(n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2;
	return `${n} ${forms[form]}`;
};


export async function GET(request) {
	const searchParams = request.nextUrl.searchParams;
	const access_token = searchParams.get('access_token');
	const userIdParam = searchParams.get('userId');
	if (!access_token) {
		return NextResponse.json({ error: "No token provided" }, { status: 401 });
	}

	await connectToDatabase();

	const user = await User.findOne({ userId: userIdParam });

	if (user) {
		if (Date.now() - user.updatedAt.getTime() < CACHE_DURATION) {
			return NextResponse.json({
				nick: user.nick,
				roles: user.roles,
			});
		} else {
			await User.findOneAndUpdate({ userId: userIdParam }, { updatedAt: new Date() });
			return NextResponse.json({
				nick: user.nick,
				roles: user.roles,
			});
		}
	}

	const [userGuildData, getUserGuildData_error] = await getUserGuildData(access_token);
	if (getUserGuildData_error) {
		const { status, data } = getUserGuildData_error;
		if (status === 429) {
			return NextResponse.json({
				error:
					"Нахуй так быстро? Попробуй снова через " +
					localizeSeconds(Math.round(data.retry_after))
			}, { status });
		}
		if (status === 401) {
			return NextResponse.json({
				error: "Тебе нужно заново войти"
			}, { status });
		}
	}


	const nick = userGuildData.nick || userGuildData.user.global_name;
	// const [avatar] = await getUserAvatar(userGuildData.user.id, userGuildData.avatar || userGuildData.user.avatar);
	const roles = userGuildData.roles;
	const userId = userGuildData.user.id;

	if (!user) {
		await User.create({
			nick: nick,
			roles: roles,
			updatedAt: new Date()
		});
	}
	console.log('юзера нет');

	return NextResponse.json({
		nick: nick,
		roles: roles,
	});
	// return NextResponse.json({
	// 	error: "I'm a Teapot"
	// }, { status: 418 });
}