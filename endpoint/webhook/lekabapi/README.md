# LEKAB Rich API

| WhatsApp | WeChat  | Viber  | Rich SMS  |  RCS | Messenger | Line  | KakaoTalk | Instagram | Apple Business Chat       |
|:--------:|:-------:|:------:|:---------:|:----:|:---------:|:-----:|:---------:|:---------:|:-------------------------:|
|![](./docs/Lekab-WhatsApp.svg)|![](./docs/Lekab-Wechat.svg)|![](./docs/Lekab-viber.svg)|![](./docs/Lekab-rich-sms-02_1.svg)|![](./docs/Lekab-rcs.svg)|![](./docs/Lekab-messenger.svg)|![](./docs/Lekab-Line.svg)|![](./docs/Lekab-Kakao-Talk.svg)|![](./docs/Lekab-instagram.svg)|![](./docs/Lekab-Apple-business-chat.svg)|


This transformer provides LEKAB API functionality. LEKAB API is a multichannel platform where you can control all your channels in one place, including WhatsApp, Messenger, RCS, and more. The transformer converts the default content of your Cognigy flow nodes to valid rich content by using [LEKAB](https://www.lekab.com/en/rich-channels).

# Connection

To use the LEKAB Rich API and, therefore, this transformer, one needs to sign up for [LEKAB](https://app.lekab.com/wp/signup).

## Endpoint Configuration

To use this transformer, two settings need to be configured:

**Transformer Functions:**

Open the section, click on **Enable Input Transformer** and **Enable Output Transformer**. Finally, paste the entire [source code](./transformer.ts) into the dark code window.

**Authentications:**

The connection with LEKAB is established using an API key. The following information needs to be provided:

- **LEKAB_API_KEY =** LEKAB  'X-API-Key'
- **LEKAB_API_URL** https://secure.lekab.com/rich/lekabrich/send

## Provided Message Types

Each message type, supported in the specified channel, can be sent. Depending on the channel to which the message is sent, there are seven available message types:

- [text_message](#text)
- [media_message](#media-attachments)
- [choice_message](#choice)
- [card_message](#card)
- [carousel_message](#carousel)
- [location_message](#location)
- [template_message](#template)

### Text

Use the **Text** type in the default tab of the Say Node.

### Media Attachments

One can use the default tab of the Say Node and send **images**, **videos**, or **audio** files. An additional description can be added by using the **Fallback Text**.

### Choice

Use the **Text with Buttons** type of the Say or Question Node.

### Card

Use the **Gallery** type of the Say or Question Node and add exactly one card to it. All button types are supported.

### Carousel

Use the **Gallery** type of the Say or Question Node and add multiple cards, and it's called a carousel (check the channel-specific restriction). All button types are supported.

### Location

Use the **Text** type of the SAY Node and define a data-only message (No Text), where the data must look like this:

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

### Template

>Note: WhatsApp and KakaoTalk template messages aren't supported.

## Supported Message Types and Features in LEKAB API Transformer

### Say Node

Each output type, except the **Adaptive Card** and **List** of the Say Node, is supported if the channel (WhatsApp, Messenger, etc.) supports them.

### Condition

Cognigy Script is not supported, leave them empty.

### Question Node (Including Optional Question)

All Question types except date are supported. All output types, except the **Adaptive Card** and **List** of the Question Node, are supported if the channel (WhatsApp, Messenger, etc.) supports them.