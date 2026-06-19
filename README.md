# School Management System

Système de gestion scolaire avec backend Node.js/Express et frontend React.

## Structure

```
school-management/
├── client/          # Frontend React (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── context/      # Contextes React (Auth, Langue)
│   │   ├── pages/        # Pages de l'application
│   │   │   ├── admin/    # Interface administrateur
│   │   │   ├── teacher/  # Interface enseignant
│   │   │   └── parent/   # Interface parent
│   │   ├── services/     # API client
│   │   └── types/        # Types TypeScript
│   └── vite.config.ts
├── server/          # Backend Node.js (Express)
│   └── src/
│       ├── routes/       # Routes API
│       ├── middleware/   # Middleware (auth JWT)
│       ├── db.js         # Connexion MySQL
│       └── index.js      # Point d'entrée
└── package.json     # Scripts racine
```

## Prérequis

- Node.js 18+
- MySQL (base de données distante ou locale)
- npm

## Installation

```bash
# Installer les dépendances du frontend
cd client && npm install

# Installer les dépendances du backend
cd ../server && npm install

# Revenir à la racine
cd ..
```

## Configuration

### Base de données

Éditer `server/.env` :

```
DB_HOST=163.123.183.89
DB_PORT=17705
DB_USER=ecole
DB_PASSWORD=peda2026
DB_NAME=ecole2026
JWT_SECRET=votre-secret-jwt
PORT=3001
```

## Démarrage

### Mode développement (frontend + backend)

```bash
npm run dev
```

Ou séparément :

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### Mode production

```bash
# Builder le frontend
npm run build

# Démarrer le serveur (sert l'API + le frontend)
npm start
```

- Frontend : `http://localhost:3000` (dev)
- Backend API : `http://localhost:3001/api`
- Production : `http://localhost:3001`

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@ecole.test | password |

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion

### Utilisateurs (admin only)
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur
- `PATCH /api/users/:id/toggle-active` - Activer/désactiver

### Élèves
- `GET /api/students` - Liste des élèves
- `GET /api/students/:id` - Détail d'un élève
- `POST /api/students` - Créer un élève
- `PUT /api/students/:id` - Modifier un élève
- `DELETE /api/students/:id` - Supprimer un élève
- `PATCH /api/students/:id/toggle-active` - Activer/désactiver

### Enseignants
- `GET /api/teachers` - Liste des enseignants
- `POST /api/teachers` - Créer un enseignant
- `PUT /api/teachers/:id` - Modifier un enseignant
- `DELETE /api/teachers/:id` - Supprimer un enseignant (non implémenté côté frontend)
- `PATCH /api/teachers/:id/toggle-active` - Activer/désactiver
