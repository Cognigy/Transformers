# Description
Avaya Voice Channel Transformer translates the communication between Avaya CPaaS calls,sms messages and Cognigy's text in real time.

# Usage
The first step is to upload Avaya's Extension, then create a Cognigy Flow Bot with Avaya's extension nodes such as play,prompt,record,handover,hangup,conference.

Next a Cognigy endpoint has to be created with the type of "Avaya" and the ``Enable Input Transformer``, ``Enable Output Transformer`` and ``Enable Execution Finished Transformer`` have to be ``enabled``.

Lastly publish the endpoint's url with any CPaaS vendor's phone number and call the number to experience the Cognigy's flow.