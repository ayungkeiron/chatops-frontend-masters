type SlackSlashCommandPayload = {
	token: string;
	team_id: string;
	team_domain: string;
	channel_id: string;
	channel_name: string;
	user_id: string;
	user_name: string;
	command: string;
	text: string;
	api_app_id: string;
	is_enterprise_install: boolean;
	response_url: string;
	trigger_id: string;
	payload: never;
};

type SlackInteractivityPayload = {
	payload: string;
	command: never;
};

// Define el tipo SlackOAuthAccessResponse sin un espacio de nombres
type SlackOAuthAccessResponse = {
    ok: boolean;
    app_id: string;
    authed_user: { id: string };
    scope: string;
    token_type: string;
    access_token: string;
    bot_user_id: string;
    team: { id: string; name: string };
    enterprise: null | string;
    is_enterprise_install: boolean;
};

type SlackPayload = SlackSlashCommandPayload | SlackInteractivityPayload;

type SlackBlockSection = {
	type: 'section';
	text: {
		type: 'plain_text' | 'mrkdwn';
		text: string;
		verbatim?: boolean;
	};
};

// Define el tipo SlackEvent para mensajes directos
type SlackEvent = {
    user: string; // ID del usuario que envió el mensaje
    type: 'message'; // Tipo de evento, en este caso 'message'
    ts: string; // Timestamp del mensaje
    client_msg_id?: string; // ID único del mensaje del cliente
    text: string; // Contenido del mensaje enviado
    team: string; // ID del equipo
    blocks?: Array<{
        type: string; // Tipo de bloque, como 'rich_text'
        block_id: string;
        elements: Array<any>; // Elementos en el bloque, podrían requerir un tipo más detallado
    }>;
    channel: string; // ID del canal al que fue enviado el mensaje
    event_ts: string; // Timestamp del evento en la API de Slack
    channel_type: 'im' | 'channel' | 'group'; // Tipo de canal, generalmente 'im' para mensajes directos
    bot_id?: string; // Presente si el mensaje fue enviado por un bot
    subtype?: string; // Presente para subtipos específicos de mensajes
};


type SlackBlockInput = {
	type: 'input';
	block_id: string;
	label: {
		type: 'plain_text';
		text: string;
		emoji?: boolean;
	};
	hint?: {
		type: 'plain_text';
		text: string;
		emoji?: boolean;
	};
	optional?: boolean;
	dispatch_action?: boolean;
	element: {
		type: string;
		action_id: string;
		placeholder?: {
			type: string;
			text: string;
			emoji?: boolean;
		};
		options?: {
			text: {
				type: 'plain_text';
				text: string;
				emoji?: boolean;
			};
			value: string;
		}[];
		initial_value?: string;
		dispatch_action_config?: {
			trigger_actions_on: string[];
		};
	};
};

type SlackBlock = SlackBlockSection | SlackBlockInput;

type FoodOpinionModalState = {
	values: {
		opinion_block: {
			opinion: {
				type: 'plain_text_input';
				value: string;
			};
		};
		spice_level_block: {
			spice_level: {
				type: 'static_select';
				selected_option: {
					text: {
						type: 'plain_text';
						text: string;
						emoji: boolean;
					};
					value: string;
				};
			};
		};
	};
};

type ModalArgs = {
	trigger_id: string;
	id: string;
	title: string;
	submit_text?: string;
	blocks: SlackBlock[];
};

type SlackModalPayload = {
	type: string;
	callback_id?: string;
	team: {
		id: string;
		domain: string;
	};
	user: {
		id: string;
		username: string;
		name: string;
		team_id: string;
	};
	channel?: {
		id: string;
		name: string;
	};
	message: {
		ts: string;
		thread_ts?: string;
	};
	api_app_id: string;
	token: string;
	trigger_id: string;
	view: {
		id: string;
		team_id: string;
		type: string;
		blocks: SlackBlock[];
		private_metadata: string;
		callback_id: string;
		state: FoodOpinionModalState;
		hash: string;
		title: {
			type: 'plain_text';
			text: string;
			emoji: boolean;
		};
		clear_on_close: boolean;
		notify_on_close: boolean;
		close: null;
		submit: {
			type: 'plain_text';
			text: string;
			emoji: boolean;
		};
		app_id: string;
		external_id: string;
		app_installed_team_id: string;
		bot_id: string;
	};
};

type SlackApiEndpoint =  | "auth.test"
| "chat.postMessage"
| "users.info"
| "conversations.list"

type SlackApiRequestBody = {};

type BlockArgs = {
	id: string;
	label: string;
	placeholder: string;
};

type SectionBlockArgs = {
	text: string;
};

type InputBlockArgs = {
	initial_value?: string;
	hint?: string;
} & BlockArgs;

type SelectBlockArgs = {
	options: {
		label: string;
		value: string;
	}[];
} & BlockArgs;

type NotionItem = {
	properties: {
		opinion: {
			title: {
				text: {
					content: string;
				};
			}[];
		};
		spiceLevel: {
			select: {
				name: string;
			};
		};
		Status: {
			status: {
				name: string;
			};
		};
	};
};

type NewItem = {
	opinion: string;
	spiceLevel: string;
	status?: string;
	submitter?: string;
};



