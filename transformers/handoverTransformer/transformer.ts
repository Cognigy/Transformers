const handoverProviderURL = "https://<url>";

createSocketTransformer({
	
	/**
	 * Forward the user message to the handover provider
	 * if the user is in a handover
	 */
	handleInput: async ({ payload, endpoint }) => {
		const { userId, sessionId, text } = payload;
		const { URLToken } = endpoint;

		const sessionStorage = await getSessionStorage(userId, sessionId);

		/**
		 * If we are in a handover,
		 * then we forward the message to the
		 * handover provider
		 */
		if (sessionStorage.isHandoverActive) {

			/**
			 * If the user wishes to talk to the bot
			 * again, we end the handover conversation
			 */
			if (text.match("bot")) {
				await sendEventToHandoverProvider("end", {
					URLToken,
					userId,
					sessionId
				});

				sessionStorage.isHandoverActive = false;

				/**
				 * Return data.endHandover
				 * to the Flow
				 */
				return {
					data: {
						endHandover: true
					},
					userId,
					sessionId
				}
			} else {
				await sendEventToHandoverProvider("message", {
					text,
					URLToken,
					userId,
					sessionId
				});


				/**
				 * Return void to prevent Flow execution
				 */
				return;
			}
		}

		/**
		 * If we are not in a handover,
		 * then we return the original data
		 */
		return {
			userId,
			sessionId,
			text
		};
	},

	/**
	 * Mark the user as being in a handover when a specific
	 * data output from the Flow is sent
	 */
	handleOutput: async ({ output, processedOutput, endpoint, userId, sessionId }) => {
		const { data = {}} = output;
		const { URLToken } = endpoint;

		const sessionStorage = await getSessionStorage(userId, sessionId);

		/**
		 * If we received a 'startHandover'
		 * event, store this setting on the
		 * sessionStorage object
		 */
		if (data.startHandover) {
			sessionStorage.isHandoverActive = true;

			await sendEventToHandoverProvider("start", {
				URLToken,
				userId,
				sessionId
			});
		}

		return processedOutput;
	},

	/**
	 * Forward messages from the agent to the
	 * user using the Notify API
	 */
	handleNotify: async ({ request }) => {
		const { userId, sessionId, message, type } = request.body;

		/**
		 * If we got a 'message' event
		 * from the handover platform, we
		 * forward it to the user
		 */
		if (type === "message") {
			return {
				userId,
				sessionId,
				text: message
			};
		} else {
			throw new Error("Invalid notify request recieved. Only 'message' requests are supported");
		}
	}
});

async function sendEventToHandoverProvider(type: HandoverEventType, body: SendEventToHandoverProviderBody) {
	try {
		await httpRequest({
			method: "POST",
			uri: `${handoverProviderURL}/${type}`,
			body,
			json: true
		});
	} catch (err) {
		console.error(err);
	}
}

type HandoverEventType = "start" | "end" | "message";

interface SendEventToHandoverProviderBody {
	userId: string;
	sessionId: string;
	URLToken: string;
	[key: string]: any;
}
