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

// Session timeout in seconds, new session gets generated afterwards
// Disable by setting to 0
const SESSION_TIMEOUT = 1800;

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

interface IZoomImage {
	type: 'attachments';
	resource_url: string;
	img_url: string;
	information?: {
		title: {
			text: string;
		}
	}
}

interface IZoomImageMessage extends IZoomMessageBasis {
	content: {
		body: IZoomImage[];
	}
}

interface IZoomQuickReplyButton {
	text: string;
	value: string;
	style: 'Primary' | 'Default' | 'Danger' | 'Disabled';
}

interface IZoomQuickReplyBody {
	type: 'actions';
	items: IZoomQuickReplyButton[];
}

interface IZoomQuickReplyMessage extends IZoomMessageBasis {
	content: {
		head: {
			text: string;
		}
		body: IZoomQuickReplyBody[]
	}
}

interface IZoomLinkButtonBody {
	type: 'message';
	text: string;
	link: string;
}

interface IZoomLinkButtonMessage extends IZoomMessageBasis {
	content: {
		head?: {
			text: string;
		}
		body: IZoomLinkButtonBody[];
	}
}

interface IZoomTextBody {
	type: 'message';
	text: string;
}

interface IZoomSection {
	type: 'section';
	sidebar_color: string;
	sections: (IZoomTextBody | IZoomQuickReplyBody)[];
	footer?: string;
	footer_icon?: string;
	ts?: number;
}

interface IZoomSectionMessage extends IZoomMessageBasis {
	content: IZoomSection;
}

type TZoomMessage = IZoomTextMessage | IZoomQuickReplyMessage | IZoomImageMessage | IZoomLinkButtonMessage | IZoomSectionMessage;

interface IDefaultQuickReply {
	title: string;
	payload: string;
	contentType: string;
}

interface IDefaultButton {
	title: string;
	type: 'web_url' | string;
	url?: string;
	target?: '_blank' | '_self';
	payload?: string;
}

interface IDefaultListItem {
	title: string;
	subtitle: string;
	imageUrl: string;
	defaultActionUrl: string;
	buttons: IDefaultButton[]
}

interface IDefaultGalleryItem {
	title: string;
	subtitle: string;
	imageUrl: string;
	buttons: IDefaultButton[];
	id: string;
}

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

const createZoomLinkButtons = (buttons: IDefaultButton[]): IZoomLinkButtonBody[] => {

	let zoomLinkButtons: IZoomLinkButtonBody[] = [];

	for (let button of buttons) {
		zoomLinkButtons.push({
			type: 'message',
			text: button.title,
			link: button.url
		});
	}

	return zoomLinkButtons;
}


/**
 * Per list or gallery item, this function creates the content for the card or row. In Zoom, this is a section message consisting of sections with sections
 */
const createZoomSectionSection = (item: (IDefaultListItem | IDefaultGalleryItem)): (IZoomTextBody | IZoomQuickReplyBody | IZoomLinkButtonBody)[] => {

	const buttons: IDefaultButton[] = item?.buttons;
	let zoomSectionSections: (IZoomLinkButtonBody | IZoomQuickReplyBody | IZoomTextBody)[] = [];

	// Check if current item has no image. If true, add the item title as section section
	// as the title would be already provided as image title if the item as an image
	// Send the text as bold
	if (item?.imageUrl?.length === 0) {
		zoomSectionSections.push({
			type: 'message',
			text: `*${item?.title}*`
		});
	}

	// Check if the current item as a subtitle
	if (item?.subtitle?.length !== 0) {
		zoomSectionSections.push({
			type: 'message',
			text: item?.subtitle
		});
	}

	if (buttons?.length !== 0) {
		for (let button of buttons) {
			if (button?.type === 'web_url') {
				zoomSectionSections.push({
					type: 'message',
					text: button?.title,
					link: button?.url
				});
			} else if (button?.type === 'postback') {
				zoomSectionSections.push({
					type: 'actions',
					items: [
						{
							text: button?.title,
							value: button?.payload,
							style: 'Default'
						}
					]
				});
			}
		}

		return zoomSectionSections
	}

	return [
		{
			type: 'message',
			text: item?.title,
		}
	];
}

/**
 * Per list or gallery item, this function adds an image at the top and then calls the createZoomSectionSection() function for the content of the actual card or list row
 */
const createZoomSections = (items: (IDefaultListItem[] | IDefaultGalleryItem[])): (IZoomSection | IZoomImage)[] => {

	let zoomSections: (IZoomSection | IZoomImage)[] = [];

	for (let item of items) {

		// Check if current item has image
		if (item?.imageUrl?.length !== 0) {

			zoomSections.push({
				type: "attachments",
				resource_url: item?.imageUrl,
				img_url: item?.imageUrl,
				information: {
					title: {
						text: item?.title
					}
				}
			});
		}

		zoomSections.push({
			type: 'section',
			sidebar_color: '#ffffff',
			sections: createZoomSectionSection(item)
		});
	};

	return zoomSections;
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
		} as IZoomTextMessage
	}

	// Check for text with quick replies message
	else if (output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies") {

		let text: string = output?.data?._cognigy?._default?._quickReplies?.text;
		let quickReplies: IDefaultQuickReply[] = output?.data?._cognigy?._default?._quickReplies?.quickReplies;

		let content: any = {};
		if (text?.length !== 0) {
			content = {
				head: {
					text
				},
				body: [
					{
						type: "actions",
						items: createZoomQuickReplyButtons(quickReplies)
					}
				]
			}
		} else {
			content = {
				body: [
					{
						type: "actions",
						items: createZoomQuickReplyButtons(quickReplies)
					}
				]
			}
		}

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content
		} as IZoomQuickReplyMessage
	}

	// Check for text with buttons message
	else if (output?.data?._cognigy?._default?._buttons?.type === "buttons") {

		let text: string = output?.data?._cognigy?._default?._buttons?.text;
		let buttons: IDefaultButton[] = output?.data?._cognigy?._default?._buttons?.buttons;

		let content: any = {};
		if (text?.length !== 0) {
			content = {
				head: {
					text
				},
				body: createZoomLinkButtons(buttons)
			}
		} else {
			content = {
				body: createZoomLinkButtons(buttons)
			}
		}

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content
		} as IZoomLinkButtonMessage
	}

	// Check for gallery message
	else if (output?.data?._cognigy?._default?._gallery?.type === 'carousel') {

		const galleryItems: IDefaultGalleryItem[] = output?.data?._cognigy?._default?._gallery?.items;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: createZoomSections(galleryItems)
			}
		} as unknown as IZoomSectionMessage
	}

	// Check for list message
	else if (output?.data?._cognigy?._default?._list !== null && output?.data?._cognigy?._default?._list?.type === "list") {

		let listItems: IDefaultListItem[] = output?.data?._cognigy?._default?._list?.items;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: createZoomSections(listItems)
			}
		} as unknown as IZoomSectionMessage
	}

	// Check for image message
	else if (output?.data?._cognigy?._default?._image?.type === 'image') {

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

	// Check for video message
	else if (output?.data?._cognigy?._default?._video?.type === 'video') {

		const { videoUrl } = output?.data?._cognigy?._default?._video;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: [
					{
						type: 'message',
						text: videoUrl,
						link: videoUrl,
					}
				]
			}
		}
	}

	// Check for audio message
	else if (output?.data?._cognigy?._default?._audio?.type === 'audio') {

		const { audioUrl } = output?.data?._cognigy?._default?._audio;

		return {
			robot_jid: payload?.robotJid,
			to_jid: payload?.toJid,
			account_id: payload?.accountId,
			content: {
				body: [
					{
						type: 'message',
						text: audioUrl,
						link: audioUrl,
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

			// Store the payload into the session storage to make it available in the output transformer
			let sessionStorage = await getSessionStorage(userId, sessionId);
			sessionStorage.payload = payload;

			// Session Management
			const currentTime = moment(new Date()).unix();
			if (sessionStorage.timestamp) {
				const difference = moment(currentTime).diff(moment(sessionStorage.timestamp));
				//check for timeout if timeout is more than 0
				if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
					sessionStorage.timestamp = currentTime;
				}
			} else {
				sessionStorage.timestamp = currentTime;
			}
			// Assign user and session ID for Cognigy.AI
			userId = payload?.userId;
			sessionId = JSON.stringify([payload?.userId, sessionStorage.timestamp]);


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