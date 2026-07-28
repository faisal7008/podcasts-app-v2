/**
 * "or continue with" divider for auth forms.
 * Uses the Figma divider color token.
 */
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-divider" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-bg px-4 text-[13px] text-text-muted">
          or continue with
        </span>
      </div>
    </div>
  );
}
