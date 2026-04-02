// Stage 6.2 (1:1 refactor): extracted from LedgersPage root shell
export function LedgerTabsShell({ children }) {
  return (
    <div className="page-shell page-shell--wide ledgers-page ledgers-page-shell">{children}</div>
  );
}
