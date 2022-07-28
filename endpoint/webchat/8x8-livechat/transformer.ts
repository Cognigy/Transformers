const TENANT_ID: string = '';
const REGION: string = '';

createSocketTransformer({
	handleInput: async ({ payload, endpoint }) => {

		const sessionStorage = await getSessionStorage(payload?.userId, payload?.sessionId);

		if (sessionStorage?.isHandover && sessionStorage?.conversationId && sessionStorage.access_token) {

			try {

				await httpRequest({
					method: 'POST',
					uri: `https://api.8x8.com/vcc/${REGION}/chat/v2/tenant/${TENANT_ID}/conversations/${sessionStorage?.conversationId}/messages`,
					headers: {
						'Accept': 'application/problem+json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${sessionStorage?.access_token}`
					},
					body: {
						"authorType": "user",
						"text": payload?.text
					},
					json: true
				});
			} catch (error) {
				console.error(error);
			}

			return;
		}


		let transcript = sessionStorage?.transcript || [];

		// Write the live agent message into the sessionStorage for transcript
		if (payload?.text?.length !== 0) {
			transcript.push({
				type: "user",
				text: payload?.text
			});

			sessionStorage.transcript = transcript;
		}

		return {
			userId: payload.userId,
			sessionId: payload.sessionId,
			text: payload.text,
			data: {
				...payload.data,
				transcript: sessionStorage?.transcript
			}
		};
	},
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		const sessionStorage = await getSessionStorage(userId, sessionId);

		if (sessionStorage) {
			// Write the bot message into the sessionStorage for transcript
			if (processedOutput?.text) {
				let transcript = sessionStorage.transcript || [];

				transcript.push({
					type: "bot",
					text: processedOutput?.text?.length !== 0 ? processedOutput?.text : "Unsupported message type"
				});

				sessionStorage.transcript = transcript;
			} else {
				// check if it was a quick reply text
				let quickReplyText = processedOutput?.data?._cognigy?._webchat?.message?.text;
				if (quickReplyText) {
					// get quick reply text
					let transcript = sessionStorage.transcript || [];
					transcript.push({
						type: "bot",
						text: quickReplyText
					});
					// get options of quick replies
					let quickreplies = processedOutput?.data?._cognigy?._webchat?.message?.quick_replies?.map(qr => qr.title)?.join(',');
					transcript.push({
						type: "bot Options:",
						text: quickreplies
					});
					sessionStorage.transcript = transcript;
				}
			}
		}


		if (output?.data?.isHandover && output?.data?.conversationId && output?.data?.access_token) {
			sessionStorage.isHandover = output.data.isHandover;
			sessionStorage.conversationId = output.data.conversationId;
			sessionStorage.access_token = output.data.access_token;
		}

		return processedOutput;
	},

	handleExecutionFinished: async ({ sessionId, userId, endpoint }) => {

	},

	/**
	 * This transformer is executed when receiving an inject event.
	 * The extracted text and data will be injected into the conversation
	 * for the given user in the given session.
	 *
	 * @param request The Express request object with a JSON parsed body.
	 * @param response The Express response object.
	 * @param endpoint The configuration object for the used Endpoint.
	 *
	 * @returns A valid userId, sessionId, as well as text and/or data,
	 * which has been extracted from the request body. The text and data
	 * will be injected into this conversation.
	 */
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

	/**
	 * This transformer is executed when receiving a notify event.
	 * The extracted text and data will be sent directly to the
	 * given user in the given session as a notification.
	 *
	 * @param request The Express request object with a JSON parsed body.
	 * @param response The Express response object.
	 * @param endpoint The configuration object for the used Endpoint.
	 *
	 * @returns A valid userId, sessionId, as well as text and/or data,
	 * which has been extracted from the request body. The text and data
	 * will be sent directly to the user.
	 */
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
});