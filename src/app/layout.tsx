// app/layout.tsx
'use client';

import './globals.css';
import "primereact/resources/themes/vela-orange/theme.css";
import 'primeicons/primeicons.css';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query-client';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="az">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
