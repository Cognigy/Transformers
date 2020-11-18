createWebhookTransformer({
	
	/**
	 * Converts the contents of the Webchat tab
	 * in a Say Node to the corresponding Smooch
	 * template.
	 */
	handleOutput: async ({ output, processedOutput }) => {
		const { data = {} } = output;
		const { _cognigy = {} } = data;
		const { _webchat: webchatData } = _cognigy as { _webchat: WebchatData };

		/**
		 * If there is no webchat
		 * data to convert,
		 * return the already
		 * procesed output
		 */
		if (!webchatData) {
			return processedOutput;
		}

		const { payload } = webchatData.message.attachment;

		let transformedData: SmoochRequestData;

		/**
		 * Conver the Webchat data to the correct
		 * Smooch template based on the found
		 * Webchat template 
		 */
		switch (payload.template_type) {
			case "button": {
				const { buttons, text } = payload;

				transformedData = {
					type: "text",
					text,
					actions: buttons.map(formatButtonToSmoochAction)
				};

				break;
			}

			case "generic": {
				const { elements } = payload;

				transformedData = {
					type: "carousel",
					items: elements.map(element => ({
							title: element.title,
							description: element.subtitle,
							mediaUrl: element.image_url,
							actions: element.buttons.map(formatButtonToSmoochAction)
					}))
				};

				break;
			}

			case "list": {
				const { elements, buttons } = payload;

				transformedData = {
					type: "list",
					items: elements.map(element => ({
							title: element.title,
							description: element.subtitle,
							mediaUrl: element.image_url,
							actions: element.buttons.map(formatButtonToSmoochAction)
					})),
					actions: buttons.map(formatButtonToSmoochAction)
				};

				break;
			}

			default: {
				if ((payload as WebchatMediaTemplate).url) {
					const { url } = payload as WebchatMediaTemplate;

					transformedData = {
						type: "image",
						mediaUrl: url
					};
				} else {
					console.error("Unknown template type. Returning standard output");
					return processedOutput;
				}
			}
		}

		const requestPayload: SmoochRequestPayload = {
			role: "appMaker",
			...transformedData
		}

		return requestPayload;
	}
});

function formatButtonToSmoochAction(button: WebchatButton): SmoochAction {
	if (button.type === "web_url") {
		return {
			type: "link",
			uri: button.url,
			text: button.title
		};
	} else if (button.type === "postback") {
		return {
			type: "postback",
			payload: button.payload,
			text: button.title
		};
	}
}

interface SmoochRequestPayload extends SmoochRequestData {
	role: "appMaker";
}

interface SmoochRequestData {
	type: "text" | "carousel" | "list" | "image";
	text?: string;
	actions?: SmoochAction[];
	items?: {
		title: string;
		description: string;
		mediaUrl?: string;
		actions?: SmoochAction[];
	}[];
	mediaUrl?: string;
}

interface SmoochAction {
	text: string;
	type: "link" | "reply" | "postback" | "locationRequest" | "buy" | "webview";
	uri?: string;
	payload?: string;
}

interface WebchatData {
	message: {
		attachment: {
			type?: "template";
			payload?: WebchatButtonTemplate | WebchatGalleryTemplate | WebchatListTemplate;
		}
	}
}

interface WebchatButtonTemplate {
	template_type: "button";
	text: string;
	buttons: WebchatButton[];
}

interface WebchatButton {
	type: "web_url" | "postback";
	title: string;
	url?: string;
	payload?: string;
}

interface WebchatGalleryTemplate {
	template_type: "generic";
	elements: {
		title: string;
		image_url?: string;
		subtitle?: string;
		default_action?: {
			type: "web_url";
			url: string;
		};
		buttons: WebchatButton[];
	}[];
}

interface WebchatListTemplate {
	template_type: "list";
	elements: {
		title: string;
		subtitle?: string;
		buttons: WebchatButton[];
		image_url: string;
	}[];
	buttons?: WebchatButton[];
}

interface WebchatMediaTemplate {
	meda_type: "image";
	url: string;
}