import React from 'react';

// Stage 6.2 (1:1 refactor): extracted from LedgersPage root shell
export function LedgerTabsShell({ children }) {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {children}
    </div>
  );
}
