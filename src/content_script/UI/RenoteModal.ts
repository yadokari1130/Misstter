import browser from 'webextension-polyfill';
import {modal_pin_icon} from "./Icons";
import {misskeyFlagAttribute} from "./ImageFlagButton";
import {showNotification} from "./Notification";
import {getCW, getLocalOnly, getScope, getSensitive, getServer, getToken} from "../System/StorageReader";
import {Scope, isScopeModalElement} from "./ScopeModal";
import {postToMisskey} from "../System/PostAPI";
import {createLocalOnlyButton} from "./LocalOnlyButton";
import {createScopeButton} from "./ScopeButton";
import {createEmojiPickerButton} from "./EmojiPickerButton";
import {isEmojiPickerModalElement} from "./EmojiPickerModal";

export const renoteModalClassName = 'renote-modal';
export let url: string | null = null;

const createRenoteButton = (textArea: any) => {
    const button = document.createElement('div');
    button.style.backgroundColor = 'rgb(134, 179, 0)';
    button.style.border = '5px';
    button.style.padding = '5px';
    button.style.cursor = 'pointer';
    button.style.borderRadius = '3px';
    button.innerHTML = '<p style="text-align: center; margin: 0px">リノート</p>';

    button.onclick = async () => {
        try {
            const [token, server, cw, sensitive, scope, localOnly] = await Promise.all([
                getToken(), getServer(), getCW(), getSensitive(), getScope(), getLocalOnly(),
            ])

            const url = button.parentElement?.parentElement?.parentElement?.getAttribute('url');
            const text = `${textArea.value}\n\n${url}`;
            const options = { cw, token, server, sensitive, scope: scope as Scope, localOnly }
            await postToMisskey(text ?? '', [], [], options);
        } catch (e) {
            console.error(e)
            showNotification('Misskeyへの投稿に失敗しました', 'error')
        }
        textArea.value = '';
        closeRenoteModal();
    }

    return button;
}

const createRenoteModal = () => {
    const modal = document.createElement('div');
    modal.className = renoteModalClassName;
    modal.style.fontFamily = 'sans-serif';
    modal.style.position = 'absolute';
    modal.style.padding = '10px';
    modal.style.backgroundColor = 'inherit';
    modal.style.color = 'inherit';
    modal.style.border = '2px solid rgb(134, 179, 0)';
    modal.style.borderRadius = '10px';
    // transition on opacity
    modal.style.transition = 'opacity 0.2s ease 0s';

    const modal_content = document.createElement('div');
    const textArea = document.createElement('textarea');
    textArea.id = 'misskey-renote-textarea';
    textArea.style.background = 'inherit';
    textArea.style.width = '320px';
    textArea.style.height = '180px';
    textArea.style.padding = "3px";
    textArea.style.borderRadius = "3px";
    modal_content.innerHTML = `
        <h5 style="margin-bottom: 10px; margin-top: 5px">引用リノート</h5>
    `
    modal_content.appendChild(textArea);
    const renoteButton = createRenoteButton(textArea);
    textArea.onkeydown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) renoteButton.click()
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginTop = '8px';

    const misstterButtons = document.createElement('div');
    misstterButtons.style.display = 'flex';
    misstterButtons.style.gap = '4px';
    misstterButtons.appendChild(createScopeButton());
    misstterButtons.appendChild(createLocalOnlyButton());
    misstterButtons.appendChild(createEmojiPickerButton());

    buttonContainer.appendChild(misstterButtons);
    buttonContainer.appendChild(renoteButton);

    modal_content.appendChild(buttonContainer);

    modal.appendChild(modal_content);
    return modal
}

// Global renote modal
const renoteModal = createRenoteModal();

export const showRenoteModal = (renoteButton: HTMLDivElement, url: string) => {
    if (!isShowingRenoteModal()) {
        renoteModal.setAttribute('url', url);
        document.body.appendChild(renoteModal);
    }

    // set position of modal
    const rect = renoteButton.getBoundingClientRect();

    const modalWidth = renoteModal.offsetWidth || 344;
    const modalHeight = renoteModal.offsetHeight || 260;

    let top = rect.top + window.scrollY + 40;
    let left = rect.left + window.scrollX - 83;

    if (left + modalWidth > window.scrollX + window.innerWidth) {
        left = window.scrollX + window.innerWidth - modalWidth - 30;
    }
    if (left < window.scrollX) {
        left = window.scrollX + 30;
    }

    if (top + modalHeight > window.scrollY + window.innerHeight) {
        top = rect.top + window.scrollY - modalHeight - 30;
    }
    if (top < window.scrollY) {
        top = window.scrollY + 30;
    }

    renoteModal.style.top = `${top}px`;
    renoteModal.style.left = `${left}px`;
}

export const isShowingRenoteModal = () => {
    return document.body.contains(renoteModal);
}

const handleDocumentClick = (e: MouseEvent) => {
    let target: any = e.target;
    if (isScopeModalElement(target) || isEmojiPickerModalElement(target)) return;
    
    while (target) {
        if (target.className === renoteModalClassName) return;
        target = target.parentElement;
    }
    closeRenoteModal();
}

window.addEventListener('click', handleDocumentClick);


export const closeRenoteModal = () => {
    if (!isShowingRenoteModal()) return;

    // animation
    renoteModal.style.opacity = '0';
    setTimeout(() => {
        renoteModal.style.opacity = '1';
        // remove modal
        renoteModal.remove();
    }, 200);
}
