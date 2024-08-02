import axios from "axios";

export const getAllPoints = async () => {
	try {
		const response = await axios.get('/api/points');
		return [response.data, null];
	} catch (error) {
		return [null, error];
	}
};
export const udpatePoint = async ({ sprite, prevValue, value, updatedAt }) => {
	try {
		const response = await axios.post('/api/points',
			{ sprite, prevValue, value, updatedAt }
		);
		return [response.data, null];
	} catch (error) {
		return [null, error];
	}
};