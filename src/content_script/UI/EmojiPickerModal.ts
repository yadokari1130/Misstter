import browser from 'webextension-polyfill';
import { modal_pin_icon } from "./Icons"
import { getServer } from "../System/StorageReader"

export type Emoji = {
  aliases: string[];
  name: string;
  category: string;
  url: string;
};

let cachedEmojis: Emoji[] | null = null;
let emojiPickerModal: HTMLDivElement | null = null;

export const fetchEmojis = async (): Promise<Emoji[]> => {
  if (cachedEmojis) return cachedEmojis;
  try {
    const server = await getServer();
    const response = await fetch(`${server}/api/emojis`);
    if (!response.ok) throw new Error(`Failed to fetch emojis: ${response.status}`);
    const data = await response.json();
    const emojis = data.emojis || data; // Handle different Misskey versions if needed
    cachedEmojis = Array.isArray(emojis) ? emojis : [];
    return cachedEmojis as Emoji[];
  } catch (e) {
    console.error(e);
    return [];
  }
};

const insertTextToTweetTextarea = (text: string) => {
  let textarea: HTMLElement | null = null;
  const renoteTextarea = document.getElementById('misskey-renote-textarea') as HTMLTextAreaElement | null;
  
  if (renoteTextarea && renoteTextarea.offsetParent !== null) {
      textarea = renoteTextarea;
  } else {
      textarea = document.querySelector('div[data-testid="tweetTextarea_0"]') as HTMLElement | null;
  }

  if (!textarea) return;

  textarea.focus();

  if (textarea instanceof HTMLTextAreaElement) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(text, start, end, 'end');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return;
  }

  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    const event = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    });
    
    if (!textarea.dispatchEvent(event)) {
      return;
    }
    
    if (!document.execCommand('insertText', false, text)) {
      throw new Error('execCommand failed');
    }
  } catch(e) {
    console.warn("Text insertion failed, trying fallback", e);
    const textNode = document.createTextNode(text);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(textNode);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

export const isShowingEmojiPickerModal = () => {
  return emojiPickerModal ? document.body.contains(emojiPickerModal) : false;
};

export const isEmojiPickerModalElement = (element: any) => {
  if (!emojiPickerModal) return false;
  let target = element;
  while (target) {
    if (target === emojiPickerModal) return true;
    target = target.parentNode;
  }
  return false;
}

export const closeEmojiPickerModal = () => {
  if (!isShowingEmojiPickerModal() || !emojiPickerModal) return;

  // animation
  emojiPickerModal.style.opacity = '0';
  setTimeout(() => {
    if (emojiPickerModal) {
      emojiPickerModal.style.opacity = '1';
      // remove modal
      if (emojiPickerModal.parentNode) emojiPickerModal.parentNode.removeChild(emojiPickerModal);
    }
  }, 200);
};

const createEmojiPickerModalContent = async (container: HTMLDivElement) => {
  container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">読み込み中...</div>';
  const emojis = await fetchEmojis();
  
  if (emojis.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">絵文字が見つかりませんでした</div>';
    return;
  }

  // Create categories
  const categories: { [key: string]: Emoji[] } = {};
  emojis.forEach(emoji => {
    const cat = emoji.category || 'カスタム';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(emoji);
  });

  const html = `
  <style>
    .misskey_emoji_picker {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
    }
    .misskey_emoji_category {
      margin-bottom: 12px;
    }
    .misskey_emoji_category_name {
      font-size: 12px;
      font-weight: bold;
      color: rgb(101, 119, 134);
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    .misskey_emoji_grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .misskey_emoji_item {
      width: 52px;
      height: 52px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.1s ease 0s;
    }
    .misskey_emoji_item:hover {
      background-color: rgba(134, 179, 0, 0.1);
    }
    .misskey_emoji_item img {
      max-width: 48px;
      max-height: 48px;
      object-fit: contain;
    }
    /* Scrollbar */
    .misskey_emoji_picker::-webkit-scrollbar {
      width: 6px;
    }
    .misskey_emoji_picker::-webkit-scrollbar-track {
      background: transparent;
    }
    .misskey_emoji_picker::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
  </style>
  <div class="misskey_emoji_picker">
    ${Object.keys(categories).map(catName => `
      <div class="misskey_emoji_category">
        <div class="misskey_emoji_category_name" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <span>${catName}</span>
          <span class="misskey_emoji_category_toggle">▶</span>
        </div>
        <div class="misskey_emoji_grid" style="display: none;">
          ${categories[catName].map(emoji => `
            <div class="misskey_emoji_item" data-emoji-name="${emoji.name}" title=":${emoji.name}:">
              <img data-src="${emoji.url}" alt="${emoji.name}" class="lazy-emoji" />
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>
  `;

  container.innerHTML = html;

  const categoryNames = container.querySelectorAll('.misskey_emoji_category_name');
  categoryNames.forEach(nameEl => {
    nameEl.addEventListener('click', () => {
      const grid = nameEl.nextElementSibling as HTMLElement;
      const toggle = nameEl.querySelector('.misskey_emoji_category_toggle') as HTMLElement;
      if (grid.style.display === 'none') {
        grid.style.display = 'flex';
        toggle.innerText = '▼';
      } else {
        grid.style.display = 'none';
        toggle.innerText = '▶';
      }
    });
  });

  const emojiItems = container.querySelectorAll('.misskey_emoji_item');
  emojiItems.forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-emoji-name');
      if (name) {
        insertTextToTweetTextarea(`:${name}:`);
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');
        if (src && !img.src) {
          browser.runtime.sendMessage({ type: 'fetchImage', url: src }).then((dataUrl: unknown) => {
            if (typeof dataUrl === 'string') img.src = dataUrl;
          }).catch(console.error);
        }
        observer.unobserve(img);
      }
    });
  }, {
    root: container.querySelector('.misskey_emoji_picker'),
    rootMargin: '100px'
  });

  const lazyImages = container.querySelectorAll('.lazy-emoji');
  lazyImages.forEach(img => observer.observe(img));
};

const createEmojiPickerModal = () => {
  const modal = document.createElement('div');
  modal.style.fontFamily = 'sans-serif';
  modal.style.position = 'absolute';
  modal.style.width = '280px';
  modal.style.top = '45px';
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '4px';
  modal.style.boxShadow = 'rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px';
  modal.style.transition = 'opacity 0.2s ease 0s';
  modal.style.zIndex = '9999';

  const modal_pin = document.createElement('div');
  modal_pin.innerHTML = modal_pin_icon;
  modal_pin.style.fill = 'white';
  modal_pin.style.width = '24px';
  modal_pin.style.height = '24px';
  modal_pin.style.position = 'absolute';
  modal_pin.style.top = '-12px';
  modal_pin.style.left = 'calc(50% - 12px)';
  modal.appendChild(modal_pin);

  const modal_content = document.createElement('div');
  modal.appendChild(modal_content);

  // Prevent mousedown from taking focus away from the tweet textarea
  modal.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  // Lazy load the content when modal shows
  createEmojiPickerModalContent(modal_content);

  return modal;
};

export const showEmojiPickerModal = (emojiButton: HTMLDivElement) => {
  if (!emojiPickerModal) emojiPickerModal = createEmojiPickerModal();

  if (!isShowingEmojiPickerModal()) document.body.appendChild(emojiPickerModal);

  // set position of modal
  const rect = emojiButton.getBoundingClientRect();
  emojiPickerModal.style.top = `${rect.top + window.scrollY + 40}px`;
  emojiPickerModal.style.left = `${rect.left + window.scrollX - 123}px`; // Center relative to button based on modal width (280/2 - 17)
};

const handleDocumentClick = (e: MouseEvent) => {
  let target: any = e.target;
  while (target) {
    if (target.className === "misskey-emoji-picker-button") return;
    if (target === emojiPickerModal) return; // Don't close if clicking inside the modal
    target = target.parentNode;
  }
  closeEmojiPickerModal();
};

window.addEventListener('click', handleDocumentClick);
