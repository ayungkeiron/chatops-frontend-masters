import type { HandlerEvent } from '@netlify/functions';

import { createHmac } from 'crypto';


//manejo de los endpoiints de slack
export function slackApi(
	endpoint: SlackApiEndpoint,
	body: SlackApiRequestBody,
) {
	return fetch(`https://slack.com/api/${endpoint}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.SLACK_BOT_OAUTH_TOKEN}`,
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify(body),
	}).then((res) => res.json());
}

export function verifySlackRequest(request: HandlerEvent) {
	const secret = process.env.SLACK_SIGNING_SECRET!;
	const signature = request.headers['x-slack-signature'];
	const timestamp = Number(request.headers['x-slack-request-timestamp']);
	const now = Math.floor(Date.now() / 1000); // match Slack timestamp precision

	// if the timestamp is more than five minutes off assume something’s funky
	if (Math.abs(now - timestamp) > 300) {
		return false;
	}

	// make a hash of the request using the same approach Slack used
	const hash = createHmac('sha256', secret)
		.update(`v0:${timestamp}:${request.body}`)
		.digest('hex');

	// we know the request is valid if our hash matches Slack’s
	return `v0=${hash}` === signature;
}

export const blocks = {
	section: ({ text }: SectionBlockArgs): SlackBlockSection => {
		return {
			type: 'section',
			text: {
				type: 'mrkdwn',
				text,
			},
		};
	},
	input({
		id,
		label,
		placeholder,
		initial_value = '',
		hint = '',
	}: InputBlockArgs): SlackBlockInput {
		return {
			block_id: `${id}_block`,
			type: 'input',
			label: {
				type: 'plain_text',
				text: label,
			},
			element: {
				action_id: id,
				type: 'plain_text_input',
				placeholder: {
					type: 'plain_text',
					text: placeholder,
				},
				initial_value,
			},
			hint: {
				type: 'plain_text',
				text: hint,
			},
		};
	},
	select({
		id,
		label,
		placeholder,
		options,
	}: SelectBlockArgs): SlackBlockInput {
		return {
			block_id: `${id}_block`,
			type: 'input',
			label: {
				type: 'plain_text',
				text: label,
				emoji: true,
			},
			element: {
				action_id: id,
				type: 'static_select',
				placeholder: {
					type: 'plain_text',
					text: placeholder,
					emoji: true,
				},
				options: options.map(({ label, value }) => {
					return {
						text: {
							type: 'plain_text',
							text: label,
							emoji: true,
						},
						value,
					};
				}),
			},
		};
	},
};

export function modal({
	trigger_id,
	id,
	title,
	submit_text = 'Submit',
	blocks,
}: ModalArgs) {
	return {
		trigger_id,
		view: {
			type: 'modal',
			callback_id: id,
			title: {
				type: 'plain_text',
				text: title,
			},
			submit: {
				type: 'plain_text',
				text: submit_text,
			},
			blocks,
		},
	};
}

// Función para intercambiar el código de autorización por un token
export async function exchangeAuthCodeForToken(code: string): Promise<string> {
    const client_id = process.env.SLACK_CLIENT_ID;
    const client_secret = process.env.SLACK_CLIENT_SECRET;
    const params = new URLSearchParams({
        client_id: client_id || '',
        client_secret: client_secret || '',
        code
    });

    const response = await fetch(`https://slack.com/api/oauth.v2.access?${params}`);
    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Error al obtener el token: ${data.error}`);
    }

    return data.access_token;
}