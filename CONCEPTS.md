# Concepts

This section contains general concepts and best practices regarding the use of Transformers.

## Table of Contents:

- Logging the Conversation
- Session Timeout
- Hiding User Id and Session Id from the Flow

## Logging the Conversation

By default, we do not have the whole conversation history available in the Flows. However, the Endpoint Transformer has both access to the input and to the output and we can inject content into the Flow data.

### Log storage Input Transformer:

First we need to push the user input into the log, the log is saved in the Endpoint sessionStorage:

```js
handleInput: async ({ payload, endpoint }) => {
        //initialize session storage
        const sessionStorage = await getSessionStorage(payload.userId, payload.sessionId);
        if (!sessionStorage.log) {
            sessionStorage.log = [];
        };
        //add text input to log
        if (payload.text) {
            let log = sessionStorage.log;
            log.push({"sender":"user","text":payload.text});
            sessionStorage.log = log;
        };
```

Then we push the log into the Flow by injecting it into the Flow data in the Input Transformer:

```js
        //add log to data input
        let data = {};
        if (payload.data) {
            data["payload"]​ = payload.data;
        };
        data["log"] = sessionStorage.log;
```

### Output Transformer for Websocket based Endpoint

(use the ExecutionFinished Transformer for REST based Endpoints)

Basically the same procedure as at the start of the Input Transformer, access the sessionStorage and expand the log there:

```js
handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
        //initialize session storage
        const sessionStorage = await getSessionStorage(userId, sessionId);
        if (!sessionStorage.log) {
            sessionStorage.log = [];
        };
        //add text output to log
        if (processedOutput.text) {
            let log = sessionStorage.log;
            log.push({"sender":"bot","text":processedOutput.text});
            sessionStorage.log = log;
        };
```

You can use the same principles for the Inject and Notify Transformers.

## Session Timeout

By default, REST, Webhook and Websocket Endpoints do not have a configurable session timeout. Using a combination of the Endpoint session storage and moment.js, we can manipulate the sessionId before it enters the Flow in a way that allows new sessions to be generated.

A few pieces of information up front to understand the functionality:

- A conversation in the Flow is defined by the **combination of userId and sessionId**, only this combination provides the basis for the Cognigy Context.
- The Endpoint Transformer "sessionStorage" is completely disconnected and different from the Flow Context, you cannot reference the Flow Context from the Endpoint Transformer and vice versa.

In the Endpoint Transformer you can easily modify the userId and the sessionId you pass on to the Flow in the Input Transformer. However, you probably need the unmodified values for the Output Transformer (e.g. for Whatsapp Integrations you need both the caller's number as well as the callee's for the output connection).


### Technical Execution

The timeout itself is configured at the top of the Transformer. In the example we use 60 seconds as this makes it easy to test, usually a value of 1800 (30 minutes) should be the default:

```js
//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 60

createSocketTransformer({
```

To keep track of a session timeout, we need a sessionStorage based on the raw and unmodified userId and sessionId, we will call this the rawSessionStorage. To get the unmodified values in the Output Transformer, where we only have the modified values accessible at first we need a sessionStorage based on the modified values, we will call this the processedSessionStorage.

The **rawSessionStorage** manages:

- Timeout check

The **processedSessionStorage** manages:

- Output Transformer access to the clear/raw values from the Input Transformer
- other functionality, e.g. Logging the Conversation.

### Input Transformer

The comments in combination with the code should explain the steps:

```js
    handleInput: async ({ payload, endpoint }) => {
        //timestamp in unix seconds
        const currentTime = moment(new Date()).unix()
        //initialize clear values and create rawSessionStorage
        const clearUserId = payload.userId
        const clearSessionId = payload.sessionId
        const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
        //check for timeout
        if (rawSessionStorage.timestamp) {
            const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
            //check for timeout if timeout is more than 0
            if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)){
                //update timestamp -> will lead to new Flow session
                rawSessionStorage.timestamp = currentTime
            }
        } else {
            //intialize timestamp
            rawSessionStorage.timestamp = currentTime
        }

        let userId = clearUserId
        //by appending the timestamp to the sessionId we create a new Flow session
        let sessionId = JSON.stringify([clearSessionId,rawSessionStorage.timestamp])
        //create output transformer translation storage
        const processedSessionStorage = await getSessionStorage(userId, sessionId);
        //fill with clear values
        processedSessionStorage.clearUserId = clearUserId
        processedSessionStorage.clearSessionId = clearSessionId
```

### Output/Execution Finished Transformer

```js
    handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
        //create output transformer translation storage
        const processedSessionStorage = await getSessionStorage(userId, sessionId);
        const clearUserId = processedSessionStorage.clearUserId
        const clearSessionId = processedSessionStorage.clearSessionId
        //if you need to access the original rawSessionStorage you now can
        const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
```

## Hiding User Id and Session Id from the Flow

The Blind Mode can obscure the userId in ODATA, but what if you want to hide the userId and/or sessionId information from the Flow? This can happen, if you do not want the caller's and/or callee's phone number to be available in a WhatsApp Flow for example.
This example makes use of concepts explained in more detail in the Session Timeout​ page, so feel free to read that first.

### Technical Execution

To make this configurable, we add a few settings to the top of the Transformer:

```js
//session timeout in seconds, new session gets generated afterwards
//disable by setting to 0
const SESSION_TIMEOUT = 60
//true = enabled
//false = disabled
const HIDE_USER_ID = true
const HIDE_SESSION_ID = true
//method used for hiding
const HASH_ALGORITHM = "sha256"

createSocketTransformer({
```

### Input Transformer

```js
    handleInput: async ({ payload, endpoint }) => {
        //timestamp in unix seconds
        const currentTime = moment(new Date()).unix()
        //initialize clear values and create rawSessionStorage
        const clearUserId = payload.userId
        const clearSessionId = payload.sessionId
        const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
        //check for timeout
        if (rawSessionStorage.timestamp) {
            const difference = moment(currentTime).diff(moment(rawSessionStorage.timestamp))
            //check for timeout if timeout is more than 0
            if (SESSION_TIMEOUT && (difference > SESSION_TIMEOUT)){
                //update timestamp -> will lead to new Flow session
                rawSessionStorage.timestamp = currentTime
            }
        } else {
            //intialize timestamp
            rawSessionStorage.timestamp = currentTime
        }
        //fill with clear values
        let userId = clearUserId
        let sessionId = JSON.stringify([clearSessionId,rawSessionStorage.timestamp])
        //hash and obscure if hiding is true
        if (HIDE_USER_ID){
            userId = crypto.createHash(HASH_ALGORITHM).update(userId).digest("hex")
        }
        if (HIDE_SESSION_ID){
            sessionId = crypto.createHash(HASH_ALGORITHM).update(sessionId).digest("hex")
        }
        //create output transformer translation storage
        const processedSessionStorage = await getSessionStorage(userId, sessionId);
        processedSessionStorage.clearUserId = clearUserId
        processedSessionStorage.clearSessionId = clearSessionId
```

Compared to the Session Timeout Transformer we only added these lines in the Input Transformer, the rest stayed the same (the behavior will also be exactly the same once HIDE_USER_ID and HIDE_SESSION_ID are set to "false":

```js
        //hash and obscure if hiding is true
        if (HIDE_USER_ID){
            userId = crypto.createHash(HASH_ALGORITHM).update(userId).digest("hex")
        }
        if (HIDE_SESSION_ID){
            sessionId = crypto.createHash(HASH_ALGORITHM).update(sessionId).digest("hex")
        }
```

### Output/Execution Finsished Transformer

```js
    handleOutput: async ({ processedOutput, output, endpoint, userId, sessionId }) => {
        //create output transformer translation storage
        const processedSessionStorage = await getSessionStorage(userId, sessionId);
        const clearUserId = processedSessionStorage.clearUserId
        const clearSessionId = processedSessionStorage.clearSessionId
        //if you need to access the original rawSessionStorage you now can
        const rawSessionStorage = await getSessionStorage(clearUserId, clearSessionId);
```

As you can see, the logic for the Output Transformer is exactly the same as for the Session Timeout.
