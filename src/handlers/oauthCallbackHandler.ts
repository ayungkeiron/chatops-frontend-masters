import { HandlerEvent } from '@netlify/functions';
import { exchangeAuthCodeForToken } from '../util/slack';
import { llaimaApi } from '../util/llaima';

export async function handleSlackOauthCallback(event: HandlerEvent) {
    const queryStringParameters = event.queryStringParameters;
    const code = queryStringParameters?.code;

    if (!code) {
        return {
            statusCode: 400,
            body: 'Código de autorización no proporcionado.'
        };
    }

    try {
        const response = await exchangeAuthCodeForToken(code)
        const accessToken = response.access_token;

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

        console.log("payoad a llaima", JSON.stringify(OauthLlaimaPayload));
        const res = await llaimaApi('/integration/slack/auth-user', OauthLlaimaPayload);
        console.log("res de llaimapi", res);

        let redirectUrl = 'https://llaimaespacio.slack.com/app_redirect?app=A070KENRX7Y';

        if (!res.success) {
            redirectUrl = 'https://llaima.tech'
        }

        return {
            statusCode: 302,
            headers: {
                Location: redirectUrl,
                'Content-Type': 'text/plain'
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
