# Multi-stage Dockerfile untuk Aplikasi Jadwal & Kursus Mahasiswa
# Base image Node.js 20 Alpine (Ringan dan aman)
FROM node:20-alpine AS builder

WORKDIR /app

# Salin definisi dependensi
COPY package.json ./

# Install seluruh dependensi
RUN npm install

# Salin seluruh source code proyek
COPY . .

# Build frontend (Vite) dan backend bundle (esbuild -> dist/server.cjs)
RUN npm run build

# -------------------------------------------------------------
# Production Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dependensi produksi saja untuk meminimalkan ukuran image
COPY package.json ./
RUN npm install --omit=dev

# Salin hasil build dari stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/database.sql ./database.sql

# Buat folder penyimpanan data lokal jika diperlukan
RUN mkdir -p /app/data/pgdata && chown -R node:node /app

USER node

EXPOSE 3000

# Jalankan server bundle
CMD ["node", "dist/server.cjs"]
