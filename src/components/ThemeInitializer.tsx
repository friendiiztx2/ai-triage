'use client';

import { useServerInsertedHTML } from 'next/navigation';

export default function ThemeInitializer() {
  useServerInsertedHTML(() => {
    return (
      <script
        id="theme-initializer-script"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var savedTheme = localStorage.getItem('theme');
                var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `
        }}
      />
    );
  });
  return null;
}
