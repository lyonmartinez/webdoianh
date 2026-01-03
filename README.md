<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PNG Pro Resizer & AI Optimizer

Hướng dẫn cài đặt, chạy local và deploy project.

## Run Locally

**Prerequisites:** Node.js, npm

1. Cài dependencies:
   `npm install`
2. (Tùy cấu hình) Tạo file `.env.local` và thêm key nếu cần (KHÔNG commit file này):
   `GEMINI_API_KEY=your_gemini_api_key_here`
3. Chạy dev server:
   `npm run dev`

## Build production

```bash
npm run build
# output -> dist/
```

## Deploy
Xem README hoặc hướng dẫn trong repo để deploy lên GitHub Pages hoặc Vercel.
