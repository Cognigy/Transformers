/**
 * Configuration!
 */

const MICROSOFT_TRANSLATOR_API_KEY: string = "";
const FLOW_LOCALE: 'en' | 'de' | 'es' = "en";

/**
 * Translators
 */

// Microsoft
async function microsoftTranslate(text, language, apikey) {

	try {
		const microsoftOptions = {
			method: 'POST',
			uri: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${language}`,
			headers: {
				'Ocp-Apim-Subscription-Key': apikey,
				'Content-type': 'application/json',
				'Accept': 'application/json',
				'X-ClientTraceId': uuid.v4().toString()
			},
			body: [
				{
					text
				}
			],
			json: true
		};

		const response = await httpRequest(microsoftOptions);

		// Return the translated sentence only
		return response;
	} catch (error) {
		throw new Error(error.message);
	}
}

async function translateCognigyMessage(processedOutput, detectedLanguage) {

	// Check if message is plain text
	if (processedOutput.text && !processedOutput.data) {
		let translation = await microsoftTranslate(processedOutput.text, detectedLanguage, MICROSOFT_TRANSLATOR_API_KEY);
		processedOutput.text = translation[0].translations[0].text;
		
	// TODO: Cannot send multiple API requests in the same transformer execution
	// Check if message has quick replies
	} else if (processedOutput.data?._cognigy?._default?._quickReplies) {
		// Check fallback text and translate it
		if (processedOutput.data._cognigy._default._quickReplies.fallbackText) {
			let translation = await microsoftTranslate(processedOutput.data._cognigy._default._quickReplies.fallbackText, detectedLanguage, MICROSOFT_TRANSLATOR_API_KEY);
			processedOutput.data._cognigy._default._quickReplies.fallbackText = translation[0].translations[0].text;
		}

		// Translate header message text
		let translation = await microsoftTranslate( processedOutput.data._cognigy._default._quickReplies.text, detectedLanguage, MICROSOFT_TRANSLATOR_API_KEY);
		processedOutput.data._cognigy._default.text = translation[0].translations[0].text;

		// Loop through the quick replies and translate the button text
		for (let quickReply of processedOutput.data?._cognigy?._default?._quickReplies.quickReplies) {
			let translation = await microsoftTranslate(quickReply.title, detectedLanguage, MICROSOFT_TRANSLATOR_API_KEY);
			quickReply.title = translation[0].translations[0].text;
		}
	}

	return processedOutput;
}

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

		// Translate the text
		let translation = await microsoftTranslate(payload.text, FLOW_LOCALE, MICROSOFT_TRANSLATOR_API_KEY);

		let translatedText = translation[0].translations[0].text;
		let detectedLanguage = translation[0].detectedLanguage.language;

		// Write detected language into the session storage
		const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId);
		sessionStorage.detectedLanguage = detectedLanguage;

		return {
			userId: payload.userId,
			sessionId: payload.sessionId,
			text: translatedText,
			data: payload.data
		};
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

		// Get the detected language from the input user message
		const sessionStorage = await getSessionStorage(userId, sessionId);
		const detectedLanguage = sessionStorage.detectedLanguage;

		// Translate the outgoing message
		processedOutput = await translateCognigyMessage(processedOutput, detectedLanguage);

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
