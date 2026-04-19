import { Platform } from 'react-native';

export const Colors = {
  white: '#FFFFFF',
  black: '#222222',
  purple: '#5B2D90',
  yellow: '#FDDA24',
  green: '#00A651',
  background: '#FFFFFF',
  text: '#222222',
  tint: '#5B2D90',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#5B2D90',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
