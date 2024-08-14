import browser from 'webextension-polyfill';
import {closeRenoteModal, isShowingRenoteModal, showRenoteModal} from "./RenoteModal";

export const renoteButtonClassName = 'misskey-renote-button'

export const createRenoteButton = (url: string) => {
    const misskeyIcon = document.createElement('img')
    misskeyIcon.src = browser.runtime.getURL('misskey_icon.png');
    misskeyIcon.style.width = '24px';
    misskeyIcon.style.height = '24px';
    misskeyIcon.style.verticalAlign = 'middle';
    misskeyIcon.style.display = 'inline-block';
    misskeyIcon.style.userSelect = 'none';

    const renoteButton = document.createElement('div');
    renoteButton.setAttribute('url', url);
    renoteButton.className = renoteButtonClassName;
    renoteButton.appendChild(misskeyIcon);

    renoteButton.style.minWidth = '34px';
    renoteButton.style.width = '34px';
    renoteButton.style.maxWidth = '34px';

    renoteButton.style.minHeight = '34px';
    renoteButton.style.height = '34px';
    renoteButton.style.maxHeight = '34px';

    renoteButton.style.marginLeft = '5px';

    renoteButton.style.backgroundColor = 'rgb(134, 179, 0)';
    renoteButton.style.display = 'flex'
    renoteButton.style.alignItems = 'center'
    renoteButton.style.justifyContent = 'center'
    renoteButton.style.borderRadius = '9999px';
    renoteButton.style.cursor = 'pointer';
    renoteButton.style.transition = 'background-color 0.2s ease-in-out';
    renoteButton.onmouseover = () => {
        renoteButton.style.backgroundColor = 'rgb(100, 134, 0)';
    }
    renoteButton.onmouseout = () => {
        renoteButton.style.backgroundColor = 'rgb(134, 179, 0)';
    }

    renoteButton.onclick = (event) => {
        event.stopPropagation();
        if (isShowingRenoteModal()) {
            closeRenoteModal();
        } else {
            showRenoteModal(renoteButton, renoteButton.getAttribute('url') || '');
        }
    }

    return renoteButton;
}