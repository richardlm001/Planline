interface ConfirmDialogOptions {
  confirmLabel?: string;
  cancelLabel?: string;
}

function createDialog(
  message: string,
  mode: 'confirm' | 'alert',
  options: ConfirmDialogOptions | undefined,
  resolve: (result: boolean) => void,
) {
  let resolved = false;

  const finish = (result: boolean) => {
    if (resolved) return;
    resolved = true;
    window.removeEventListener('keydown', handleKey, true);
    backdrop.remove();
    resolve(result);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      finish(false);
    }
  };

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/40';
  backdrop.setAttribute('data-testid', 'confirm-dialog-backdrop');
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) finish(false);
  });

  // Card
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden';

  // Body
  const body = document.createElement('div');
  body.className = 'px-5 pt-5 pb-4';
  const p = document.createElement('p');
  p.className = 'text-sm text-gray-700 leading-relaxed';
  p.textContent = message;
  p.setAttribute('data-testid', 'confirm-dialog-message');
  body.appendChild(p);
  card.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'flex justify-end gap-2 px-5 pb-4';

  if (mode === 'confirm') {
    const cancelBtn = document.createElement('button');
    cancelBtn.className =
      'px-4 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors';
    cancelBtn.textContent = options?.cancelLabel ?? 'Cancel';
    cancelBtn.setAttribute('data-testid', 'confirm-dialog-cancel');
    cancelBtn.addEventListener('click', () => finish(false));
    footer.appendChild(cancelBtn);
  }

  const okBtn = document.createElement('button');
  okBtn.className =
    'px-4 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors';
  okBtn.textContent = mode === 'confirm' ? (options?.confirmLabel ?? 'OK') : 'OK';
  okBtn.setAttribute('data-testid', 'confirm-dialog-ok');
  okBtn.addEventListener('click', () => finish(mode === 'confirm'));
  footer.appendChild(okBtn);

  card.appendChild(footer);
  backdrop.appendChild(card);

  window.addEventListener('keydown', handleKey, true);
  document.body.appendChild(backdrop);
  okBtn.focus();
}

export function confirmDialog(
  message: string,
  options?: ConfirmDialogOptions,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    createDialog(message, 'confirm', options, resolve);
  });
}

export function alertDialog(message: string): Promise<void> {
  return new Promise<void>((resolve) => {
    createDialog(message, 'alert', undefined, () => resolve());
  });
}
