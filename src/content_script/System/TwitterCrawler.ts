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

const getTweetText = () => {
  const textContents = document.querySelectorAll('div[data-testid="tweetTextarea_0"] div[data-block="true"], textarea[data-testid="tweetTextarea_0"]');
  if (!textContents) return;
  const text = Array.from(textContents).map((textContent) => {
    return textContent.textContent;
  }).join('\n');

  return text;
}

const getTweetVideo = async () => {
  const video = document.querySelector("div[data-testid='attachments'] video > source");
  if (!video) return null;
  const videoRoot = video.parentElement?.parentElement
  const flagButton = videoRoot?.querySelector(`.${misskeyFlagClassName}`)
  const isFlagged = flagButton?.getAttribute(misskeyFlagAttribute) === "true";
  const url = video.getAttribute('src');
  if (!url) return null;
  if (!url.startsWith("blob:")) return null;
  const blob = await fetch(url).then(res => res.blob())
  return { blob: blob, isSensitive: isFlagged };
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
    let text = getTweetText() ?? "";
    const images = await getTweetImages();
    const video = await getTweetVideo();
    
    const quoteUrl = await getQuoteRTUrl();
    if (quoteUrl) text = text ? `${text}\n${quoteUrl}` : quoteUrl;
  
    if (!text && images.length == 0 && !video) {
      showNotification('Misskeyへの投稿内容がありません', 'error')
      return;
    }
  
    const [token, server, cw, sensitive, scope, localOnly] = await Promise.all([
      getToken(), getServer(), getCW(), getSensitive(), getScope(), getLocalOnly(),
    ])
  
    const options = { cw, token, server, sensitive, scope: scope as Scope, localOnly }
    await postToMisskey(text, images, video, options);
  } catch (e) {
    console.error(e)
    showNotification('Misskeyへの投稿に失敗しました', 'error')
  }
}
