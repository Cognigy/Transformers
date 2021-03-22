const TOKEN = "<token>";
const BASE_API_URL = "https://api.telegram.org";

const sendTelegramMessage = async (output: any, sessionId: string) => {

	console.log(JSON.stringify(output))

	if (output.text) {
		try {
			await httpRequest({
				uri: `${BASE_API_URL}/bot${TOKEN}/sendMessage`,
				method: "POST",
				json: true,
				body: {
					chat_id: sessionId,
					text: output.text
				}
			});
		} catch (err) {
			console.error(`Error while sending request to Telegram. Error was: ${err}`);
		}
	}
	// check for image
	else if (output.data?._cognigy?._default?._image?.type === "image") {
		try {
			await httpRequest({
				uri: `${BASE_API_URL}/bot${TOKEN}/sendPhoto`,
				method: "POST",
				json: true,
				body: {
					chat_id: sessionId,
					photo: output.data._cognigy._default._image.imageUrl,
					caption: output.data._cognigy._default._image.fallbackText || ""
				}
			});
		} catch (err) {
			console.error(`Error while sending request to Telegram. Error was: ${err}`);
		}
	}

	// check for audio
	else if (output.data?._cognigy?._default?._audio?.type === "audio") {
		try {
			await httpRequest({
				uri: `${BASE_API_URL}/bot${TOKEN}/sendAudio`,
				method: "POST",
				json: true,
				body: {
					chat_id: sessionId,
					audio: output.data._cognigy._default._audio.audioUrl,
					caption: output.data._cognigy._default._audio.fallbackText || ""
				}
			});
		} catch (err) {
			console.error(`Error while sending request to Telegram. Error was: ${err}`);
		}
	}

	// check for video
	else if (output.data?._cognigy?._default?._video?.type === "video") {
		try {
			await httpRequest({
				uri: `${BASE_API_URL}/bot${TOKEN}/sendVideo`,
				method: "POST",
				json: true,
				body: {
					chat_id: sessionId,
					video: output.data._cognigy._default._video.videoUrl,
					caption: output.data._cognigy._default._video.fallbackText || ""
				}
			});
		} catch (err) {
			console.error(`Error while sending request to Telegram. Error was: ${err}`);
		}
	}
}

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

		// Sends a message to Telegram
		await sendTelegramMessage(output, sessionId);

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