import type { Handler, HandlerEvent } from '@netlify/functions';
import { parse } from 'querystring';
import { verifySlackRequest } from './util/slack';
import { handleSlashCommand } from './handlers/slashCommandHandler';
import { handleInteractivity } from './handlers/interactivityHandler';
import { handleSlackOauthCallback } from './handlers/oauthCallbackHandler';
import { handleAppHomeOpened, handleSlackMessage } from './handlers/eventHandlers';

const quickResponse = (handler: Handler) => async (event: HandlerEvent, context: any) => {
	const quickRes = {
		statusCode: 200,
		body: '',
	};

	setTimeout(async () => {
		try {
			await handler(event, context);
		} catch (error) {
			console.error(error);
		}
	}, 0);

	return quickRes;
};

export const handler: Handler = quickResponse(async (event) => {

	//parseams la solicitud de Slack opara saber como manejarla
	const contentType = event.headers['content-type'] || '';
	let body: any;

	if (contentType.includes('application/x-www-form-urlencoded')) {
		body = parse(event.body || '');
	} else {
		body = event.body ? JSON.parse(event.body) : {};
	}

	//cuando viene esa ruta, sabemos que es para hacer el callback de la autenticacion de slack
	if (event.path.includes('/api/slack/oauth/callback')) {
		console.log("AuthSkack")
		return handleSlackOauthCallback(event);
	}
	//sino, verificamos la solicitud con el header de slack
	else if(!verifySlackRequest(event)){
		console.error('invalid request');

		return {
			statusCode: 400,
			body: 'invalid request',
		};
	} 
	else if (body.type === 'url_verification') {
		return {
			statusCode: 200,
			body: body.challenge
		};
	} 
	else if (body.command) {
		return handleSlashCommand(body);
	} 
	else if (body.payload) {
		const payload = JSON.parse(body.payload);
		return handleInteractivity(payload);
	} 
	else if (body.event) {
		switch (body.event.type) {
			case 'app_home_opened':
				return handleAppHomeOpened(body.event);
			case 'message':
				return handleSlackMessage(body.event);
			default:
				console.log(`Unhandled event type: ${body.event.type}`);
				return {
					statusCode: 200,
					body: 'Event type not handled'
				};
		}
	}
	else{
		return {
			statusCode: 400,
			body: 'No recognized request type'
		};
	}
	
});
