const cognitiveServiceUrl = "https://germanywestcentral.api.cognitive.microsoft.com/text/analytics/v3.0/sentiment"
const cognitiveServiceKey = ""
//@ts-ignore

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
        //@ts-ignore
        const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId);
        sessionStorage.id++

        if (payload?.data?._cognigy?.event?.type === "user-connected") {
            return null
        }

        let text = payload.text
        let data = {}

        console.info(payload)
        //@ts-ignore
        const result = await httpRequest({
            url: cognitiveServiceUrl,
            headers: {
                "Ocp-Apim-Subscription-Key": cognitiveServiceKey,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: {
                "documents": [
                    {
                        "id": sessionStorage.id,
                        "text": text
                    }
                ]

            },
            json: true
        });

        console.log(result)
        if (payload.data) {
            data["payload"]
        }
        data["sentiment"] = result


        return {
            userId: payload.userId,
            sessionId: payload.sessionId,
            text: text,
            data: data
        };
    }
});