# 🔧 Manuel Technique de Maintenance

## Système de Gestion Scolaire — Cameroun

---

## Table des Matières

1. [Architecture générale](#1-architecture-générale)
2. [Prérequis techniques](#2-prérequis-techniques)
3. [Installation & Déploiement](#3-installation--déploiement)
4. [Arborescence du projet](#4-arborescence-du-projet)
5. [Base de données](#5-base-de-données)
6. [API REST — Routes complètes](#6-api-rest--routes-complètes)
7. [Frontend — Structure et dépendances](#7-frontend--structure-et-dépendances)
8. [Authentification & Sécurité](#8-authentification--sécurité)
9. [Internationalisation (i18n)](#9-internationalisation-i18n)
10. [Procédures de maintenance](#10-procédures-de-maintenance)
11. [Dépannage avancé](#11-dépannage-avancé)

---

## 1. Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│  Client (React + Vite)          Port 3000                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Vite Dev Server → Proxy /api → localhost:3001        │  │
│  │  Production  → Serveur Express sert /client/dist      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Serveur (Node.js + Express)    Port 3001                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /api/auth       → auth.js                             │  │
│  │  /api/users      → users.js                            │  │
│  │  /api/students   → students.js                         │  │
│  │  /api/teachers   → teachers.js                         │  │
│  │  /api/*          → 10 autres routeurs                  │  │
│  │  /*              → client/dist/index.html (prod)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL (MariaDB)               Port 3306                     │
│  Base : ecole2026                                            │
└─────────────────────────────────────────────────────────────┘
```

### Flux de développement

```bash
# Terminal 1 : Backend + Frontend simultanément
npm run dev

# Ou séparément :
npm run dev:server   # Backend seul (port 3001, avec --watch)
npm run dev:client   # Frontend seul (port 3000, avec HMR)
```

### Flux de production

```bash
npm run build                  # Compile client/dist/
npm start                      # Serveur Express sert le frontend compilé
                               # + API sur le même port (3001)
```

---

## 2. Prérequis techniques

| Logiciel | Version minimum | Notes |
|---|---|---|
| Node.js | ≥ 18 | Testé avec v22.17 |
| npm | ≥ 9 | Fourni avec Node |
| MySQL | ≥ 8.0 | Ou MariaDB ≥ 10.5 |
| Git | ≥ 2.30 | Pour le versioning |

### Dépendances backend

| Package | Rôle |
|---|---|
| `express` ^4.21 | Serveur HTTP |
| `mysql2` ^3.12 | Driver MySQL avec support Promises |
| `bcryptjs` ^2.4 | Hachage des mots de passe |
| `jsonwebtoken` ^9.0 | JWT (JSON Web Tokens) |
| `cors` ^2.8 | Cross-Origin Resource Sharing |
| `dotenv` ^16.4 | Variables d'environnement |

### Dépendances frontend

| Package | Rôle |
|---|---|
| `react` ^19 | UI Library |
| `react-router-dom` ^7 | Routage SPA |
| `axios` ^1.18 | Client HTTP |
| `lucide-react` ^1.21 | Icônes SVG |
| `recharts` ^3.8 | Graphiques (dashboard) |
| `i18next` ^26 | Internationalisation |
| `react-hot-toast` ^2.6 | Notifications |
| `jspdf` ^4.2 | Génération PDF (bulletins) |
| `html2canvas` ^1.4 | Capture écran pour PDF |
| `tailwindcss` ^4.3 | CSS Utility-first |
| `vite` ^8 | Build tool / dev server |
| `typescript` ^6 | Typage statique |

---

## 3. Installation & Déploiement

### 3.1 Installation initiale

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd school-management

# 2. Installer les dépendances racine (concurrently)
npm install

# 3. Installer les dépendances client
cd client && npm install && cd ..

# 4. Installer les dépendances serveur
cd server && npm install && cd ..

# 5. Configurer l'environnement serveur
cp server/.env.example server/.env
# Éditer server/.env avec les bons paramètres
```

### 3.2 Fichier `.env`

```env
DB_HOST=163.123.183.89        # Hôte MySQL
DB_PORT=17705                 # Port MySQL
DB_USER=ecole                 # Utilisateur MySQL
DB_PASSWORD=peda2026          # Mot de passe MySQL
DB_NAME=ecole2026             # Nom de la base
JWT_SECRET=schule-mgmt-secret-key-2026   # Clé secrète JWT
PORT=3001                     # Port du serveur Express
```

### 3.3 Commandes essentielles

```bash
# === DÉVELOPPEMENT ===
npm run dev              # Backend + Frontend simultanés

# === BACKEND SEUL ===
npm run dev:server       # Avec --watch (redémarrage auto)
cd server && node src/index.js    # Sans --watch

# === FRONTEND SEUL ===
npm run dev:client       # Vite dev server avec HMR

# === PRODUCTION ===
npm run build            # Build frontend → client/dist/
npm start                # Server Express sert le build

# === TYPE CHECK ===
cd client && npx tsc --noEmit   # Vérification TypeScript

# === LIBÉRER UN PORT ===
fuser -k 3001/tcp        # Tue le processus sur le port 3001
```

---

## 4. Arborescence du projet

```
school-management/
├── package.json                 # Scripts racine (dev, build, start)
├── README.md
├── USER_MANUAL.md               # Manuel utilisateur
├── client/
│   ├── package.json
│   ├── vite.config.ts           # Proxy /api → 3001
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── main.tsx             # Point d'entrée React
│       ├── App.tsx              # Routes (admin/teacher/parent)
│       ├── App.css
│       ├── index.css            # Tailwind
│       ├── types/
│       │   └── index.ts         # Interfaces TypeScript (16 types)
│       ├── services/
│       │   └── api.ts           # Client Axios (15 modules API)
│       ├── context/
│       │   └── AuthContext.tsx   # Contexte d'authentification
│       ├── utils/
│       │   └── constants.ts     # Constantes (langues, régions, etc.)
│       ├── hooks/
│       ├── i18n/
│       │   ├── en.json          # 258 clés anglais
│       │   └── fr.json          # 258 clés français
│       ├── components/
│       │   ├── Sidebar.tsx       # Navigation par rôle
│       │   ├── Navbar.tsx
│       │   ├── DataTable.tsx     # Tableau générique
│       │   ├── Modal.tsx
│       │   ├── LoadingSkeleton.tsx
│       │   └── ProtectedRoute.tsx # Garde par rôle
│       └── pages/
│           ├── auth/            # Login
│           ├── dashboard/       # Admin, Teacher, Parent
│           ├── students/        # List, Form, Profile, Enrollment
│           ├── teachers/        # TeacherList
│           ├── users/           # UserManagement
│           ├── classes/         # ClassList
│           ├── academic/        # AcademicPage
│           ├── courses/         # CoursesPage
│           ├── exams/           # ExamsPage
│           ├── reports/         # ReportPage
│           ├── payments/        # PaymentsPage
│           ├── library/         # LibraryPage
│           ├── messages/        # MessagePage
│           ├── discipline/      # DisciplinePage
│           ├── parents/         # ParentPage
│           └── settings/        # SettingsPage
│
└── server/
    ├── package.json             # ES modules ("type": "module")
    ├── .env                     # Configuration DB + JWT
    ├── .env.example
    └── src/
        ├── index.js             # Point d'entrée Express
        ├── db.js                # Pool MySQL2
        ├── middleware/
        │   └── auth.js          # authenticate() + authorize()
        └── routes/
            ├── auth.js          # POST /login
            ├── users.js         # CRUD utilisateurs
            ├── students.js      # CRUD élèves, enrollment, grades
            ├── teachers.js      # CRUD enseignants, assignations
            ├── classes.js       # Cycles, classes, salles
            ├── academics.js     # Années, trimestres, sessions
            ├── courses.js       # Matières, emploi du temps
            ├── exams.js         # Natures, épreuves, évaluations
            ├── payments.js      # Scolarités, tranches, modes, paiements
            ├── library.js       # Spécialités, livres
            ├── messages.js      # Messagerie
            ├── parents.js       # Liste parents
            ├── dashboard.js     # Statistiques, graphiques
            └── reports.js       # Bulletins
```

---

## 5. Base de données

### 5.1 Tables

La base `ecole2026` contient les tables suivantes :

| Table | Rôle | Colonnes clés |
|---|---|---|
| `users` | Comptes de connexion | `id_user`, `name`, `email`, `password`, `role` (`admin`/`ENSEIGNANT`/`PARENT`), `id_pers`, `is_active` |
| `personnes` | Identité civile | `id_pers`, `nom`, `prenom`, `mobile`, `email`, `type_personne` |
| `eleves` | Élèves (Laravel) | `matricule` (VARCHAR PK), `nom`, `prenom`, `date_naissance`, `sexe` (`M`/`F`), `langue`, `photo_url`, `actif` |
| `Eleve` | Élèves (français) | `matricule` (INT AUTO_INCREMENT), `nom`, `prenom`, `sexe` (1/2), `idVilleNaissance` FK |
| `enseignants` | Enseignants | `id_enseignant` PK, `id_pers` FK, `actif` |
| `Enseignant` | Enseignants (FR) | `id_enseignant` PK, `id_pers` FK, `Actif`, `isDelete` |
| `Cycle` | Cycles pédagogiques | `idCycle`, `libelle`, `description`, `isDelete` |
| `Classe` | Classes | `idClasse`, `libelle`, `idCycle` FK, `titulaire` FK→`enseignants`, `isDelete` |
| `Salle` | Salles physiques | `idSalle`, `libelle`, `position`, `surface`, `idClasse` FK, `actif` |
| `Cours` | Matières | `idCours`, `libelle`, `coefficient`, `note`, `idClasse` FK, `idEnseignant` FK, `actif`, `isDelete` |
| `EmploiDuTemps` | Emploi du temps | `idTemps`, `jour`, `heure`, `idClasse` FK, `idCours` FK |
| `Frequente` | Inscriptions | `idFrequente`, `idSalle` FK, `idAcademi` FK, `matricule` FK→`Eleve`, `idAdmin` |
| `AnneeAcademique` | Années scolaires | `idAnnee`, `libelle`, `periode`, `actif` |
| `Trimestre` | Trimestres | `idTrimes`, `libelle`, `periode`, `idAca` FK |
| `Session` | Sessions d'examens | `idSession`, `libelle`, `idTrimestre` FK |
| `NatureEpreuve` | Types d'épreuves | `idNature`, `libelle` |
| `Epreuve` | Épreuves | `idEpreuve`, `libelle`, `idNature` FK, `idPers` |
| `Evaluation` | Notes | `idEval`, `note`, `appreciation`, `matricule`, `idCours` FK, `idEpreuve` FK, `idSession` FK |
| `Scolarite` | Config frais | `idScolante`, `inscription`, `pension`, `nbreTranche`, `idCycle` FK |
| `Tranches` | Échéanciers | `idTranche`, `libelle`, `montant`, `delai_mois`, `delai_jour`, `idScolante` FK, `actif` |
| `Mode` | Modes de paiement | `idMode`, `libelle`, `actif` |
| `Paiement` | Paiements | `idPaie`, `matricule`, `idAca` FK, `montant`, `datePaie`, `idMode` FK |
| `Livre` | Livres | `idLivre`, `titre`, `auteurs`, `prix`, `edition`, `totalCopie`, `idSpecialite` FK |
| `Specialite` | Spécialités livres | `idSpecialite`, `libelle` |
| `Messages` | Messagerie | `idMessages`, `idExp_Pers`, `idParent`, `objet`, `information`, `created_at`, `valider` |
| `Parents` | Lien parent-élève | `idParent`, `idPers`, `matricule` |
| `Discipline` | Discipline | `ID`, `libelle`, `points`, `matricule` |
| `Rapport` | Rapports | `idRap`, `libelle`, `points`, `matricule`, `idAca`, `commentaire` |

### 5.2 Particularités

- **Deux tables élèves** : `eleves` (Laravel, VARCHAR matricule, sexe M/F) et `Eleve` (français, INT matricule AUTO_INCREMENT, sexe 1/2). `Frequente` et `Paiement` référencent `Eleve.matricule`.
- **Deux tables enseignants** : `enseignants` (minuscule) et `Enseignant` (majuscule). La plupart des requêtes utilisent `enseignants`. La table `Enseignant` est utilisée dans `dashboard.js`.
- **Colonne `isDelete`** : soft delete sur la plupart des tables (`Cours`, `Classe`, `Cycle`, `Eleve`, `Enseignant`, etc.).
- **Colonne `titulaire`** sur `Classe` : ajoutée manuellement (ALTER TABLE), référence `enseignants.id_enseignant`.
- `Cours.idEnseignant` : nullable, permet d'assigner une matière à un enseignant.
- `Frequente.idAdmin` : NOT NULL, doit être renseigné lors de l'inscription (vient du JWT).

### 5.3 À savoir pour les requêtes SQL

```sql
-- Jointure élève → classe actuelle (dernière inscription)
SELECT e.*, cl.libelle AS classe
FROM Eleve e
LEFT JOIN Frequente f ON f.matricule = e.matricule
LEFT JOIN Salle s ON s.idSalle = f.idSalle
LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
WHERE f.idFrequente = (
  SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = e.matricule
)

-- Jointure enseignant → cours assignés
SELECT e.*, c.libelle AS cours
FROM enseignants e
LEFT JOIN Cours c ON c.idEnseignant = e.id_enseignant

-- Jointure enseignant → classe titulaire
SELECT e.*, cl.libelle AS classe
FROM enseignants e
LEFT JOIN Classe cl ON cl.titulaire = e.id_enseignant AND cl.isDelete = 0

-- Cast matricule VARCHAR en INT pour les jointures
CAST(CAST(e.matricule AS UNSIGNED) AS INT) = f.matricule
```

### 5.4 Ajouté au schema (modifications non-Laravel)

```sql
ALTER TABLE Classe ADD COLUMN titulaire INT NULL AFTER idCycle;
-- Clé étrangère implicite vers enseignants.id_enseignant
```

---

## 6. API REST — Routes complètes

Toutes les routes sont préfixées par `/api`. Authentification requise sauf `/api/auth/login`.

### Authentification
| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Non | Login → JWT + infos user |

### Dashboard
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Stats générales (élèves, enseignants, paiements...) |
| GET | `/api/dashboard/teacher/:idPers` | Cours de l'enseignant |
| GET | `/api/dashboard/parent/:idPers` | Enfants du parent |
| GET | `/api/dashboard/recent-payments` | 5 derniers paiements |
| GET | `/api/dashboard/recent-students` | 5 derniers inscrits |
| GET | `/api/dashboard/students-per-class` | Effectifs par classe |
| GET | `/api/dashboard/payment-trend` | Totaux mensuels |

### Utilisateurs (admin only)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/users` | Liste utilisateurs |
| POST | `/api/users` | Créer utilisateur |
| PUT | `/api/users/:id` | Modifier utilisateur |
| DELETE | `/api/users/:id` | Supprimer utilisateur |
| PATCH | `/api/users/:id/toggle-active` | Activer/désactiver |

### Élèves
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/students` | Liste avec classe + salle |
| GET | `/api/students/:id` | Détail élève |
| POST | `/api/students` | Créer (matricule auto) |
| PUT | `/api/students/:id` | Modifier |
| DELETE | `/api/students/:id` | Supprimer |
| PATCH | `/api/students/:id/toggle-active` | Activer/désactiver |
| POST | `/api/students/enroll` | Inscrire en classe |
| GET | `/api/students/:id/grades` | Notes de l'élève |
| GET | `/api/students/:id/payments` | Paiements de l'élève |

### Enseignants
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/teachers` | Liste avec cours + classe titulaire |
| POST | `/api/teachers` | Créer |
| PUT | `/api/teachers/:id` | Modifier |
| PATCH | `/api/teachers/:id/toggle-active` | Activer/désactiver |
| PATCH | `/api/teachers/:id/courses` | Assigner matières `{ courseIds: [...] }` |
| PATCH | `/api/teachers/:id/class` | Assigner classe titulaire `{ idClasse: N }` |

### Classes
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/cycles` | Liste cycles |
| POST | `/api/cycles` | Créer cycle |
| GET | `/api/classes` | Liste classes avec cycle + titulaire |
| POST | `/api/classes` | Créer classe |
| GET | `/api/salles` | Liste salles |
| POST | `/api/salles` | Créer salle |

### Académique
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/annees` | Années académiques |
| POST | `/api/annees` | Créer année |
| GET | `/api/trimestres` | Trimestres (`?idAca=`) |
| POST | `/api/trimestres` | Créer trimestre |
| GET | `/api/sessions` | Sessions (`?idTrimestre=`) |
| POST | `/api/sessions` | Créer session |

### Cours & Emploi du Temps
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/courses` | Matières |
| POST | `/api/courses` | Créer matière |
| GET | `/api/timetable` | EDT (`?idClasse=`) |
| POST | `/api/timetable` | Ajouter séance |

### Examens
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/natures` | Types d'épreuves |
| GET | `/api/epreuves` | Épreuves |
| POST | `/api/epreuves` | Créer épreuve |
| GET | `/api/evaluations` | Notes (`?idSession=&idCours=`) |
| POST | `/api/evaluations` | Ajouter note |
| POST | `/api/evaluations/bulk` | Ajout en masse |

### Paiements
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/scolarites` | Config frais |
| POST | `/api/scolarites` | Créer config |
| GET | `/api/tranches` | Tranches (`?idScolante=`) |
| POST | `/api/tranches` | Créer tranche |
| GET | `/api/modes` | Modes de paiement |
| POST | `/api/modes` | Créer mode |
| GET | `/api/paiements` | Liste paiements |
| POST | `/api/paiements` | Enregistrer paiement |

### Bibliothèque
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/specialites` | Spécialités |
| GET | `/api/livres` | Livres |
| POST | `/api/livres` | Ajouter livre |

### Messages
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/messages` | Messages reçus |
| POST | `/api/messages` | Envoyer message |

### Rapports / Bulletins
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/reports/:matricule/:idTrimes` | Bulletin complet |

### Parents
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/parents` | Liste parents |

### Santé
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | `{ status: "ok" }` |

---

## 7. Frontend — Structure et dépendances

### 7.1 Routage (App.tsx)

Trois zones de routes protégées par rôle :

```typescript
// Routes publiques
<Route path="/login" element={<Login />} />

// Routes Admin (rôle 1)
<Route path="/admin" element={<ProtectedRoute role={1} />}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="students" element={<StudentList />} />
  <Route path="students/new" element={<StudentForm />} />
  <Route path="students/enroll" element={<EnrollmentForm />} />
  <Route path="students/:id" element={<StudentProfile />} />
  <Route path="students/:id/edit" element={<StudentForm />} />
  <Route path="teachers" element={<TeacherList />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="classes" element={<ClassList />} />
  <Route path="academic" element={<AcademicPage />} />
  <Route path="courses" element={<CoursesPage />} />
  <Route path="exams" element={<ExamsPage />} />
  <Route path="reports" element={<ReportPage />} />
  <Route path="payments" element={<PaymentsPage />} />
  <Route path="library" element={<LibraryPage />} />
  <Route path="messages" element={<MessagePage />} />
  <Route path="discipline" element={<DisciplinePage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>

// Routes Enseignant (rôle 2)
<Route path="/teacher" element={<ProtectedRoute role={2} />}>
  <Route path="dashboard" element={<TeacherDashboard />} />
  <Route path="grades" element={<ExamsPage />} />
  <Route path="timetable" element={<CoursesPage />} />
  <Route path="messages" element={<MessagePage />} />
</Route>

// Routes Parent (rôle 3)
<Route path="/parent" element={<ProtectedRoute role={3} />}>
  <Route path="dashboard" element={<ParentDashboard />} />
  <Route path="grades" element={<ParentDashboard />} />
  <Route path="payments" element={<ParentDashboard />} />
  <Route path="messages" element={<MessagePage />} />
</Route>
```

### 7.2 Composants partagés (client/src/components/)

| Composant | Rôle |
|---|---|
| `Sidebar.tsx` | Menu latéral adapté au rôle (14 items admin) |
| `Navbar.tsx` | Barre supérieure : nom école, toggle langue, infos user, logout |
| `DataTable.tsx` | Tableau générique : colonnes, actions, tri |
| `Modal.tsx` | Fenêtre modale réutilisable |
| `LoadingSkeleton.tsx` | Squelette de chargement |
| `ProtectedRoute.tsx` | Garde par rôle + redirection 401 |

### 7.3 Intercepteurs Axios (api.ts)

```typescript
// Intercepteur requête : ajoute le token JWT depuis localStorage
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user')
  if (stored) {
    const user: User = JSON.parse(stored)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// Intercepteur réponse : redirige vers /login si 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

### 7.4 Configuration Vite (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 8. Authentification & Sécurité

### 8.1 Flux JWT

1. **Login** : `POST /api/auth/login` avec `{ email, password }`
2. **Vérification** : `users.email` + `bcrypt.compare(password, users.password)`
3. **Génération token** : `jwt.sign({ id, idPers, typePersonne }, JWT_SECRET, { expiresIn: '24h' })`
4. **Stockage** : `localStorage.setItem('user', JSON.stringify({...user, token}))`
5. **Envoi** : `Authorization: Bearer <token>` dans chaque requête
6. **Vérification middleware** : `jwt.verify(token, JWT_SECRET)` → `req.user`
7. **Expiration** : après 24h, le serveur renvoie 401, le frontend redirige vers /login

### 8.2 Mapping des rôles

```javascript
// Backend (auth.js)
const roleMap = {
  admin: 1, Admin: 1, ADMIN: 1,
  ENSEIGNANT: 2, enseignant: 2,
  PARENT: 3, parent: 3
}
// Priorité : type_personne de la table personnes, sinon rôle de users
const typePersonne = user.type_personne || roleMap[user.role] || 1
```

### 8.3 Middleware d'autorisation

```javascript
// Protège une route par rôle
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.typePersonne)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}

// Usage
router.delete('/:id', authenticate, authorize(1), async (req, res) => { ... })
```

### 8.4 Frontend : ProtectedRoute

```typescript
function ProtectedRoute({ role }: { role: number }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.typePersonne !== role) return <Navigate to="/login" replace />
  return <Outlet />
}
```

---

## 9. Internationalisation (i18n)

### Architecture

- Bibliothèque : `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- Fichiers : `client/src/i18n/{en,fr}.json` (258 clés chacun)
- Détection automatique de la langue du navigateur
- Toggle manuel via composant `LanguageToggle` dans la `Navbar`

### Ajouter une nouvelle traduction

```json
// 1. Dans fr.json
"nouvelle.cle": "Texte en français"

// 2. Dans en.json
"nouvelle.cle": "English text"

// 3. Dans un composant
const { t } = useTranslation()
return <div>{t('nouvelle.cle')}</div>
```

### Structure des clés

```
app.title             → Titre de l'application
nav.*                 → Navigation (sidebar)
auth.*                → Connexion
common.*              → Boutons génériques (ajouter, modifier, etc.)
dashboard.*           → Tableau de bord
student.*             → Élèves
teacher.*             → Enseignants
class.*               → Classes & cycles
academic.*            → Année académique
course.* / timetable.* → Matières & EDT
exam.* / grade.*      → Examens & notes
report.*              → Bulletins
payment.*             → Paiements
parent.*              → Espace parent
library.*             → Bibliothèque
message.*             → Messages
discipline.*          → Discipline
settings.*            → Paramètres
user.*                → Utilisateurs
toast.*               → Notifications
```

---

## 10. Procédures de maintenance

### 10.1 Mise à jour de l'application

```bash
# 1. Pull des dernières modifications
git pull origin main

# 2. Installer les nouvelles dépendances
cd client && npm install && cd ..
cd server && npm install && cd ..

# 3. Rebuild le frontend
npm run build

# 4. Redémarrer le serveur
fuser -k 3001/tcp
npm start
```

### 10.2 Sauvegarde de la base de données

```bash
# Sauvegarde complète
mysqldump -h <host> -P <port> -u <user> -p ecole2026 > backup_$(date +%Y%m%d).sql

# Restauration
mysql -h <host> -P <port> -u <user> -p ecole2026 < backup_20260703.sql
```

### 10.3 Vérifications périodiques

```bash
# 1. TypeScript
cd client && npx tsc --noEmit

# 2. Build frontend
cd client && npm run build

# 3. Test API health
curl http://localhost:3001/api/health

# 4. Logs serveur
tail -f /var/log/school-management.log

# 5. Espace disque
df -h

# 6. Connexions MySQL
mysqladmin -h <host> -u <user> -p status
```

### 10.4 Nettoyage des données

```sql
-- Nettoyer les soft-deletes de plus de 1 an
DELETE FROM Cours WHERE isDelete = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
DELETE FROM Classe WHERE isDelete = 1;
DELETE FROM Cycle WHERE isDelete = 1;

-- Archiver les vieux logs de paiements
-- (à adapter selon les besoins)
```

### 10.5 Problème : Port déjà utilisé

```bash
# Identifier le processus
lsof -i :3001

# Le tuer
fuser -k 3001/tcp

# Vérifier
lsof -i :3001  # Ne devrait plus rien afficher
```

### 10.6 Problème : Base de données inaccessible

```bash
# Tester la connexion
mysql -h 163.123.183.89 -P 17705 -u ecole -p

# Vérifier que MySQL écoute
netstat -tlnp | grep 3306

# Vérifier les logs MySQL
tail -f /var/log/mysql/error.log
```

### 10.7 Problème : Erreur JWT / Token invalide

```bash
# 1. Vérifier JWT_SECRET dans server/.env
# 2. Vérifier la date/heure du serveur (les tokens ont une expiration)
date
# 3. Forcer les utilisateurs à se reconnecter :
#    - Changer JWT_SECRET (invalide tous les tokens existants)
#    - OU attendre l'expiration (24h)
```

### 10.8 Problème : Erreur CORS en développement

```bash
# Vérifier que Vite proxy est correct :
# client/vite.config.ts → proxy /api → http://localhost:3001
# Vérifier que le serveur Express a CORS activé :
# server/src/index.js → app.use(cors())
```

---

## 11. Dépannage avancé

### 11.1 Capture des logs backend

```javascript
// Ajouter dans server/src/index.js
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`)
  res.status(500).json({ message: 'Internal server error' })
})
```

### 11.2 Debug des requêtes SQL

```javascript
// Dans server/src/db.js, activer le logging
const pool = mysql.createPool({
  // ... autres options
  logQueries: true,  // Non standard, utiliser plutôt :
})

// Ou wrapper manuel dans les routes
const [rows] = await pool.query('SELECT * FROM ...')
console.log('Query result:', rows)
```

### 11.3 Variables d'environnement critiques

| Variable | Valeur actuelle | Risque si incorrect |
|---|---|---|
| `DB_HOST` | `163.123.183.89` | Base inaccessible |
| `DB_PORT` | `17705` | Base inaccessible |
| `DB_USER` | `ecole` | Auth refusée |
| `DB_PASSWORD` | `peda2026` | Auth refusée |
| `DB_NAME` | `ecole2026` | Base inexistante |
| `JWT_SECRET` | `schule-mgmt-secret-key-2026` | Tous les tokens invalides |
| `PORT` | `3001` | Conflit de port |

### 11.4 Problèmes courants frontend

| Symptôme | Cause probable | Solution |
|---|---|---|
| Page blanche au build | Erreur TypeScript | `cd client && npx tsc --noEmit` pour identifier |
| API 404 | Route inexistante ou faute de frappe | Vérifier `api.ts` vs `routes/` |
| Formulaire ne s'affiche pas | Erreur dans le composant | Console F12 → onglet Console |
| Graphiques vides | Données manquantes en DB | Vérifier les tables `Paiement`, `Eleve`, etc. |
| i18n affiche la clé | Clé manquante dans le JSON | Ajouter dans `en.json` et `fr.json` |

### 11.5 Problèmes connus

1. **Deux tables élèves** (`eleves` et `Eleve`) : certaines requêtes utilisent l'une ou l'autre. Les INSERT doivent aller dans les deux si nécessaire.
2. **`Frequente.idAdmin` NOT NULL** : l'inscription échoue si `idAdmin` n'est pas fourni (via le JWT).
3. **`Eleve.idVilleNaissance` NOT NULL** : l'INSERT dans `Eleve` nécessite une `idVilleNaissance` valide (copie depuis `eleves` avec une valeur par défaut).
4. **Client/src est un sous-module git** : `git status` peut montrer `modified: client/src (untracked content)`. Pour résoudre :
   ```bash
   cd client/src
   rm -rf .git
   cd ../..
   git add client/src
   ```

---

## Annexe A : Fichiers de configuration

### `server/.env` (actuel)
```env
DB_HOST=163.123.183.89
DB_PORT=17705
DB_USER=ecole
DB_PASSWORD=peda2026
DB_NAME=ecole2026
JWT_SECRET=schule-mgmt-secret-key-2026
PORT=3001
```

### `server/.env.example` (template)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ecole2026
JWT_SECRET=your-secret-key
PORT=3001
```

### `client/vite.config.ts`
```typescript
// Proxy API vers backend
server: {
  port: 3000,
  proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
}
```

---

## Annexe B : Scripts NPM

| Commande | Répertoire | Description |
|---|---|---|
| `npm run dev` | Racine | Backend + Frontend simultanés |
| `npm run dev:server` | Racine | Backend avec --watch |
| `npm run dev:client` | Racine | Vite dev server |
| `npm run build` | Racine | Build frontend |
| `npm start` | Racine | Serveur production |
| `cd client && npm run build` | Client | Build TypeScript + Vite |
| `cd client && npx tsc --noEmit` | Client | Vérification types |
| `cd server && node src/index.js` | Serveur | Backend sans --watch |
| `cd server && node --watch src/index.js` | Serveur | Backend avec watch |

---

## Annexe C : Dépendances complètes

### Backend (server/package.json)
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.12.0"
  }
}
```

### Frontend (client/package.json)
```json
{
  "dependencies": {
    "axios": "^1.18.0",
    "axios-mock-adapter": "^2.1.0",
    "html2canvas": "^1.4.1",
    "i18next": "^26.3.1",
    "i18next-browser-languagedetector": "^8.2.1",
    "jspdf": "^4.2.1",
    "lucide-react": "^1.21.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-hot-toast": "^2.6.0",
    "react-i18next": "^17.0.8",
    "react-router-dom": "^7.18.0",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.1",
    "@types/node": "^24.12.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "tailwindcss": "^4.3.1",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.59.2",
    "vite": "^8.0.12"
  }
}
```

---

*Document mis à jour le 03/07/2026 — Pour toute question technique, contacter le développeur.*
