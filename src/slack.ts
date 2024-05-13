import type { Handler, HandlerEvent } from '@netlify/functions';
import { parse } from 'querystring';
import { blocks, modal, slackApi, verifySlackRequest, exchangeAuthCodeForToken, getUserEmail } from './util/slack';


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
async function handleOauthCallback(event: HandlerEvent) {
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
		const userEmail = await getUserEmail(accessToken, response.authed_user.id);
		console.log(`Correo electrónico del usuario: ${userEmail}`, response);
		//Aquí hay que guardar el @algo, ty el response completo para validarlo con Henry.
		//APIHENRY(usermail, payload, slack)

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
		return handleOauthCallback(event);
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