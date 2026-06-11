import darkTheme from './dark.json';
import blackTheme from './black.json';
import whiteTheme from './white.json';

export const themes: Record<string, Record<string, string>> = {
  dark: darkTheme,
  black: blackTheme,
  white: whiteTheme,
};

export const applyTheme = (themeName: string) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const theme = themes[themeName] || themes.dark;
  
  // Set each CSS variable defined in the theme JSON
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Maintain CSS class hooks for backward compatibility
  root.classList.remove('theme-white', 'theme-black', 'dark');
  if (themeName === 'white') {
    root.classList.add('theme-white');
  } else if (themeName === 'black') {
    root.classList.add('theme-black');
    root.classList.add('dark');
  } else {
    root.classList.add('dark');
  }
};
