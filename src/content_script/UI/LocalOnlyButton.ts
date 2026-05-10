import browser from 'webextension-polyfill';
import { global_icon, local_only_icon } from "./Icons";

export const localOnlyButtonClassName = 'misskey-local-only-button'

export const createLocalOnlyButton = () => {
    const localOnlyButton = document.createElement('div');

    const updateLocalOnlyIcon = () => browser.storage.sync.get(['misskey_local_only']).then((result) => {
        const localOnly = result?.misskey_local_only ?? false;
        updateLocalOnlyButton(localOnlyButton, localOnly);
    });

    setInterval(() => {
        updateLocalOnlyIcon();
    }, 2000);

    updateLocalOnlyIcon();

    browser.storage.sync.get(['misskey_show_local_only'])
        .then((result) => {
            const showLocalOnly = result?.misskey_show_local_only ?? true;
            if (!showLocalOnly) {
                localOnlyButton.style.display = 'none';
            }
        });
    localOnlyButton.className = localOnlyButtonClassName;
    
    localOnlyButton.style.minWidth = '36px';
    localOnlyButton.style.width = '36px';
    localOnlyButton.style.maxWidth = '36px';

    localOnlyButton.style.minHeight = '36px';
    localOnlyButton.style.height = '36px';
    localOnlyButton.style.maxHeight = '36px';

    localOnlyButton.style.backgroundColor = 'transparent';
    localOnlyButton.style.display = 'flex'
    localOnlyButton.style.margin = '2px';
    localOnlyButton.style.paddingTop = '0';
    localOnlyButton.style.alignItems = 'center'
    localOnlyButton.style.justifyContent = 'center'
    localOnlyButton.style.borderRadius = '9999px';
    localOnlyButton.style.cursor = 'pointer';
    localOnlyButton.style.transitionProperty = 'transform, background-color, all';
    localOnlyButton.style.transitionDuration = '0.15s, 0.2s, 0.15s';
    localOnlyButton.style.transitionTimingFunction = 'ease-in-out';
    localOnlyButton.onmouseover = () => {
        localOnlyButton.style.backgroundColor = 'rgba(134, 179, 0, 0.1)';
        localOnlyButton.style.transform = 'scale(1.12)';
    }
    localOnlyButton.onmouseout = () => {
        localOnlyButton.style.backgroundColor = 'transparent';
        localOnlyButton.style.transform = 'scale(1)';
    }

    localOnlyButton.onclick = () => {
        browser.storage.sync.get(['misskey_local_only'])
            .then((result) => {
                const localOnly = result?.misskey_local_only ?? false;
                browser.storage.sync.set({ misskey_local_only: !localOnly });
                updateLocalOnlyIcon();
            });
    }

    return localOnlyButton;
}

export const updateLocalOnlyButton = (localOnlyButton: HTMLDivElement, localOnly: boolean) => {
    if (localOnly) {
        localOnlyButton.innerHTML = local_only_icon
    }
    else {
        localOnlyButton.innerHTML = global_icon
    }
}