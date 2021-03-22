const BASIC_AUTH: string = ""; // BASIC AUTH Token
const FROM_NUMBER: string = "";

/**
 * Vonage WhatsApp interfaces
 */

interface IWhatsAppImageMessage {
	type: 'image';
	image: {
		url: string;
		caption: string;
	}
}

interface IWhatsAppVideoMessage {
	type: 'video';
	video: {
		url: string;
		caption: string;
	}
}

interface IWhatsAppAudioMessage {
	type: 'audio';
	audio: {
		url: string;
		caption: string;
	}
}

interface IWhatsAppTextMessage {
	type: 'text';
	text: string;
}

interface IWhatsAppLocationMessage {
	type: "custom",
	custom: {
		type: 'location',
		location: IWhatsAppLocation
	}
}

interface IWhatsAppLocation {
	longitude: number;
	latitude: number;
	name: string;
	address: string;
}

interface IWhatsAppTemplateMessage {
	type: 'template';
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

type TWhatsAppContent = IWhatsAppTextMessage | IWhatsAppAudioMessage | IWhatsAppVideoMessage | IWhatsAppImageMessage | IWhatsAppTemplateMessage | IWhatsAppLocationMessage;


const convertWebchatContentToWhatsApp = (output: any): TWhatsAppContent => {

	// check if default text was sent
	if (output.text && !output.data?._cognigy?._default) {

		// send default text
		return {
			type: "text",
			text: output.text
		};
	}

	// check for location message
	else if (output.data.location) {

		const { longitude, latitude, name, address } = output.data.location;

		return {
			type: "custom",
			custom: {
				type: "location",
				location: {
					longitude,
					latitude,
					name,
					address
				}
			}

		};
	}

	// check if default templates are defined
	else if (output.data?._cognigy?._default) {

		let defaultContent = output.data._cognigy._default;

		// check for image
		if (defaultContent._image?.type === "image") {
			return {
				type: "image",
				image: {
					url: defaultContent._image.imageUrl,
					caption: defaultContent._image.fallbackText || ""
				}
			}
		}
		// check for audio
		else if (defaultContent._audio?.type === "audio") {
			return {
				type: "audio",
				audio: {
					url: defaultContent._audio.audioUrl,
					caption: defaultContent._audio.fallbackText || ""
				}
			}
		}
		// check for video
		else if (defaultContent._video?.type === "video") {
			return {
				type: "video",
				video: {
					url: defaultContent._video.videoUrl,
					caption: defaultContent._video.fallbackText || ""
				}
			}
		};
	}

	return;
}


createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		const userId = request?.body?.from?.number;
		const sessionId = request?.body?.from?.number;
		const text = request?.body?.message?.content?.text;
		const data = {}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleOutput: async ({ output, endpoint, userId, sessionId }) => {

		// conert Cognigy.AI message to Vonage WhatsApp content
		const whatsappContent: TWhatsAppContent = convertWebchatContentToWhatsApp(output);

		console.log(JSON.stringify(whatsappContent))

		await httpRequest({
			method: "POST",
			uri: "https://messages-sandbox.nexmo.com/v0.1/messages",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Basic ${BASIC_AUTH}`,
				"Accept": "application/json"
			},
			body: {
				"from": { 
					"type": "whatsapp",
					"number": FROM_NUMBER
				},
				"to": {
					"type": "whatsapp",
					"number": userId
				},
				"message": {
					"content": whatsappContent
				}
			},
			json: true
		})
		return output;
	}
})