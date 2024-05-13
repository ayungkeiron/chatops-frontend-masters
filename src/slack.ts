import type { Handler, HandlerEvent } from '@netlify/functions';
import { parse } from 'querystring';
import { blocks, modal, slackApi, verifySlackRequest, exchangeAuthCodeForToken, getUser } from './util/slack';
import { llaimaApi } from './util/llaima';

let fakemessage=0;

async function handleSlashCommand(payload: SlackSlashCommandPayload) {
	switch (payload.command) {
		case '/botpoc':
			const response = await slackApi(
				'views.open',
				modal({
					id: 'foodfight-modal',
					title: 'Start a food fight!',
					trigger_id: payload.trigger_id,
					blocks: [
						blocks.section({
							text: 'The discourse demands food drama! *Send in your spiciest food takes so we can all argue about them and feel alive.*',
						}),
						blocks.input({
							id: 'opinion',
							label: 'Deposit your controversial food opinions here.',
							placeholder:
								'Example: peanut butter and mayonnaise sandwiches are delicious!',
							initial_value: payload.text ?? '',
							hint: 'What do you believe about food that people find appalling? Say it with your chest!',
						}),
						blocks.select({
							id: 'spice_level',
							label: 'How spicy is this opinion?',
							placeholder: 'Select a spice level',
							options: [
								{ label: 'mild', value: 'mild' },
								{ label: 'medium', value: 'medium' },
								{ label: 'spicy', value: 'spicy' },
								{ label: 'nuclear', value: 'nuclear' },
							],
						}),
					],
				}),
			);

			if (!response.ok) {
				console.log(response);
			}

			break;

		default:
			return {
				statusCode: 200,
				body: `Command ${payload.command} is not recognized`,
			};
	}

	return {
		statusCode: 200,
		body: '',
	};
}

async function handleInteractivity(payload: SlackModalPayload) {
	const callback_id = payload.callback_id ?? payload.view.callback_id;

	switch (callback_id) {

		case 'foodfight-modal':
			
			const data = payload.view.state.values;
			const fields = {
				opinion: data.opinion_block.opinion.value,
				spiceLevel: data.spice_level_block.spice_level.selected_option.value,
				submitter: payload.user.name,
			};
 
			console.log("entrando al modal")
			await slackApi('chat.postMessage', {
				channel: 'C070BKZGL2J',
				text: `Oh dang, y’all! :eyes: <@${payload.user.id}> just started a food fight with a ${fields.spiceLevel} take:\n\n*${fields.opinion}*\n\n...discuss.`,
			});
			console.log("saliendo de post")

			break;

		case 'start-food-fight-nudge':
			const channel = payload.channel?.id;
			const user_id = payload.user.id;
			const thread_ts = payload.message.thread_ts ?? payload.message.ts;

			await slackApi('chat.postMessage', {
				channel,
				thread_ts,
				text: `Hey <@${user_id}>, an opinion like this one deserves a heated public debate. Run the \`/foodfight\` slash command in a main channel to start one!`,
			});

			break;

		default:
			console.log(`No handler defined for ${payload.view.callback_id}`);
			return {
				statusCode: 400,
				body: `No handler defined for ${payload.view.callback_id}`,
			};
	}

	return {
		statusCode: 200,
		body: '',
	};
}

// Implementa una función dedicada al endpoint de OAuth
async function handleSlackOauthCallback(event: HandlerEvent) {
    const queryStringParameters = event.queryStringParameters;
    const code = queryStringParameters?.code;

    if (!code) {
        return {
            statusCode: 400,
            body: 'Código de autorización no proporcionado.'
        };
    }

    try {

		const response=await exchangeAuthCodeForToken(code)
        const accessToken = response.access_token;
		// Obtén el correo electrónico del usuario usando `users.info`
		const user = await getUser(accessToken, response.authed_user.id);
		console.log(`LLAMADA CON INFO::`,user.profile, response);
		//-------
		const statusEmojiDisplayInfo: StatusEmojiInfo[] = user.profile.status_emoji_display_info.map((info: any) => ({
			emoji_name: info.emoji_name,
			display_url: info.display_url,
			unicode: info.unicode
		}));
		    // Creación del perfil de Slack para el usuario
			const slackProfile: SlackProfile = {
				title: user.profile.title,
				phone: user.profile.phone,
				skype: user.profile.skype,
				real_name: user.profile.real_name,
				real_name_normalized: user.profile.real_name_normalized,
				display_name: user.profile.display_name,
				display_name_normalized: user.profile.display_name_normalized,
				fields: user.profile.fields,
				status_text: user.profile.status_text,
				status_emoji: user.profile.status_emoji,
				status_emoji_display_info: ["Array"], 
				status_expiration: user.profile.status_expiration,
				avatar_hash: user.profile.avatar_hash,
				image_original: user.profile.image_original,
				is_custom_image: user.profile.is_custom_image,
				email: user.profile.email,
				huddle_state: user.profile.huddle_state,
				huddle_state_expiration_ts: user.profile.huddle_state_expiration_ts,
				first_name: user.profile.first_name,
				last_name: user.profile.last_name,
				image_24: user.profile.image_24,
				image_32: user.profile.image_32,
				image_48: user.profile.image_48,
				image_72: user.profile.image_72,
				image_192: user.profile.image_192,
				image_512: user.profile.image_512,
				image_1024: user.profile.image_1024,
				status_text_canonical: user.profile.status_text_canonical,
				team: user.profile.team
			};

			  // Creación del objeto usuario para el payload
			  const slackUser: SlackUser = {
				id: user.id,
				team_id: user.team_id,
				name: user.name,
				deleted: user.deleted,
				color: user.color,
				real_name: user.real_name,
				tz: user.tz,
				tz_label: user.tz_label,
				tz_offset: user.tz_offset,
				profile: slackProfile,
				is_admin: user.is_admin,
				is_owner: user.is_owner,
				is_primary_owner: user.is_primary_owner,
				is_restricted: user.is_restricted,
				is_ultra_restricted: user.is_ultra_restricted,
				is_bot: user.is_bot,
				is_app_user: user.is_app_user,
				updated: user.updated,
				is_email_confirmed: user.is_email_confirmed,
				who_can_share_contact_card: user.who_can_share_contact_card
			};

			// Objeto de equipo
			const slackTeam: SlackTeam = {
					id: response.team.id,
					name: response.team.name
			};

			// Creación del payload completo
			const OauthLlaimaPayload: SlackIntegrationPayload = {
						ok: response.ok,
						app_id: response.app_id,
						user: slackUser,
						scope: response.scope,
						token_type: response.token_type,
						access_token: accessToken,
						bot_user_id: response.bot_user_id,
						team: slackTeam,
						enterprise: response.enterprise,
						is_enterprise_install: response.is_enterprise_install
			};

			// Convertir el objeto del payload a un string JSON
	

			console.log("payload",OauthLlaimaPayload)

		//_-----------
		// Envío del payload JSON a la API Llaima
		const res = await llaimaApi('/integration/slack/auth-user', OauthLlaimaPayload);

		console.log("res llaimapi", res);



        // Aquí puedes guardar el token en tu base de datos o continuar con otra lógica
		const redirectUrl = 'https://llaimaespacio.slack.com/app_redirect?app=A070KENRX7Y';

		return {
			statusCode: 302,
			headers: {
				Location: redirectUrl,
				'Content-Type': 'text/plain' // O 'text/html'
			},
			body: `Redirecting to ${redirectUrl}`
		}

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Error durante el proceso de autorización.'
        };
    }
}

async function SlackValidClient(user:string) {
    //Aqui vemos si existe el cliente, y retorno si true y su token, de lo contrario registro la empresa y retorno false mas su token.
	return {token:"cwcw", payment:true}
}


// Handler para mensajes directos
async function handleSlackMessage(event:SlackEvent) {
    console.log("SlackEvent:", event);
	
    // Verifica si el mensaje fue enviado por un bot
    if ((event.subtype && event.subtype === 'bot_message') || event.bot_id) {
        console.log("Mensaje ignorado porque fue enviado por un bot");
        return {
            statusCode: 200,
            body: ''
        };
    }
    // Procesa solo los mensajes directos
    if (event.type === 'message' && event.channel_type === 'im') {
        
		const infoutil=[{"channel":event.channel},{"text":event.text},{"user":event.user}, {"team_id":event.team}]
		console.log(infoutil);

		const dialogo=[
			{"texto": "¡Hola, Juan! Claro, estaré encantado de ayudarte pero necesito más información para poder asistirte. ¿Podrías darme algunos detalles como la fecha de inicio, el tipo de contrato, y si fue con un comprador o un vendedor?"},
			{"texto": "He encontrado dos contratos. Uno de fecha 14 de marzo y otro de fecha 27 de marzo. ¿Qué necesitas saber específicamente?"},
			{"texto": "Aquí tienes los detalles de los contratos:\n- *Contrato de Compraventa SolarTech 14-03-2024.pdf*\n  - Fecha de Fin del Contrato: 14-03-2025\n  - Monto Total del Contrato: $100,000\n- *Contrato de Compraventa SolarTech 27-03-2024.pdf*\n  - Fecha de Fin del Contrato: 27-03-2025\n  - Monto Total del Contrato: $150,000\n¿Hay algo más en lo que pueda asistirte?"},
			{"texto": "De nada, Juan. Recuerda que estoy aquí para ayudarte con cualquier otra cosa que necesites. ¡Que tengas un buen día!"}
		]
		


		let message=""
		const response=await SlackValidClient(event.user);
		// Validar el cliente
		if(response?.payment){
			message=`Escribiendo: ${event.text}, no llegarás a ningún lado, la única forma de conseguirlo es trabajando.`
		}else{
			message="Tu empresa no tiene una cuenta creada para poder contestar tus solicitudes sobre tu documentación. Puedes visitar htttp://llaima.tech para poder contratar, subir e integrar tu documentación."
		}

        try {
            // Intenta enviar el mensaje utilizando la API de Slack
            await slackApi('chat.postMessage', {
                channel: event.channel,
                text: message
            },response?.token);

            // Muestra la respuesta completa en la consola
            console.log("Respuesta de la API:", response);

        } catch (error) {
            // Captura el error y lo muestra en la consola
            console.error("Error en la llamada a la API:", error);
        }
    }

    return {
        statusCode: 200,
        body: 'No se hizo nada con este evento'
    };
}



export const handler: Handler = async (event) => {


	//CASO PARA LAS PETICIONES QUE VIENE DE SLACK
	console.log("request Handler", event.httpMethod, event.path)

	// Redireccionamiento para el flujo de OAuth de SLACK
	if (event.path.includes('/api/slack/oauth/callback')) {
		console.log("AuthSkack")
		return handleSlackOauthCallback(event);
	}
	else{
		const valid = verifySlackRequest(event);
	

	if (!valid) {
		console.error('invalid request');

		return {
			statusCode: 400, 
			body: 'invalid request',
		};
	}
	const contentType = event.headers['content-type'] || '';
    let body:any;

	

    if (contentType.includes('application/x-www-form-urlencoded')) {
        // Manejo del caso donde event.body podría ser null
        body = parse(event.body || '');  // Usar el operador OR para asegurar un string
    } else {
        // Asegúrate de que event.body sea un string antes de parsearlo como JSON
        body = event.body ? JSON.parse(event.body) : {};
    }

	  // Manejar la verificación del URL durante la configuración de eventos
	 	if (body.type === 'url_verification') {
        	return {
            	statusCode: 200,
            	body: body.challenge
        	};
    }// Distribuir el manejo basado en el tipo de solicitud
		else if (body.command) {
			// Manejar comandos slash
			return handleSlashCommand(body);
		} else if (body.payload) {
			// Manejar interactividad
			const payload = JSON.parse(body.payload);
			return handleInteractivity(payload);
		} else if (body.event) {
			
			// Manejar eventos, como mensajes directos
			return handleSlackMessage(body.event);
		}

	}
		// Si ninguna condición coincide
		return {
			statusCode: 400,
			body: 'No recognized request type'
		};
};