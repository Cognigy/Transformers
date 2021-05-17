const TRANSLATOR: string = 'google' // 'google' or 'microsoft'
const TRANSLATOR_API_KEY = 'YourApiKey' // TRANSLATOR API key

const FLOW_LANGUAGE = 'en' // Langauge of the flow, from which bot messages and to which user messages are translated
const AUTO_DETECT_LANGUAGE = true // Should the transformer detect the user language automatically from their last message
const NO_TRANSLATE_PREFFIX = 'NoTranslate:' // Added to postbacks. If the user message starts with it, it is removed from the message and the message is not translated

async function translateGoogle(textArray: string[], userLanguage: string): Promise<any> {
  return await httpRequest({
    method: 'POST',
    uri: `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATOR_API_KEY}`,
    headers: { 'Content-type': 'application/json' },
    body: { 'q': textArray, 'target': userLanguage },
    json: true
  })
}

async function translateMicrosoft(textsToTranslate: string[], userLanguage: string): Promise<any> {
  let microsoftTextArray = []
  textsToTranslate.forEach(textToTranslate => {
    microsoftTextArray.push(textToTranslate)
  })

  return await httpRequest({
    method: 'POST',
    uri: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${userLanguage}`,
    headers: {
      'Ocp-Apim-Subscription-Key': TRANSLATOR_API_KEY,
      'Content-type': 'application/json',
      'Accept': 'application/json',
      'X-ClientTraceId': uuid.v4().toString()
    },
    body: microsoftTextArray,
    json: true
  })
}

async function translate(textsToTranslate: string[], userLanguage: string): Promise<string[]> {
  if (userLanguage === FLOW_LANGUAGE) { // Do not translate e.g. en to en
    return textsToTranslate
  }

  const translatedTexts = []
  if (TRANSLATOR == 'google') {
    const googleTranslation = await translateGoogle(textsToTranslate, userLanguage)
    googleTranslation.data.translations.forEach(element => {
      translatedTexts.push(element.translatedText)
    })
  } else if (TRANSLATOR == 'microsoft') {
    const microsoftTranslation = await translateMicrosoft(textsToTranslate, userLanguage)
    microsoftTranslation.forEach(element => {
      translatedTexts.push(element.translations[0].text)
    })
  }

  return translatedTexts
}

async function translateBotMessage(data: any, userLanguage: string) {
  if (data?.text) { // Translate a Text message
    const textsTranslated = await translate([data.text], userLanguage)
    data.text = textsTranslated[0]
  }

  const webchatMessage = data?.data?._cognigy?._webchat?.message // A data payload message, can have quick replies, buttons or gallery
  if (webchatMessage?.quick_replies) { // Translate a Text with Quick Replies message
    let textsToTranslate = []
    if (webchatMessage.text) { // Text above quick replies
      textsToTranslate.push(webchatMessage.text)
    }
    webchatMessage.quick_replies.forEach(quickReply => {
      if (quickReply.title) {
        textsToTranslate.push(quickReply.title)
      }
    })

    const textsTranslated = await translate(textsToTranslate, userLanguage)
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
    let textsToTranslate = []
    if (webchatMessage.attachment.payload.text) { // The text above buttons
      textsToTranslate.push(webchatMessage.attachment.payload.text)
    }
    webchatMessage.attachment.payload.buttons.forEach(button => {
      if (button.title) {
        textsToTranslate.push(button.title)
      }
    })

    const textsTranslated = await translate(textsToTranslate, userLanguage)
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

  if (data.data?._cognigy?._webchat?.message?.attachment?.payload?.elements) { // Translate a Gallery message
    const galleryElements = data.data._cognigy._webchat.message.attachment.payload.elements

    let textsToTranslate = []
    galleryElements.forEach((element) => {
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

    const textsTranslated = await translate(textsToTranslate, userLanguage)

    galleryElements.forEach((element) => {
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
        })
      }
    })
  }

  return data
}

createSocketTransformer({
  handleInput: async ({ payload, endpoint }) => {
    const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId)
    const userText = payload.text

    let translatedText
    if (userText.startsWith(NO_TRANSLATE_PREFFIX)) {
      translatedText = userText.substring(NO_TRANSLATE_PREFFIX.length)
    } else if (TRANSLATOR === 'google') {
      const googleTranslation = await translateGoogle([payload.text], FLOW_LANGUAGE)
      // Remember the detected language in the session storage
      sessionStorage.detectedLanguage = googleTranslation.data.translations[0].detectedSourceLanguage
      translatedText = googleTranslation.data.translations[0].translatedText
    } else if (TRANSLATOR === 'microsoft') {
      const msTranslation = await translateMicrosoft([payload.text], FLOW_LANGUAGE)
      // Remember the detected language in the session storage
      sessionStorage.detectedLanguage = msTranslation[0].detectedLanguage.language
      translatedText = msTranslation[0].translations[0].text
    } else {
      throw new Error(`TRANSLATOR should be either 'google' or 'microsoft'`)
    }

    return {
      userId: payload.userId,
      sessionId: payload.sessionId, // @ts-ignore
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
    if (AUTO_DETECT_LANGUAGE && sessionStorage.detectedLanguage) {
      userLanguage = sessionStorage.detectedLanguage
    }

    if (userLanguage) {  // If the destination language is known then translate the message from the bot
      return await translateBotMessage(processedOutput, userLanguage)
    }

    return processedOutput
  }
})
