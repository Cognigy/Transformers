# Introduction
This repository contains multiple Transformer examples that shows how to work with Transformers. The repository contains the following examples:

## Contents

- [Releases](./RELEASES.md)
- [Transformers](./transformers/)
- [Concepts](./CONCEPTS.md)

## Overview

This repository contains the source code of existing [Transformer functions](https://docs.cognigy.com/docs/transformers) which can be used as blueprints for further developments. Therefore, all of them are provided under the [MIT license](./LICENSE).

You are free to add a new Transformers by creating a feature branch or suggest changes on already published modules.


## Approval Process

If you want us to approve your code, please note the following approval process:

1. Add a `README.md` to your transformer and describe it in detail.
2. Check your code for hardcoded passwords, tokens or outdated JavaScript/TypeScript usage (e.g. `var foo;`).
3. Create a new Pull Request for your Transformer function feature branch.
4. Send all information and data, which are required to use the code, to the following E-Mail address:
    - support at cognigy.com

**Important:** \
Please note, that Cogngiy does not provide enterprise support for developed Transformers. This repository is licensed under MIT, in which the community is responsible for the shared functions. If you found a bug or want to improve yet developed functionalities, please don't hesitate to create a branch.

### Create a new Transformer or fix a bug

In order to create a new Transformer, please create a new feature branch:

- `git checkout -b feature/<your-feature>`

If you want to fix an existing one, please create a bug branch:

- `git checkout -b bug/<module-name>`

---

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
