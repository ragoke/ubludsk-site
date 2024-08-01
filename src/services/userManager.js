import axios from "axios";

export const checkUser = async (secret) => {
	try {
		const response = await axios.get(`/api/auth/check?access_token=${secret}`);
		return [response.data, null];
	} catch (error) {
		return [null, error.response.data];
	}
};