interface IGoogleChatMessageMessageSender {
	name: string;
	displayName: string;
	avatarUrl?: string;
	type: "HUMAN" | string;
	domainId: string
	email?: string;
	isAnonymous?: boolean;
}

interface IGoogleChatMessageMessageThread {
	name: string;
	retentionSettings: {
		state: "PERMANENT" | string;
	}
}

interface IGoogleChatMessageMessageSpace {
	name: string;
	type: "DM" | string;
	singleUserBotDm: boolean;
	spaceThreadingState: "FLAT_MESSAGES" | string;
	spaceType: "DIRECT_MESSAGE" | string;
	spaceHistoryState: "HISTORY_ON" | string;
}

interface IGoogleChatMessageMessage {
	name: string;
	sender: IGoogleChatMessageMessageSender;
	createTime: string;
	text: string;
	thread: IGoogleChatMessageMessageThread;
	space: IGoogleChatMessageMessageSpace;
	argumentText: string;
	lastUpdateTime: string;
	retentionSettings: {
		state: "PERMANENT" | string;
	}
}

interface IGoogleChatMessage {
	type: "MESSAGE",
	eventTime: string;
	message: IGoogleChatMessageMessage;
	user: IGoogleChatMessageMessageSender;
	space: IGoogleChatMessageMessageSpace;
	configCompleteRedirectUrl: string;
}

interface ICognigyBasicMessage {
	space: IGoogleChatMessageMessageSpace;
	thread: IGoogleChatMessageMessageThread;
	name: string;
	sender?: IGoogleChatMessageMessageSender;
}

interface ICognigyDefaultQuickReply {
	id: string;
	title: string;
	imageAltText: string;
	imageUrl: string;
	contentType: "postback";
	payload: string;
}

interface ICognigyDefaultButton {
	id: string;
	title: string;
	type: "web_url",
	url: string;
	target: string;
}

interface IGoogleChatCardActionButton {
	textButton: {
		text: string;
		onClick: {
			action: {
				actionMethodName: string;
				parameters: any[]
			}
		}
	}
}

interface IGoogleChatCardUrlButton {
	textButton: {
		text: string;
		onClick: {
			openLink: {
				url: string;
			}
		}
	}
}

/**
 * Generates a random UUID
 * @return {string} `ID` Random UUID
 */
function generateGoogleChatMessageId() {
	var d = new Date().getTime();//Timestamp
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16;//random number between 0 and 16
		if (d > 0) {//Use timestamp until depleted
			r = (d + r) % 16 | 0;
			d = Math.floor(d / 16);
		}
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

/**
 * Transforms a Cognigy default quick reply into a valid Google Chat button
 * @param {array} `quickReplies` Cognigy.AI default quick replies
 */
function generateGoogleChatActionButtons(quickReplies: ICognigyDefaultQuickReply[]): IGoogleChatCardActionButton[] {

	let actionButtons: IGoogleChatCardActionButton[] = [];

	for (let quickReply of quickReplies) {
		actionButtons.push({
			textButton: {
				text: quickReply.title,
				onClick: {
					action: {
						actionMethodName: quickReply.contentType,
						parameters: [
							{
								key: quickReply.title,
								value: quickReply.payload
							}
						]
					}
				}
			}
		})
	}

	return actionButtons;
}

/**
 * Transforms a Cognigy default button into a valid Google Chat button
 * @param {array} `buttons` Cognigy.AI default buttons
 */
function generateGoogleChatUrlButtons(buttons: ICognigyDefaultButton[]): IGoogleChatCardUrlButton[] {

	let urlButtons: IGoogleChatCardUrlButton[] = [];

	for (let button of buttons) {
		urlButtons.push({
			textButton: {
				text: button.title,
				onClick: {
					openLink: {
						url: button.url
					}
				}
			}
		})
	}

	return urlButtons;
}

/**
 * Transforms a Cognigy default "Text with Quick Replies" message into a valid Google Chat Buttons Card
 * @param {array} `quickReplies` Cognigy.AI default quick replies
 * @param {string} `text` The Cognigy.AI default header text message of the quick reply message
 * @param {string} `fallbackText` The Cognigy.AI default fallback text message
 */
function generateGoogleChatQuickReplyCard(quickReplies: ICognigyDefaultQuickReply[], text: string, fallbackText: string): any {

	return {
		sections: [
			{
				widgets: [
					{
						textParagraph: {
							text
						}
					}
				]
			},
			{
				widgets: [
					{
						buttons: generateGoogleChatActionButtons(quickReplies)
					}
				]
			}
		]
	}
}

/**
 * Transforms a Cognigy default "Text with Buttons" message into a valid Google Chat Buttons Card
 * @param {array} `buttons` Cognigy.AI default buttons
 * @param {string} `text` The Cognigy.AI default header text message of the button message
 * @param {string} `fallbackText` The Cognigy.AI default fallback text message
 */
function generateGoogleChatButtonCard(buttons: ICognigyDefaultButton[], text: string, fallbackText: string): any {

	return {
		sections: [
			{
				widgets: [
					{
						textParagraph: {
							text
						}
					}
				]
			},
			{
				widgets: [
					{
						buttons: generateGoogleChatUrlButtons(buttons)
					}
				]
			}
		]
	}
}

/**
 * Transforms the Cognigy default output into a valid Google Chat message
 * @param {object} `output` The Cognigy.AI Flow output object
 * @param {string} `userId` The Cognigy.AI user ID
 * @param {string} `sessionId` The Cognigy.AI session ID
 */
async function generateGoogleChatMessage(output: IProcessOutputData, userId: string, sessionId: string): Promise<any> {

	let sessionStorage = await getSessionStorage(userId, sessionId);

	const basicMessage: ICognigyBasicMessage = {
		space: sessionStorage.space,
		thread: sessionStorage.thread,
		name: `${sessionId}/messages/${generateGoogleChatMessageId()}`
	}

	// Check for simple text
	if (output?.text) {
		return {
			...basicMessage,
			text: output?.text,
			argumentText: output?.text,
			fallbackText: output?.text,
			attachment: [],
			annotations: [],
			cards: []
		}
	}
	// Check for quick replies
	else if (output?.data?._cognigy?._default?._quickReplies) {
		const quickReplies: ICognigyDefaultQuickReply[] = output.data._cognigy._default._quickReplies.quickReplies;
		const text: string = output.data._cognigy._default._quickReplies.text;
		const fallbackText: string = output.data._cognigy._default._quickReplies.fallbackText;

		return {
			...basicMessage,
			text: fallbackText,
			argumentText: fallbackText,
			fallbackText: fallbackText,
			attachment: [],
			annotations: [],
			cards: [generateGoogleChatQuickReplyCard(quickReplies, text, fallbackText)]
		}
	}
	// Check for buttons
	else if (output?.data?._cognigy?._default?._buttons) {
		const buttons: ICognigyDefaultButton[] = output.data._cognigy._default._buttons.buttons;
		const text: string = output.data._cognigy._default._buttons.text;
		const fallbackText: string = output.data._cognigy._default._buttons.fallbackText;

		return {
			...basicMessage,
			text: fallbackText,
			argumentText: fallbackText,
			fallbackText: fallbackText,
			attachment: [],
			annotations: [],
			cards: [generateGoogleChatButtonCard(buttons, text, fallbackText)]
		}
	} else {
		return null;
	}
}

createWebhookTransformer({
	handleInput: async ({ endpoint, request, response }) => {

		let userId = undefined;
		let sessionId = undefined;
		let text = undefined;
		let data = {}

		// Check if Google Chat Message is incoming
		if (request?.body?.type === "MESSAGE") {

			const googleChatMessage: IGoogleChatMessage = request.body;

			userId = googleChatMessage.user.name;
			sessionId = googleChatMessage.space.name;
			text = googleChatMessage.message.text;
			data = googleChatMessage

			// Store general mesasge info in session storage
			let sessionStorage = await getSessionStorage(userId, sessionId);
			sessionStorage.user = googleChatMessage.user;
			sessionStorage.space = googleChatMessage.space;
			sessionStorage.thread = googleChatMessage.message.thread

			// Log event
			console.info(`[Google Chat] Received message from ${userId} in session ${sessionId}`);
		}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		let sessionStorage = await getSessionStorage(userId, sessionId);

		// Check if Service Account authentication details are configured
		if (output?.data?.auth) {
			sessionStorage.auth = output.data.auth;
		}

		// Generate Google Chat message from Cognigy Default message output
		const cognigyMessage = await generateGoogleChatMessage(output, userId, sessionId);

		if (sessionStorage?.auth?.access_token && cognigyMessage !== null) {
			try {
				const messageResponse = await httpRequest({
					uri: `https://chat.googleapis.com/v1/${sessionId}/messages`,
					method: "POST",
					headers: {
						'Content-Type': 'application/json; charset=UTF-8',
						'Accept': 'application/json',
						'Authorization': `Bearer ${sessionStorage?.auth?.access_token}`
					},
					body: cognigyMessage,
					json: true
				});

				console.info(`[Google Chat] Sent message to user with id ${userId}.`);
				console.log(`[Google Chat] Message: ${JSON.stringify(messageResponse)}`);
			} catch (error) {
				console.error(`[Google Chat] Error: ${error}`);
			}
		}

		return null;
	}
})