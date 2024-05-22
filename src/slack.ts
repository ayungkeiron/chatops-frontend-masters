import type { Handler, HandlerEvent } from '@netlify/functions';
import { parse } from 'querystring';
import { blocks, modal, slackApi, verifySlackRequest, exchangeAuthCodeForToken, getUser } from './util/slack';
import { llaimaApi, validateLlaimaUser, getSendMessage } from './util/llaima';
import { get } from 'http';

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

			// Creación del payload completo
		const OauthLlaimaPayload: SlackIntegrationPayload = {
						ok: response.ok,
						app_id: response.app_id,
						user: response.authed_user.id,
						scope: response.scope,
						token_type: response.token_type,
						access_token: accessToken,
						bot_user_id: response.bot_user_id,
						team: {
							id: response.team.id,
							name: response.team.name
					},
						enterprise: response.enterprise,
						is_enterprise_install: response.is_enterprise_install
			};

			// Envío del payload JSON a la API Llaima
			console.log("payoad a llaima", JSON.stringify(OauthLlaimaPayload));
			const res = await llaimaApi('/integration/slack/auth-user', OauthLlaimaPayload);
			console.log("res de llaimapi", res);

			// Aquí puedes guardar el token en tu base de datos o continuar con otra lógica
	   		let redirectUrl = 'https://llaimaespacio.slack.com/app_redirect?app=A070KENRX7Y';

			if(!res.success){
				//si no es success lo llevams a la página de llaima.tech
				redirectUrl = 'https://llaima.tech'
			}
 
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

async function handleAppHomeOpened(event: SlackEvent) {
    // Comprobar que el evento es de tipo 'app_home_opened'
    if (event.type == 'app_home_opened') {
        const user_id = event.user;
        // Aquí puedes definir el contenido del Home tab usando bloques
        const homeView = {
            "type": "home",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "¡Bienvenido a LlaimaBOT!"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Selecciona una opción de abajo para comenzar."
                    }
                },
                // Añade más bloques según necesites
            ]
        };

        try {
            // Usa la API de Slack para enviar la vista al Home tab
            const response = await slackApi('views.publish', {
                user_id: user_id,
                view: homeView
            });

            console.log('Home tab updated:', response);
            return {
                statusCode: 200,
                body: 'Home tab updated successfully'
            };
        } catch (error) {
            console.error('Error updating Home tab:', error);
            return {
                statusCode: 500,
                body: 'Failed to update Home tab'
            };
        }
    }
    return {
        statusCode: 200,
        body: 'Event not app_home_opened'
    };
}


async function SlackValidClient(event:SlackEvent) {
    //Aqui vemos si existe el cliente, y retorno si true y su token, de lo contrario registro la empresa y retorno false mas su token.
	try{
		const response=await validateLlaimaUser(event);
		return response
	}
	catch(error){
		console.log("error en SlackValidacioncliente con backend llaima", error)
		return {"payment":false, "token":""}
	}
}
// Handler para mensajes directos
async function handleSlackMessage(event:SlackEvent) {

	//	console.log("event HM:", event)
   
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
		
		const mensajesBot = [
			{
				texto: "¡Hola, Domingo! Claro, estaré encantado de ayudarte pero necesito más información para poder asistirte. ¿Podrías darme algunos detalles como la fecha de inicio, el tipo de contrato, y si fue con un comprador o un vendedor?"
			},
			{
				texto: "He encontrado dos contratos. Uno de fecha *14 de marzo* y otro de *fecha 27 de marzo*. ¿Qué necesitas saber específicamente?"
			},
			{
				texto: "Aquí tienes los detalles de los contratos:\n*Nombre del Contrato*: Contrato de Compraventa SolarTech 14-03-2024.pdf\n  * *Fecha de Fin del Contrato*: 14-03-2025\n  * *Monto Total del Contrato*: $100,000\n*Nombre del Contrato*: Contrato de Compraventa SolarTech 27-03-2024.pdf\n  * *Fecha de Fin del Contrato*: 27-03-2025\n  * *Monto Total del Contrato*: $150,000\n¿Hay algo más en lo que pueda asistirte?"
			},
			{
				texto: "De nada, Domingo. Recuerda que estoy aquí para ayudarte con cualquier otra cosa que necesites. ¡Que tengas un buen día!"
			}
		];
		let message="usuario logueado y de pago!!:D"
		const response=await SlackValidClient(event);
		
				//Aqui debemos validar 
		try{
			if(response.company.isActive){

				//mensaje para los logueados

				const getm=await getSendMessage(event)

				if(getm.success){
					console.log("getm:",getm.data.prompt.answer)

					const res=	await slackApi('chat.postMessage', {
						channel: event.channel,
						text: getm.data.prompt.answer
					},response?.company.integrations[0].payload.access_token);
				}else{
						//mensaje para los logueados
				const res=	await slackApi('chat.postMessage', {
					channel: event.channel,
					text: message
				},response?.company.integrations[0].payload.access_token);

				}
				

				
			}else{
				//mensajesBot[fakemessage].texto
				//mensaje para los no logueados.
				//'.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.'
				const res=	await slackApi('chat.postMessage', {
					channel: event.channel,
					text:mensajesBot[fakemessage].texto //esto es lo que se manda y hay que reemplazar
				},response?.token);
				fakemessage=fakemessage+1;
				if(fakemessage==4){
					fakemessage=0
				}
				console.log(res)	
			}
			return {
				statusCode: 200,
				body: 'Mensaje enviado'
			};

		}catch(error){

			console.log("error en SlackValidacioncliente con backend llaima", error)

			return {
				statusCode: 500,
				body: 'No se valida usuario en backend de llaima'
			};
		}

    }

    return {
        statusCode: 200,
        body: 'Tipo de evento no manejado en handleSlack'
    };
}


export const handler: Handler = async (event) => {


	//CASO PARA LAS PETICIONES QUE VIENE DE SLACK
	

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

	}
		// Si ninguna condición coincide
		return {
			statusCode: 400,
			body: 'No recognized request type'
		};
};