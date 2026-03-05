import { tweetToMisskey } from '../System/TwitterCrawler';
import { REPLY_BUTTON_LABELS } from '../../common/constants';
import { createScopeButton, scopeButtonClassName } from "../UI/ScopeButton"
import { createMisskeyPostButton, misskeyButtonClassName, syncDisableState } from "../UI/MisskeyPostButton"
import { createMisskeyImageOptionButton } from "../UI/ImageFlagButton"
import { createLocalOnlyButton, localOnlyButtonClassName } from "../UI/LocalOnlyButton";
import {createRenoteButton, renoteButtonClassName} from "../UI/RenoteButton";
import { createEmojiPickerButton, emojiPickerButtonClassName } from "../UI/EmojiPickerButton";

const gifButtonSelector = 'button[data-testid="gifSearchButton"]'
const buttonSelector = 'button[data-testid="tweetButton"], button[data-testid="tweetButtonInline"]'
const attachmentsImageSelector = 'div[data-testid="attachments"] div[role="group"]'
const editButtonSelector = 'button[role="button"]'
const bookmarkButtonSelector = 'button[data-testid="bookmark"],button[data-testid="removeBookmark"]'
const tweetSelector = 'article[data-testid="tweet"]'


//リノートボタンを作成する
const addRenoteButton = (iconBox: HTMLElement, url: string) => {
  // すでにボタンがある場合は何もしない
  if (iconBox.querySelector(`.${renoteButtonClassName}`)) return;
  const renoteButton = createRenoteButton(url);
  iconBox.appendChild(renoteButton);
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

// ミスキーへの投稿ボタンを追加する
const addMisskeyPostButton = (tweetButton: HTMLElement, tweetBox: HTMLElement) => {
  // すでにボタンがある場合は何もしない
  if (tweetBox.querySelector(`.${misskeyButtonClassName}`)) return;

  const misskeybutton = createMisskeyPostButton(tweetToMisskey, tweetButton);
  
  tweetBox.appendChild(misskeybutton);
  syncDisableState(tweetButton, misskeybutton);
}

// ミスキーへのセンシティブ設定ボタンを追加する
const addMisskeyImageOptionButton = (editButton: HTMLElement, attachmentsImage: HTMLElement) => {
  const misskeybutton = createMisskeyImageOptionButton();
  editButton.parentElement!.insertBefore(misskeybutton, editButton);
}

const foundTweetButtonHandler = (tweetButton: HTMLElement) => {
  if (!tweetButton) return;

  const buttonText = tweetButton.innerText.trim();

  // リプライボタンの場合は後続の処理を行わない
  const isReplyButton = REPLY_BUTTON_LABELS.indexOf(buttonText) !== -1;
  if (isReplyButton) return;

  // add misskey post button
  const tweetBox = tweetButton.parentElement as HTMLElement;
  if (tweetBox) { addMisskeyPostButton(tweetButton, tweetBox); }

  // add scope button and local only button
  const iconsBlock = document.querySelector(gifButtonSelector)?.parentElement?.parentElement as HTMLElement;
  if (iconsBlock) {
    if (!iconsBlock.querySelector('.misskey-extension-break')) {
      iconsBlock.style.flexWrap = 'wrap';
      const breakEl = document.createElement('div');
      breakEl.className = 'misskey-extension-break';
      breakEl.style.flexBasis = '100%';
      breakEl.style.height = '0px';
      breakEl.style.margin = '0';
      breakEl.style.padding = '0';
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
  
  const editButton = attachmentsImage.querySelector(editButtonSelector) as HTMLElement;
  if (!editButton) return;
  addMisskeyImageOptionButton(editButton, attachmentsImage);
}

const getTweetUrl = (tweet: HTMLElement) => {
  const link: HTMLLinkElement | null = tweet.querySelector('a[href*="/status/"]');
  if (link) {
    console.log(link.href)
    const match = link.href.match(/([^\/]+)\/status\/(\d+)/);
    if (match) return `https://twitter.com/${match[1]}/status/${match[2]}`;
  }

  return null;
}

const foundTweetHandler = (tweet: HTMLElement) => {
  if (tweet.getElementsByClassName(renoteButtonClassName).length > 0) return

  const bookmarkButton = tweet.querySelector(bookmarkButtonSelector);
  if (!bookmarkButton) return;

  const iconsBlock = bookmarkButton.parentElement?.parentElement as HTMLElement;
  const tweetUrl = getTweetUrl(tweet);
  if (iconsBlock) addRenoteButton(iconsBlock, tweetUrl + "");
}

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
      if (mutation.type !== 'childList') return;
      mutation.addedNodes.forEach((node: any) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        const tweetButton = node.querySelector(buttonSelector);
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
      });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
