/**
 * WhatsApp Endpoint
 * 
 * Type: Webhook
 * Documentation: https://developers.facebook.com/docs/whatsapp/getting-started/signing-up
 */

// This token can be defined by you and is used in order verify this Webhook in the Facebook Developer portal.
// If a new Webhook is created in Facebook Developer for WhatsApp, the Endpoint URL and this VERIFY_TOKEN must be provided.
// Example: Cognigy123
const VERIFY_TOKEN: string = "";

// This is the phone number associated with the WhatsApp Business Account that can be found in the WhatsApp Manager platform
// Example: 104510793210612
const PHONE_NUMBER_ID: string = "";

// This token is used in order to authenticate the outgoing message to WhatsApp within the handleOutput() Transformer
// It can be found in the "First Steps" section of "WhatsApp" inside of the Facebook Developer portal
// Example: EAAEYl54FMww...
const BEARER_TOKEN: string = "";

interface IWhatsAppMessageBasis {
	messaging_product: 'whatsapp';
	recipient_type?: 'individual';
	to: string;
	type: 'text' | 'image' | 'audio' | 'video' | 'contacts' | 'location' | 'interactive' | 'document' | 'template';
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


interface IWhatsAppTemplateMessage extends IWhatsAppMessageBasis {
	template: {
		name: string;
		language: {
			code: string;
		}
		components: any[]
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

type IWhatsAppMessage = IWhatsAppTextMessage | IWhatsAppLocationMessage | IWhatsAppQuickReplyMessage | IWhatsAppImageMessage | IWhatsAppVideoMessage | IWhatsAppAudioMessage | IWhatsAppDocumentMessage | IWhatsAppContactsMessage | IWhatsAppTemplateMessage;

interface IWhatsAppMediaDownloadResponse {
	url: string;
	mime_type: string;
	sha256: string;
	file_size: number;
	id: string;
	messaging_product: 'whatsapp' | string;
}

interface IDefaultQuickReply {
	title: string;
	payload: string;
	contentType: string;
}

/**
 * Downloads media content based on the ID that WhatsApp responds to Cognigy.AI
 * @param {string} `mediaId` The ID of the sent media
 * @return {IWhatsAppMediaDownloadResponse} The download URL, mime_type, file_size, and id
 */
const downloadWhatsAppMediaByID = async (mediaId: string): Promise<IWhatsAppMediaDownloadResponse> => {

	try {
		// Download the media content that was sent by the user. For example, an image
		return await httpRequest({
			uri: `https://graph.facebook.com/v13.0/${mediaId}`,
			method: "GET",
			headers: {
				'Accept': 'application/json',
				// The Authorization 
				'Authorization': `Bearer ${BEARER_TOKEN}`
			},
			json: true
		});
	} catch (error) {
		return null;
	}
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

	// Check for gallery message
	if (output?.data?._cognigy?._default?._gallery?.items) {

		const galleryElements = output?.data?._cognigy?._default?._gallery?.items;

		// create gallery message as message bubble
		for (let element of galleryElements) {

			// check if image is provided
			if (element?.imageUrl === "" || element?.imageUrl === null || element?.imageUrl === undefined) {
				throw new Error('[WhatsApp] Gallery item is missing image url');
			}

			/**
			 * TODO:
			 * - Only the first gallery element is sent to the user. Bulk messages must be possible.
			 * - Buttons of gallery element must quick replies or URL buttons
			 */
			return {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: userId,
				type: 'image',
				image: {
					link: element?.imageUrl,
					caption: `*${element?.title}*\n\n${element?.subtitle}`
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

	// Check for template message
	else if (output?.data?.template) {

		const { template } = output?.data;

		return {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: userId,
			type: 'template',
			template
		}
	}
}


createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		try {

			// Initialize Cognigy.AI input values
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

			// Check if the user sent a message || request.body includes `whatsapp_business_api_data` object
			else if (request?.body?.entry?.[0].changes?.[0].value) {
				let valuePath = null;
				let messagePath = null;

				// find the base path based on the api type (cloud vs onprem)
				if (request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages) {
					valuePath = request.body?.entry[0].changes[0].value.whatsapp_business_api_data;
				} else if (request?.body?.entry?.[0].changes?.[0].value?.messages) {
					valuePath = request.body.entry[0].changes[0].value;
				} else {
					return null;
				}

				// Check if an image with caption was sent
				if (request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages[0]?.image?.caption) {
					text = request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages[0]?.image?.caption;

					// Extract the media id
					const mediaId: string = request?.body?.entry[0]?.changes[0]?.value?.whatsapp_business_api_data?.messages[0]?.image?.id;

					// Download the media content JSON and set it as data input
					const mediaDownloadResponse: IWhatsAppMediaDownloadResponse = await downloadWhatsAppMediaByID(mediaId);

					data = {
						...data,
						media: mediaDownloadResponse
					}

				}

				userId = messagePath.from;
				sessionId = valuePath.metadata?.display_phone_number;
				data = valuePath;

				if (messagePath.text) {
					text = messagePath.text?.body;
				}

				// extract image caption as input text
				else if (messagePath.image) {
					text = messagePath.image?.caption;
				}

				// Check if an image was sent
				if (request?.body?.entry[0]?.changes[0]?.value?.messages[0]?.image) {

					// Check if the image includes a caption. If not, sent empty text
					text = request?.body?.entry[0]?.changes[0]?.value?.messages[0]?.image?.caption || '';

					// Extract the media id
					const mediaId: string = request?.body?.entry[0]?.changes[0]?.value?.messages[0]?.image?.id;

					// Download the media content JSON and set it as data input
					const mediaDownloadResponse: IWhatsAppMediaDownloadResponse = await downloadWhatsAppMediaByID(mediaId);

					data = {
						...data,
						media: mediaDownloadResponse
					}
				}

				// Return the user message in order to execute the Flow
				return {
					userId,
					sessionId,
					text,
					data
				};
			} else {
				return null;
			}

		} catch (error) {
			// Log the error message
			console.error(`[WhatsApp] An error occured in Input Transformer: ${error?.message}`);

			// Stop the execution
			return null;
		}
	},

	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		try {

			// Transform the Cognigy.AI output into a valid WhatsApp message object
			let whatsAppMessage: IWhatsAppMessage = transformToWhatsAppMessage(output, userId);

			// Send Cognigy.AI message to WhatsApp
			await httpRequest({
				uri: `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					// The Authorization 
					'Authorization': `Bearer ${BEARER_TOKEN}`
				},
				body: whatsAppMessage,
				json: true
			});

		} catch (error) {
			// Log error message
			console.error(`[WhatsApp] An error occured in Output Transformer: ${error?.message}`);
		}

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
