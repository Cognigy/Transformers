const SPEED = "+20%";
const VOICE = "en-US-JennyNeural"

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

		return {
			userId: payload.userId,
			sessionId: payload.sessionId,
			text: payload.text,
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
		//console.log(JSON.stringify(processedOutput));
        
        try {
            if (Array.isArray(processedOutput)) {
                for (let po of processedOutput) {
                    if (po.say?.text) {
						if (po.say?.text?.match(/(?<start><voice[^>]+>)(?<text>.+?)(?<end><\/voice>)/ims)) {
							//console.log("first case")
							po.say.text = po.say.text.replace(/(?<start><voice[^>]+>)(?<text>.+?)(?<end><\/voice>)/ims,(all, start, text, end) => start + `<prosody rate="${SPEED}">` + text + `</prosody>` + end)
						} else {
							//console.log("second case")
							po.say.text = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="de-DE"><voice name="` + VOICE + `"><prosody rate="${SPEED}">${po.say.text}</prosody></voice></speak>`;
						}
                        //console.log("output: " + po.say.text)
                    }
                }
            }
        } catch (err) {

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
