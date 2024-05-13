export async function llaimaApi(endpoint: string, body: {}) {
	const res = await fetch(`http://api.llaima.tech:3001/api/v1${endpoint}`, {
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
	const response=await llaimaApi('/integration/slack/validate-user',request)
	return response.data
}

