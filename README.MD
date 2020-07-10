# Introduction
This repository contains multiple Transformer examples that shows how to work with Transformers. The repository contains the following examples:

## Contents

- [Releases](./RELEASES.md)
- [Transformers](./transformers/)

### Transformers - Short Description
- **Custom Endpoint Transformer:**
  This Transformer shows how to build a custom integration with an Endpoint not supported natively by Cognigy.AI (Telegram).
- **Handover Transformer:**
  This Transformer shows how to build an integration with an agent handover tool. The Transformer includes examples of HTTP Requests and the Session Storage.
- **Translation Transformer:**
  This Transformer translates the input from the user into the language of the Flow (e.g. from German to English), and translates the outputs from the Flow into the language of the user (e.g. from English to German).
- **Webchat Rich Content Transformer:**
  This Transformer shows how to transform rich content build for the Webchat using the Say Node Editor to another format for another channel (Sunshine Conversations).

Every Transformer example contains a ``transformer.ts`` file, whose contents can simply be copied into the Transformer Function of the specified Endpoint. Every Transformer also contains its own README.MD file with more details about the specific example.