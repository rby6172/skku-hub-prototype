import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드: GitHub Pages 하위 주소(…github.io/저장소이름/)에서도 그대로 동작
  base: './',
  server: { port: 5173 },
});
