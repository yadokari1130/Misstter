import browser from 'webextension-polyfill';

import { isShowingScopeModal, showScopeModal, closeScopeModal, updateScopeButton } from '../UI/ScopeModal';

export const scopeButtonClassName = 'misskey-scope-button'

export const createScopeButton = () => {
  const scopeButton = document.createElement('div');
  
  const updateScopeIcon = () => browser.storage.sync.get(['misskey_scope']).then((result) => {
    const scope = result?.misskey_scope ?? 'public';
    updateScopeButton(scopeButton, scope);
  });

  setInterval(() => {
    updateScopeIcon();
  }, 2000);
  
  updateScopeIcon();

  browser.storage.sync.get(['misskey_access'])
    .then((result) => {
      const access = result?.misskey_access ?? true;
      if (!access) {
        scopeButton.style.display = 'none';
      }
    });
  scopeButton.className = scopeButtonClassName;
  
  scopeButton.style.minWidth = '36px';
  scopeButton.style.width = '36px';
  scopeButton.style.maxWidth = '36px';
  
  scopeButton.style.minHeight = '36px';
  scopeButton.style.height = '36px';
  scopeButton.style.maxHeight = '36px';

  scopeButton.style.backgroundColor = 'transparent';
  scopeButton.style.display = 'flex'
  scopeButton.style.margin = '2px';
  scopeButton.style.paddingTop = '0';
  scopeButton.style.alignItems = 'center'
  scopeButton.style.justifyContent = 'center'
  scopeButton.style.borderRadius = '9999px';
  scopeButton.style.cursor = 'pointer';
  scopeButton.style.transitionProperty = 'transform, background-color, all';
  scopeButton.style.transitionDuration = '0.15s, 0.2s, 0.15s';
  scopeButton.style.transitionTimingFunction = 'ease-in-out';
  scopeButton.onmouseover = () => {
    scopeButton.style.backgroundColor = 'rgba(134, 179, 0, 0.1)';
    scopeButton.style.transform = 'scale(1.12)';
  }
  scopeButton.onmouseout = () => {
    scopeButton.style.backgroundColor = 'transparent';
    scopeButton.style.transform = 'scale(1)';
  }

  scopeButton.onclick = () => {
    if (isShowingScopeModal()) {
      closeScopeModal();
    } else {
      showScopeModal(scopeButton);
    }
  }

  return scopeButton;
}
