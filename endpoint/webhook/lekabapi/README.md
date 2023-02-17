# LEKAB Rich API

<img src="./docs/Lekab-WhatsApp.svg" width="10%">
<img src="./docs/Lekab-Wechat.svg" width="10%">
<img src="./docs/Lekab-viber.svg" width="10%">
<img src="./docs/Lekab-rich-sms-02_1.svg" width="10%">
<img src="./docs/Lekab-rcs.svg" width="10%">
<img src="./docs/Lekab-messenger.svg" width="10%">
<img src="./docs/Lekab-Line.svg" width="10%">
<img src="./docs/Lekab-Kakao-Talk.svg" width="10%">
<img src="./docs/Lekab-instagram.svg" width="10%">
<img src="./docs/Lekab-Apple-business-chat.svg" width="10%">


This transformer provides Lekab API function. Lekab API is multichannel platrform from where you can control all your channels in same place. WhatsApp, Messenger, RCS etc. The transformer converts the Default content of your Cognigy Flow nodes to valid rich content by using [LEKAB](https://www.lekab.com/en/rich-channels).

# Connection

In order to use Lekab Rich API and therefore this transfomator, one needs to sign up for the [Lekab](https://www.lekab.com/en/contact).

## Endpoint Configuration

In order to use this Transformer function, two settings need to be configured:

**Transformer Functions:**

Open the section, click on **Enable Input Transformer** and **Enable Output Transformer**. Finally, paste the entire [source code](./transformer.ts) into the dark code window.

**Authentications:**

The connection with LEKAB is established using a apikey. Therefore, the following information needs to be provided:

- **LEKAB_API_KEY =** LEKAB  'X-API-Key'
- **LEKAB_API_URL** https://secure.lekab.com/rich/lekabrich/send

## Provided Message Types

Basically every message type which is supported by the specifide channel can be send. Depending on the channel to which messages is send there are seven available message types

- [text_message](#text)
- [media_message](#media-attachments)
- [choice_message](#choice)
- [card_message](#card)
- [carousel_message](#carousel)
- [location_message](#location)
- [template_message](#template)

### Text

Use the **Text** type in the default tab of the SAY Node. 

<img src="./docs/text.png" width="50%">

### Media Attachments

One can use the default tab of the SAY Node and send, **images**, **videos** or **audio files**. An additonal description can be added by using the **Fallback Text**.

<img src="./docs/image.png" width="50%">

### Choice
 message a.k.a buttons and clickables
Tähän jotain choice viesteistä

### Card

Use the **Gallery** type of the SAY or Question Node and add ONE card to it. All Button Types are supported.

### Carousel

Use the **Gallery** type of the SAY or Question Node and add multiple cards and it's called carousel (make sure that the endpoint u are using support carousel. For example WA does not). All Button Types are supported.

### Location

Use the **Text** type of the SAY Node and define a data only message (No Text), where the data has to look like the following:

```json
{
	"type": "location",
    "title": "Teknobulevardi 3-5, Vantaa",
	"label": "Lekab Communication Systems",
	"coordinates": {
		"latitude": 60.30565815164177, 
		"longitude": 24.966011212479764
		}
}
```

This will be displayed like this:

<img src="./docs/location.png" width="50%">

### Template

WhatsApp and KakaoTalk template messages arenät supported at the moment but the feature is coming.

## Supported Message Types And Features in Lekab API Transformer

### Say Node

All output types, except "Adaptive Card" and "List" of the Say Node is supported if the channel (WhatsApp, Messenger etc.) supports them. 


### Condition: Cognigy Script is not supported, leave them empty.

### Question Node (Including Optional Question)

All Question Types except Date is supported. All output types, except "Adaptive Card" and "List" of the Say Node is supported if the channel (WhatsApp, Messenger etc.) supports them. 
