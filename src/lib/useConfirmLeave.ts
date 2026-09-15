import { useEffect } from 'react';

const DEFAULT_MESSAGE = '入力中の内容が保存されていません。このページを離れますか？';

/**
 * フォームに未保存の変更があるとき、ブラウザの戻る/進む・リンククリック・
 * タブを閉じる操作の前に確認ダイアログを出す。
 */
export function useConfirmLeave(isDirty: boolean, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }

    function handlePopState() {
      if (window.confirm(message)) {
        window.removeEventListener('popstate', handlePopState);
        history.back();
      } else {
        history.pushState(null, '', window.location.href);
      }
    }

    // ブラウザの「戻る」を1回吸収して確認する余地を作る
    history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, message]);
}
