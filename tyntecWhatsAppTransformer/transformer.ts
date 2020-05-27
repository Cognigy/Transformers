/**
 * README
 * 
 * Location Message:
 * This message shows a WhatsApp location with the given configuration. In order to use this, your SAY node has be configured as following:
 *  Text: <no text>
 *  Data: {
		"location": {
			"longitude": -122.747986,
			"latitude": 37.989981,
			"name": "Name of the location",
			"address": "Shoreline Highway, CA 1, California"
		}
	}
 */


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

interface IWebchatQuickReply {
	title: string;
	payload: string;
}

const createWhatsAppQuickReplies = (text: string, quickReplies: IWebchatQuickReply[]): (IWhatsAppTemplateButtonComponent | IWhatsAppTemplateBodyComponent)[] => {

	let whatsAppQuickReplies: (IWhatsAppTemplateButtonComponent | IWhatsAppTemplateBodyComponent)[] = [];

	// insert the quick reply header text  
	whatsAppQuickReplies.push(
		{
			type: 'body',
			parameters: [
				{
					text: text,
					type: 'text'
				}
			]
		},
	)

	for (let i = 0; i < 3; i++) {
		try {
			whatsAppQuickReplies.push(
				{
					index: i,
					type: 'button',
					subType: 'quick_reply',
					parameters: [
						{
							type: 'payload',
							payload: quickReplies[i].payload
						}
					]
				}
			)
		} catch (error) {
			// there is no second or third quick reply
		}
	}

	return whatsAppQuickReplies;
}

const convertWebchatContentToWhatsApp = (processedOutput, userId: string): TWhatsAppContent => {
	// check if default text was sent
	if (processedOutput.text != '' && !processedOutput.data._cognigy) {

		// send default text
		return {
			from: userId,
			contentType: "text",
			text: processedOutput.text
		}
	}

	// check for location message
	else if (processedOutput.data.location) {

		const { longitude, latitude, name, address } = processedOutput.data.location;

		return {
			from: userId,
			contentType: "location",
			location: {
				longitude,
				latitude,
				name,
				address
			},
		}
	}

	// check if webchat templates are defined
	else if (processedOutput.data && processedOutput.data._cognigy._webchat) {
		let webchatContent = processedOutput.data._cognigy._webchat;

		// look for media attachments
		if (webchatContent.message.attachment != null) {

			switch (webchatContent.message.attachment.type) {
				case 'image':
					return {
						from: userId,
						contentType: "media",
						media: {
							type: "image",
							url: webchatContent.message.attachment.payload.url,
							caption: processedOutput.text
						}

					}
				case 'audio':
					return {
						from: userId,
						contentType: "media",
						media: {
							type: "audio",
							url: webchatContent.message.attachment.payload.url,
							caption: processedOutput.text
						}
					}
				case 'video':
					return {
						from: userId,
						contentType: "media",
						media: {
							type: "video",
							url: webchatContent.message.attachment.payload.url,
							caption: processedOutput.text
						}
					}
			}
		}

		// look for quick replies
		else if (webchatContent.message.quick_replies != null) {
			let text: string = webchatContent.message.text;
			let quickReplies: IWebchatQuickReply[] = webchatContent.message.quick_replies;

			// IMPORTANT: Only three quick reply buttons can be displayed in WhatsApp
			return {
				from: userId,
				contentType: 'template',
				template: {
					language: {
						code: 'en',
						policy: 'deterministic',
					},
					templateId: processedOutput.data.whatsapp || '',
					components: createWhatsAppQuickReplies(text, quickReplies)
				}
			}
		}
	}
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
		const userId = request.body.to;
		const sessionId = request.body.from;
		const text = request.body.content.text;
		const data = request.body;

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

		let whatsapp: TWhatsAppContent = convertWebchatContentToWhatsApp(processedOutput, userId);

		return await httpRequest({
			uri: "https://api.tyntec.com/chat-api/v2/messages",
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'apikey': ''
			},
			body: {
				"to": sessionId,
				"channels": [
					"whatsapp"
				],
				"whatsapp": whatsapp
			},
			json: true
		});
	}
});