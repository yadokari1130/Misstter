import { postToMisskey } from './PostAPI'
import { showNotification } from '../UI/Notification'
import { Scope } from '../UI/ScopeModal';
import { misskeyFlagAttribute, misskeyFlagClassName } from '../UI/ImageFlagButton';
import { getCW, getLocalOnly, getScope, getSensitive, getServer, getToken } from "./StorageReader"
import { Attachment } from '../../common/CommonType';
import browser from 'webextension-polyfill';

const getQuoteRTUrl = async (): Promise<string | null> => {
  const result = await browser.storage.local.get(['misskey_last_quote_url']);
  const url = result?.misskey_last_quote_url as string;
  if (!url) return null;

  const attachments = document.querySelector('div[data-testid="attachments"]');
  if (!attachments) return null;

  const text = attachments.textContent || "";
  if (/@\w+/.test(text)) return url;
  return null;
}
const injectFetchPatch = () => {
    if ((window as any).__misstter_fetch_patch_injected) return;
    (window as any).__misstter_fetch_patch_injected = true;
    
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('js/misskey_fetch_patch.js');
    script.async = false;
    (document.head || document.documentElement).prepend(script);
};

injectFetchPatch();


const truncateText = (text: string, maxLength: number) => {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return chars.slice(0, maxLength - 3).join('') + '...';
};

const getTweetText = () => {
  let text = "";
  for (let i = 0; i < 20; i++) {
    let textContents = document.querySelectorAll(`div[role="dialog"] div[data-testid="tweetTextarea_${i}"] div[data-block="true"], div[role="dialog"] textarea[data-testid="tweetTextarea_${i}"]`);
    if (textContents.length === 0) textContents = document.querySelectorAll(`div[data-testid="tweetTextarea_${i}"] div[data-block="true"], textarea[data-testid="tweetTextarea_${i}"]`);

    if (!textContents || textContents.length === 0) continue;
    text += Array.from(textContents).map((textContent) => {
      return textContent.textContent;
    }).join('\n') + '\n\n';
  }

  return text;
}

const getTweetVideos = async () => {
  const videos = document.querySelectorAll("div[data-testid='attachments'] video > source");
  
  const res: Attachment[] = []

  for (const video of videos) {
    const videoRoot = video.parentElement?.parentElement
    const flagButton = videoRoot?.querySelector(`.${misskeyFlagClassName}`)
    const isFlagged = flagButton?.getAttribute(misskeyFlagAttribute) === "true";
    const url = video.getAttribute('src');
    if (!url) continue;
    if (!url.startsWith("blob:")) continue;
    const blob = await fetch(url).then(res => res.blob())
    res.push({blob: blob, isSensitive: isFlagged})
  }

  return res;
}

const getTweetImages: () => Promise<Attachment[]> = async () => {
  const images = document.querySelectorAll("div[data-testid='attachments'] img");

  const res: Attachment[] = []

  for (const image of images) {
    const imageRoot = image.parentElement?.parentElement?.parentElement?.parentElement
    const flagButton = imageRoot?.querySelector(`.${misskeyFlagClassName}`)
    const isFlagged = flagButton?.getAttribute(misskeyFlagAttribute) === "true";
    const url = image.getAttribute('src')
    if (!url) continue;
    if (!url.startsWith("blob:")) continue;
    const blob = await (await fetch(url)).blob()
    res.push({ blob: blob, isSensitive: isFlagged })
  }

  return res;
}

export const tweetToMisskey = async () => {
  try {
    let text = truncateText(getTweetText() ?? "", 3000);
    const images = await getTweetImages();
    const videos = await getTweetVideos();
    
    const quoteUrl = await getQuoteRTUrl();
    if (quoteUrl) text = text ? `${text}\n${quoteUrl}` : quoteUrl;
  
    if (!text && images.length == 0 && videos.length == 0) {
      showNotification('Misskeyへの投稿内容がありません', 'error')
      return;
    }
  
    const [token, server, cw, sensitive, scope, localOnly] = await Promise.all([
      getToken(), getServer(), getCW(), getSensitive(), getScope(), getLocalOnly(),
    ])
  
    const options = { cw, token, server, sensitive, scope: scope as Scope, localOnly }
    await postToMisskey(text, images, videos, options);
  } catch (e) {
    console.error(e)
    showNotification('Misskeyへの投稿に失敗しました', 'error')
  }
}
