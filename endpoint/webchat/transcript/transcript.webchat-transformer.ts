createSocketTransformer({
  handleInput: async ({ payload }) => {
    const { text, data, userId, sessionId } = payload
    // console.log(`handleInput payload: ${JSON.stringify(payload)}`)

    if (text && text !== 'GET_STARTED') {
      const sessionStorage = await getSessionStorage(userId, sessionId)
      const transcript = sessionStorage.transcript ?? []
      transcript.push({ from: 'User', text: text.trim() })
      sessionStorage.transcript = transcript
    }

    return { text, data, userId, sessionId }
  },

  handleOutput: async ({ processedOutput, userId, sessionId }) => {
    const { text, data } = processedOutput
    // console.log(`handleOutput processedOutput: ${JSON.stringify(processedOutput)}`)

    const sessionStorage = await getSessionStorage(userId, sessionId)
    // Transcribe Text, Text with Buttons, or Text with Quick Replies
    const transcriptText = text || // Simple text
      data?._cognigy?._webchat?.message?.attachment?.payload?.text || // Text with buttons
      data?._cognigy?._webchat?.message?.text // Text with postbacks

    if (transcriptText) {
      const transcriptRecord = { from: 'Bot', text: transcriptText.trim() }
      const quick_replies = data?._cognigy?._webchat?.message?.quick_replies
      if (quick_replies) {
        transcriptRecord['quickReplies'] = quick_replies.map(quickReply => quickReply.title.trim())
      }
      const buttons = data?._cognigy?._webchat?.message?.attachment?.payload?.buttons
      if (buttons) {
        transcriptRecord['buttons'] = buttons.map(button => button.title.trim())
      }
      const transcript = sessionStorage.transcript ?? []
      transcript.push(transcriptRecord);
      sessionStorage.transcript = transcript
    }

    // Transcribe gallery
    const galleryItems = data?._cognigy?._default?._gallery?.items
    if (galleryItems) {
      const items = galleryItems.map(element => ({
        title: element.title?.trim(),
        subtitle: element.subtitle?.trim(),
        buttons: element.buttons?.map(button => button.title?.trim())
      }))

      const transcriptRecord = { from: 'Bot', text: '', items }
      const transcript = sessionStorage.transcript ?? []
      transcript.push(transcriptRecord);
      sessionStorage.transcript = transcript
    }

    return processedOutput
  },
  // Respond to a POST request to the inject endpoint with a formatted transcript
  handleInject: async ({ request, response }) => {
    const { userId, sessionId } = request.query
    const sessionStorage = await getSessionStorage(userId, sessionId)
    if (sessionStorage?.transcript) {
      const lines = sessionStorage.transcript.map(
        line => `<tr>
          <td>${line.from}</td>
          <td>
            ${line.text?.replaceAll(/\n/g, '<br/>')}
            ${line.buttons ? '<br/>Buttons: ' + line.buttons.join(', ') : ''}
            ${line.quickReplies ? '<br/>Quick Replies: ' + line.quickReplies.join(', ') : ''}
            ${line.items ? line.items.map(item => (
              'Gallery item: ' + item.title +
              (item.subtitle ? '<br/>' + item.subtitle : '') +
              (item.buttons ? '<br/>Buttons: ' + item.buttons.join(', ') : '')
              )).join('<br/><br/>') : ''
            }
          </td>
          </tr>`
      )
      const html = `<!DOCTYPE html>
<html>
<head>
<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}
pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
table {
  border-collapse: collapse;
  padding: 10px;
  margin: 20px;
  border: 1px solid #ccc;
  background-color: #fff;
}
td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}
tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
</head>
<body>

<h2>Transcript</h2>
<table>
<tr>
<th>From</th>
<th>Text</th>
</tr>
${lines.join('')}
</table>

<h2>JSON</h2>
<details><summary></summary>
<pre>${JSON.stringify(sessionStorage.transcript, null, 2)}</pre>
</details>

</html>`
      // Send the formatted output with the response
      response
        .status(200)
        .header('Content-Type', 'text/html')
        .send(html)
        // .header('Content-Type', 'application/json')
        // .send(JSON.stringify(sessionStorage.transcript, null, 2))
    } else { // Transcript not found in the session storage, could be wrong userId / sessionId
      response
        .status(404)
        .header('Content-Type', 'application/json')
        .send(JSON.stringify({ error: 'Transcript not found' }))
    }

    return null // Don't forward this inject to the bot
  }
})