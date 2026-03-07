import browser from 'webextension-polyfill';
import { PostMessage } from "../common/CommonType"
import { postToMisskey, saveLinkPair } from "./MisskeyAPI"

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'post') {
    const postMessage = message as PostMessage
    return postToMisskey(postMessage.text, postMessage.attachments, postMessage.options)
  }

  if (message.type == 'saveLinkPair') {
    return saveLinkPair(message.twitterId, message.misskeyId, message.options);
  }


  if (message.type === 'fetchImage') {
    return fetch(message.url)
      .then(res => res.blob())
      .then(blob => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });
  }
});