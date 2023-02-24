const LEKAB_API_KEY = "Lekab API Key"; // LEKAB API Key
const LEKAB_API_URL = "https://secure.lekab.com/rich/lekabrich/send";
//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 1800;

const HIDE_USER_ID = true
const HIDE_SESSION_ID = true
const HIDE_FROM_CHANNEL = true
//method used for hiding
const HASH_ALGORITHM = "sha256"
/**
 * LEKAB LekabApi interfaces
 */
interface ILekabApiMessageBase {
	"to":[
			{
				"channel":string;
				"address":string;	
			}
		]
}

interface ILekabApiMediaMessage extends ILekabApiMessageBase {
	"media_message": {
		"url": string;
	  }
}

interface ILekabApiTextMessage extends ILekabApiMessageBase {
	"message": {
		"text_message": {
		  "text": string;
		}
	}
}

interface ILekabApiLocationMessage {
	"location_message": {
		"title": string;
		"label": string;
		"coordinates": {
		  "latitude": number;
		  "longitude": number;
		}
	  }
}

interface ILekabApiQuickReplyMessage extends ILekabApiMessageBase {
	"choice_message": {
		"text_message": {
		  "text": "Text"
		},
		"choices": TLekabApiChoiceComponent[];
	}
}

type TLekabApiChoiceComponent = ILekabApiChoiceTextComponent | ILekabApiChoiceCallComponent | ILekabApiChoiceUrlComponent;

interface ILekabApiChoiceTextComponent {
		"text_message": {
		  "text": string;
		},
		"postback_data": string;
	  
}

interface ILekabApiChoiceCallComponent {
	"call_message": {
		"title": string;
		"phone_number": string;
	  },
	  "postback_data": string;
}

interface ILekabApiChoiceUrlComponent {
	"type": "reply",
    "postback_data": string;
    "url_suffix": string;
}

interface ILekabApiTemplateMessage extends ILekabApiMessageBase {
	"template_message": {
		"lekabapimessage_template": {
		  "template_id": string;
		  "language_code": string;
		}
		"body_parameters": ILekabApiTemplateBodyComponent[];
		"header_parameters": ILekabApiTemplateHeaderComponent[];
		"button_parameters": ILekabApiTemplateButtonComponent[];
	}
}


type TLekabApiTemplateComponent = ILekabApiTemplateHeaderComponent | ILekabApiTemplateBodyComponent | ILekabApiTemplateButtonComponent;

interface ILekabApiTemplateHeaderComponent {
	"type": "text";
	"text": string;
	"link": string;
	"provider_name": string;
	"filename": string;  
}

interface ILekabApiTemplateBodyComponent {
	type: string;
}

interface ILekabApiTemplateButtonComponent {
	"type": "reply",
    "postback_data": string;
    "url_suffix": string;
}


type TLekabApiContent = ILekabApiTextMessage | ILekabApiMediaMessage | ILekabApiTemplateMessage | ILekabApiLocationMessage | ILekabApiQuickReplyMessage | any;

const convertWebchatContentToLekabApi = (output, sessionId: string, sessionStorage: any): TLekabApiContent[] => {

		// create list for lekabapimessage content
		let lekabApiContents: TLekabApiContent[] = [];

		// check for location message
		if (output.data.type==="location") {

			//const { longitude, latitude, name, address } = output.data.location;

			lekabApiContents.push({
				"location_message": {
					"title": output.data.title,
					"label": output.data.label,
					"coordinates": {
						"latitude": output.data.coordinates.latitude,
						"longitude": output.data.coordinates.longitude
					}
				}
			});
		}

		// check if default templates are defined
		else if (output.data?._cognigy?._default) {
						// check if message is carousel
					let defaultContent = output.data._cognigy._default;
					// look for quick replies
					if (defaultContent._quickReplies !== null && defaultContent._quickReplies?.type === "quick_replies") {
						let text: string = defaultContent._quickReplies.text;
						//let quickReplies: IDefaultQuickReply[] = defaultContent._quickReplies.quickReplies;
						let quickReplies = defaultContent._quickReplies.quickReplies;
						let choices: object[] = [];

						for(let i = 0; i < quickReplies.length; i++){
								choices.push({
									"text_message":
									{
										"text":quickReplies[i].title
									},
									"postback_data": quickReplies[i].payload
								});
						}
						lekabApiContents.push({
								"choice_message":{
									"text_message":{
										"text":text
									},
									"choices": choices
								}
							});
					}
					
					//check for buttons
					else if (defaultContent._buttons?.type === "buttons") {
						let defaultContentButtons = defaultContent._buttons;
						let choices : object[] = [];
						for(let i = 0; i < defaultContentButtons.buttons.length; i++){
							if(defaultContentButtons.buttons[i].type === "web_url"){
									choices.push({
										"url_message":
										{
											"title": defaultContentButtons.buttons[i].title,
											"url": defaultContentButtons.buttons[i].url
										}
									});
								}
							else if(defaultContentButtons.buttons[i].type === "postback"){
								choices.push({
										"text_message":
										{
											"text":defaultContentButtons.buttons[i].title
										},
										"postback_data": defaultContentButtons.buttons[i].payload
								});
							} else if(defaultContentButtons.buttons[i].type === "phone_number"){
								choices.push({
											"call_message": {
												"title": defaultContentButtons.buttons[i].title,
												"phone_number": defaultContentButtons.buttons[i].payload
										}       
								});


							}
						}
							lekabApiContents.push({
								"choice_message":{
									"text_message":{
										"text":defaultContentButtons.text
									},
									"choices": choices
								}
							});
						
					}

					// check for image
					else if (defaultContent._image?.type === "image") {
						lekabApiContents.push({
							"media_message": {
								"url": defaultContent._image.imageUrl
							}
						});
					}

					// check for audio
					else if (defaultContent._audio?.type === "audio") {
						lekabApiContents.push({
							"media_message": {
								"url": defaultContent._audio.audioUrl
							}
						});
					}

					// check for video
					else if (defaultContent._video?.type === "video") {
						lekabApiContents.push({
							"media_message": {
								"url": defaultContent._video.videoUrl
							}
						});
					}
					// check carousel
					else if (defaultContent._gallery.type==="carousel") {
						let galleryItems = defaultContent._gallery.items;			
						let cards: object[] = [];
						let choices: object[] = [];
						for(let j = 0; j < galleryItems.length; j++){
							let galleryButtons = galleryItems[j].buttons;							
								for(let i = 0; i < galleryButtons.length; i++){
									if(galleryButtons[i].type==="web_url"){
										choices.push({
											"url_message": {
												"title": galleryButtons[i].title,
												"url": galleryButtons[i].url
											}
											});
												
									}
									else if(galleryButtons[i].type==="phone_number"){
										choices.push({
											"call_message": {
												"title": galleryButtons[i].title,
												"phone_number": galleryButtons[i].payload
											}
											});
												
									}  
									else if(galleryButtons[i].type==="postback"){
										choices.push({
											"text_message":
											{
												"text":galleryButtons[i].title
											},
											"postback_data": galleryButtons[i].payload
										});
									}
									
								}
							
							cards.push({
								"title": defaultContent._gallery.items[j].title,
									"description": defaultContent._gallery.items[j].subtitle,
									"media_message": {
										"url": defaultContent._gallery.items[j].imageUrl
									},
									"choices": choices
							})
							
						}
						if(galleryItems.length === 1){
							lekabApiContents.push({
								"card_message": {
									"title": defaultContent._gallery.items[0].title,
									"description": defaultContent._gallery.items[0].subtitle,
									"media_message": {
										"url": defaultContent._gallery.items[0].imageUrl
									},
									"choices": choices
								}
							});
						} else{
							lekabApiContents.push({
							"carousel_message": {
								"cards": cards
							}
						});
						}
					}
		}
		// check if default text was sent
		else if (output.text && !output.data?._cognigy?._default && !output.data.type) {

			// send default text
			lekabApiContents.push({
				"text_message":{
					"text":output.text
				}
			});
		}
	// return the list of lekabapimessage messages
	return lekabApiContents;
}

createWebhookTransformer({

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
	
		if (request.body.status) {
			response.sendStatus(200);
			return;
		}
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
		//timestamp in unix seconds
		const currentTime = moment(new Date()).unix()
		const clearFromChannel = request.body.from_channel
		const clearUserId = request.body.from_address
		const clearSessionId = request.body.operator_conversation
		const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

		if (rawSessionStorage.timestamp) {
			const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
			//check for timeout if timeout is more than 0
			if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
				rawSessionStorage.timestamp = currentTime
			}
		} else {
			rawSessionStorage.timestamp = currentTime
		}
		//fill with clear values
		let userId = clearUserId
		let fromChannel = clearFromChannel
		let sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])
		//hash and obscure if hiding is true
		if (HIDE_USER_ID) {
			userId = crypto.createHash(HASH_ALGORITHM).update(userId).digest("hex")
		}
		if (HIDE_SESSION_ID) {
			sessionId = crypto.createHash(HASH_ALGORITHM).update(sessionId).digest("hex")
		}
		if (HIDE_FROM_CHANNEL) {
			fromChannel = crypto.createHash(HASH_ALGORITHM).update(fromChannel).digest("hex")
		}
		//create output transformer translation storage
		const processedSessionStorage = await getSessionStorage(userId, sessionId);
		processedSessionStorage.clearUserId = clearUserId
		processedSessionStorage.clearSessionId = clearSessionId
		processedSessionStorage.clearFromChannel = clearFromChannel
		

		let text: string;
		const data = request.body;

		// Check if quick reply button was clicked
		if (request?.body?.postback?.data) {
			text = request.body.postback_data;
		} else {
			text = request.body.incoming_data;
		}

		return {
			userId,
			sessionId,
			text,
			data
		};
	},

	/**
	 * This transformer is executed on every output from the Flow.
	 * For Webhook based transformers, the return value of this transformer
	 * will be sent directly to the user.
	 *
	 * @param processedOutput The output from the Flow that has been processed into the final object
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
		//create output transformer translation storage
		const processedSessionStorage = await getSessionStorage(userId, sessionId);
		const clearFromChannel = processedSessionStorage.clearFromChannel
		const clearUserId = processedSessionStorage.clearUserId
		const clearSessionId = processedSessionStorage.clearSessionId
		//if you need to access the original rawSessionStorage you now can
		const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
		// Delete Quick Replies for the next time
		delete processedSessionStorage.quickReplies;
		delete processedSessionStorage.quickReplyCurrentNumber;
		let lekabapimessage: TLekabApiContent[] = convertWebchatContentToLekabApi(output, clearSessionId, processedSessionStorage);	
		if (!lekabapimessage.length) {
			console.error("Missing LekabApi compatible channel output!");
			return
		}
		let result: any;
		let options = {
					uri: LEKAB_API_URL,
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Accept':'application/json',
						'X-API-Key': LEKAB_API_KEY
					},
					body: {
					
						"to":[
							{
								"channel":clearFromChannel,
								"address":clearUserId	
							}
							],
								"message": lekabapimessage[0]
    
						
					},
					json: true
			};
			try{
				result  = await httpRequest(options);
				console.log("HTTP result: " + JSON.stringify(result));
			} catch (err){
				console.error(err.message);
			};
			return null;
		},


	/**
  	 * This transformer is executed when the Flow execution has finished.
	 * Since all outputs have been sent to the user, this transformer does not return anything.
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
	handleInject: async ({request}) => {
		const { userId, sessionId, text } = request.body;
		/**
		 * Extract the userId, sessionId and text
		 * from the request. Example:
		 *
		const { userId, sessionId, text, data } = request.body;
		 * 
		 * Note that the format of the request body will be different for
		 * every Endpoint, and the example above needs to be adjusted
		 * accordingly.
		 */
		
		
		return {
			userId,
			sessionId,
			text
		
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
})