/**
* Google Configuration
*/

// Google Service Account Client Email
const CLIENT_EMAIL: string = '';
// Google Scope
const SCOPE: string = 'https://www.googleapis.com/auth/businessmessages https://www.googleapis.com/auth/chat.bot';
// Google Service Account Private Key
const PRIVATE_KEY: string = '';


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

function base64Url(value) {
	const stringifiedValue = JSON.stringify(value);

	// @ts-ignore
	const base64 = new Buffer
		.from(stringifiedValue)
		.toString("base64");

	return fromBase64(base64);
}

function fromBase64(base64) {
	return base64
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

function createSignature(input, privateKey) {
	const sigFunction = crypto.createSign("RSA-SHA256");

	// @ts-ignore
	sigFunction.write(input);
	// @ts-ignore
	sigFunction.end();

	const signatureBase64 = sigFunction.sign(privateKey, "base64");

	return signatureBase64;
}

/**
 * JWT is
 *
 * {Base64url encoded header}.{Base64url encoded claim set}.{Base64url encoded signature}
 *
 * The signature includes
 * {Base64url encoded header}.{Base64url encoded claim set}
 */
function makeJWT({ clientEmail, scope, privateKey }) {
	/**
	 * JWT HEADER
	 */
	const jwtHeader = { "alg": "RS256", "typ": "JWT" };
	const jwtHeaderBase64Encoded = base64Url(jwtHeader);

	/**
	 * JWT CLAIM SET
	 */
	const issuedTime = Math.floor(Date.now() / 1000); // in seconds
	const expirationTime = issuedTime + (3600 - 10)

	const jwtClaimSet = {
		"iss": clientEmail,
		"scope": scope,
		"aud": "https://oauth2.googleapis.com/token",
		"exp": expirationTime,
		"iat": issuedTime
	};

	const jwtClaimSetBase64Encoded = base64Url(jwtClaimSet);

	/**
	 * JWT SIGNATURE
	 */
	const signatureSource = `${jwtHeaderBase64Encoded}.${jwtClaimSetBase64Encoded}`;
	const signature = createSignature(signatureSource, privateKey);
	const signatureBase64Url = fromBase64(signature);

	const jwt = `${jwtHeaderBase64Encoded}.${jwtClaimSetBase64Encoded}.${signatureBase64Url}`;

	return jwt;
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
		name: `${sessionId}/messages/${generateGoogleChatMessageId()}`,
	}

	// Check for simple text
	if (output?.text) {
		return {
			...basicMessage,
			text: output?.text,
			argumentText: "",
			fallbackText: "",
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
			argumentText: "",
			fallbackText: "",
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
			argumentText: "",
			fallbackText: "",
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
		let text = "";
		let data = {}

		// Check if Google Chat Message is incoming
		if (request?.body?.type === "MESSAGE"
			|| request?.body?.type === "CARD_CLICKED"
			|| request?.body?.type === "ADDED_TO_SPACE") {

			const googleChatMessage: IGoogleChatMessage = request.body;


			// Check if user clicked a button on a card (Quick Reply)
			if (request.body?.action?.actionMethodName === "postback" && request?.body?.action?.parameters) {
				text = request.body.action.parameters[0].value;
			} else if (request.body.type === "ADDED_TO_SPACE") {
				text = '##welcome##';
			} else {
				text = googleChatMessage.message.text;
			}

			userId = googleChatMessage?.user?.name;
			sessionId = googleChatMessage?.space?.name;
			data = googleChatMessage;

			// Log event
			console.info(`[Google Chat] Received message from ${userId} in session ${sessionId}`);
		}

		// Directly answer Google Chat for avoiding "Bot did not answer" message
		if (!response.headersSent) {
			response.status(200).json({
				text: ""
			});
		}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		const jwt = makeJWT({
			clientEmail: CLIENT_EMAIL,
			scope: SCOPE,
			privateKey: PRIVATE_KEY
		});

		const oauth2Response = await httpRequest({
			method: 'POST',
			uri: 'https://oauth2.googleapis.com/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			form: {
				assertion: jwt,
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
			},
			json: true
		});

		// Generate Google Chat message from Cognigy Default message output
		const cognigyMessage = await generateGoogleChatMessage(output, userId, sessionId);

		if (oauth2Response?.access_token && cognigyMessage !== null) {
			try {
				const messageResponse = await httpRequest({
					uri: `https://chat.googleapis.com/v1/${sessionId}/messages`,
					method: "POST",
					headers: {
						'Content-Type': 'application/json; charset=UTF-8',
						'Accept': 'application/json',
						'Authorization': `Bearer ${oauth2Response.access_token}`
					},
					body: cognigyMessage,
					json: true
				});

				console.info(`[Google Chat] Sent message to user with id ${userId}.`);
				console.log(`[Google Chat] Message Response: ${JSON.stringify(messageResponse)}`);
			} catch (error) {
				console.error(`[Google Chat] Error: ${error}`);
				return;
			}
		} else {
			console.error(`[Google Chat] No Access Token provided: ${JSON.stringify(oauth2Response)}`);
			return;
		}

		return;

	}
})