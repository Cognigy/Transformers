/**
 * CONFIGURATION
 */

// 'google' or 'microsoft' or 'deepl'
const TRANSLATOR: string = 'deepl';
// TRANSLATOR API key
const TRANSLATOR_API_KEY = '';
// Langauge of the flow, from which bot messages and to which user messages are translated
const FLOW_LANGUAGE = 'en';
// Should the transformer detect the user language automatically from their last message
const AUTO_DETECT_LANGUAGE = true;
// Added to postbacks. If the user message starts with it, it is removed from the message and the message is not translated
const NO_TRANSLATE_PREFFIX = 'NoTranslate:';

/**
 * INTERFACES
 */

interface ITranslateGoogleBody {
  q: string[];
  target: string;
  source?: string;
}

interface ITranslateGoogleTranslation {
  detectedSourceLanguage: string;
  translatedText: string;
}

interface ITranslateGooglePromise {
  data: {
    translations: ITranslateGoogleTranslation[];
  }
}

interface ITranslateMicrosoftBody {
  Text: string;
}

interface ITranslateMicrosoftTranslation {
  text: string;
}

interface ITranslateMicrosoftPromise {
  detectedLanguage: {
    language: string;
  },
  translations: ITranslateMicrosoftTranslation[];
}

interface ITranslateDeepLTranslations {
  detected_source_language: string;
  text: string;
}

interface ITranslateDeepLPromise {
  translations: ITranslateDeepLTranslations[];
}

/**
 * Translate a list of text messages with Google
 * @param `textArray` A list of string text messages
 * @param `toLanguage` The language code of the target language
 * @param `fromLanguage` The language code of the source language
 */
async function translateGoogle(textArray: string[], toLanguage: string, fromLanguage?: string): Promise<ITranslateGooglePromise> {
  const body: ITranslateGoogleBody = { 'q': textArray, 'target': toLanguage };

  if (fromLanguage) {
    body['source'] = fromLanguage
  }

  return await httpRequest({
    method: 'POST',
    uri: `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATOR_API_KEY}`,
    headers: { 'Content-type': 'application/json' },
    body: body,
    json: true
  })
}

/**
 * Translate a list of text messages with Microsoft
 * @param `textArray` A list of string text messages
 * @param `toLanguage` The language code of the target language
 * @param `fromLanguage` The language code of the source language
 */
async function translateMicrosoft(textArray: string[], toLanguage: string, fromLanguage?: string): Promise<ITranslateMicrosoftPromise[]> {
  const body: ITranslateMicrosoftBody[] = [];

  textArray.forEach(text => {
    body.push({ 'Text': text })
  });

  let uri = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${toLanguage}`
  if (fromLanguage) {
    uri += `&from=${fromLanguage}`
  }

  return await httpRequest({
    method: 'POST',
    uri: uri,
    headers: {
      'Ocp-Apim-Subscription-Key': TRANSLATOR_API_KEY,
      'Content-type': 'application/json'//,
      // 'Accept': 'application/json',
      // 'X-ClientTraceId': uuid.v4().toString()
    },
    body: body,
    json: true
  })
}

/**
 * Translate a list of text messages with DeepL
 * @param `textArray` A list of string text messages
 * @param `toLanguage` The language code of the target language
 * @param `fromLanguage` The language code of the source language
 */
async function translateDeepL(textArray: string[], toLanguage: string, fromLanguage?: string): Promise<ITranslateDeepLPromise> {

  // Initialize string for HTTP text query paramters -> &text=...&text=...
  let textQueryString: string = '';

  // Build the text query string/s based on the number of texts in the array
  textArray.forEach(text => {
    textQueryString += `&text=${text}`
  })

  return await httpRequest({
    method: 'POST',
    uri: `https://api.deepl.com/v2/translate?auth_key=${TRANSLATOR_API_KEY}&target_lang=${toLanguage}${textQueryString}`,
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  })
}

async function translate(textsToTranslate: string[], toLanguage: string, fromLanguage: string): Promise<string[]> {
  if (toLanguage === fromLanguage) { // Do not translate e.g. en to en
    return textsToTranslate
  }

  const textsTranslated = []
  if (TRANSLATOR === 'google') {
    const googleTranslation = await translateGoogle(textsToTranslate, toLanguage, fromLanguage);
    googleTranslation.data.translations.forEach(element => {
      textsTranslated.push(element.translatedText)
    });
  } else if (TRANSLATOR === 'microsoft') {
    const microsoftTranslation = await translateMicrosoft(textsToTranslate, toLanguage, fromLanguage);
    microsoftTranslation.forEach(element => {
      textsTranslated.push(element.translations[0].text)
    });
  } else if (TRANSLATOR === 'deepl') {
    const deeplTranslation = await translateDeepL(textsToTranslate, toLanguage, fromLanguage);
    deeplTranslation.translations.forEach(element => {
      textsTranslated.push(element.text);
    });
  }

  return textsTranslated
}

async function translateBotMessage(data: any, userLanguage: string) {
  if (data?.text) { // Translate a Text message
    const textsTranslated = await translate([data.text], userLanguage, FLOW_LANGUAGE)
    data.text = textsTranslated[0]
  }

  const webchatMessage = data?.data?._cognigy?._webchat?.message // A data payload message, can have quick replies, buttons or gallery
  if (webchatMessage?.quick_replies) { // Translate a Text with Quick Replies message
    const textsToTranslate = []
    if (webchatMessage.text) { // Text above quick replies
      textsToTranslate.push(webchatMessage.text)
    }
    webchatMessage.quick_replies.forEach(quickReply => {
      if (quickReply.title) {
        textsToTranslate.push(quickReply.title)
      }
    })

    const textsTranslated = await translate(textsToTranslate, userLanguage, FLOW_LANGUAGE)
    if (webchatMessage.text) { // Text message above Quick Replies
      const index = textsToTranslate.indexOf(webchatMessage.text)
      webchatMessage.text = textsTranslated[index]
    }
    webchatMessage.quick_replies.forEach(quickReply => {
      if (quickReply.payload) { // Add a prefix to the payload to avoid translation later when it is sent back in a user message
        quickReply.payload = `${NO_TRANSLATE_PREFFIX}${quickReply.payload}`
      }
      if (quickReply.title) {
        const index = textsToTranslate.indexOf(quickReply.title)
        quickReply.title = textsTranslated[index]
      }
    })
  }

  if (webchatMessage?.attachment?.payload?.template_type === 'button') { // Translate a Text with Buttons message
    const textsToTranslate = []
    if (webchatMessage.attachment.payload.text) { // The text above buttons
      textsToTranslate.push(webchatMessage.attachment.payload.text)
    }
    webchatMessage.attachment.payload.buttons.forEach(button => {
      if (button.title) {
        textsToTranslate.push(button.title)
      }
    })

    const textsTranslated = await translate(textsToTranslate, userLanguage, FLOW_LANGUAGE)
    if (webchatMessage.attachment.payload.text) { // The text above buttons
      const index = textsToTranslate.indexOf(webchatMessage.attachment.payload.text)
      webchatMessage.attachment.payload.text = textsTranslated[index]
    }
    webchatMessage.attachment.payload.buttons.forEach(button => {
      if (button.payload) { // Add a prefix to the payload to avoid translation later when it is sent back in a user message
        button.payload = `${NO_TRANSLATE_PREFFIX}${button.payload}`
      }
      if (button.title) {
        const index = textsToTranslate.indexOf(button.title)
        button.title = textsTranslated[index]
      }
    })
  }

  if (webchatMessage?.attachment?.payload?.elements) { // Translate a Gallery message
    const textsToTranslate = []
    webchatMessage.attachment.payload.elements.forEach((element) => {
      if (element.title) {
        textsToTranslate.push(element.title)
      }
      if (element.subtitle) {
        textsToTranslate.push(element.subtitle)
      }
      if (element.buttons) {
        element.buttons.forEach(button => {
          if (button.title) {
            textsToTranslate.push(button.title)
          }
        })
      }
    })

    const textsTranslated = await translate(textsToTranslate, userLanguage, FLOW_LANGUAGE)
    webchatMessage.attachment.payload.elements.forEach((element) => {
      if (element.title) {
        const index = textsToTranslate.indexOf(element.title)
        element.title = textsTranslated[index]
      }
      if (element.subtitle) {
        const index = textsToTranslate.indexOf(element.subtitle)
        element.subtitle = textsTranslated[index]
      }
      if (element.buttons) {
        element.buttons.forEach(button => {
          if (button.title) {
            const index = textsToTranslate.indexOf(button.title)
            button.title = textsTranslated[index]
          }
          if (button.payload) { // Add a prefix to the payload to avoid translation later when it is sent back in a user message
            button.payload = `${NO_TRANSLATE_PREFFIX}${button.payload}`
          }
        })
      }
    })
  }

  return data;
}

createSocketTransformer({
  handleInput: async ({ payload, endpoint }) => {
    const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId)

    if (payload?.data?.language) { // Current message from the user contains the desired language in the data payload
      sessionStorage.language = payload.data.language;
    }

    const userText = payload?.text;

    let translatedText;
    if (!userText) {
      // There is no text in this message, e.g. this is a data-only message from a webchat extension
      translatedText = userText
    } else if (userText.startsWith(NO_TRANSLATE_PREFFIX)) {
      // Neither translate nor detect language when processing a postback
      translatedText = userText.substring(NO_TRANSLATE_PREFFIX.length)  // Remove the NO_TRANSLATE_PREFFIX from the user message
    } else if (TRANSLATOR === 'google') {
      let googleTranslation
      if (sessionStorage.language && !AUTO_DETECT_LANGUAGE) {
        // User language detection is off AND the user language is known 
        googleTranslation = await translateGoogle([payload.text], FLOW_LANGUAGE, sessionStorage.language)
      } else { // Let Google Translate API detect the language automatically
        googleTranslation = await translateGoogle([payload.text], FLOW_LANGUAGE); // Let the translate API detect the language
      }

      if (googleTranslation.data?.translations[0]?.detectedSourceLanguage) { // Remember the detected language in the session storage
        sessionStorage.detectedLanguage = googleTranslation.data.translations[0].detectedSourceLanguage
      }
      translatedText = googleTranslation.data.translations[0].translatedText
    } else if (TRANSLATOR === 'microsoft') {
      let microsoftTranslation
      if (sessionStorage.language && !AUTO_DETECT_LANGUAGE) {
        // User language detection is off AND the user language is known 
        microsoftTranslation = await translateMicrosoft([payload.text], FLOW_LANGUAGE, sessionStorage.language)
      } else { // Let Microsoft Translate API detect the language automatically
        microsoftTranslation = await translateMicrosoft([payload.text], FLOW_LANGUAGE);
      }

      if (microsoftTranslation[0]?.detectedLanguage?.language) { // Remember the detected language in the session storage
        sessionStorage.detectedLanguage = microsoftTranslation[0].detectedLanguage.language
      }
      translatedText = microsoftTranslation[0].translations[0].text
    } else if (TRANSLATOR === 'deepl') {
      let deeplTranslation;
      if (sessionStorage.language && !AUTO_DETECT_LANGUAGE) {
        // User language detection is off AND the user language is known
        deeplTranslation = await translateDeepL([payload.text], FLOW_LANGUAGE, sessionStorage.language);
      } else { // Let DeepL Translate API detect the language automatically
        deeplTranslation = await translateDeepL([payload.text], FLOW_LANGUAGE);
      }

      if (deeplTranslation.translations[0]?.detected_source_language) {
        sessionStorage.detectedLanguage = deeplTranslation.translations[0]?.detected_source_language;
      }

      translatedText = deeplTranslation.translations[0].text;
    }

    return {
      userId: payload.userId,
      sessionId: payload.sessionId,
      text: translatedText,
      data: payload.data
    }
  },
  handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
    const sessionStorage = await getSessionStorage(userId, sessionId)
    if (processedOutput?.data?.language) {
      // Current message from the bot contains the desired translation language in the data payload
      sessionStorage.language = processedOutput.data.language
    }

    let userLanguage = sessionStorage.language
    if (AUTO_DETECT_LANGUAGE && sessionStorage.detectedLanguage) { // Use the language detected by the translate API in a user message
      userLanguage = sessionStorage.detectedLanguage
    }

    if (userLanguage) {  // If the destination language is known then translate the message from the bot
      return await translateBotMessage(processedOutput, userLanguage)
    }

    return processedOutput
  }
})