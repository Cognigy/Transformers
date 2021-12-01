
interface IGoogleChatMessageMessageSender {
	name: string;
	displayName: string;
	avatarUrl: string;
	type: "HUMAN" | string;
	domainId: string
	email?: string;
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

		if (sessionStorage?.auth?.access_token && output?.text?.length !== 0) {
			try {
				const messageResponse = await httpRequest({
					uri: `https://chat.googleapis.com/v1/${sessionId}/messages`,
					method: "POST",
					headers: {
						'Content-Type': 'application/json; charset=UTF-8',
						// 'Content-Type': 'application/x-www-form-urlencoded',
						'Accept': 'application/json',
						'Authorization': `Bearer ${sessionStorage?.auth?.access_token}`
					},
					body: {
						space: sessionStorage.space,
						thread: sessionStorage.thread,
						name: `${sessionId}/messages/${generateGoogleChatMessageId()}`,
						sender: {
							name: "Cognigy",
							displayName: "Cognigy",
							domainId: sessionStorage.user.domainId,
							type: "HUMAN",
							isAnonymous: false
						},
						text: output?.text,
						argumentText: output?.text,
						fallbackText: output?.text,
						attachment: [],
						annotations: [],
						cards: []
					},
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