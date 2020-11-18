const TOKEN = "<token>";
const BASE_API_URL = "https://api.telegram.org";

createWebhookTransformer({

	/**
	 * Extract the userId, sessionId and text
	 * from the Telegram request body
	 */
	handleInput: async ({ request }) => {
		const { body } = request as TelegramRequest;

		const { message } = body;
		
		if (!message) {
			throw new Error("Received update of a different type than 'message'");
		}

		const { from, text, chat } = message;
 
		const { id: userId } = from;
		const { id: sessionId } = chat;

		return {
			userId: String(userId),
			sessionId: String(sessionId),
			text,
			data: {
				request: request.body
			}
		};
	},

	/**
	 * Send the output text from the Flow
	 * to the user on Telegram
	 */
	handleOutput: async ({ output, sessionId }) => {
		const payload: TelegramSendMessagePayload = {
			chat_id: sessionId,
			text: output.text
		};

		try {
			await httpRequest({
				uri: `${BASE_API_URL}/bot${TOKEN}/sendMessage`,
				method: "POST",
				json: true,
				body: payload
			});
		} catch (err) {
			console.error(`Error while sending request to Telegram. Error was: ${err}`);
		}

		// Return null to stop execution after sending the request
		return null;
	}
});

interface TelegramRequest {
	body: TelegramRequestBody;
};

interface TelegramRequestBody {
	udate_id: number;
	message: TelegramMessage;
	edited_message: TelegramMessage;
	channel_post: TelegramMessage;
	edited_channel_post: TelegramMessage;
}

interface TelegramMessage {
	message_id: number;
	from: TelegramUser;
	text: string;
	date: number;
	chat: TelegramChat;
}

interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
}

interface TelegramChat {
	id: number;
	type: string;
}

interface TelegramSendMessagePayload {
	chat_id: string;
	text: string;
}