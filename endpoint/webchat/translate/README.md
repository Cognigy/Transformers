# Realtime Translation Transformer
For the Cognigy Webchat endpoint.

With this Transformer function, Cognigy.AI is able to translate messages that were sent by the user and virtual agent automatically using **Microsoft Translate** or **Google Translate** API.

## Configuration

- `TRANSLATOR` - which API to use, can be 'google' or 'microsoft'
- `TRANSLATOR_API_KEY` - the API Key of the selected API
- `FLOW_LANGUAGE` - the language of the Cognigy.AI Flow in a two-letter code format, e.g. 'en', 'de', 'fr'. Read more: [Google Translate](https://cloud.google.com/translate/docs/languages), [Microsoft Translate](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support)
- `AUTO_DETECT_LANGUAGE` - should the Transformer detect the user messages language automatically, which is returned by the translation API. Can be  `true` or `false`
- `NO_TRANSLATE_PREFFIX` - a prefix text, which is added before the postback of the buttons. Later, if the user clicks on a button, the prefix is automatically removed and the postback text is handled directly to the flow without being translated.

## Option 1: Auto Detect Language

When this option is on (`true`), the selected Translation tool detects the language of the user's input message automatically and stores it in Cognigy.AI in order to answer in the same langauge as well.

**Example:**

<img src="./docs/autoDetectLanguageExample.PNG" width="400">

## Option 2: User Defines Language

If the user should be able to select a specific language, the `AUTO_DETECT_LANGUAGE` value should be off (`false`). In this case, the Cognigy.AI Flow needs to send the information about the preferred language by using a so-called DATA_ONLY message:

<img src="./docs/userDefinesLanguageExample.PNG" width="400">

Since the message doesn't contain a text, it is not displayed in the chat window. Thereforem, the transformer can use the value and store it internally in order to translate further messages into, in this case, *German* (de) -- for example.

**Important!**

Please make sure that the sent `language` value fits the schema of the selected Translation tool. In order to read more about this, take a look into the linked pages in the `FLOW_LANGUAGE` configuration at the top.

## Supported Message Types

- Text
- Text with Quick Replies
- Text with Buttons
- Gallery