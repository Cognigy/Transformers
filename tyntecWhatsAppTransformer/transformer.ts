/**
 * Tyntec WhatsApp interfaces
 */
interface IWhatsAppMessageBase {
    from: string;
}
interface IWhatsAppMediaMessage extends IWhatsAppMessageBase {
    contentType: 'media';
    media: {
        type: 'image';
         url: string;
    }
}

interface IWhatsAppTextMessage extends IWhatsAppMessageBase {
    contentType: 'text';
    text: string;
}

interface IWhatsAppTemplateMessage extends IWhatsAppMessageBase {
    contentType: 'template';
    template: {
        templateId: string;
        language: {
            policy: string;
            code: 'en' | 'de';
        };
        components: IWhatsAppTemplateComponent[];
    };
}

interface IWhatsAppTemplateComponent {
    type: 'body' | string;
    parameters: IWhatsAppTemplateComponentParameter[];
}

interface IWhatsAppTemplateComponentParameter {
    type: 'text' | string;
    text: string;
}

type TWhatsAppContent = IWhatsAppTextMessage | IWhatsAppMediaMessage | IWhatsAppTemplateMessage;

const convertWebchatContentToWhatsApp = (processedOutput, userId: string): TWhatsAppContent => {
            // check if default text was sent
        if (processedOutput.text != '') {
            // send default text
            return {
                from: userId,
                contentType: "text",
                text: processedOutput.text
            }
        }
        // check if webchat templates are defined
        else if (processedOutput.data._cognigy._webchat != null) {
            let webchatContent = processedOutput.data._cognigy._webchat;

            // check if an image is defined
            if (webchatContent.message.attachment.type === 'image') {

                let imageUrl: string = webchatContent.message.attachment.payload.url;
                return {
                    from: userId,
                    contentType: "media",
                    media: {
                        type: "image",
                        url: imageUrl
                    }
                }
            }

        }
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
        const userId = request.body.to;
        const sessionId = request.body.from;
        const text = request.body.content.text;
        const data = request.body;
 
        return {
            userId,
            sessionId,
            text,
            data
        };
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
    
    // TODO: Check if you can use mixed output - two different types of messages in one output.
 
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
        
        let whatsapp: TWhatsAppContent = convertWebchatContentToWhatsApp(processedOutput, userId);
        
        return await httpRequest({
            uri: "https://api.tyntec.com/chat-api/v2/messages",
            method: "POST",
            headers : {
            'Content-Type':'application/json',
            'Accept':'application/json',
            'apikey': ''
            },
            body: {
                "to": sessionId,
                "channels": [
                    "whatsapp"
                ],
                "whatsapp": whatsapp
            },
            json: true
        });    
    }
});