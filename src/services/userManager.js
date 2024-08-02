import axios from "axios";

export const checkUser = async (secret, nick) => {
	try {
		const response = await axios.get(`/api/auth/check?access_token=${secret}&userId=${nick}`);
		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};

export const logoutUser = async (secret) => {
	try {
		const response = await axios.get(`/api/auth/logout?access_token=${secret}`);
		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};