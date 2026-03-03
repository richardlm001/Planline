import { describe, it, expect, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { confirmDialog, alertDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  afterEach(() => {
    // Clean up any remaining dialog backdrops
    document.querySelectorAll('[data-testid="confirm-dialog-backdrop"]').forEach((el) => el.remove());
  });

  describe('confirmDialog', () => {
    it('renders the message and resolves true on OK click', async () => {
      const promise = confirmDialog('Delete this item?');

      expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent('Delete this item?');
      expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('confirm-dialog-ok')).toHaveTextContent('OK');

      fireEvent.click(screen.getByTestId('confirm-dialog-ok'));

      const result = await promise;
      expect(result).toBe(true);
    });

    it('resolves false on Cancel click', async () => {
      const promise = confirmDialog('Are you sure?');

      expect(screen.getByTestId('confirm-dialog-cancel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      const result = await promise;
      expect(result).toBe(false);
    });

    it('resolves false on Escape key', async () => {
      const promise = confirmDialog('Press escape?');

      expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      const result = await promise;
      expect(result).toBe(false);

      // Dialog should be removed from the DOM
      expect(screen.queryByTestId('confirm-dialog-backdrop')).not.toBeInTheDocument();
    });

    it('resolves false on backdrop click', async () => {
      const promise = confirmDialog('Click outside?');

      const backdrop = screen.getByTestId('confirm-dialog-backdrop');
      fireEvent.click(backdrop);

      const result = await promise;
      expect(result).toBe(false);
    });

    it('uses custom button labels', async () => {
      const promise = confirmDialog('Custom labels?', {
        confirmLabel: 'Yes, delete',
        cancelLabel: 'No, keep',
      });

      expect(screen.getByTestId('confirm-dialog-ok')).toHaveTextContent('Yes, delete');
      expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('No, keep');

      fireEvent.click(screen.getByTestId('confirm-dialog-ok'));
      await promise;
    });
  });

  describe('alertDialog', () => {
    it('renders the message with only an OK button', async () => {
      const promise = alertDialog('Something went wrong.');

      expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent('Something went wrong.');
      // Alert mode has no cancel button
      expect(screen.queryByTestId('confirm-dialog-cancel')).not.toBeInTheDocument();
      expect(screen.getByTestId('confirm-dialog-ok')).toHaveTextContent('OK');

      fireEvent.click(screen.getByTestId('confirm-dialog-ok'));
      await promise;
    });

    it('dismisses on Escape key', async () => {
      const promise = alertDialog('Escape me.');

      expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      await promise;
      // Dialog should be removed
      expect(screen.queryByTestId('confirm-dialog-backdrop')).not.toBeInTheDocument();
    });
  });
});
