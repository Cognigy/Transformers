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
        
        let whatsapp1 = {
            "from": userId,
            "contentType": "media",
            "media": {
                "type": "image",
                "url": processedOutput.data._cognigy._facebook.message.attachment.payload.url
            }
        }
            
        let whatsapp2 = {
            "from": userId,
            "contentType": "text",
            "text": processedOutput.text
        }

        let whatsapp3 = {
            "from": userId,
            "contentType": "template",
            "template": {
                "templateId": "appointment_confirmation",
                "language": {
                    "policy": "deterministic",
                    "code": "en"
                },
                "components": [
                    {
                    "type": "body",
                    "parameters": [
                        {
                        "type": "text",
                        "text": "10.02.2020"
                        },
                        {
                        "type": "text",
                        "text": "20:00"
                        }
                    ]
                    }
                ]
            }
        }

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
                "whatsapp": whatsapp3
            },
            json: true
        });    
    }
});