/**
 * Zoom Endpoint
 * 
 * This Endpoint Transformer is required for connecting Cognigy.AI to Zoom Chat.
 */


// To authenticate every sent Cognigy.AI message, the Client ID and Client Secret are used
// Both values can be found in the 'App Credentials' section of the Zoom Marketplace App
// Docs: https://marketplace.zoom.us/docs/guides/build/chatbot-app#generate-app-credentials
const CLIENT_ID: string = '';
const CLIENT_SECRET: string = '';

interface IZoomAuthenticationResponse {
	access_token: string;
	token_type: 'bearer' | string,
	expires_in: number,
	scope: string;
}

interface IZoomBotNotificationPayload {
	event: 'bot_notification' | string;
	payload: {
		robotJid: string;
		toJid: string;
		userJid: string;
		cmd: string;
		accountId: string;
		userId: string;
		name: string;
		channelName: string;
		userName: string;
		timestamp: number;
	}
}

interface IZoomMessageBasis {
	robot_jid: string;
	to_jid: string;
	account_id: string;
}

interface IZoomTextMessage extends IZoomMessageBasis {
	content: {
		head: {
			text: string;
		}
	}
}

interface IZoomImageMessage extends IZoomMessageBasis {
	content: {
		body: [
			{
				type: 'attachments' | string;
				resource_url: string;
				img_url: string;
				information?: {
					title: {
						text: string;
					}
				}
			}
		]
	}
}

interface IZoomQuickReplyButton {
	text: string;
	value: string;
	style: 'Primary' | 'Default' | 'Danger' | 'Disabled';
}

interface IZoomQuickReplyMessage extends IZoomMessageBasis {
	content: {
		body: [
			{
				type: 'actions' | string;
				items: IZoomQuickReplyButton[];
			}
		]
	}
}

type TZoomMessage = IZoomTextMessage | IZoomQuickReplyMessage | IZoomImageMessage;

interface IDefaultQuickReply {
	title: string;
	payload: string;
	contentType: string;
}


/**
 * Transforms the AI channel Quick Reply buttons into valid Zoom 'suggestions'
 */
const createZoomQuickReplyButtons = (quickReplies: IDefaultQuickReply[]): IZoomQuickReplyButton[] => {

	let zoomQuickReplies: IZoomQuickReplyButton[] = [];

	for (let quickReply of quickReplies) {
		zoomQuickReplies.push({
			text: quickReply.title,
			value: quickReply.payload,
			style: 'Default'
		});
	}

	return zoomQuickReplies;
}

/**
 * Transforms the AI channel Say Node content into a valid Zoom message
 */
const transformToZoomMessage = async (output: IProcessOutputData, userId: string, sessionId: string): Promise<TZoomMessage> => {

	const sessionStorage = await getSessionStorage(userId, sessionId);
	const { payload } = sessionStorage as IZoomBotNotificationPayload;

	// Check if default text was sent
	if (output?.text && !output?.data?._cognigy?._default) {

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				head: {
					text: output.text
				}
			}
		}
	}

	// Check for text with quick replies message
	else if (output?.data?._cognigy?._default?._quickReplies !== null && output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies") {

		let text: string = output?.data?._cognigy?._default?._quickReplies?.text;
		let quickReplies: IDefaultQuickReply[] = output?.data?._cognigy?._default?._quickReplies?.quickReplies;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: [
					{
						type: "actions",
						items: createZoomQuickReplyButtons(quickReplies)
					}
				]
			}
		}
	}

	// Check for image message
	if (output?.data?._cognigy?._default?._image?.type === 'image') {

		const { imageUrl, fallbackText } = output?.data?._cognigy?._default?._image;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: [
					{
						type: 'attachments',
						resource_url: imageUrl,
						img_url: imageUrl,
						information: {
							title: {
								text: fallbackText || imageUrl
							}
						}
					}
				]
			}
		}
	}
}

createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		let userId: string = '';
		let sessionId: string = '';

		// Check if Zoom payload was sent
		if (request?.body?.payload) {

			// Extract the payload from request body
			const { payload } = request.body as IZoomBotNotificationPayload;

			// Assign user and session ID for Cognigy.AI
			userId = payload?.userId;
			sessionId = payload?.userId;

			// Store the payload into the session storage to make it available in the output transformer
			let sessionStorage = await getSessionStorage(userId, sessionId);
			sessionStorage.payload = payload;

			// Check if a normal text message was sent by the Zoom user
			if (request?.body?.event === 'bot_notification') {
				return {
					userId,
					sessionId,
					text: payload?.cmd,
					data: payload
				};

			// Check if the Zoom user clicked a 'suggestion' (Quick Reply) button
			} else if (request?.body?.event === 'interactive_message_actions') {
				return {
					userId,
					sessionId,
					text: request?.body?.payload?.actionItem?.value,
					data: payload
				};

			// Else continue with the Cognigy.AI Flow
			} else {
				return;
			}
		}
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		const zoomMessage: TZoomMessage = await transformToZoomMessage(output, userId, sessionId);

		try {

			// @ts-ignore
			const basicAuthToken: string = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

			// Authorize the message to be sent
			let authResponse: IZoomAuthenticationResponse = await httpRequest({
				uri: `https://zoom.us/oauth/token?grant_type=client_credentials`,
				method: 'POST',
				headers: {
					'Authorization': `Basic ${basicAuthToken}`
				},
				json: true
			});

			// Send Cognigy.AI message to Zoom
			await httpRequest({
				uri: `https://api.zoom.us/v2/im/chat/messages`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authResponse?.access_token}`
				},
				body: zoomMessage,
				json: true
			});

		} catch (error) {
			// Log error message
			console.error(`[Zoom] An error occured in Output Transformer: ${error?.message}`);
		}

		return null;
	},
	handleExecutionFinished: async ({ sessionId, userId, endpoint }) => {

	},
	handleInject: async ({ request, response, endpoint }) => {
		const userId = "";
		const sessionId = "";
		const text = "";
		const data = {}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleNotify: async ({ request, response, endpoint }) => {

		const userId = "";
		const sessionId = "";
		const text = "";
		const data = {}

		return {
			userId,
			sessionId,
			text,
			data
		};
	}
})