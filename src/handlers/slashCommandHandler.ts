import { slackApi, modal, blocks } from '../util/slack';

export async function handleSlashCommand(payload: SlackSlashCommandPayload) {
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
                            placeholder: 'Example: peanut butter and mayonnaise sandwiches are delicious!',
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
