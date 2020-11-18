# Description
This Transformer example shows how to translate the inputs from the user as well as the outputs from the Flow in order to enable one Flow in one language to be used in other languages. In this Transformer example, the user inputs will be translated from German into English, and the English result will then be sent to the English Flow. On every Flow output, the English text in the output will be translated to German before being sent to the user.

It is also possible to adjust this example to translate to and from every other language.

# Usage
Using this Transformer requires a Microsoft Translator subscription (https://docs.microsoft.com/en-us/azure/cognitive-services/translator), which can be created for free.

To use this Transformer, the first step is to create a Webchat Endpoint in Cognigy.AI and copying the contents of the ``transformer.ts`` file into the Transformer function.

After creating the Endpoint, a subscription key for the Microsoft Translator service has to be applied in the const ``SUBSCRIPTION_KEY`` in the top of the Transformer. Additionally, the languages to translate to and from can be modified in the CONFIG variable. The default is to translate from a German user input to an English Flow. To start using the Transformer, the only thing left is to ``enable`` the  ``Input Transformer`` and the ``Output Transformer``.