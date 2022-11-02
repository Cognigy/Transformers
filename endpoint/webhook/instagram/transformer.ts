/**
 * Instagram Endpoint
 * 
 * Type: Webhook
 * Documentation: https://developers.facebook.com/docs/messenger-platform/instagram/get-started
 */

// This token can be defined by you and is used in order verify this Webhook in the Facebook Developer portal.
// If a new Webhook is created in Facebook Developer for WhatsApp, the Endpoint URL and this VERIFY_TOKEN must be provided.
// Example: Cognigy123
const VERIFY_TOKEN: string = "122585841285845ddasdsad";

// This is the page_id associated with your Instagram account in your Facebook business account. 
// Example: 104510793210612
const PAGE_ID: string = "";

// This token is used in order to authenticate the outgoing message to Instagram within the handleOutput() Transformer
// Instructions on how to create a key can be found here: https://developers.facebook.com/docs/messenger-platform/instagram/get-started in the section "5. Get the page access token"
// Example: EAAEYl54FMww...
const ACCESS_TOKEN: string = "";

//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 120

interface IinstagramMessageBasis {
    recipient: {
        id: string
    };
}
interface IInstagramTextMessage extends IinstagramMessageBasis {
    message: {
        text: string;
    },
    access_token: string;
}
interface IInstagramQuickReplyButton {
    content_type: 'text';
    title: string;
    payload: string;
}
interface IInstagramQuickReplyMessage extends IinstagramMessageBasis {
    messaging_type: 'RESPONSE',
    message: {
        text: string;
        quick_replies: IInstagramQuickReplyButton[]
    }
}
interface IInstagramImageMessage extends IinstagramMessageBasis {
    message: {
        attachment: {
            type: 'image',
            payload: {
                url: string;
            }
        }
    },
    access_token: string;
}
interface IInstagramAudioMessage extends IinstagramMessageBasis {
    message: {
        attachment: {
            type: 'audio',
            payload: {
                url: string;
            }
        }
    },
    access_token: string;
}
interface IInstagramVideoMessage extends IinstagramMessageBasis {
    message: {
        attachment: {
            type: 'video',
            payload: {
                url: string;
            }
        }
    },
    access_token: string;
}
interface IInstagramTemplateElementButtons {
    type: 'web_url' | 'postback',
    title: string
}
interface IInstagramTemplateElements {
    title: string;
    image_url: string;
    subtitle: string;
    buttons: IInstagramTemplateElementButtons[]
}
interface IInstagramTemplateMessage extends IinstagramMessageBasis {
    recipient: {
        id: string
    },
    message: {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: IInstagramTemplateElements[]
            }
        }
    }
}
interface IInstagramDataMessage extends IinstagramMessageBasis {
    recipient: {
        id: string
    },
    message: any
}
type IinstagramMessage = IInstagramTextMessage | IInstagramQuickReplyMessage | IInstagramImageMessage | IInstagramVideoMessage | IInstagramAudioMessage | IInstagramTemplateMessage | IInstagramDataMessage;
/* interface IInstagramMediaDownloadResponse {
    url: string;
    mime_type: string;
    sha256: string;
    file_size: number;
    id: string;
}*/
interface IDefaultQuickReply {
    title: string;
    payload: string;
    contentType: string;
}
interface IDefaultGallery {
    title: string;
    subtitle: string;
    imageUrl: string;
}
interface IDefaultGalleryButton {
    title: string;
    payload: string;
    type: 'postback' | 'web_url'
}

type IInstagramMessageType = 'text' | 'comment' | 'reaction' | 'video' | 'image' | 'audio' | 'share' | 'inline' | 'galleryPostback' | 'quickReplyPostback' | 'echo' | 'unsupportedFormat' | 'thelastoption';

/**
 * Downloads media content based on the ID that WhatsApp responds to Cognigy.AI
 * @param {string} `mediaId` The ID of the sent media
 * @return {IWhatsAppMediaDownloadResponse} The download URL, mime_type, file_size, and id
 */
/*const downloadInstagramMediaByID = async (mediaId: string): Promise<IInstagramMediaDownloadResponse> => {
    try {
        // Download the media content that was sent by the user. For example, an image
        return await httpRequest({
            uri: `https://graph.facebook.com/v15.0/${mediaId}`,
            method: "GET",
            headers: {
                'Accept': 'application/json',
                // The Authorization 
                // 'Authorization': `Bearer ${BEARER_TOKEN}`
            },
            json: true
        });
    } catch (error) {
        return null;
    }
}*/
const createInstagramQuickReplyButtons = (quickReplies: IDefaultQuickReply[]): IInstagramQuickReplyButton[] => {
    let InstagramQuickReplies: IInstagramQuickReplyButton[] = [];
    for (let quickReply of quickReplies) {
        InstagramQuickReplies.push({
            content_type: 'text',
            title: quickReply.title,
            payload: quickReply.payload
        });
    }
    return InstagramQuickReplies.slice(0, 3);
}
const createInstagramTemplateElements = (templateElements: IDefaultGallery[]): IInstagramTemplateElements[] => {
    let instagramTemplateElements: IInstagramTemplateElements[] = [];
    for (let element of templateElements) {
        let instagramElementButtons = []
        // @ts-ignore
        let elementButtons = element.buttons
        for (let button of elementButtons) {
            if (button.type === 'web_url') {
                instagramElementButtons.push({
                    type: 'web_url',
                    url: button.url,
                    title: button.title
                })
            } else {
                instagramElementButtons.push({
                    type: 'postback',
                    payload: button.payload,
                    title: button.title
                })
            }
        }
        instagramTemplateElements.push({
            title: element.title,
            image_url: element.imageUrl,
            subtitle: element.subtitle,
            buttons: instagramElementButtons
        });
    }
    console.log({ 'elements': instagramTemplateElements })
    return instagramTemplateElements.slice(0, 3);
}
const transformToinstagramMessage = (output: IProcessOutputData, userId: string): IinstagramMessage => {
    // Check if default text was sent
    if (output?.text && !output?.data?._cognigy?._default) {
        return {
            recipient: {
                id: userId
            },
            message: {
                text: output.text
            },
            access_token: ACCESS_TOKEN
        }
    }
    // Check for text with quick replies message
    else if (output?.data?._cognigy?._default?._quickReplies !== null && output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies") {
        let text: string = output?.data?._cognigy?._default?._quickReplies?.text;
        let quickReplies: IDefaultQuickReply[] = output?.data?._cognigy?._default?._quickReplies?.quickReplies;
        return {
            recipient: {
                id: userId
            },
            messaging_type: "RESPONSE",
            message: {
                text: text,
                quick_replies: createInstagramQuickReplyButtons(quickReplies)
            }
        }
    }
    // Check for gallery message
    if (output?.data?._cognigy?._default?._gallery?.items) {
        const galleryElements = output?.data?._cognigy?._default?._gallery?.items;
        // create gallery message as message bubble
        for (let element of galleryElements) {
            // check if image is provided
            if (element?.imageUrl === "" || element?.imageUrl === null || element?.imageUrl === undefined) {
                throw new Error('[Instagram] Gallery item is missing image url');
            }
            let templateElements: IDefaultGallery[] = output?.data?._cognigy?._default?._gallery?.items;
            /**
             * TODO:
             * - Only the first gallery element is sent to the user. Bulk messages must be possible.
             * - Buttons of gallery element must quick replies or URL buttons
             */
            return {
                recipient: {
                    id: userId
                },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'generic',
                            elements: createInstagramTemplateElements(templateElements)
                        }
                    }
                },
            }
        }
    }
    // Check for image message
    if (output?.data?._cognigy?._default?._image?.type === 'image') {
        const { imageUrl, fallbackText } = output?.data?._cognigy?._default?._image;
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            message: {
                attachment:
                {
                    type: 'image',
                    payload: {
                        url: imageUrl
                    }
                }
            }
        }
    }
    // Check for video message
    if (output?.data?.type === 'video') {
        const videoUrl = output?.data?._data?._cognigy?._default?._video?.videoUrl;
        console.log(videoUrl)

        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            message: {
                attachment: {
                    type: 'video',
                    payload: {
                        url: videoUrl
                    }
                }
            }
        }
    }
    // Check for audio message
    if (output?.data?._cognigy?._default?._audio?.type === 'audio') {
        const { audioUrl } = output?.data?._cognigy?._default?._audio;
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            message: {
                attachment: {
                    type: 'audio',
                    payload: {
                        url: audioUrl
                    }
                }
            }
        }
    }
    // Check for data message
    if (output?.data?.type === 'data') {
        const data = output.data.message
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            message: data
        }
    }
}

createWebhookTransformer({
    handleInput: async ({ endpoint, request, response }) => {


        console.info(`[Instagram] Received message from user: ${JSON.stringify(request.body)}`);

        try {
            let userId = '';
            let sessionId = '';
            let text = '';
            let data = {};


            const currentTime = moment(new Date()).unix()

            /**
             * Verify the webhook connection initially
             * when configured in developers.facebook.com portal
             */
            if (request?.query['hub.verify_token']) {
                // Parse params from the webhook verification request
                let mode = request?.query['hub.mode'];
                let token = request?.query['hub.verify_token'];
                let challenge = request?.query['hub.challenge'];
                // Check if a token and more were sent
                if (mode && token) {
                    // Check the mode and token sent are correctly
                    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                        // Respond with 200 ok and challenge token from the request
                        response.status(200).send(challenge);
                    } else {
                        // Responds with '403 Forbidden' if verfiy tokens do not match
                        response.sendStatus(403);
                    }
                }
            }

            /**
             * Check the type of the incoming Instagram user message
             * It can be a text, comment or reaction
             */
            let instagramMessageType: IInstagramMessageType;

            let postbackText;

            if (request?.body?.entry?.length) {
                if (request?.body?.entry[0]?.messaging?.length) {
                    if (request?.body?.entry[0]?.messaging[0]?.message?.is_echo === true) {
                        instagramMessageType = 'echo'
                    } else if (request?.body?.entry[0]?.messaging[0]?.message?.mid &&
                        request?.body?.entry[0]?.messaging[0]?.message?.text == undefined &&
                        request?.body?.entry[0]?.messaging[0]?.message?.quick_reply == undefined &&
                        request?.body?.entry[0]?.messaging[0]?.postback == undefined &&
                        request?.body?.entry[0]?.messaging[0]?.message?.attachments == undefined) {
                        instagramMessageType = 'inline'
                    } else if (request?.body?.entry[0]?.messaging[0]?.message?.is_unsupported === true) {
                        instagramMessageType = 'unsupportedFormat'
                    } else if (request?.body?.entry[0]?.messaging[0]?.message?.quick_reply) {
                        instagramMessageType = 'quickReplyPostback'
                        postbackText = request?.body?.entry[0]?.messaging[0]?.message?.quick_reply?.payload
                    } else if (request?.body?.entry[0]?.messaging[0]?.message?.text) {
                        instagramMessageType = 'text';
                    } else if (request?.body?.entry[0]?.messaging[0]?.message?.attachments?.length) {
                        if (request?.body?.entry[0]?.messaging[0]?.message?.attachments[0]?.type === 'video') {
                            instagramMessageType = 'video'
                        } else if (request?.body?.entry[0]?.messaging[0]?.message?.attachments[0]?.type === 'image') {
                            instagramMessageType = 'image'
                        } else if (request?.body?.entry[0]?.messaging[0]?.message?.attachments[0]?.type === 'audio') {
                            instagramMessageType = 'audio'
                        } else if (request?.body?.entry[0]?.messaging[0]?.message?.attachments[0]?.type === 'share') {
                            instagramMessageType = 'share'
                        } else {
                            return null;
                        }
                    } else if (request?.body?.entry[0]?.messaging[0]?.postback) {
                        instagramMessageType = 'galleryPostback'
                        postbackText = request?.body?.entry[0]?.messaging[0]?.postback?.payload
                    } else if (request?.body?.entry[0]?.messaging[0]?.reaction?.reaction) {
                        instagramMessageType = 'reaction';
                    } else {
                        return null;
                    }
                } else if (request?.body?.entry[0]?.changes?.length) {
                    if (request?.body?.entry[0]?.changes[0]?.field === 'comments') {
                        instagramMessageType = 'comment'
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                return null;
            }

            console.info({ "instagramMessageType": instagramMessageType })
            // // initialize session storage

            // sessionStorage.instagramMessageType = instagramMessageType;
            // if (request?.body?.entry[0]?.changes[0]?.value?.id) {
            //     sessionStorage.commentId = request?.body?.entry[0]?.changes[0]?.value?.id;
            // }

            /**
             * Create the Cognigy.AI Input object 
             * based on the incoming Instagram message
             */

            let clearUserId;
            let clearSessionId;
            let rawSessionStorage;

            switch (instagramMessageType) {
                case 'text':
                    userId = request?.body?.entry[0]?.messaging[0]?.sender?.id;
                    sessionId = request?.body?.entry[0]?.messaging[0]?.recipient?.id;
                    data = {
                        ...request?.body,
                        type: 'text'
                    };
                    text = request?.body?.entry[0]?.messaging[0]?.message?.text;

                    //initialize clear values and create rawSessionStorage
                    clearUserId = userId
                    clearSessionId = sessionId
                    rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

                    if (rawSessionStorage.timestamp) {
                        const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
                        //check for timeout if timeout is more than 0
                        if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
                            //update timestamp -> will lead to new Flow session
                            rawSessionStorage.timestamp = currentTime
                        }
                    } else {
                        //intialize timestamp
                        rawSessionStorage.timestamp = currentTime
                    }

                    userId = clearUserId
                    //by appending the timestamp to the sessionId we create a new Flow session
                    sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])

                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }

                case 'video':
                case 'audio':
                case 'image':
                case 'share':
                case 'inline':
                case 'unsupportedFormat':
                    userId = request?.body?.entry[0]?.messaging[0]?.sender?.id;
                    sessionId = request?.body?.entry[0]?.messaging[0]?.recipient?.id;
                    data = {
                        ...request?.body,
                        type: instagramMessageType
                    };
                    text = null

                    //initialize clear values and create rawSessionStorage
                    clearUserId = userId
                    clearSessionId = sessionId
                    rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

                    if (rawSessionStorage.timestamp) {
                        const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
                        //check for timeout if timeout is more than 0
                        if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
                            //update timestamp -> will lead to new Flow session
                            rawSessionStorage.timestamp = currentTime
                        }
                    } else {
                        //intialize timestamp
                        rawSessionStorage.timestamp = currentTime
                    }

                    userId = clearUserId
                    //by appending the timestamp to the sessionId we create a new Flow session
                    sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])

                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }

                case 'galleryPostback':
                case 'quickReplyPostback':
                    userId = request?.body?.entry[0]?.messaging[0]?.sender?.id;
                    sessionId = request?.body?.entry[0]?.messaging[0]?.recipient?.id;
                    data = {
                        ...request?.body,
                        type: instagramMessageType
                    };
                    text = postbackText

                    //initialize clear values and create rawSessionStorage
                    clearUserId = userId
                    clearSessionId = sessionId
                    rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

                    if (rawSessionStorage.timestamp) {
                        const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
                        //check for timeout if timeout is more than 0
                        if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)) {
                            //update timestamp -> will lead to new Flow session
                            rawSessionStorage.timestamp = currentTime
                        }
                    } else {
                        //intialize timestamp
                        rawSessionStorage.timestamp = currentTime
                    }

                    userId = clearUserId
                    //by appending the timestamp to the sessionId we create a new Flow session
                    sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])

                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }
                case 'reaction':
                    userId = request?.body?.entry[0]?.messaging[0]?.sender?.id;;
                    sessionId = request?.body?.entry[0]?.messaging[0]?.recipient?.id;
                    data = {
                        ...request?.body,
                        type: 'reaction'
                    };
                    text = request?.body?.entry[0]?.messaging[0]?.reaction?.text;

                    clearUserId = userId
                    clearSessionId = sessionId
                    rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);

                    userId = clearUserId
                    //by appending the timestamp to the sessionId we create a new Flow session
                    sessionId = JSON.stringify([clearSessionId, rawSessionStorage.timestamp])


                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }
                case 'comment':
                    if (request?.body?.entry[0]?.id === request?.body?.entry[0]?.changes[0]?.value?.from?.id)
                        return null;
                    else {
                        userId = request?.body?.entry[0]?.changes[0]?.value?.from?.id;
                        sessionId = request?.body?.entry[0]?.changes[0]?.value?.media?.id;
                        data = {
                            ...request?.body,
                            type: 'comment'
                        };
                        text = request?.body?.entry[0]?.changes[0]?.value?.text

                        clearUserId = userId
                        clearSessionId = sessionId
                        rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
                        rawSessionStorage.commentId = request?.body?.entry[0]?.changes[0]?.value?.id;
                        rawSessionStorage.instagramMessageType = 'comment'
                        return {
                            userId,
                            sessionId,
                            text,
                            data
                        }
                    }


                case 'echo':
                default:
                    return null;
            }
            //initialize clear values and create rawSessionStorage

        } catch (error) {
            // Log the error message
            console.error(`[Instagram] An error occured in Input Transformer: ${error}`);
            // Stop the execution
            return null;
        }

    },
    handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
        try {

            const sessionStorage = await getSessionStorage(userId, sessionId);

            // Transform the Cognigy.AI output into a valid Instagram message object
            console.log({ "rawCognigyOutput": output })

            let instagramMessage: IinstagramMessage = transformToinstagramMessage(output, userId);
            console.log(`[Instagram] Sending message to user: ${JSON.stringify(instagramMessage)}`);
            // Send Cognigy.AI message to Instagram
            // Check if there is a comment that must be replied to
            if (sessionStorage.commentId) {
                let commentId = sessionStorage.commentId
                console.info({ 'commentIdStorage': commentId })
                await httpRequest({
                    uri: `https://graph.facebook.com/v15.0/${commentId}/replies`,
                    method: "POST",
                    qs: {
                        message: output.text,
                        access_token: ACCESS_TOKEN
                    },
                    useQuerystring: true
                })
                // If message is quickreplies
            } else if (output?.data?._cognigy?._default?._quickReplies !== null && output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies" || (output?.data?._cognigy?._default?._gallery?.items)) {
                await httpRequest({
                    uri: `https://graph.facebook.com/v15.0/${PAGE_ID}/messages`,
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: instagramMessage,
                    json: true,
                    qs: {
                        access_token: ACCESS_TOKEN
                    },
                });
            } else { // Other formats
                await httpRequest({
                    uri: `https://graph.facebook.com/v15.0/${PAGE_ID}/messages`,
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    qs: instagramMessage,
                });
            }
        } catch (error) {
            // Log error message
            console.error(`[Instagram] An error occured in Output Transformer: ${error?.message}`);
        }
        return null;
    },
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