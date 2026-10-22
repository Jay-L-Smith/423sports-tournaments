import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  text,
  onYes,
  onNo,
  okOnly = false,
}: {
  text: string;
  onYes: () => void;
  onNo: () => void;
  okOnly?: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={onNo}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm">{text}</p>
        <div className="mt-4 flex gap-2">
          {okOnly ? null : (
            <Button type="button" variant="outline" className="flex-1" onClick={onNo}>
              Cancel
            </Button>
          )}
          <Button type="button" className="flex-1" onClick={onYes}>
            OK
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
