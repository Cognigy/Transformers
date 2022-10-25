/**
 * WhatsApp Endpoint
 * 
 * Type: Webhook
 * Documentation: https://developers.facebook.com/docs/whatsapp/getting-started/signing-up
 */
// This token can be defined by you and is used in order verify this Webhook in the Facebook Developer portal.
// If a new Webhook is created in Facebook Developer for WhatsApp, the Endpoint URL and this VERIFY_TOKEN must be provided.
// Example: Cognigy123
const VERIFY_TOKEN: string = "122585841285845ddasdsad";
// This is the phone number associated with the WhatsApp Business Account that can be found in the WhatsApp Manager platform
// Example: 104510793210612
const PAGE_ID: string = "";
// This token is used in order to authenticate the outgoing message to WhatsApp within the handleOutput() Transformer
// It can be found in the "First Steps" section of "WhatsApp" inside of the Facebook Developer portal
// Example: EAAEYl54FMww...
const ACCESS_TOKEN: string = "";
//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 60
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
interface IInstagramLocationMessage extends IinstagramMessageBasis {
    location: {
        longitude: number;
        latitude: number;
        name: string;
        address: string
    },
    access_token: string;
    type: 'location'
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
interface IInstagramContactAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    country_code: string;
    type: 'WORK' | 'HOME';
}
interface IInstagramContactEmail {
    email: string;
    type: 'WORK' | 'HOME';
}
interface IInstagramContactName {
    formatted_name: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    prefix: string;
    type: 'contacts'
}
interface IInstagramContactOrg {
    company: string;
    department: string;
    title: string;
    type: 'contacts';
}
interface IInstagramContactPhone {
    phone: string;
    type: 'WORK' | 'HOME';
    wa_id?: string;
}
interface IInstagramContactURL {
    url: string;
    type: 'WORK' | 'HOME'
}
interface IInstagramContact {
    addresses: IInstagramContactAddress[];
    birthday: string;
    emails: IInstagramContactEmail[];
    name: IInstagramContactName;
    org: IInstagramContactOrg;
    phones: IInstagramContactPhone[];
    urls: IInstagramContactURL[];
    type: 'contacts';
}
interface IInstagramContactsMessage extends IinstagramMessageBasis {
    contacts: IInstagramContact[];
    type: 'contacts';
    access_token: string;
}
type IinstagramMessage = IInstagramTextMessage | IInstagramLocationMessage | IInstagramQuickReplyMessage | IInstagramImageMessage | IInstagramVideoMessage | IInstagramAudioMessage | IInstagramContactsMessage | IInstagramTemplateMessage;
interface IInstagramMediaDownloadResponse {
    url: string;
    mime_type: string;
    sha256: string;
    file_size: number;
    id: string;
}
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

type IInstagramMessageType = 'text' | 'comment' | 'reaction';

/**
 * Downloads media content based on the ID that WhatsApp responds to Cognigy.AI
 * @param {string} `mediaId` The ID of the sent media
 * @return {IWhatsAppMediaDownloadResponse} The download URL, mime_type, file_size, and id
 */
const downloadInstagramMediaByID = async (mediaId: string): Promise<IInstagramMediaDownloadResponse> => {
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
}
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
    if (output?.data?._cognigy?._default?._video?.type === 'video') {
        const { videoUrl } = output?.data?._cognigy?._default?._video;
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            message: {
                attachment: {
                    type: 'video',
                    payload: { url: videoUrl }
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
    // Check for location message
    else if (output?.data?.location) {
        const { longitude, latitude, name, address } = output.data.location;
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            type: 'location',
            location: {
                longitude,
                latitude,
                name,
                address
            }
        }
    }
    // Check for contacts message
    else if (output?.data?.contacts) {
        const { contacts } = output?.data;
        return {
            recipient: {
                id: userId
            },
            access_token: ACCESS_TOKEN,
            type: 'contacts',
            contacts
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

            if (request?.body?.entry[0]?.messaging[0]?.message?.text) {
                instagramMessageType = 'text';
            } else if (request?.body?.entry[0]?.messaging[0]?.reaction?.reaction) {
                instagramMessageType = 'reaction';
            } else if (request?.body?.entry[0]?.changes[0]?.field === 'comments') {
                instagramMessageType = 'comment';
            } else {
                return null;
            }

            // // initialize session storage
            const sessionStorage = await getSessionStorage(userId, sessionId)
            // sessionStorage.instagramMessageType = instagramMessageType;
            // if (request?.body?.entry[0]?.changes[0]?.value?.id) {
            //     sessionStorage.commentId = request?.body?.entry[0]?.changes[0]?.value?.id;
            // }

            /**
             * Create the Cognigy.AI Input object 
             * based on the incoming Instagram message
             */

            switch (instagramMessageType) {
                case 'text':
                    userId = request?.body?.entry[0]?.messaging[0]?.sender?.id;;
                    sessionId = request?.body?.entry[0]?.messaging[0]?.recipient?.id;
                    data = {
                        ...request?.body,
                        type: 'text'
                    };
                    text = request?.body?.entry[0]?.messaging[0]?.message?.text;

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

                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }
                case 'comment':
                    userId = request?.body?.entry[0]?.changes[0]?.value?.from?.id;
                    sessionId = request?.body?.entry[0]?.changes[0]?.value?.id;
                    data = {
                        ...request?.body,
                        type: 'comment'
                    };
                    text = request?.body?.entry[0]?.changes[0]?.value?.text

                    return {
                        userId,
                        sessionId,
                        text,
                        data
                    }
                default:
                    return null;

            }
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

            /**
             * Check if there is a comment that must be replied to
             */
            let commentId = sessionStorage.commentId;

            if (sessionStorage.instagramMessageType === 'comment') {
                await httpRequest({
                    uri: `https://graph.facebook.com/v15.0/${commentId}/replies`,
                    method: "POST",
                    qs: {
                        message: output.text,
                        access_token: ACCESS_TOKEN
                    },
                    useQuerystring: true
                })
            }

            // Transform the Cognigy.AI output into a valid Instagram message object
            let instagramMessage: IinstagramMessage = transformToinstagramMessage(output, userId);

            console.log(`[Instagram] Sending message to user: ${JSON.stringify(instagramMessage)}`);

            // Send Cognigy.AI message to Instagram
            // If message is quickreplies
            if (output?.data?._cognigy?._default?._quickReplies !== null && output?.data?._cognigy?._default?._quickReplies?.type === "quick_replies" || (output?.data?._cognigy?._default?._gallery?.items)) {
                await httpRequest({
                    uri: `https://graph.facebook.com/v15.0/${PAGE_ID}/messages`,
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        // The Authorization 
                        // 'Authorization': `Bearer ${BEARER_TOKEN}`
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
                        // The Authorization 
                        // 'Authorization': `Bearer ${BEARER_TOKEN}`
                    },
                    qs: instagramMessage,
                });
            }
        } catch (error) {
            // Log error message
            console.error(`[Instagram] An error occured in Output Transformer: ${error?.message}`);
            let instagramMessage: IinstagramMessage = transformToinstagramMessage(output, userId);
            // console.log({'instagramMessage': instagramMessage})
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