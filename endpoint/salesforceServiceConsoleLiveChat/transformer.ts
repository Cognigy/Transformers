const LIVE_AGENT_URL = "https://your-agent-url.salesforceliveagent.com/chat/rest/";


createSocketTransformer({

	/**
	 * This transformer is executed when receiving a message
	 * from the user, before executing the Flow.
	 *
	 * @param payload The payload object containing userId, sessionId, text etc.
	 * @param endpoint The configuration object for the used Endpoint.
	 *
	 * @returns A valid userId, sessionId, as well as text and/or data,
	 * which has been extracted from the payload.
	 */
	handleInput: async ({ payload, endpoint }) => {

		const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId);

		let liveAgentSessionKey = sessionStorage?.liveAgentSessionKey;
		let liveAgentAffinity = sessionStorage?.liveAgentAffinity;

		/**
		 * Rule intent so that we do not need to use an intent. Cancel option is showed using a quick reply message in the webchat.
		 */
		if (payload.text.toLowerCase() === "abbrechen") {
			sessionStorage.isHandover = false;
		}

		let isHandover = sessionStorage && sessionStorage.isHandover;

		if (isHandover) {
			
				try {
					await httpRequest({
						uri:  `${LIVE_AGENT_URL}Chasitor/ChatMessage`,
						method: "POST",
						headers: {
							"X-LIVEAGENT-SESSION-KEY": liveAgentSessionKey,
							"X-LIVEAGENT-AFFINITY": liveAgentAffinity,
							"X-LIVEAGENT-API-VERSION": "34",
						},
						body: {
							text: payload.text
						},
						json: true
					});
				} catch (error) {
					console.log(JSON.stringify(error));
					return null;
				}	
			
		} else {
			return {
				userId: payload.userId,
				sessionId: payload.sessionId,
				text: payload.text,
				data: payload.data
			};
		}
	},

	/**
	 * This transformer is executed on every output from the Flow.
	 * For Socket based transformers, the return value of this transformer
	 * will be sent directly to the user.
	 *
	 * @param processedOutput The output from the Flow which has been processed into the final object
	 * that will be sent to the user. It is structured according to the data structure used
	 * on the specific Endpoint channel.
	 *
	 * @param output The raw output from the Flow.
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 *
	 * @returns An object that will be sent to the user, unchanged. It therefore has to have the
	 * correct format according to the documentation of the specific Endpoint channel.
	 */
	handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

		let sessionStorage = await getSessionStorage(userId, sessionId);
		
		if (sessionStorage) {
			// get room Id
			if (processedOutput?.data?.liveAgentSessionKey ) {
				sessionStorage.liveAgentSessionKey = processedOutput.data.liveAgentSessionKey;
			}

			// get person
			if (processedOutput?.data?.liveAgentAffinity) {
				sessionStorage.liveAgentAffinity = processedOutput.data.liveAgentAffinity;
			}

			// get isHandover
			if (processedOutput?.data?.isHandover) {
				sessionStorage.isHandover = true;
			}
		}

		return processedOutput;
	},

	/**
	 * This transformer is executed when the Flow execution has finished.
	 * Since all outputs have already been sent to the user, this transformer does not return anything.
	 *
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 *
	 * @param endpoint The configuration object for the used Endpoint.
	 *
	 * @returns This transformer cannot return anything.
	 */
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