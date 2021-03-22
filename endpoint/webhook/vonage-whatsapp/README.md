# Vonage - WhatsApp

<img src="./docs/whatsapp.svg" width="30%">

This [Transformer Function](https://docs.cognigy.com/docs/transformers) converts the Default (Version 4) content of your [Say Node](https://docs.cognigy.com/docs/say-nodes) to valid [WhatsApp](https://www.whatsapp.com/) messages by using [Vonage](https://www.vonage.com/).


## Provided Message Types

- [Vonage - WhatsApp](#vonage---whatsapp)
  - [Provided Message Types](#provided-message-types)
    - [Text](#text)
    - [Media Attachments](#media-attachments)
    - [Location](#location)

### Text

Use the **Text** type in the default tab of the SAY Node. 

<img src="./docs/text.png" width="50%">

### Media Attachments

One can use the default tab of the SAY Node and send, **images**, **videos** or **audio files**. An additonal description can be added by using the **Fallback Text**.

<img src="./docs/image.png" width="50%">

### Location

Use the **Text** type of the SAY Node and define a data only message (No Text), where the data has to look like the following:

```json
{
  "location": {
    "longitude": -122.747986,
    "latitude": 37.989981,
    "name": "Your Location",
    "address": "Shoreline Highway, CA 1, California"
  }
}
```

This will be displayed like this:

<img src="./docs/location.png" width="50%">
