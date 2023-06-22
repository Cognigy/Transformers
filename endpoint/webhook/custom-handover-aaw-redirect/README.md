# Custom Handover AAW Redirect

## Setup

```javascript
/**
 * Insert "withAAWRedirect" code here
 */

/**
 * Insert "withForwardToCC" code here
 */

createWebhookTransformer({
  handleInput: withAAWRedirect(
    withForwardToCC(() => {
      // your regular "input transformer"
    })
  ),
});
```

## Handling / Forwarding User Inputs

```mermaid
sequenceDiagram
    actor user as User
    participant endpoint as Endpoint
    participant redirect as Redirect Middleware
    participant forward as Forward Middleware
    participant transformer as Input Transformer
    participant contactcenter as Contact Center

    user->>endpoint: "hi"
    endpoint->>transformer: "Redirect" and "Forward" middlewares pass on the request
    note over transformer: extracts userId, sessionId, text and data
    transformer->>forward: return "input"

    opt no foreignSessionId in session storage
        forward->>contactcenter: creates conversation
        activate contactcenter
        contactcenter-->>forward: responds with conversation id
        deactivate contactcenter
        note over forward: stores foreignSessionId
    end

    forward->>contactcenter: adds message to conversation
    forward->>redirect: returns input

    opt no foreign session storage
        note over redirect: stores session params in foreign session storage
    end

    redirect->>endpoint: returns input
    note over endpoint: sends input to flow
```

## Handling AAW Redirects

```mermaid
sequenceDiagram
    actor user as User
    participant endpoint as Endpoint
    participant redirect as Redirect Middleware
    participant forward as Forward Middleware
    participant transformer as Input Transformer

    note over user: opens conversation in contact center
    note over user: visits endpoint URL through embedded iframe
    user->>endpoint: GET /?aaw=<foreignSessionId>
    endpoint->>redirect: forwards request
    note over redirect: extracts foreignSessionId
    note over redirect: resolves session params from foreign session
    note over redirect: builds AAW URL with session params
    redirect-->>user: redirects to AAW URL
    note over redirect: does not pass on request
    redirect->>endpoint: returns null
    note over endpoint: ignores input
```
