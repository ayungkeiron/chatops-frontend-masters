import { slackApi } from '../util/slack';

export async function handleInteractivity(payload: SlackModalPayload) {
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
