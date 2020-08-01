const fetch = require('node-fetch')

async function getCID(youtubeurl) {
    // example url https://www.youtube.com/watch?v=AAAAAAAAA
    // get continuation id that need for getting livestream chat
    const resp = await fetch(youtubeurl)
    const respText = await resp.text()
    const regex = /window\["ytInitialData"\] = (\{.*\});/g
    const match = regex.exec(respText)
    const json = JSON.parse(match[1])
    const cid = json.contents.twoColumnWatchNextResults.conversationBar.liveChatRenderer.continuations[0].reloadContinuationData.continuation
    return cid
}

async function fetchComments(youtubeurl, offset = 0, end=Infinity,cb) {
    const cid = await getCID(youtubeurl)
    const allChats = []
    
    //get the chat recursively until specified end or the video ended
    async function getChatRecursively(cid, offset = 0) {
        const getChat = await fetch(`https://www.youtube.com/live_chat_replay/get_live_chat_replay?commandMetadata=%5Bobject%20Object%5D&continuation=${cid}&playerOffsetMs=${offset}&hidden=false&pbj=1`, {
            headers: {
                //set custom header so it's not detected as old browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0'
            }
        })
        //get response as json
        const getChatResp = await getChat.json()
        let chats = getChatResp.response.continuationContents.liveChatContinuation.actions
      if (chats && chats.length>0) {
            chats = chats.map(v => {
                if(!v.replayChatItemAction.actions[0].addChatItemAction)return;
                const render = v.replayChatItemAction.actions[0].addChatItemAction.item.liveChatTextMessageRenderer
                if (render) {
                    //only take necessary data
                    return [v.replayChatItemAction.videoOffsetTimeMsec, render.message.runs[0].text ]
                }
            }).filter(v => v != undefined)
            if(chats.length<1) return ;
            //add newly pulled chats to allChats
            allChats.push(...chats)
            if(cb)cb(chats)
            //get the next continuation id
            const nextCid = getChatResp.response.continuationContents.liveChatContinuation.continuations[0].liveChatReplayContinuationData.continuation
            const lastChatOffset = chats[chats.length - 1][0]
            console.error(chats[0][0], chats[chats.length - 1][0], offset, chats.length)
            // check for next recursion
            if (chats.length > 0 && lastChatOffset < end) await getChatRecursively(nextCid)
        }
    }
    await getChatRecursively(cid, offset)
    console.error(allChats.length)
    return allChats
}
module.exports = fetchComments
