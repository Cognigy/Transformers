/**
 * LiveChat.Inc Integration
 * You need to create a Bots Agents using the LiveChat API.
 * https://developers.livechatinc.com/docs/management/configuration-api/#create-bot-agent
 * 
 * Easiest is to generate a Personal Access Token in the developer portal
 * https://developers.livechatinc.com/console/tools/personal-access-tokens
 * 
 * You can then use basic auth on the queries, with Account ID as user and Token as password.
 * 
 * Below is a sample query for creating a new bot agent
 * 
 * URL: https://api.livechatinc.com/v3.1/configuration/action/create_bot_agent
 * Payload:
 *
 {
    "name": "Cognigy Bot",
    "status": "accepting chats",
    "default_group_priority": "first",
    "webhooks": {
    	"url": "https://endpoint-internal.cognigy.ai/xxx",
    	"secret_key": "123",
    	"actions": [
    		{
    			"name": "incoming_chat_thread"
    		},
    		{
    			"name": "incoming_event"
    		},
    		{
    			"name": "incoming_rich_message_postback"
    		}
    	]
    }
}
 *
 * This will create a bot for you that points to a Cognigy.AI endpoint
 */

const ACCOUNT_ID = "XXXX"; // the Account ID on your Personal Access Token
const TOKEN = "XXXX"; // The Personal Access Token
const AGENT_GROUP = 2; // The group of agents you want to hand over to

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
		const action = request.body.action;
		const payload = request.body.payload;
		switch (action) {
			
			case "incoming_chat_thread":
				// extract user data from payload
				const chatId = payload.chat.id;
				const threadId = payload.chat.thread.id;
				const userId = payload.chat.users[0].id;
				const userName = payload.chat.users[0].name;
				const userEmail = payload.chat.users[0].email;

				// store user data into session storage
				const sessionStorage = await getSessionStorage(userId, threadId);
				sessionStorage["userId"] = userId;
				sessionStorage["userName"] = userName;
				sessionStorage["userEmail"] = userEmail;
				sessionStorage["chatId"] = chatId;

				const lastMessage = payload.chat.thread.events[payload.chat.thread.events.length-1];
				if (lastMessage.type === "filled_form" || (lastMessage.properties && lastMessage.properties.lc2 && lastMessage.properties.lc2.welcome_message))
					return {
						userId: userId,
						sessionId: threadId,
						text: "GET_STARTED"
						};
				else return null;
				break;

			case "incoming_event":
				if (payload.event.type === "message" && payload.event.properties.source.client_id !== "personal_access_token") {
					const chat_Id = payload.chat_id;
					const thread_Id = payload.thread_id;
					const text = (payload.event.postback && payload.event.postback.value) ? payload.event.postback.value : payload.event.text;
					const user_Id = payload.event.author_id;

					const sessionStorage = await getSessionStorage(user_Id, thread_Id);
					sessionStorage["chatId"] = chat_Id;

					let user_name = null;
					let user_email = null;
					let data = {};
					try {
						user_name = sessionStorage["userName"];
						user_email = sessionStorage["userEmail"];

						data = {
							user_name,
							user_email
						};
					} catch (err) {	}

					const returnObject = {
						userId: user_Id,
						sessionId: thread_Id,
						text,
						data
						};
					return returnObject;
				} else return null;
				break;
				
			default:
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
		const sessionStorage = await getSessionStorage(userId, sessionId);
		const chat_Id = sessionStorage["chatId"];
		if (output.data && output.data._cognigy && output.data._cognigy._facebook) output.data._cognigy._webchat = output.data._cognigy._facebook;
		const options = transformMessage(output, chat_Id);

		await httpRequest(options);

		return null;
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
		return processedOutput;
	}
});

/**
 * Transforms Cognigy.AI Webchat content to LiveChat Rich Messages
 * @param output Cognigy.AI Output
 * @param chat_Id The ID of the LiveChat chat
 */
const transformMessage = (output, chat_Id): any => {
    let body = {};
    let uri = `https://${ACCOUNT_ID}:${TOKEN}@api.livechatinc.com/v3.1/agent/action/send_event`;
    if (output && output.data && output.data.handover) {
        // message was a handover request
        uri = `https://${ACCOUNT_ID}:${TOKEN}@api.livechatinc.com/v3.2/agent/action/transfer_chat`
        body = {
            "chat_id": chat_Id,
            "target": {
                "type": "group",
                "ids": [
                    AGENT_GROUP
                ]
            }
        };
    } else if (output && output.data && output.data._cognigy && output.data._cognigy._webchat) {
        // message is some kind of rich message
        const webchatData = output.data._cognigy._webchat;
        if (webchatData.message.quick_replies) {
            // message is a quick replies message
            body = {
                "chat_id": chat_Id,
                "event": {
                    "type": "rich_message",
                    "recipients": "all",
                    "template_id": "quick_replies",
                    "elements": [{
                        "title": webchatData.message.text,
                        "buttons": webchatData.message.quick_replies.map(qr => {
                            return {
                                "type": "message",
                                "text": qr.title,
                                "postback_id": "send_message",
                                "user_ids": [],
                                "value": qr.payload
                            };
                        }),
                    }]
                }
            }
        } else if (webchatData.message.attachment) {
            // message is a card or a carousel
            const payload = webchatData.message.attachment.payload;
            body = {
                "chat_id": chat_Id,
                "event": {
                    "type": "rich_message",
                    "recipients": "all",
                    "template_id": "cards",
                    "elements": payload.elements.map(el => {
                        return {
                            "title": el.title,
                            "subtitle": el.subtitle,
                            "image": !el.image_url ? null : {
                                "url": el.image_url
                            },
                            "buttons": el.buttons.map(btn => {
                                switch (btn.type) {
                                    case "web_url":
                                        return {
                                            "type": "url",
                                            "text": btn.title,
                                            "postback_id": "open_url",
                                            "user_ids": [],
                                            "value": btn.url
                                        }
                                        break;
                                    case "postback":
                                        return {
                                            "type": "message",
                                            "text": btn.title,
                                            "postback_id": "send_message",
                                            "user_ids": [],
                                            "value": btn.payload
                                        }
                                        break;
                                    case "phone_number":
                                        return {
                                            "type": "phone",
                                            "text": btn.title,
                                            "postback_id": "action_call",
                                            "user_ids": [],
                                            "value": btn.payload
                                        }
                                        break;
                                }
                                
                            })
                        }
                    })
                }
            }
        }
    } else {
        // message is a standard message
        body = {
            "chat_id": chat_Id,
            "event": {
                "type": "message",
                "text": output.text,
                "recipients": "all"
            }
        };
    }

    return {
        method: 'POST',
        uri,
        body,
		json: true
    };
}