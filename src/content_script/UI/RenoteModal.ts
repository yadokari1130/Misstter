import browser from 'webextension-polyfill';
import {modal_pin_icon} from "./Icons";
import {misskeyFlagAttribute} from "./ImageFlagButton";
import {showNotification} from "./Notification";
import {getCW, getLocalOnly, getScope, getSensitive, getServer, getToken} from "../System/StorageReader";
import {Scope} from "./ScopeModal";
import {postToMisskey} from "../System/PostAPI";

export const renoteModalClassName = 'renote-modal';
export let url: string | null = null;

const createRenoteButton = (textArea: any) => {
    const button = document.createElement('div');
    button.style.backgroundColor = 'rgb(134, 179, 0)';
    button.style.border = '5px';
    button.style.padding = '5px';
    button.style.cursor = 'pointer';
    button.innerHTML = '<p style="text-align: center; margin: 0px">リノート</p>';

    button.onclick = async () => {
        try {
            const [token, server, cw, sensitive, scope, localOnly] = await Promise.all([
                getToken(), getServer(), getCW(), getSensitive(), getScope(), getLocalOnly(),
            ])

            const url = button.parentElement?.parentElement?.getAttribute('url');
            const text = `${textArea.value}\n\n${url}`;
            const options = { cw, token, server, sensitive, scope: scope as Scope, localOnly }
            await postToMisskey(text ?? '', [], null, options);
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
    modal.style.border = '2px solid rgb(134, 179, 0)';
    modal.style.borderRadius = '10px';
    // transition on opacity
    modal.style.transition = 'opacity 0.2s ease 0s';

    const modal_content = document.createElement('div');
    const textArea = document.createElement('textarea');
    textArea.style.background = 'inherit';
    textArea.style.width = '320px';
    textArea.style.height = '180px';
    modal_content.innerHTML = `
        <h5 style="margin-bottom: 10px; margin-top: 5px">引用リノート</h5>
    `
    modal_content.appendChild(textArea);
    const renoteButton = createRenoteButton(textArea);
    textArea.onkeydown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) renoteButton.click()
    }
    modal_content.appendChild(renoteButton);

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
    renoteModal.style.top = `${rect.top + window.scrollY + 40}px`;
    renoteModal.style.left = `${rect.left + window.scrollX - 83}px`;
}

export const isShowingRenoteModal = () => {
    return document.body.contains(renoteModal);
}

const handleDocumentClick = (e: MouseEvent) => {
    let target: any = e.target;
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
