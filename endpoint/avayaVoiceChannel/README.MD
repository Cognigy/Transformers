# Description
Avaya Voice Channel Transformer translates the communication between Avaya CPaaS calls,sms messages and Cognigy's text in real time.

## Avaya CPaaS
In order to use this Transformer you need to get the free trial Avaya CPaaS account at [Avaya CPaaS](https://www.avaya.com/en/products/cpaas/). In the Avaya CPaaS dashboard you can purcahse a phone number which will be used to link with your Cognigy's endpoint as stated below.

## Cognigy
You need to have access to Cognigy to create an agent first. You will need to download the Avaya Extension from Cognigy's extensions repository at [Extension](https://github.com/Cognigy/Extensions). Next the Avaya Extension needs be uploaded to the Cognigy environment using ``Manage`` -> ``Extension``.

A Cognigy flow should be created and deployed with the endpoint type of Avaya voice channel and then copy the endpoint url and paste it into the ``Voice Configuration`` -> ``WebLink`` of the phone number you purcahsed in the step above.

# Usage
While creating Cognigy flow, you can use Avaya Extension nodes such as play,prompt,record,handover,hangup,conference,sms and redirect to design your voice conversation bot including playing audio file, prompt customers for dtmf buttons, conference calls and handover the conversation to a live agent.

**play** - requires the url of the autio file and the text of the audio content.  
**prompt** - there are two prompt options, number prompt and menu prompt.
- for number prompt, it requires text for the prompt and the expected max number of digits.
- for menu prompt, it requires text for the prompt and the dtmf menu in the parameter ``Menu`` as shown below: 
```
        "1":"sales"
        "2":"support"
        "3":"marketing"
```  
    where the digits are the dtmf buttons and the texts are the Cognigy's intents. The digits of prompt menu can be reused in other menu prompts in the same flow.
**record** - use a toggle button to enable recording on the conversation flow or not.  
**handover** - requires phone number or sip address to be handed over and an optional callback url.  
**conference** - requires a conference room name.  
**hangup** - hangs up the call.  
**sms** - sends the sms messages in the voice channel flow. It's not needed for sms channel.  
**redirect** - redirects current Cognigy flow to another flow and won't return. It requires the endpoint url of the other flow.

# Deploy #
A Cognigy flow should be created and deployed with the endpoint type of Avaya voice channel  and the ``Enable Input Transformer``, ``Enable Output Transformer`` and ``Enable Execution Finished Transformer`` have to be ``enabled``.

Next copy the endpoint url and paste it into the ``Voice Configuration`` -> ``WebLink`` of the phone number in Avaya CPaaS. Now it's ready for you to call the number to experience the Cognigy's flow.
