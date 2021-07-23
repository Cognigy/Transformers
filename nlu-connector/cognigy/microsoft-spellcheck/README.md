# Microsoft Spellcheck

This Transformer uses the [Microsoft Cognitive Services](https://docs.microsoft.com/de-de/azure/cognitive-services/bing-spell-check/quickstarts/nodejs) in order to check the spelling of the incoming user message.

## Functionality

If it is the case, that the user sent a misspelled text, the Transformer will overwrite `input.text` with the first found suggestion. The detailed result, however, is stored in `input.data`.

```json
{
    "data": {
        "spellcheck": [
            { 
                "offset":0,
                "token":"famili",
                "type":"UnknownToken",
                "suggestions": [
                    {
                        "suggestion":"family",
                        "score":0.7860625107148129
                    },
                    {
                        "suggestion":"familia",
                        "score":0.5813920633311034
                    }
                ]
            }
        ]
    }
}
```
