import browser from 'webextension-polyfill';
import { REPLY_BUTTON_LABELS } from '../../common/constants';
import { createScopeButton, scopeButtonClassName } from "../UI/ScopeButton"
import { createMisskeyPostButton, misskeyButtonClassName, syncDisableState } from "../UI/MisskeyPostButton"
import { createMisskeyImageOptionButton } from "../UI/ImageFlagButton"
// DeckではTwitterCrawlerがそのまま使用可能
import { tweetToMisskey } from '../System/TwitterCrawler';
import { createEmojiPickerButton, emojiPickerButtonClassName } from "../UI/EmojiPickerButton";
import { getCW, getLocalOnly, getScope, getSensitive, getServer, getToken } from "../System/StorageReader"
import { createLocalOnlyButton, localOnlyButtonClassName } from "../UI/LocalOnlyButton";
import { fetchEmojis } from '../UI/EmojiPickerModal';

// ミスキーへの投稿ボタンを追加する
const addMisskeyPostButton = (tweetButton: HTMLElement, tweetBox: HTMLElement, replyMisskeyId?: string) => {
  // すでにボタンがある場合は何もしない
  if (tweetBox.querySelector(`.${misskeyButtonClassName}`)) return;

  const misskeybutton = createMisskeyPostButton(tweetToMisskey, tweetButton);
  if (replyMisskeyId) {
    misskeybutton.setAttribute('data-reply-misskey-id', replyMisskeyId);
  }
  misskeybutton.style.width = "40px"
  misskeybutton.style.height = "30px"
  misskeybutton.style.marginLeft = "8px"
  tweetBox.appendChild(misskeybutton);
  syncDisableState(tweetButton, misskeybutton);
}

// スコープボタンを作成する
const addScopeButton = (iconBox: HTMLElement) => {
  // すでにボタンがある場合は何もしない
  if (iconBox.querySelector(`.${scopeButtonClassName}`)) return;
  const scopeButton = createScopeButton();
  iconBox.appendChild(scopeButton);
}

// 連合なしボタンを作成する
const addLocalOnlyButton = (iconBox: HTMLElement) => {
  if (iconBox.querySelector(`.${localOnlyButtonClassName}`)) return;
  const localOnlyButton = createLocalOnlyButton();
  iconBox.appendChild(localOnlyButton);
}

// 絵文字ピッカーボタンを作成する
const addEmojiPickerButton = (iconBox: HTMLElement) => {
  if (iconBox.querySelector(`.${emojiPickerButtonClassName}`)) return;
  const emojiPickerButton = createEmojiPickerButton();
  iconBox.appendChild(emojiPickerButton);
}

// ミスキーへのセンシティブ設定ボタンを追加する
const addMisskeyImageOptionButton = (editButton: HTMLElement, attachmentsImage: HTMLElement) => {
  const misskeybutton = createMisskeyImageOptionButton();
  editButton.parentElement!.insertBefore(misskeybutton, editButton);
}

const getReplyTweetId = (): string | null => {
  const match = window.location.href.match(/\/status\/(\d+)/);
  if (match) return match[1];
  
  const dialog = document.querySelector('div[role="dialog"]');
  if (dialog) {
    const timeLink = dialog.querySelector('time')?.parentElement as HTMLAnchorElement;
    if (timeLink && timeLink.href) {
      const modalMatch = timeLink.href.match(/\/status\/(\d+)/);
      if (modalMatch) return modalMatch[1];
    }
  }
  
  return null;
}

const foundTweetButtonHandler = async (tweetButton: HTMLElement) => {
  if (!tweetButton) return;

  let replyMisskeyId: string | undefined = undefined;
  
  const isReplyButton = REPLY_BUTTON_LABELS.indexOf(tweetButton.innerText) !== -1;
  if (isReplyButton) {
    const replyTweetId = getReplyTweetId();
    if (replyTweetId) {
      try {
        const [token, server] = await Promise.all([getToken(), getServer()]);
        const misskeyId = await browser.runtime.sendMessage({
          type: 'getLinkPair',
          twitterId: replyTweetId,
          options: { token, server }
        });
        
        if (misskeyId) replyMisskeyId = misskeyId;
        else return;
      } catch (e) {
        console.error('[Misstter] Failed to check reply link', e);
        return;
      }
    } else {
      return;
    }
  }

  // add misskey post button
  const tweetBox = tweetButton.parentElement?.parentElement as HTMLElement;
  if (tweetBox) { addMisskeyPostButton(tweetButton, tweetBox, replyMisskeyId); }


  // // add scope button and local only button
  const iconsBlock = document.querySelector(gifButtonSelector)?.parentElement as HTMLElement
  if (iconsBlock) {
    if (!iconsBlock.querySelector('.misskey-extension-break')) {
      iconsBlock.style.flexWrap = 'wrap';
      const breakEl = document.createElement('div');
      breakEl.className = 'misskey-extension-break';
      breakEl.style.flexBasis = '100%';
      breakEl.style.height = '4px';
      iconsBlock.appendChild(breakEl);
    }
    
    addScopeButton(iconsBlock);
    addLocalOnlyButton(iconsBlock);
    addEmojiPickerButton(iconsBlock);
  }
}

const foundAttachmentsImageHandler = (attachmentsImage: HTMLElement) => {
  // すでにボタンがある場合は何もしない
  if (attachmentsImage.getAttribute('data-has-flag-button')) return;
  attachmentsImage.setAttribute('data-has-flag-button', 'true');
  
  const editButton = Array.from(attachmentsImage.querySelectorAll("div[role='button']"))[1] as HTMLElement;
  if (!editButton) return;
  addMisskeyImageOptionButton(editButton, attachmentsImage);
}

let zoomedEmojiContainer: HTMLDivElement | null = null;

const createZoomedEmojiContainer = () => {
  if (zoomedEmojiContainer) return;
  zoomedEmojiContainer = document.createElement('div');
  zoomedEmojiContainer.style.position = 'fixed';
  zoomedEmojiContainer.style.zIndex = '999999';
  zoomedEmojiContainer.style.pointerEvents = 'none';
  zoomedEmojiContainer.style.visibility = 'hidden';
  zoomedEmojiContainer.style.opacity = '0';
  zoomedEmojiContainer.style.transform = 'scale(0.8)';
  zoomedEmojiContainer.style.transition = 'opacity 0.1s ease-out, transform 0.1s ease-out';
  zoomedEmojiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  zoomedEmojiContainer.style.borderRadius = '8px';
  zoomedEmojiContainer.style.padding = '8px';
  zoomedEmojiContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
  const img = document.createElement('img');
  img.style.height = '10em';
  img.style.maxWidth = '90vw';
  img.style.maxHeight = '90vh';
  img.style.objectFit = 'contain';
  zoomedEmojiContainer.appendChild(img);
  
  document.body.appendChild(zoomedEmojiContainer);
}

const showZoomedEmoji = (imgEl: HTMLImageElement) => {
  if (!zoomedEmojiContainer) createZoomedEmojiContainer();
  if (!zoomedEmojiContainer) return;
  
  const img = zoomedEmojiContainer.querySelector('img');
  if (img) img.src = imgEl.src;
  
  zoomedEmojiContainer.style.visibility = 'hidden';
  zoomedEmojiContainer.style.display = 'block';
  
  const rect = imgEl.getBoundingClientRect();
  
  requestAnimationFrame(() => {
    if (!zoomedEmojiContainer) return;
    const zoomWidth = zoomedEmojiContainer.offsetWidth;
    const zoomHeight = zoomedEmojiContainer.offsetHeight;
    
    let left = rect.right + 10;
    let top = rect.top + (rect.height / 2) - (zoomHeight / 2);
    
    if (left + zoomWidth > window.innerWidth) {
      left = rect.left - zoomWidth - 10;
    }
    
    if (top < 10) top = 10;
    if (top + zoomHeight + 10 > window.innerHeight) top = window.innerHeight - zoomHeight - 10;
    
    zoomedEmojiContainer.style.left = `${left}px`;
    zoomedEmojiContainer.style.top = `${top}px`;
    
    zoomedEmojiContainer.style.visibility = 'visible';
    zoomedEmojiContainer.style.opacity = '1';
    zoomedEmojiContainer.style.transform = 'scale(1)';
  });
}

const hideZoomedEmoji = () => {
  if (zoomedEmojiContainer) {
    zoomedEmojiContainer.style.opacity = '0';
    zoomedEmojiContainer.style.transform = 'scale(0.8)';
    setTimeout(() => {
      if (zoomedEmojiContainer && zoomedEmojiContainer.style.opacity === '0') {
        zoomedEmojiContainer.style.visibility = 'hidden';
      }
    }, 100);
  }
}

const foundTweetTextHandler = async (tweetText: HTMLElement) => {
  if (tweetText.getAttribute('data-misskey-emoji-processed') === 'true') return;
  tweetText.setAttribute('data-misskey-emoji-processed', 'true');

  const emojis = await fetchEmojis();
  if (emojis.length === 0) return;

  const emojiMap = new Map(emojis.map(e => [e.name, e.url]));
  const regex = /:([a-zA-Z0-9_]+):(?![a-zA-Z0-9])/g;

  const walker = document.createTreeWalker(tweetText, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    if (!text || !regex.test(text)) continue;

    regex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const emojiName = match[1];
      const emojiUrl = emojiMap.get(emojiName);

      if (emojiUrl) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }

        const img = document.createElement('img');
        img.alt = `:${emojiName}:`;
        img.style.display = 'inline-block';
        img.style.height = '2em';
        img.style.verticalAlign = 'middle';
        img.style.margin = '0 0.05em';
        img.style.cursor = 'pointer';
        
        browser.runtime.sendMessage({ type: 'fetchImage', url: emojiUrl }).then((dataUrl: unknown) => {
          if (typeof dataUrl === 'string') img.src = dataUrl;
        }).catch(console.error);

        img.addEventListener('mouseenter', () => {
          if (img.src) showZoomedEmoji(img);
        });
        
        img.addEventListener('mouseleave', () => {
          hideZoomedEmoji();
        });

        fragment.appendChild(img);
        lastIndex = regex.lastIndex;
      }
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    
    if (lastIndex > 0) {
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }
}

const gifButtonSelector = 'div[data-testid="gifSearchButton"]'
const buttonSelector = '//*[@id="react-root"]/div/div/div[3]/div/div[2]/div/div/div[1]/div/div/div/div[3]/div'
const attachmentsImageSelector = 'div[data-testid="attachments"] div[role="group"]'
const tweetSelector = 'article[data-testid="tweet"]'

const getTweetUrl = (tweet: HTMLElement) => {
  const link: HTMLLinkElement | null = tweet.querySelector('a[href*="/status/"]');
  if (link) {
    const match = link.href.match(/([^\/]+)\/status\/(\d+)/);
    if (match) return `https://x.com/${match[1]}/status/${match[2]}`;
  }
  return null;
}

const foundTweetHandler = (tweet: HTMLElement) => {
  const retweetButtonSelector = 'button[data-testid="retweet"]';
  const retweetButton = tweet.querySelector(retweetButtonSelector);
  
  if (retweetButton && !retweetButton.hasAttribute('data-misskey-rt-hooked')) {
    retweetButton.setAttribute('data-misskey-rt-hooked', 'true');
    retweetButton.addEventListener('click', () => {
      const tweetUrl = getTweetUrl(tweet);
      if (tweetUrl) browser.storage.local.set({ misskey_last_quote_url: tweetUrl });
    });
  }
}

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
      if (mutation.type !== 'childList') return;
      mutation.addedNodes.forEach((node: any) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        // select with xpath
        const tweetButton = node.ownerDocument.evaluate(buttonSelector, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        if (tweetButton) { foundTweetButtonHandler(tweetButton); }
        
        const attachmentsImages = document.querySelectorAll(attachmentsImageSelector);
        if (attachmentsImages) { 
          attachmentsImages.forEach((attachmentsImage: any) => {
            foundAttachmentsImageHandler(attachmentsImage); 
          })
        }

        const tweets = document.querySelectorAll(tweetSelector);
        if (tweets) {
          tweets.forEach(tweet => {
            foundTweetHandler(tweet as HTMLElement);
          })
        }

        const tweetTexts = document.querySelectorAll('div[data-testid="tweetText"]');
        if (tweetTexts) {
          tweetTexts.forEach(tweetText => {
            foundTweetTextHandler(tweetText as HTMLElement);
          })
        }
      });
  });
});

observer.observe(document.documentElement, { childList: true, subtree: true });
