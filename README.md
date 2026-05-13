# Albion Tool

> Advanced Albion Online Data Platform
> Crafting • Market Prices • Profitability • Economy Tools • Admin System

Albion Tool est une plateforme complète de gestion de données pour Albion Online, pensée comme un véritable outil professionnel orienté économie, crafting et optimisation.

Le projet centralise :

- la base complète des items
- les recettes de craft
- les refining chains
- les arbres de crafting
- les prix live du marché
- l’historique des prix
- les calculateurs de rentabilité
- les outils d’optimisation économique
- l’administration des données
- la gestion des utilisateurs

L’objectif est de proposer une architecture scalable, modulaire et production-ready, pensée pour évoluer vers une vraie plateforme SaaS premium.

---

# Stack Technique

## Frontend

- Nuxt 3
- Vue 3
- TypeScript
- Tailwind CSS
- UI Dark Mode
- Dashboard UX moderne

## Backend

- Nuxt Server Routes (API REST)
- Architecture modulaire backend
- Services métier découplés
- Import engine
- Pricing engine
- Admin engine

## Database

- PostgreSQL
- Prisma ORM v7
- Historisation complète
- Optimisation gros volumes

## Infrastructure

- Docker
- Docker Compose
- Dev / Staging / Production Ready

---

# Core Features

## Smart Item Search

Recherche avancée avec filtres dynamiques :

- item search
- category filters
- tier filters
- enchantment filters
- city filters
- refining filters
- craftability filters
- weapon family filters
- specialization filters

---

## Item Detail Page

Chaque item dispose d’une page complète avec :

- stats complètes
- tier réel
- enchantement réel
- crafting requirements
- recipe complète
- crafting spells
- related resources
- item progression
- dependencies
- refining chain
- crafting tree
- city bonuses
- return rates
- taxes
- profitability estimation
- station requirements
- related items

---

## Crafting Tree Engine

Système avancé de génération :

- recursive dependencies
- parent / child resources
- refining chains
- multi-step recipes
- profitability simulation

---

## Live Market Prices

Intégration de l’Albion Online Data Project API :

- live prices
- buy / sell spread
- best buy city
- best sell city
- historical prices
- charts
- gold prices
- city arbitrage
- profitability engine

---

## Profitability Tools

Prévu pour :

- craft calculator
- refining calculator
- transport calculator
- flip calculator
- economy analytics
- black market tools
- premium optimization tools

---

## Admin Panel

Administration complète :

### User Management

- create users
- roles & permissions
- moderation
- suspension
- audit logs

### Data Management

- full DB update
- partial sync
- market sync
- icon sync
- cache refresh
- reindex
- retry failed jobs
- monitoring
- import logs
- API health checks

---

# Data Sources

## Static Game Data

Official dump source :

https://github.com/ao-data/ao-bin-dumps

Used for :

- items
- crafting
- resources
- equipment
- enchantments
- cities
- categories
- crafting stations
- refining chains
- filters structure

---

## Market Prices API

Albion Online Data Project API :

- West (Americas)
- East (Asia)
- Europe

Used for :

- current prices
- historical prices
- gold prices
- price analytics

Supports :

- batching
- rate limit safe sync
- GZIP optimization
- retry logic
- queue system

---

# Project Philosophy

Ce projet n’est pas pensé comme un simple fan tool.

L’objectif est :

## SaaS-ready Architecture

- scalable
- maintainable
- modular
- profitable
- extensible

Avec possibilité future :

- subscriptions
- premium features
- public API
- guild tools
- economy intelligence
- advanced market analytics

---

# Development Priorities

## Phase 1

Core Database Engine

- parser refactor
- item normalization
- crafting system
- filters system
- crafting tree foundations

## Phase 2

Pricing Engine

- live prices
- history sync
- profitability calculations
- market dashboards

## Phase 3

Advanced Economy Tools

- flip tools
- transport optimization
- black market
- advanced analytics

## Phase 4

SaaS Expansion

- subscriptions
- premium tools
- API public access
- guild ecosystem tools

---

# Lancer le serveur

## Prérequis

- Node.js >= 22
- pnpm >= 9
- Docker + Docker Compose

## Variables d'environnement

Créer le fichier `.env` à partir de l'exemple :

```bash
cp .env.example .env
```

Variables minimales à vérifier :

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `NUXT_SESSION_SECRET`
- `APP_URL`
- `DATABASE_URL`
- `REDIS_URL`

Pour générer un secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Développement

### Option 1: lancer l'app en local

Installer les dépendances :

```bash
pnpm install
```

Démarrer PostgreSQL et Redis :

```bash
docker-compose up -d postgres redis
```

Appliquer les migrations et générer Prisma :

```bash
pnpm db:generate
pnpm db:migrate
```

Lancer le serveur de développement Nuxt :

```bash
pnpm dev
```

Application disponible sur `http://localhost:3000`.

### Option 2: lancer tout l'environnement via Docker

```bash
docker-compose up --build
```

Cette commande démarre :

- `postgres`
- `redis`
- `app` en mode développement
- `worker`

L'application est exposée sur `http://localhost:3000`.

## Production

Le mode production s'appuie sur `docker-compose.prod.yml` avec :

- `postgres`
- `pgbouncer`
- `redis`
- `app` buildée en mode production
- `nginx`

### 1. Préparer l'environnement

Mettre à jour `.env` avec des valeurs de production :

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `NUXT_SESSION_SECRET`
- `APP_URL`

Important :

- `APP_URL` doit pointer vers l'URL publique du site
- dans `docker-compose.prod.yml`, l'application utilise `pgbouncer` via `DATABASE_URL`

### 2. Construire et démarrer

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Au démarrage, le conteneur `app` exécute automatiquement `prisma migrate deploy` avant de lancer Nuxt.

### 3. Vérifier les logs

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### 4. Arrêter la stack

```bash
docker-compose -f docker-compose.prod.yml down
```

### Ports exposés

- `80` pour HTTP
- `443` pour HTTPS

## Commandes utiles

Build du monorepo :

```bash
pnpm build
```

Vérification de types :

```bash
pnpm typecheck
```

Tests :

```bash
pnpm test
```

---

# Important Notes

Le projet respecte :

- clean architecture
- modular domain logic
- scalable import systems
- safe pricing synchronization
- rate limit compliance
- production-grade observability

Aucune logique quick fix.

Aucune architecture jetable.

Objectif : long terme.

---

# Roadmap

- [x] Core architecture
- [x] Parser foundations
- [x] Item detail system
- [ ] Crafting Tree Engine
- [ ] Pricing Engine
- [ ] Profitability Calculators
- [ ] Advanced Admin Panel
- [ ] Premium Economy Tools
- [ ] Public API
- [ ] SaaS Monetization Layer

---

# License

Private Project — Internal Development

---

# Author

Built for serious Albion Online economy players.

Designed for scale.
Built for the long game.
