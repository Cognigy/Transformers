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

const TYNTEC_API_KEY = ""; // Tyntec API Key

//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 1800

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

type TWhatsAppContent = IWhatsAppTextMessage | IWhatsAppMediaMessage | IWhatsAppTemplateMessage | IWhatsAppLocationMessage;

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

const createWhatsAppQuickReplies = (quickReplies: IDefaultQuickReply[], sessionStorage: any): string => {

	// get previous quick replies from session storage 
	let sessionquickReplyCurrentNumber: number = sessionStorage.quickReplyCurrentNumber || 0;
	let sessionQuickReplies: ISessionStorageQuickReply[] = sessionStorage.quickReplies || [];

	// initialize empty text message bubble
	let whatsAppQuickReplyMessage: string = "";

	for (let quickReply of quickReplies) {
		// store the index to the session storage for further quick replies
		sessionquickReplyCurrentNumber += 1;
		sessionQuickReplies.push({
			index: sessionquickReplyCurrentNumber,
			quickReply
		})
		// add the quick reply to the text message bubble
		// Example: 1. first quick reply
		whatsAppQuickReplyMessage += `\n${sessionquickReplyCurrentNumber}. ${quickReply.title}`;

	}

	sessionStorage.quickReplyCurrentNumber = sessionquickReplyCurrentNumber;
	sessionStorage.quickReplies = sessionQuickReplies;

	return whatsAppQuickReplyMessage;
}

const convertWebchatContentToWhatsApp = (processedOutput, sessionId: string, sessionStorage: any): TWhatsAppContent[] => {

	// create list for whatsapp content
	let whatsAppContents: TWhatsAppContent[] = [];

	// Loop through all provided Cogngiy bot messages
	if (processedOutput.outputStack) {
		for (let stackItem of processedOutput.outputStack) {

			// check if default text was sent
			if (stackItem.text && !stackItem.data?._cognigy?._default) {

				// send default text
				whatsAppContents.push({
					from: sessionId,
					contentType: "text",
					text: stackItem.text
				});
			}

			// check for location message
			else if (stackItem.data.location) {

				const { longitude, latitude, name, address } = stackItem.data.location;

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
			else if (stackItem.data?._cognigy?._default) {

				let defaultContent = stackItem.data._cognigy._default;

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

							// create quick replies message as message bubble
							whatsAppContents.push({
								from: sessionId,
								contentType: "text",
								text: createWhatsAppQuickReplies(galleryItemQuickReplies, sessionStorage)
							});
						}
					}
				}

				// look for quick replies
				else if (defaultContent._quickReplies !== null && defaultContent._quickReplies?.type === "quick_replies") {
					let text: string = defaultContent._quickReplies.text;
					let quickReplies: IDefaultQuickReply[] = defaultContent._quickReplies.quickReplies;

					// create quick reply title message
					whatsAppContents.push({
						from: sessionId,
						contentType: "text",
						text: text
					});

					// create quick replies message as message bubble
					whatsAppContents.push({
						from: sessionId,
						contentType: "text",
						text: createWhatsAppQuickReplies(quickReplies, sessionStorage)
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
		}
	}

	// return the list of whatsapp messages
	return whatsAppContents;
}

createRestTransformer({

	/**
	 * This transformer is executed when receiving a message
	 * from the user, before executing the Flow.
	 *
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param request The Express request object with a JSON parsed body.
	 * @param response The Express response object.
	 *
	 * @returns A valid userId, sessionId, as well as text and/or data,
	 * which has been extracted from the request body.
	 */
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

		let text = request.body.content.text;
		const data = request.body;

		// check if the user chose a quick reply by inserting a number that fits a stored reply
		let sessionQuickReplies: ISessionStorageQuickReply[] = processedSessionStorage.quickReplies || [];

		// compare session quick replies with user input text and check if there is a stored quick reply that should be triggered by the current user input text
		for (let sessionQuickReply of sessionQuickReplies) {
			// the user can send the number or the title of a quick reply
			if (text.toLowerCase().includes(sessionQuickReply.index) || text.toLowerCase().includes(sessionQuickReply.quickReply.title.toLowerCase())) {
				if (sessionQuickReply.quickReply.contentType === "trigger_intent") {
					text = sessionQuickReply.quickReply.title;
				} else {
					text = sessionQuickReply.quickReply.payload;
				}
			}
		}



		return {
			userId,
			sessionId,
			text,
			data
		};
	},

	/**
	 * This transformer is executed on every output from the Flow.
	 * 
	 * @param output The raw output from the Flow. It is possible to manipulate
	 * and return every distinct output before they get formatted in the 'handleExecutionFinished'
	 * transformer.
	 *
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 * 
	 * @returns The output that will be formatted into the final response in the 'handleExecutionFinished' transformer.
	 */
	handleOutput: async ({ output, endpoint, userId, sessionId }) => {
		return output;
	},

	// TODO: Check if you can use mixed output - two different types of messages in one output.

	/**
	 * This transformer is executed when the Flow execution has finished.
	 * For REST based transformers, the final output will be sent to
	 * the user.
	 *
	 * @param processedOutput This is the final object that will be sent to the user.
	 * It is therefore structured according to the Endpoint channel of the transformer.
	 *
	 * @param outputs This is an array of all of the outputs that were output by the Flow.
	 * These will be merged to create the 'processedOutput' object.
	 * 
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param response The express response object that can be used to send a custom response back to the user.
	 *
	 * @returns An object that will be sent to the user, unchanged. It therefore has to have the
	 * correct format according to the documentation of the specific Endpoint channel.
	 */
	handleExecutionFinished: async ({ processedOutput, outputs, userId, sessionId, endpoint, response }) => {

		//create output transformer translation storage
		const processedSessionStorage = await getSessionStorage(userId, sessionId);
		const clearUserId = processedSessionStorage.clearUserId
		const clearSessionId = processedSessionStorage.clearSessionId
		//if you need to access the original rawSessionStorage you now can
		const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

		// Delete Quick Replies for the next time
		delete processedSessionStorage.quickReplies;
		delete processedSessionStorage.quickReplyCurrentNumber;

		let whatsapp: TWhatsAppContent[] = convertWebchatContentToWhatsApp(processedOutput, clearSessionId, processedSessionStorage);
		if (!whatsapp.length) {
			console.error("Missing WhatsApp compatible channel output!");
			console.log(JSON.stringify(processedOutput))
			return
		}

		// decide whether to use the bulks or messages API. If there is only one message, use the messages API.
		if (whatsapp.length === 1) {
			return await httpRequest({
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
			return await httpRequest({
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


	}
});
