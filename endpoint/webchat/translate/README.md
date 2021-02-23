# Realtime Translation Transformer

For the Cognigy Webchat.

With this Transformer function, Cognigy.AI is able to **translate messages** that were sent by the **user** and **virtual agent** automatically. In order to do so, one can select between the **Microsoft** or **Google Translator**.

## Configuration

- `TRANSLATOR`
    - The Translation tool that should be used
    - Options:
        - 'google'
        - 'microsoft'

- `TRANSLATOR_API_KEY`
    - The API Key of the selected Translation tool
- `FLOW_LANGUAGE`
    - The language of the Cognigy.AI Flow that the user is talking to. This will be the locale, such as 'en', 'de', 'fr' a.s.o
    - Options:
        - [*Read more -> Google Translate*](https://cloud.google.com/translate/docs/languages)
        - [*Read more -> Microsoft Translate*](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support)
- `AUTO_DETECT_LANGUAGE`
    - Whether the Transformer should detect the user's language or not
    - Options
        - `true`
        - `false`


## Option 1: Auto Detect Language

When this option is on (`true`), the selected Translation tool detects the language of the user's input message automatically and stores it in Cognigy.AI in order to answer in the same langauge as well.

**Example:**

<img src="./docs/autoDetectLanguageExample.PNG" width="400">

## Option 2: User Defines Language

If the user should be able to select a specific language, the `AUTO_DETECT_LANGUAGE` value should be off (`false`). In this case, the Cognigy.AI Flow needs to send the information about the preferred language by using a so-called DATA_ONLY message:

<img src="./docs/userDefinesLanguageExample.PNG" width="400">

Since the message doesn't contain a text, it is not displayed in the chat window. Thereforem, the transformer can use the value and store it internally in order to translate further messages into, in this case, *German* (de) -- for example.

**Important!**

**Please make sure that the sent `language` value fits the schema of the selected Translation tool. In order to read more about this, take a look into the linked pages in the `FLOW_LANGUAGE` configuration at the top.**

## Supported Message Types

- Text
- Text with Quick Replies
- Text with Buttons