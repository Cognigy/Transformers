/**
 * Configuration
 * 
 * Quick Replies:
 * If you want to use quick replies inside WhatsApp, please provide the template Id in the data object of the SAY Node as the following:
 * {
 *   "whatsapp": {
 *	 "templateId": "12312"
 *   }
 * }
*/

// const TYNTEC_API_KEY = "PYvD7k3JEzaD6rZwvky7zaLXSt5AluUy"; // Tyntec API Key

const TYNTEC_API_KEY = ""; // Tyntec API Key

//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 1800;

const HIDE_USER_ID = true
const HIDE_SESSION_ID = true
//method used for hiding
const HASH_ALGORITHM = "sha256"

/**
 * Tyntec WhatsApp interfaces
 */
interface IWhatsAppMessageBase {
	from: string;
}
interface IWhatsAppMediaMessage extends IWhatsAppMessageBase {
	contentType: 'media';
	media: {
		type: 'image' | 'audio' | 'video';
		url: string;
		caption: string;
	}
}

interface IWhatsAppTextMessage extends IWhatsAppMessageBase {
	contentType: 'text';
	text: string;
}

interface IWhatsAppLocationMessage extends IWhatsAppMessageBase {
	contentType: 'location',
	location: IWhatsAppLocation
}

interface IWhatsAppLocation {
	longitude: number;
	latitude: number;
	name: string;
	address: string;
}

interface IWhatsAppQuickReplyMessage extends IWhatsAppMessageBase {
	contentType: 'interactive';
	interactive: {
		subType: 'buttons';
		components: {
			body: {
				type: 'text';
				text: string;
			},
			buttons: IWhatsAppQuickReply[];
		}
	}
}

interface IWhatsAppQuickReply {
	type: 'reply';
	reply: {
		payload: string;
		title: string;
	}
}

interface IWhatsAppTemplateMessage extends IWhatsAppMessageBase {
	contentType: 'template';
	template: {
		templateId: string;
		language: {
			policy: string;
			code: 'en' | 'de';
		};
		components: TWhatsAppTemplateComponent[];
	};
}

interface IWhatsAppListSection {
	title: string;
	rows: IWhatsAppListSectionRow[]
}

interface IWhatsAppListSectionRow {
	payload: string;
	title: string;
	description: string;
}

type TWhatsAppTemplateComponent = IWhatsAppTemplateHeaderComponent | IWhatsAppTemplateBodyComponent | IWhatsAppTemplateButtonComponent;

interface IWhatsAppTemplateHeaderComponent {
	type: 'header';
	parameters: (IWhatsAppTemplateComponentTextParameter)[];
}

interface IWhatsAppTemplateBodyComponent {
	type: 'body';
	parameters: (IWhatsAppTemplateComponentTextParameter)[];
}

interface IWhatsAppTemplateButtonComponent {
	type: 'button';
	subType: 'quick_reply';
	index: number;
	parameters: IWhatsAppTemplateButtonComponentParameter[];
}

interface IWhatsAppTemplateButtonComponentParameter {
	type: 'payload';
	payload: string;
}

interface IWhatsAppTemplateComponentTextParameter {
	type: 'text';
	text: string;
}

type TWhatsAppContent = IWhatsAppTextMessage | IWhatsAppMediaMessage | IWhatsAppTemplateMessage | IWhatsAppLocationMessage | IWhatsAppQuickReplyMessage | any;

/**
 * Webchat Interface
 */

interface IDefaultQuickReply {
	title: string;
	payload: string;
	contentType: string;
}

interface ISessionStorageQuickReply {
	index: number;
	quickReply: IDefaultQuickReply;
}

const createWhatsAppQuickReplies = (quickReplies: IDefaultQuickReply[]): IWhatsAppQuickReply[] => {

	let whatsAppQuickReplies: IWhatsAppQuickReply[] = [];

	for (let quickReply of quickReplies) {
		whatsAppQuickReplies.push({
			type: "reply",
			reply: {
				payload: quickReply.payload,
				title: quickReply.title
			}
		});
	}

	return whatsAppQuickReplies.slice(0,3);
}


const convertWebchatContentToWhatsApp = (output, sessionId: string, sessionStorage: any): TWhatsAppContent[] => {

	// create list for whatsapp content
	let whatsAppContents: TWhatsAppContent[] = [];

	// check if default text was sent
	if (output.text && !output.data?._cognigy?._default) {

		// send default text
		whatsAppContents.push({
			from: sessionId,
			contentType: "text",
			text: output.text
		});
	}

	// check for location message
	else if (output.data.location) {

		const { longitude, latitude, name, address } = output.data.location;

		whatsAppContents.push({
			from: sessionId,
			contentType: "location",
			location: {
				longitude,
				latitude,
				name,
				address
			},
		});
	}

	// check if default templates are defined
	else if (output.data?._cognigy?._default) {

		let defaultContent = output.data._cognigy._default;

		// look for gallery
		if (defaultContent._gallery?.items) {
			// look for galleries
			const galleryElements = defaultContent._gallery.items;

			// create gallery message as message bubble
			for (let element of galleryElements) {

				// check if image is provided
				if (element.imageUrl === "" || element.imageUrl === null || element.imageUrl === undefined) {
					throw new Error('[WhatsApp] Gallery item is missing image url');
				}

				whatsAppContents.push({
					from: sessionId,
					contentType: "media",
					media: {
						type: "image",
						url: element.imageUrl,
						caption: `*${element.title}*\n\n${element.subtitle}`
					}
				});

				// check for buttons and show them as quick replies
				if (element.buttons?.length) {
					const galleryItemQuickReplies = element.buttons;

					whatsAppContents.push({
						from: sessionId,
						contentType: "interactive",
						interactive: {
							subType: "buttons",
							components: {
								body: {
									type: "text",
									text: "Please select:"
								},
								buttons: createWhatsAppQuickReplies(galleryItemQuickReplies)
							}
						}
					});
				}
			}
		}

		// look for quick replies
		else if (defaultContent._quickReplies !== null && defaultContent._quickReplies?.type === "quick_replies") {
			let text: string = defaultContent._quickReplies.text;
			let quickReplies: IDefaultQuickReply[] = defaultContent._quickReplies.quickReplies;

			whatsAppContents.push({
				from: sessionId,
				contentType: "interactive",
				interactive: {
					subType: "buttons",
					components: {
						body: {
							type: "text",
							text
						},
						buttons: createWhatsAppQuickReplies(quickReplies)
					}
				}
			});
		}

		// check for image
		else if (defaultContent._image?.type === "image") {
			whatsAppContents.push({
				from: sessionId,
				contentType: "media",
				media: {
					type: "image",
					url: defaultContent._image.imageUrl,
					caption: defaultContent._image.fallbackText || ""
				}
			});
		}

		// check for audio
		else if (defaultContent._audio?.type === "audio") {
			whatsAppContents.push({
				from: sessionId,
				contentType: "media",
				media: {
					type: "audio",
					url: defaultContent._audio.audioUrl,
					caption: defaultContent._audio.fallbackText || ""
				}
			});
		}

		// check for video
		else if (defaultContent._video?.type === "video") {
			whatsAppContents.push({
				from: sessionId,
				contentType: "media",
				media: {
					type: "video",
					url: defaultContent._video.videoUrl,
					caption: defaultContent._video.fallbackText || ""
				}
			});
		}
	}

	// return the list of whatsapp messages
	return whatsAppContents;
}

createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		// handle accepted Tyntec WhatsApp messages
		if (request.body.status) {
			response.sendStatus(200);
			return;
		}

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

		//timestamp in unix seconds
		const currentTime = moment(new Date()).unix()
		const clearUserId = request.body.from
		const clearSessionId = request.body.to
		const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

		if (rawSessionStorage.timestamp) {
			const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
			//check for timeout if timeout is more than 0
			if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
				rawSessionStorage.timestamp = currentTime
			}
		} else {
			rawSessionStorage.timestamp = currentTime
		}
		//fill with clear values
		let userId = clearUserId
		let sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])
		//hash and obscure if hiding is true
		if (HIDE_USER_ID) {
			userId = crypto.createHash(HASH_ALGORITHM).update(userId).digest("hex")
		}
		if (HIDE_SESSION_ID) {
			sessionId = crypto.createHash(HASH_ALGORITHM).update(sessionId).digest("hex")
		}
		//create output transformer translation storage
		const processedSessionStorage = await getSessionStorage(userId, sessionId);
		processedSessionStorage.clearUserId = clearUserId
		processedSessionStorage.clearSessionId = clearSessionId

		let text: string;
		const data = request.body;

		// Check if quick reply button was clicked
		if (request?.body?.postback?.data) {
			text = request.body.postback.data;
		} else {
			text = request.body.content.text;
		}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
		//create output transformer translation storage
		const processedSessionStorage = await getSessionStorage(userId, sessionId);
		const clearUserId = processedSessionStorage.clearUserId
		const clearSessionId = processedSessionStorage.clearSessionId
		//if you need to access the original rawSessionStorage you now can
		const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

		// Delete Quick Replies for the next time
		delete processedSessionStorage.quickReplies;
		delete processedSessionStorage.quickReplyCurrentNumber;

		let whatsapp: TWhatsAppContent[] = convertWebchatContentToWhatsApp(output, clearSessionId, processedSessionStorage);
		if (!whatsapp.length) {
			console.error("Missing WhatsApp compatible channel output!");
			return
		}

		// Decide whether to use the bulks or messages API. If there is only one message, use the messages API.
		if (whatsapp.length === 1) {
			await httpRequest({
				uri: "https://api.tyntec.com/chat-api/v2/messages",
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					//'Accept':'application/json',
					'apikey': TYNTEC_API_KEY
				},
				body: {
					"to": clearUserId,
					"channels": [
						"whatsapp"
					],
					"whatsapp": whatsapp[0]
				},
				json: true
			});
		} else {
			await httpRequest({
				uri: "https://api.tyntec.com/chat-api/v2/bulks",
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					//'Accept':'application/json',
					'apikey': TYNTEC_API_KEY
				},
				body: {
					"from": clearSessionId,
					"to": clearUserId,
					"channel": "whatsapp",
					"whatsapp": whatsapp
				},
				json: true
			});
		}
		return null;
	},
	handleExecutionFinished: async ({ sessionId, userId, endpoint }) => {
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
		const userId = undefined;
		const sessionId = undefined;
		const text = undefined;
		const data = {
			timeout: true
		}

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