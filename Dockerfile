FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN ls -la .env* || echo "Warning: No .env files found"
RUN cat .env.production || echo "Warning: .env.production not found"

RUN npm run build -- --debug > build.log 2>&1 || (echo "BUILD FAILED!" && cat build.log && exit 1)

RUN ls -la build/
RUN echo "Checking for hardcoded IPs..." && \
    grep -r "20.193.255.47" build/ && echo "❌ FOUND OLD IP!" || echo "✅ No hardcoded IPs"

FROM python:3.12-slim

RUN apt-get update && apt-get install -y nginx supervisor curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY HR_Backend_FastAPI ./HR_Backend_FastAPI

RUN pip install --no-cache-dir -r HR_Backend_FastAPI/requirements.txt

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
EXPOSE 9000

CMD ["/usr/bin/supervisord"]
