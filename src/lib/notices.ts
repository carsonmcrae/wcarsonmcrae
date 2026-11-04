/**
 * Purpose: Accessible, dismissible action feedback.
 * Scope: Eight-second notices that pause on hover/focus and can be dismissed by hand.
 * Does NOT belong: The actions that request a notice.
 */
export function initActionNotice(doc: Document, win: Pick<Window, 'setTimeout' | 'clearTimeout'>) {
  const notice = doc.querySelector<HTMLElement>('[data-action-notice]');
  if (!notice) return { show: (_message: string) => {}, destroy: () => {} };
  const text = notice.querySelector<HTMLElement>('[data-notice-text]')!;
  const live = doc.querySelector<HTMLElement>('[data-action-live]')!;
  const dismiss = notice.querySelector<HTMLButtonElement>('[data-dismiss-notice]')!;
  let timer = 0;
  const pause = () => win.clearTimeout(timer);
  const hide = () => {
    pause();
    notice.hidden = true;
    live.textContent = '';
  };
  const resume = () => {
    pause();
    timer = win.setTimeout(hide, 8000);
  };
  const show = (message: string) => {
    text.textContent = message;
    live.textContent = message;
    notice.hidden = false;
    resume();
  };
  dismiss.addEventListener('click', hide);
  notice.addEventListener('mouseenter', pause);
  notice.addEventListener('focusin', pause);
  notice.addEventListener('mouseleave', resume);
  notice.addEventListener('focusout', resume);
  return {
    show,
    destroy: () => {
      pause();
      dismiss.removeEventListener('click', hide);
      notice.removeEventListener('mouseenter', pause);
      notice.removeEventListener('focusin', pause);
      notice.removeEventListener('mouseleave', resume);
      notice.removeEventListener('focusout', resume);
    },
  };
}
