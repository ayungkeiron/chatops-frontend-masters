export async function llaimaApi(endpoint: string, body: {}) {
	const res = await fetch(`https://api.llaima.tech/api/v1${endpoint}`, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	}).catch((err) => console.error(err));

	if (!res || !res.ok) {
		console.error(res);
	} 
	//pqra probar
	const data = await res?.json();

	return data;
}

export async function validateLlaimaUser(request:SlackEvent) {
	console.log("ANTES DE VALIDATE LLAIMAUSER:", request)
	const response=await llaimaApi('/integration/slack/validate-user',request)
	return response.data
}

export async function getSendMessage(request: any) {
	try {
		console.log("ANTES DE API SEND/MESSAGE", request)
		const response = await llaimaApi('/integration/slack/send-message', request );
		console.log("response sendMessage:", response);
		return response.data;
	} catch (error) {
		console.error(error);
		// Handle the error here
		throw error; // Rethrow the error to be handled by the caller
	}
}

