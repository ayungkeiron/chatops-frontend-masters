import axios from 'axios';

export async function llaimaApi(endpoint: string, body: {}) {
    try {
        const res = await axios.post(`https://api.llaima.tech/api/v1${endpoint}`, body, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
            },
        });

        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API error:', error.response ? error.response.data : error.message);
            throw new Error(error.response ? error.response.data : 'API request failed');
        } else {
            console.error('Unexpected error:', error);
            throw new Error('An unexpected error occurred');
        }
    }
}

export async function validateLlaimaUser(request: SlackEvent) {
    try {
        console.log("ANTES DE VALIDATE LLAIMAUSER:", request);
        const response = await llaimaApi('/integration/slack/validate-user', request);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error validating Llaima user:', error.message);
        } else {
            console.error('Unexpected error validating Llaima user:', error);
        }
        throw error;
    }
}

export async function getSendMessage(request: any) {
    try {
        console.log("ANTES DE API SEND/MESSAGE", request);
        const response = await llaimaApi('/integration/slack/send-message', request);
        console.log("response sendMessage:", response);
        return response;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error sending message:', error.message);
        } else {
            console.log('Unexpected error sending message:', {error});
        }
        // Imprimir el objeto de error completo
        console.error({error});
        return {'error':error};
    }
}
