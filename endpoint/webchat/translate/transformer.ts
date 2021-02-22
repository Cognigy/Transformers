/**
 * Configuration
 */

// 'google' or 'microsoft'
const TRANSLATOR: string = 'google';
// The Google or Microsoft translate API key
const TRANSLATOR_API_KEY: string = "";
// The langauge of the Cognigy.AI Flow
const FLOW_LANGUAGE: string = "en"
// Whether the Transformer should detect the user's language or not
const AUTO_DETECT_LANGUAGE: boolean = true;

/**
 * Interfaces
 */
interface IGoogleTranslateTranslationObject {
    translatedText: string;
    detectedSourceLanguage: string;
}

interface IGoogleTranslateDataObject {
    translations: IGoogleTranslateTranslationObject[];
}

interface IGoogleTranslateResponse {
    data: IGoogleTranslateDataObject;
}

interface IMicrosoftTranslateTranslationObject {
    text: string;
    to: string;
}

interface IMicrosoftTranslateDetectedLanguageObject {
    language: string;
    score: number;
}

interface IMicrosoftTranslateResponse {
    detectedLanguage: IMicrosoftTranslateDetectedLanguageObject;
    translations: IMicrosoftTranslateTranslationObject[];
}

interface IMicrosoftTranslateRequestBody {
    text: string;
}

/**
 * Google Translate HTTP Request function
 * @param {string[]} `textArray` A list of texts that should get translated
 * @param {string} `language` The locale, such as de or en
 */
async function googleTranslate(textArray: string[], language: string): Promise<IGoogleTranslateResponse> {

    try {
        const googleOptions = {
            method: 'POST',
            uri: `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATOR_API_KEY}`,
            headers: {
                'Content-type': 'application/json'
            },
            body: {
                "q": textArray,
                "target": language
            },
            json: true
        };

        const response = await httpRequest(googleOptions);

        return response;
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Microsoft Translate HTTP Request function
 * @param {string[]} `textArray` A list of texts that should get translated
 * @param {string} `language` The locale, such as de or en
 */
async function microsoftTranslate(textArray: string[], language: string): Promise<IMicrosoftTranslateResponse[]> {

    let microsoftTextArray: IMicrosoftTranslateRequestBody[] = [];

    // Fill the microsoftTextArray with a valid format of information
    for (let text of textArray) {
        microsoftTextArray.push({
            text
        });
    }

    try {
        const microsoftOptions = {
            method: 'POST',
            uri: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${language}`,
            headers: {
                'Ocp-Apim-Subscription-Key': TRANSLATOR_API_KEY,
                'Content-type': 'application/json',
                'Accept': 'application/json',
                'X-ClientTraceId': uuid.v4().toString()
            },
            body: microsoftTextArray,
            json: true
        };

        const response = await httpRequest(microsoftOptions);

        return response;
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Translate the Cognigy.AI Webchat message into the selected language
 * @param {any} `data` The Cognigy.AI data template message, such as Text, Text with Quick Replies, List or Gallery
 * @param {string} `language` The locale to translate to, such as de or en
 */
async function translateCognigyMessage(data: any, language: string) {

    let translation: (IGoogleTranslateResponse | IMicrosoftTranslateResponse[]);
    let textArray: string[] = [];

    // Check if type is text
    if (data.text) {
        // Check the selected translator
        switch (TRANSLATOR) {
            case 'google':
                translation = await googleTranslate([data.text], language);
                data.text = translation.data.translations[0].translatedText;
                break;
            case 'microsoft':
                translation = await microsoftTranslate([data.text], language);
                data.text = translation[0].translations[0].text;
                break;
        }
    }

    // Check for Webchat Quick Replies
    if (data?.data?._cognigy?._webchat?.message?.quick_replies) {

        // Translate the text of the quick reply text
        textArray.push(data.data._cognigy._webchat.message.text);

        // Loop through the quick replies
        for (let quickReply of data.data._cognigy._webchat?.message?.quick_replies) {
            // Get the index of the current sentence in the list of sentences called 'text'
            let index = data.data._cognigy._webchat?.message?.quick_replies.indexOf(quickReply);
            textArray.push(data.data._cognigy._webchat?.message?.quick_replies[index].title);
        }

        // Check the selected translator
        switch (TRANSLATOR) {
            case 'google':
                translation = await googleTranslate(textArray, language);

                /** Translate message */
                data.data._cognigy._webchat.message.text = translation.data.translations[0].translatedText;

                for (let quickReply of data.data._cognigy._webchat?.message?.quick_replies) {
                    // Get the index of the current sentence in the list of sentences called 'text'
                    let index = data.data._cognigy._webchat?.message?.quick_replies.indexOf(quickReply);
                    data.data._cognigy._webchat.message.quick_replies[index].title = translation.data.translations[index + 1].translatedText
                }

                break;
            case 'microsoft':
                translation = await microsoftTranslate(textArray, language);

                /** Translate message */
                data.data._cognigy._webchat.message.text = translation[0].translations[0].text;

                for (let quickReply of data.data._cognigy._webchat?.message?.quick_replies) {
                    // Get the index of the current sentence in the list of sentences called 'text'
                    let index = data.data._cognigy._webchat?.message?.quick_replies.indexOf(quickReply);
                    data.data._cognigy._webchat.message.quick_replies[index].title = translation[0].translations[index + 1].text
                }

                break;
        }
    }

    // Check for Webchat Buttons
    if (data.data?._cognigy?._webchat?.message?.attachment?.payload?.template_type === 'button') {

        // Translate the text of the quick reply text
        textArray.push(data.data._cognigy._webchat.message.attachment.payload.text);

        // Loop through the quick replies
        for (let button of data.data._cognigy._webchat?.message?.attachment.payload.buttons) {
            // Get the index of the current sentence in the list of sentences called 'text'
            let index = data.data._cognigy._webchat?.message?.attachment.payload.buttons.indexOf(button);
            textArray.push(data.data._cognigy._webchat?.message?.attachment.payload.buttons[index].title);
        }

        translation = await googleTranslate(textArray, language);

        data.data._cognigy._webchat.message.attachment.payload.text = translation.data.translations[0].translatedText;

        for (let button of data.data._cognigy._webchat?.message?.attachment.payload.buttons) {
            // Get the index of the current sentence in the list of sentences called 'text'
            let index = data.data._cognigy._webchat?.message?.attachment.payload.buttons.indexOf(button);
            data.data._cognigy._webchat.message.attachment.payload.buttons[index].title = translation.data.translations[index + 1].translatedText
        }
    }

    // Check if type is list
    if (data?.data?._cognigy?._webchat?.message?.attachment?.payload?.template_type === 'list') {

        // Loop through the list buttons
        for (let element of data.data._cognigy._webchat?.message?.attachment.payload.elements) {
            let index = data.data._cognigy._webchat?.message?.attachment.payload.elements.indexOf(element);
            textArray.push(data.data._cognigy._webchat?.message?.attachment.payload.elements[index].title);
            textArray.push(data.data._cognigy._webchat?.message?.attachment.payload.elements[index].subtitle);
        }

        translation = await googleTranslate(textArray, language);

        for (let element of data.data._cognigy._webchat?.message?.attachment.payload.elements) {
            // Get the index of the current sentence in the list of sentences called 'text'
            let index = data.data._cognigy._webchat?.message?.attachment.payload.elements.indexOf(element);
            data.data._cognigy._webchat.message.attachment.payload.elements[index].title = translation.data.translations[index].translatedText
            data.data._cognigy._webchat.message.attachment.payload.elements[index].subtitle = translation.data.translations[index + 1].translatedText
        }
    }
    return data;
}


/**
 * Get the Google Translate Locale from plain text language
 * @param {string} `language` The language string such as English or German
 */
function getLocale(language: string) {

    switch (language) {
        case "German":
            return 'de';
        case "French":
            return 'fr';
        case "English":
            return 'en';
        default:
            return 'en';
    }
}


createSocketTransformer({

    handleInput: async ({ payload, endpoint }) => {

        // Now the language could be used in order to tanslate the user's text, for example
        let translation: (IGoogleTranslateResponse | IMicrosoftTranslateResponse[]);
        let detectedSourceLanguage: string;
        let sessionStorage = await getSessionStorage(payload.userId, payload.sessionId);

        switch (TRANSLATOR) {
            case 'google':
                translation = await googleTranslate([payload.text], FLOW_LANGUAGE);

                // Write detected language into the session storage
                if (AUTO_DETECT_LANGUAGE) {
                    detectedSourceLanguage = translation.data.translations[0].detectedSourceLanguage;
                    sessionStorage.detectedSourceLanguage = detectedSourceLanguage;
                }

                return {
                    userId: payload.userId,
                    sessionId: payload.sessionId,
                    // @ts-ignore
                    text: translation.data.translations[0].translatedText,
                    data: payload.data
                };
            case 'microsoft':
                translation = await microsoftTranslate([payload.text], FLOW_LANGUAGE);

                if (AUTO_DETECT_LANGUAGE) {
                    // Write detected language into the session storage
                    detectedSourceLanguage = translation[0].detectedLanguage.language;
                    sessionStorage.detectedSourceLanguage = detectedSourceLanguage;
                }

                return {
                    userId: payload.userId,
                    sessionId: payload.sessionId,
                    text: translation[0].translations[0].text,
                    data: payload.data
                };
            default:
                return {
                    userId: payload.userId,
                    sessionId: payload.sessionId,
                    text: payload.text,
                    data: payload.data
                };
        }
    },
    handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {

        // Create Session Storage
        const sessionStorage = await getSessionStorage(userId, sessionId);

        // Check if language information is provided
        if (processedOutput?.data?.language) {
            sessionStorage.language = processedOutput.data.language;
        }

        if (AUTO_DETECT_LANGUAGE) {
            const detectedSourceLanguage: string = sessionStorage?.detectedSourceLanguage;

            // Translate the outgoing message
            const translatedProcessedOutput = await translateCognigyMessage(processedOutput, detectedSourceLanguage)
            return translatedProcessedOutput;

        } else if (sessionStorage.language) {
            // Get stored language
            const language = sessionStorage?.language;
            let locale = getLocale(language);

            // Translate the outgoing message
            const translatedProcessedOutput = await translateCognigyMessage(processedOutput, locale)
            return translatedProcessedOutput;
        }

        return processedOutput;
    },
    handleExecutionFinished: async ({ sessionId, userId, endpoint }) => {
    },
    handleInject: async ({ request, response, endpoint }) => {

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