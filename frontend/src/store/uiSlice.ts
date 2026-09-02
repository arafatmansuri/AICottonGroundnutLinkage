import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type Language = 'en' | 'hi' | 'gu';

interface UIState {
  language: Language;
  sidebarOpen: boolean;
  theme: 'light';
}

const initialState: UIState = {
  language: (localStorage.getItem('language') as Language) || 'en',
  sidebarOpen: true,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setLanguage, toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
