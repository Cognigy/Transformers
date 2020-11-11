# Description
Avaya Voice Channel Transformer translates the communication between Avaya CPaaS calls,sms messages and Cognigy's text in real time.

## Avaya CPaaS
In order to use this Transformer you need to get the free trial Avaya CPaaS account at [Avaya CPaaS](https://www.avaya.com/en/products/cpaas/). In the Avaya CPaaS dashboard you can purcahse a phone number which will be used to link with your Cognigy's endpoint as stated below.

## Cognigy
You need to have access to Cognigy to create an agent first. You will need to download the Avaya Extension from Cognigy's extensions repository at [Extension](https://github.com/Cognigy/Extensions). Next the Avaya Extension needs be uploaded to the Cognigy environment using ``Manage`` -> ``Extension``.

A Cognigy flow should be created and deployed with the endpoint type of Avaya voice channel and then copy the endpoint url and paste it into the ``Voice Configuration`` -> ``WebLink`` of the phone number you purcahsed in the step above.

# Usage
While creating Cognigy flow, you can use Avaya Extension nodes such as play,prompt,record,handover,hangup,conference to design your voice conversation bot including playing audio file, prompt customers for dtmf buttons, conference calls and handover the conversation to a live agent.

**play** - requires the url of the autio file and the text of the audio content.  
**prompt** - requires the text for the prompt and the dtmf menu in the parameter ``Menu`` as shown below: 
```
    {
        "1":"sales",
        "2":"support",
        "3":"marketing"
    }
```  
    where the digits are the dtmf buttons and the texts are the Cognigy's intents. The prompts can be built to multiple levels.  
**record** - use a toggle button to enable recording on the conversation flow or not.  
**handover** - requires phone number to be handed over and an optional callback url.  
**conference** - requires a conference room name.  
**hangup** - hangs up the call.  

# Deploy #
A Cognigy flow should be created and deployed with the endpoint type of Avaya voice channel  and the ``Enable Input Transformer``, ``Enable Output Transformer`` and ``Enable Execution Finished Transformer`` have to be ``enabled``.

Next copy the endpoint url and paste it into the ``Voice Configuration`` -> ``WebLink`` of the phone number in Avaya CPaaS. Now it's ready for you to call the number to experience the Cognigy's flow.
