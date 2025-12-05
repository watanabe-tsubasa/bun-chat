export type InputHandlers = {
  onInput: (e: any) => void;
  onCompositionstart: (e: any) => void;
  onCompositionend: (e: any) => void;
};

// Returns composition-aware handlers for controlled inputs.
export function createInputHandlers(update: (value: string) => void): InputHandlers {
  let composing = false;
  return {
    onInput: (e: any) => {
      if (composing || e.isComposing) return;
      update(e.target.value);
    },
    onCompositionstart: () => {
      composing = true;
    },
    onCompositionend: (e: any) => {
      composing = false;
      update(e.target.value);
    },
  };
}
