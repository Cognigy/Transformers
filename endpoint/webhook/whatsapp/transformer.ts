const VERIFY_TOKEN: string = "";
const PHONE_NUMBER_ID: string = "";

interface IWhatsAppMessageBasis {
	messaging_product: 'whatsapp';
	recipient_type?: 'individual';
	to: string;
	type: 'text' | 'image' | 'audio' | 'video' | 'contacts' | 'location' | 'interactive' | 'document';
}

interface IWhatsAppTextMessage extends IWhatsAppMessageBasis {
	text: {
		preview_url: boolean;
		body: string;
	}
}

interface IWhatsAppLocationMessage extends IWhatsAppMessageBasis {
	location: {
		longitude: number;
		latitude: number;
		name: string;
		address: string
	}
}

interface IWhatsAppQuickReplyButton {
	type: 'reply';
	reply: {
		id: string;
		title: string;
	}
}

interface IWhatsAppQuickReplyMessage extends IWhatsAppMessageBasis {
	interactive: {
		type: 'button';
		body: {
			text: string;
		}
		action: {
			buttons: IWhatsAppQuickReplyButton[];
		}
	}
}

interface IWhatsAppImageMessage extends IWhatsAppMessageBasis {
	image: {
		link: string;
		caption?: string;
	}
}

interface IWhatsAppAudioMessage extends IWhatsAppMessageBasis {
	audio: {
		link: string;
	}
}

interface IWhatsAppVideoMessage extends IWhatsAppMessageBasis {
	video: {
		link: string;
	}
}

interface IWhatsAppDocumentMessage extends IWhatsAppMessageBasis {
	document: {
		link: string;
		caption: string;
		filename: string;
	}
}

interface IWhatsAppContactAddress {
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	country_code: string;
	type: 'WORK' | 'HOME';
}

interface IWhatsAppContactEmail {
	email: string;
	type: 'WORK' | 'HOME';
}

interface IWhatsAppContactName {
	formatted_name: string;
	first_name: string;
	last_name: string;
	middle_name: string;
	suffix: string;
	prefix: string;
}

interface IWhatsAppContactOrg {
	company: string;
	department: string;
	title: string;
}

interface IWhatsAppContactPhone {
	phone: string;
	type: 'WORK' | 'HOME';
	wa_id?: string;
}

interface IWhatsAppContactURL {
	url: string;
	type: 'WORK' | 'HOME'
}

interface IWhatsAppContact {
	addresses: IWhatsAppContactAddress[];
	birthday: string;
	emails: IWhatsAppContactEmail[];
	name: IWhatsAppContactName;
	org: IWhatsAppContactOrg;
	phones: IWhatsAppContactPhone[];
	urls: IWhatsAppContactURL[];
}

interface IWhatsAppContactsMessage extends IWhatsAppMessageBasis {
	contacts: IWhatsAppContact[];
}

type IWhatsAppMessage = IWhatsAppTextMessage | IWhatsAppLocationMessage | IWhatsAppQuickReplyMessage | IWhatsAppImageMessage | IWhatsAppVideoMessage | IWhatsAppAudioMessage | IWhatsAppDocumentMessage | IWhatsAppContactsMessage;

interface IDefaultQuickReply {
	title: string;
	payload: string;
	contentType: string;
}

const createWhatsAppQuickReplyButtons = (quickReplies: IDefaultQuickReply[]): IWhatsAppQuickReplyButton[] => {

	let whatsAppQuickReplies: IWhatsAppQuickReplyButton[] = [];

	for (let quickReply of quickReplies) {
		whatsAppQuickReplies.push({
			type: "reply",
			reply: {
				id: Math.random().toString(36).substr(2),
				title: quickReply.title
			}
		});
	}

	return whatsAppQuickReplies.slice(0, 3);
}

const transformToWhatsAppMessage = (output: IProcessOutputData, userId: string): IWhatsAppMessage => {

	// Check if default text was sent
	if (output?.text && !output?.data?._cognigy?._default) {
		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'text',
			text: {
				preview_url: false,
				body: output.text
			}
		}
	}

	// Check for text with quick replies message
	else if (output?.data?._cognigy?._default?._quickReplies !== null && output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies") {

		let text: string = output?.data?._cognigy?._default?._quickReplies?.text;
		let quickReplies: IDefaultQuickReply[] = output?.data?._cognigy?._default?._quickReplies?.quickReplies;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'interactive',
			interactive: {
				type: 'button',
				body: {
					text
				},
				action: {
					buttons: createWhatsAppQuickReplyButtons(quickReplies)
				}
			}
		}
	}

	// Check for image message
	if (output?.data?._cognigy?._default?._image?.type === 'image') {

		const { imageUrl, fallbackText } = output?.data?._cognigy?._default?._image;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'image',
			image: {
				link: imageUrl,
				caption: fallbackText || ""
			}
		}
	}

	// Check for video message
	if (output?.data?._cognigy?._default?._video?.type === 'video') {

		const { videoUrl } = output?.data?._cognigy?._default?._video;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'video',
			video: {
				link: videoUrl
			}
		}
	}

	// Check for audio message
	if (output?.data?._cognigy?._default?._audio?.type === 'audio') {

		const { audioUrl } = output?.data?._cognigy?._default?._audio;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'audio',
			audio: {
				link: audioUrl
			}
		}
	}


	// Check for location message
	else if (output?.data?.location) {

		const { longitude, latitude, name, address } = output.data.location;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'location',
			location: {
				longitude,
				latitude,
				name,
				address
			}
		}
	}

	// Check for contacts message
	else if (output?.data?.contacts) {

		const { contacts } = output?.data;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'contacts',
			contacts
		}
	}

	// Check for document message
	else if (output?.data?.document) {

		const { link, caption, filename } = output?.data?.document;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'document',
			document: {
				link,
				caption,
				filename
			}
		}
	}
}


createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		console.log(JSON.stringify(request.body))

		let userId = '';
		let sessionId = '';
		let text = '';
		let data = {};

		// Verify the webhook connection initially
		if (request?.query['hub.verify_token']) {

			// Parse params from the webhook verification request
			let mode = request?.query['hub.mode'];
			let token = request?.query['hub.verify_token'];
			let challenge = request?.query['hub.challenge'];

			// Check if a token and more were sent
			if (mode && token) {
				// Check the mode and token sent are correctly
				if (mode === 'subscribe' && token === VERIFY_TOKEN) {
					// Respond with 200 ok and challenge token from the request
					response.status(200).send(challenge);
				} else {
					// Responds with '403 Forbidden' if verfiy tokens do not match
					response.sendStatus(403);
				}
			}
		}

		// Check if the user sent a message
		if (request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages[0]?.text?.body) {
			userId = request?.body.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages[0]?.from;
			sessionId = request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.display_phone_number;
			text = request?.body?.entry[0].changes[0].value.whatsapp_business_api_data.messages[0].text.body;
			data = request.body?.entry[0]?.changes[0]?.value;
		}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {


		let whatsAppMessage: IWhatsAppMessage = transformToWhatsAppMessage(output, userId);

		console.log(JSON.stringify(whatsAppMessage))

		// Send Cognigy.AI message to WhatsApp
		await httpRequest({
			uri: `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				//'Accept':'application/json',
				'Authorization': 'Bearer '
			},
			body: whatsAppMessage,
			json: true
		});


		return null;
	},
	handleInject: async ({ request, response, endpoint }) => {

		/**
		 * Extract the userId, sessionId and text
		 * from the request. Example:
		 *
		 * const { userId, sessionId, text, data } = request.body;
		 * 
		 * Note that the format of the request body will be different for
		 * every Endpoint, and the example above needs to be adjusted
		 * accordingly.
		 */
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

		/**
		 * Extract the userId, sessionId and text
		 * from the request. Example:
		 *
		 * const { userId, sessionId, text, data } = request.body;
		 *
		 * Note that the format of the request body will be different for
		 * every Endpoint, and the example above needs to be adjusted
		 * accordingly.
		 */
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