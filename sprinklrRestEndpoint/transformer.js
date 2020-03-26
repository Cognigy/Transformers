const CAMPAIGN_ID = "";

// format: "Bearer {access_token}"
const AUTH_TOKEN = "";
//refresh Token: 
//created on 

const API_KEY = "";

//enter the configured URL shortener here, otherwise set it to null
const URL_SHORTENER = ""

createRestTransformer({

	/**
	 * This transformer is executed when receiving a message
	 * from the user, before executing the Flow.
	 *
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param request The Express request object with a JSON parsed body.
	 * @param response The Express response object.
	 *
	 * @returns A valid userId, sessionId, as well as text and/or data,
	 * which has been extracted from the request body.
	 */
	handleInput: async ({ endpoint, request, response }) => {

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
		
		//infinite loop prevention
		if (request.body &&
			request.body.payload.senderProfile && 
			request.body.payload.senderProfile.bio) {

			console.error("Sprinklr Account output, aborting")
			response.sendStatus(200);
			return null; 
		}
		
		if (request.body &&
			request.body.payload &&
			request.body.payload.sourceId &&
			request.body.payload.senderProfile &&
			request.body.payload.senderProfile.username &&
			request.body.payload.senderProfile.channelType &&
			request.body.payload.senderProfile.channelId &&
			request.body.payload.messageId) {

			const userId = request.body.payload.sourceId.toString();
			const senderProfile = request.body.payload.senderProfile;
			const sessionId = JSON.stringify([senderProfile.username, senderProfile.channelType, senderProfile.channelId]);
			const sessionStorage = await getSessionStorage(userId, sessionId);
			sessionStorage.messageId = request.body.payload.messageId;

			//Twitter api check
			let text = "";
			if (request.body.payload.content &&
				request.body.payload.content.text) {
				text = request.body.payload.content.text;
				if (text.startsWith("@")) {
					sessionStorage.twitter = "tweet"
				} else {
					sessionStorage.twitter = "direct message"
				}
			} 
			const data = request.body;

			return {
				userId,
				sessionId,
				text,
				data
			};
		} else {
			//Sprinklr Endpoint Check requirement
			response.sendStatus(200);
			return null;
		}
	},

	/**
	 * This transformer is executed on every output from the Flow.
	 * 
	 * @param output The raw output from the Flow. It is possible to manipulate
	 * and return every distinct output before they get formatted in the 'handleExecutionFinished'
	 * transformer.
	 *
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 * 
	 * @returns The output that will be formatted into the final response in the 'handleExecutionFinished' transformer.
	 */
	handleOutput: async ({ output, endpoint, userId, sessionId }) => {
		return output;
	},

	/**
	 * This transformer is executed when the Flow execution has finished.
	 * For REST based transformers, the final output will be sent to
	 * the user.
	 *
	 * @param processedOutput This is the final object that will be sent to the user.
	 * It is therefore structured according to the Endpoint channel of the transformer.
	 *
	 * @param outputs This is an array of all of the outputs that were output by the Flow.
	 * These will be merged to create the 'processedOutput' object.
	 * 
	 * @param userId The unique ID of the user.
	 * @param sessionId The unique ID for this session. Can be used together with the userId
	 * to retrieve the sessionStorage object.
	 * @param endpoint The configuration object for the used Endpoint.
	 * @param response The express response object that can be used to send a custom response back to the user.
	 *
	 * @returns An object that will be sent to the user, unchanged. It therefore has to have the
	 * correct format according to the documentation of the specific Endpoint channel.
	 */
	handleExecutionFinished: async ({ processedOutput, outputs, userId, sessionId, endpoint, response }) => {

		const sessionStorage = await getSessionStorage(userId, sessionId);
		const [userName, chType, chId] = JSON.parse(sessionId);
		
		let requestBody = null

		//construct requestBody channel specificly
		if (chType == "TWITTER") {
			
			let uri, text = ""

			if (sessionStorage.twitter &&
				sessionStorage.twitter == "tweet") {
				uri = "https://api2.sprinklr.com/prod0/api/v2/publishing/reply"
				//twitter userName handle has to be included
				text = "@" + userName + " " + processedOutput.text
			} else {
				uri = "https://api2.sprinklr.com/prod0/api/v2/publishing/message"
				text = processedOutput.text
			}

			requestBody = {
				uri: uri,
				method: "POST",
				headers : {
					'Content-Type':'application/json',
					'Accept':'application/json',
					'Authorization': AUTH_TOKEN,
					'Key': API_KEY
				},
				body: {
					"accountId": userId,
					"content": {
						"text": text,
						"attachment": null
					},
					"scheduleDate": 0,
					"taxonomy": {
						"campaignId": CAMPAIGN_ID,
						"urlShortenerId": URL_SHORTENER
					},
					//prevent Twitter block
					"allowDuplicateMessages" : true,
					"inReplyToMessageId": sessionStorage.messageId,
					"toProfile": {
						"channelType": chType,
						"channelId": chId,
						"screenName": userName
					}
				},
				json: true
			};

		} else {
			//not Twitter
			requestBody = {
				uri: "https://api2.sprinklr.com/prod0/api/v2/publishing/reply",
				method: "POST",
				headers : {
					'Content-Type':'application/json',
					'Accept':'application/json',
					'Authorization': AUTH_TOKEN,
					'Key': API_KEY
				},
				body: {
					"accountId": userId,
					"content": {
						//"title": "Mobily Assistant",
						"text": processedOutput.text,
						"attachment": null/*{
							"type": "IMAGE", 
							"attachmentOptions": [
								{
									"channelType": "FACEBOOK",
									"accountId": 0
								}     
							]   
						}*/
					},
					"scheduleDate": 0,
					"taxonomy": {
						"campaignId": CAMPAIGN_ID/*,
						"clientCustomProperties": {
							"additionalProp1": ["string"],
							"additionalProp2": ["string"],
							"additionalProp3": ["string"]   
						},
						"partnerCustomProperties": {
							"additionalProp1": ["string"],
							"additionalProp2": ["string"],
							"additionalProp3": ["string"]   
						},
						"tags": ["string"],
						"urlShortenerId": "string"
					*/},
					"inReplyToMessageId": sessionStorage.messageId,
					"toProfile": {
						"channelType": chType,
						"channelId": chId,
						"screenName": userName
					}
				},
				json: true
			};
		}

		//send to sprinklr
		try {
			const result = await httpRequest(requestBody); 
		} catch (error){
			console.error(error)
			//debug
			return {"error":error, "request":requestBody}
		}
		//debug return
		return requestBody.body;
	}
});
