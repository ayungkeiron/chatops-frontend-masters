import { slackApi } from '../util/slack';
import { validateLlaimaUser, getSendMessage } from '../util/llaima';


let fakemessage = 0;

export async function handleAppHomeOpened(event: SlackEvent) {
    if (event.type == 'app_home_opened') {
        const user_id = event.user;
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
            ]
        };

        try {
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

export async function handleSlackMessage(event: SlackEvent) {

    if ((event.subtype && event.subtype === 'bot_message') || event.bot_id) {
        console.log("Mensaje ignorado porque fue enviado por un bot");
        return {
            statusCode: 200,
            body: ''
        };
    }

    else if (event.type === 'message' && event.channel_type === 'im') {

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

        let message = "usuario logueado y de pago!!:D"
        const response = await validateLlaimaUser(event);

       // console.log('respuesta validate en mensaje in:',response)

        //Cualquier persona que nos hable, deberia tener el payload de integracion, osino es un error extra;o no manejado.
        if(response.company.integrations[0].payload.access_token != null){
            try {

                await slackApi('chat.postMessage', {
                    channel: event.channel,
                    text: "Estamos buscando la información que solicitaste. Por favor, espera un momento..."
                }, response?.company.integrations[0].payload.access_token);
    
                //COMPORTAMIENTO PARA LOS LOGUEADOS
                if (response.company.isActive) {
                    const getm = await getSendMessage(event)
                    console.log("getm:", getm.error)

                    if (getm.success) {
                        console.log("getm:", getm.data.prompt.answer)
    
                        const res = await slackApi('chat.postMessage', {
                            channel: event.channel,
                            text: getm.data.prompt.answer
                        }, response?.company.integrations[0].payload.access_token);
                    } else {
                        const res = await slackApi('chat.postMessage', {
                            channel: event.channel,
                            text: "Estamos temporalmente con problemas, intenta más tarde. Este incidente ya fue automáticamente reportado a nuestro equipo de soporte."
                        }, response?.company.integrations[0].payload.access_token);
                    }
                } 
                //COMPORTAMIENTO PARA LOS NO LOGUEADOS
                else {
    
                    const res = await slackApi('chat.postMessage', {
                        channel: event.channel,
                        text: mensajesBot[fakemessage].texto
                    }, response?.token);
                    fakemessage = fakemessage + 1;
                    if (fakemessage == 4) {
                        fakemessage = 0;
                    }
                    console.log(res);
                }
    
                return {
                    statusCode: 200,
                    body: 'Mensaje enviado'
                };
    
            } 
            catch (error) {
                console.log("error en slackPostMessage", error)
    
                return {
                    statusCode: 500,
                    body: 'No se valida usuario en backend de llaima'
                };
            }

        }else{
            //Si no tiene integracion, no se puede hacer nada esto jamas deberia pasar.
            return {
                statusCode: 500,
                body: 'Sin info de integracion de usuario'
            };
        }
    }
    else{
        return {
            statusCode: 200,
            body: 'Tipo de evento no manejado en handleSlack'
        };
    }

}
