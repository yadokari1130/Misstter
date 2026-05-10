import browser from 'webextension-polyfill';

import { emoji_picker_icon } from "./Icons"
import { showEmojiPickerModal, closeEmojiPickerModal, isShowingEmojiPickerModal } from "./EmojiPickerModal"

export const emojiPickerButtonClassName = 'misskey-emoji-picker-button'

export const createEmojiPickerButton = () => {
  const emojiButton = document.createElement('div');
  
  emojiButton.className = emojiPickerButtonClassName;
  
  emojiButton.style.minWidth = '36px';
  emojiButton.style.width = '36px';
  emojiButton.style.maxWidth = '36px';
  
  emojiButton.style.minHeight = '36px';
  emojiButton.style.height = '36px';
  emojiButton.style.maxHeight = '36px';

  emojiButton.style.backgroundColor = 'transparent';
  emojiButton.style.display = 'flex'
  emojiButton.style.margin = '2px';
  emojiButton.style.paddingTop = '0';
  emojiButton.style.alignItems = 'center'
  emojiButton.style.justifyContent = 'center'
  emojiButton.style.borderRadius = '9999px';
  emojiButton.style.cursor = 'pointer';
  emojiButton.style.transition = 'background-color 0.2s ease-in-out';
  emojiButton.innerHTML = emoji_picker_icon;

  // Icons.tsのSVGに合わせたスタイル調整
  // 常に緑色のアイコンにする
  (emojiButton.children[0] as any).style.stroke = 'rgb(134, 179, 0)';
  (emojiButton.children[0] as any).style.fill = 'none';
  (emojiButton.children[0] as any).style.width = '24px';
  (emojiButton.children[0] as any).style.height = '24px';

  emojiButton.onmouseover = () => {
    // 背景だけ薄緑になるように
    emojiButton.style.backgroundColor = 'rgba(134, 179, 0, 0.1)';
  }
  emojiButton.onmouseout = () => {
    emojiButton.style.backgroundColor = 'transparent';
  }

  emojiButton.onmousedown = (e) => {
    e.preventDefault();
  }

  emojiButton.onclick = () => {
    if (isShowingEmojiPickerModal()) closeEmojiPickerModal();
    else showEmojiPickerModal(emojiButton);
  }

  return emojiButton;
}
