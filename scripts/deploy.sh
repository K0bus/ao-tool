#!/bin/bash

# Configuration
NAMESPACE="k0bus/albion-silvermind"
TAG="${1:-$(git rev-parse --short HEAD)}"

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Préparation du déploiement pour ${NAMESPACE}:${TAG}${NC}"

# 1. Postgres
echo -e "${BLUE}📦 Building Postgres...${NC}"
docker build -t ${NAMESPACE}-postgres:${TAG} -f docker/postgres/Dockerfile docker/postgres/
docker push ${NAMESPACE}-postgres:${TAG}

# 2. Nginx
echo -e "${BLUE}📦 Building Nginx...${NC}"
docker build -t ${NAMESPACE}-nginx:${TAG} -f docker/nginx/Dockerfile docker/nginx/
docker push ${NAMESPACE}-nginx:${TAG}

# 3. App (Nuxt)
echo -e "${BLUE}📦 Building App (cela peut prendre quelques minutes)...${NC}"
docker build --target production -t ${NAMESPACE}-app:${TAG} -f docker/app/Dockerfile .
docker push ${NAMESPACE}-app:${TAG}

# 4. Worker
echo -e "${BLUE}📦 Building Worker...${NC}"
docker build --target production -t ${NAMESPACE}-worker:${TAG} -f docker/worker/Dockerfile .
docker push ${NAMESPACE}-worker:${TAG}

echo -e "${GREEN}✅ Toutes les images ont été envoyées sur Docker Hub !${NC}"
echo -e "${BLUE}ℹ️  Sur votre serveur, vous pouvez maintenant lancer :${NC}"
echo -e "   export IMAGE_TAG=${TAG}"
echo -e "   docker compose -f docker-compose.prod.yml pull"
echo -e "   docker compose -f docker-compose.prod.yml up -d --force-recreate"
