let KEY1 = {
    "name": "KEY1",
    "AUTH_TOKEN": "Bearer XXX==",
    "refresh_Token": "XXX==",
    "created_on": new Date().getTime(),
    "expires_in": "2591999",
    "API_KEY": "XXX",
    "SECRET": "XXX",
    "isProcessing": false
}
let KEY2 = {
    "name": "KEY2",
    "AUTH_TOKEN": "Bearer XXX==",
    "refresh_Token": "XXX==",
    "created_on": new Date().getTime() - 15 * 24 * 60 * 60 * 1000,
    "expires_in": "2591999",
    "API_KEY": "XXX",
    "SECRET": "XXX",
    "isProcessing": false
}
const CAMPAIGN_ID = "123456789";

const regExChatbotToken = /[a-z0-9]{20,30}/;

//set to true if Cognigy should answer even if Sprinklr did not send a thread control update
const ANSWER_BY_DEFAULT = false;

const URL_SHORTENER = null//"bit.ly", "s.spr.ly";

const HANDOVER_TARGET = "Sprinklr";
let newLogic = false;

const SPRINKLR_API_URL = "https://api2.sprinklr.com/prod2/api/v2"


function checkAvailableKeys(keyStorage: any): any {
    keyStorage.KEY1 = null;
    keyStorage.KEY2 = null;
    if (keyStorage.KEY1 != null) {
        KEY1 = keyStorage.KEY1;
        console.log("key1 is available in storage" + JSON.stringify(KEY1))
    }
    else {
        keyStorage.KEY1 = KEY1;
        // console.log("key1 is NOT available in storage");
    }
    if (keyStorage.KEY2 != null) {
        KEY2 = keyStorage.KEY2;
        // console.log("key2 is available in storage" + JSON.stringify(KEY2))
    }
    else {
        keyStorage.KEY2 = KEY2;
        // console.log("key2 is NOT available in storage");
    }
    let keyList = [];
    if (isKeyAvailable(KEY1)) {
        keyList.push(KEY1);
    }
    if (isKeyAvailable(KEY2)) {
        keyList.push(KEY2);
    }
    console.log("key list is " + JSON.stringify(keyList));
    return keyList;
}

function isKeyAvailable(key: any): boolean {
    let currentTime = new Date().getTime();
    let expiryTime = key.expires_in;
    let consumedTime = (currentTime - key.created_on) / 1000;
    // console.log(key.name + " current time is " + currentTime + " expriry original druation is " + expiryTime + " consumed duration is " + consumedTime + " consumed percentage is " + (consumedTime / expiryTime) + "% is key expired " + (consumedTime / expiryTime > 0.85));
    return (consumedTime / expiryTime < 0.85);

}

async function refreshKey(key: any, result: any, keyStorage: any) {
    // console.log("entered refresh key");
    if (result.access_token != null) {
        key.AUTH_TOKEN = result.access_token;
    }
    if (result.refresh_token != null) {
        key.refresh_Token = result.refresh_token;
    }
    key.created_on = new Date().getTime();
    // console.log("updated key Object is " + JSON.stringify(key));
    if (key.name == "KEY1") {
        keyStorage.KEY1 = key;
    }
    else {
        keyStorage.KEY2 = key;
    }
    key.isProcessing = false;
    // console.log("refresh result=" + result);
}


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
    handleInput: async ({
        endpoint,
        request,
        response
    }) => {

        console.log("request payload coming from Webhook is: " + JSON.stringify(request.body))
        
        //infinite loop prevention
        if (request.body &&
            request.body.payload &&
            request.body.payload.senderProfile &&
            (request.body.payload.senderProfile.channelType == "WHATSAPP_BUSINESS") &&
            request.body.payload.senderProfile.avatarUrl) {

            // console.log("nothing to be done")
            response.sendStatus(200);
            return null;
        }

        //read case update tags
        if (request.body &&
            request.body.type === "case.update") {
            if (newLogic == true) {
				
                console.log("entered case update " + JSON.stringify(request.body))
                const userId = request.body.payload.firstMessageId.split("_")[1];
                const contact = request.body.payload.contact;
                const sessionId = JSON.stringify([contact.name, contact.channelType, contact.channelId]);
                const sessionStorage = await getSessionStorage(userId, sessionId);
				
                if (
                    request.body.payload.workflow != null &&
                    request.body.payload.workflow.assignment != null &&
                    request.body.payload.workflow.assignment.assigneeId != null &&
                    request.body.payload.workflow.assignment.assigneeId.length > 0
                ) {
                    if (sessionStorage.caseId != null) {
                        sessionStorage.caseAssignee = request.body.payload.workflow.assignment.assigneeId;
                    }
                    console.log(sessionId + " case Assigned To  " + sessionStorage.caseAssignee);
                }
                else {
                    sessionStorage.caseAssignee = null;
                    console.log(sessionId + "case is still unassigned");
                }
                response.sendStatus(200);
                return null;
            }
        }

        //thread control check
        if (
            request.body &&
            request.body.payload &&
            request.body.payload.entityType &&
            request.body.payload.entityType == "CASE" &&
            request.body.payload.entityId &&
            request.body.payload.controllingParticipant) {

            const caseStorage = await getSessionStorage("sprinklrCaseUser", request.body.payload.entityId);
            caseStorage.controller = request.body.payload.controllingParticipant;

            console.log("controller updated: " + caseStorage.controller + " for case ID " + request.body.payload.entityId)
            response.sendStatus(200);
            return null;
        }

        // Case Created
        if (
            request.body &&
            request.body.type === "case.create" &&
            request.body.payload &&
            request.body.payload.id &&
            request.body.payload.firstMessageId &&
            request.body.payload.contact &&
            request.body.payload.contact.name &&
            request.body.payload.contact.channelType &&
            request.body.payload.contact.channelId) {

            const userId = request.body.payload.firstMessageId.split("_")[1];
            const contact = request.body.payload.contact;
            const sessionId = JSON.stringify([contact.name, contact.channelType, contact.channelId]);
            const sessionStorage = await getSessionStorage(userId, sessionId);
            sessionStorage.firstMessageId = request.body.payload.firstMessageId;
            sessionStorage.caseId = request.body.payload.id;
            //reset controller
            const caseStorage = await getSessionStorage("sprinklrCaseUser", request.body.payload.id);
            caseStorage.controller = null

            console.log(sessionId + "[Sprinklr] controller updated: " + caseStorage.controller)
            response.sendStatus(200);
            return null;
        }

        // Message Created
        if (request.body.type === "message.created" &&
            request.body &&
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

            if (sessionStorage.caseId) {
                const caseStorage = await getSessionStorage("sprinklrCaseUser", sessionStorage.caseId);
                if (caseStorage != null)
                    console.log("case storage info" + JSON.stringify(caseStorage))
                else
                    console.log("case storage is null")
                if (ANSWER_BY_DEFAULT || (caseStorage.controller != null && regExChatbotToken.test(caseStorage.controller))) {
                    console.log(sessionId + "[Sprinklr] Bot IS IN control 1");
                    sessionStorage.caseShouldBeRespondedTo = true;
                }
                else {
                    if (newLogic == true && sessionStorage.caseShouldBeRespondedTo != null && sessionStorage.caseShouldBeRespondedTo == true) {
                        if (sessionStorage.caseAssignee == null || sessionStorage.caseAssignee.length == 0) {
                            // console.log(sessionId + " Bot will still respond as case has not been assigned yet");
                        } else {
                            // console.log(sessionId + " Bot will stop responding as case has been assigned to agent ID " + sessionStorage.caseAssignee);
                            response.sendStatus(200);
                            return null;
                        }
                    } else {
                        //handover happened, prevent Flow execution
                        console.log(sessionId + "[Sprinklr] Bot is not in control 1");
                        response.sendStatus(200);
                        return null;
                    }
                }
            } else {
                if (!ANSWER_BY_DEFAULT) {
                    // do not respond when we do not have a control status
                    console.log(sessionId + "[Sprinklr] Bot is not in control 2");
                    response.sendStatus(200);
                    return null;
                }
                else {
                    console.log(sessionId + "[Sprinklr] Bot IS IN control 2");
                    // return null;
                }
            }

            //Twitter api check
            let text = "";
            if (request.body.payload.content &&
                request.body.payload.content.text) {
                text = request.body.payload.content.text;
                if (text.startsWith("@")) {
                    sessionStorage.twitter = "tweet"
                    //remove twitter handles to prevent NLU confusion
                    text = text.replace(/(\s|^)@\S+/g, "")
                } else {
                    sessionStorage.twitter = "direct message"
                }
            }
            const data = request.body;

            const sessionIdToSend = (sessionStorage.caseId) ? sessionId + "--Cog--" + sessionStorage.caseId : sessionId;

            response.sendStatus(200);
            return {
                userId,
                sessionId: sessionIdToSend,
                text,
                data
            };
        } else {
			// Sprinklr Endpoint Check requirement
			// console.log("[Sprinklr] Ignored payload");
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
    handleOutput: async ({
        output,
        endpoint,
        userId,
        sessionId
    }) => {

        let actualSession = sessionId;
        let keyStorage = await getSessionStorage("SPRINKLR_API_KEYS", "SPRINKLR_API_KEYS");
        let KEY = await checkAvailableKeys(keyStorage)[0]
        // console.log("key extracted is " + KEY);

        if (sessionId.indexOf("--Cog--")) {
            actualSession = sessionId.split("--Cog--")[0];
        }

        const sessionStorage = await getSessionStorage(userId, actualSession);
        const [userName, chType, chId] = JSON.parse(actualSession);

        if (output.data &&
            output.data.handover) {
            if (sessionStorage.caseId) {
                //perform handover to agent
                let passRequestBody = {
                    uri: SPRINKLR_API_URL + "/thread/pass-control",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': KEY.AUTH_TOKEN.startsWith("Bearer ") ? KEY.AUTH_TOKEN : ("Bearer " + KEY.AUTH_TOKEN),
                        'Key': KEY.API_KEY
                    },
                    body: {
                        "entityType": "CASE",
                        "entityId": sessionStorage.caseId,
                        "participantId": HANDOVER_TARGET
                    },
                    json: true
                };
                const result = await httpRequest(passRequestBody);

            } else {
                console.log(sessionId + " [Sprinklr] Case Id is missing!")
            }
        }
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
    handleExecutionFinished: async ({
        processedOutput,
        outputs,
        userId,
        sessionId,
        endpoint,
        response
    }) => {

        let actualSession = sessionId;

        if (sessionId.indexOf("--Cog--")) {
            actualSession = sessionId.split("--Cog--")[0];
        }

        const sessionStorage = await getSessionStorage(userId, actualSession);
        const [userName, chType, chId] = JSON.parse(actualSession);

        let requestBody = null

        let keyStorage = await getSessionStorage("SPRINKLR_API_KEYS", "SPRINKLR_API_KEYS");
        let KEY = await checkAvailableKeys(keyStorage)[0]

        {
            {
                //construct requestBody channel specificly
                if (chType == "TWITTER") {

                    let uri,
                        text = processedOutput.text

                    if (sessionStorage.twitter &&
                        sessionStorage.twitter == "tweet") {
                        // uri = SPRINKLR_API_URL + "/publishing/reply"
                        uri = ""
                        text = "@" + userName + " " + text
                        //force shorten message to tweet standards
                        // text = text.substring(0,275)
                        text = ""
                    } else {
                        uri = SPRINKLR_API_URL + "/publishing/message"
                    }

                    requestBody = {
                        uri: uri,
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': KEY.AUTH_TOKEN.startsWith("Bearer ") ? KEY.AUTH_TOKEN : ("Bearer " + KEY.AUTH_TOKEN),
                            'Key': KEY.API_KEY
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
                            "allowDuplicateMessages": true,
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
                        uri: SPRINKLR_API_URL + "/publishing/message",
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': KEY.AUTH_TOKEN.startsWith("Bearer ") ? KEY.AUTH_TOKEN : ("Bearer " + KEY.AUTH_TOKEN),
                            'Key': KEY.API_KEY
                        },
                        body: {
                            "accountId": userId,
                            "content": {
                                "text": processedOutput.text,
                                "attachment": null
                            },
                            "scheduleDate": 0,
                            "taxonomy": {
                                "campaignId": CAMPAIGN_ID
                            },
                            "inReplyToMessageId": sessionStorage.messageId,
                            //to prevent message block 
                            "allowDuplicateMessages": true,
                            "toProfile": {
                                "channelType": chType,
                                "channelId": chId,
                                "screenName": userName
                            }
                        },
                        json: true
                    };
                }
            }

            //send to sprinklr
            try {
                console.log(sessionId + "request body is " + JSON.stringify(requestBody))
                const result = await httpRequest(requestBody);
            } catch (error) {
                if (requestBody.uri == null || requestBody.uri.length == 0) {
                    console.log(sessionId + "bot tried to respond to public mention body:" + JSON.stringify(requestBody));
                }
                else {
                    console.error(sessionId + "error while sending to Sprinklr" + error + " request is " + JSON.stringify(requestBody));
                }
                //debug
                return {
                    "error": error,
                    "request": requestBody
                }
            }
        }


        return null;
    }
});

