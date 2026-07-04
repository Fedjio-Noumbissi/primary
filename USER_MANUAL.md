# 📚 Manuel d'Utilisation — Système de Gestion Scolaire

## Table des Matières

1. [Présentation](#1-présentation)
2. [Connexion](#2-connexion)
3. [Tableau de Bord](#3-tableau-de-bord)
4. [Gestion des Élèves](#4-gestion-des-élèves)
5. [Gestion des Enseignants](#5-gestion-des-enseignants)
6. [Gestion des Utilisateurs](#6-gestion-des-utilisateurs)
7. [Classes & Salles](#7-classes--salles)
8. [Année Académique & Trimestres](#8-année-académique--trimestres)
9. [Matières & Emploi du Temps](#9-matières--emploi-du-temps)
10. [Examens & Notes](#10-examens--notes)
11. [Bulletins](#11-bulletins)
12. [Paiements](#12-paiements)
13. [Bibliothèque](#13-bibliothèque)
14. [Messages](#14-messages)
15. [Discipline](#15-discipline)
16. [Paramètres](#16-paramètres)
17. [Espace Parent](#17-espace-parent)
18. [Espace Enseignant](#18-espace-enseignant)
19. [Dépannage](#19-dépannage)

---

## 1. Présentation

Application web de gestion scolaire pour écoles primaires au Cameroun. Elle permet de gérer :

- **Les élèves** : inscriptions, dossiers, notes, paiements
- **Les enseignants** : affectations aux matières et classes
- **Les classes** : cycles, classes, salles
- **Le calendrier** : années académiques, trimestres, sessions d'examens
- **Les notes** : saisie individuelle ou en masse, bulletins
- **Les paiements** : scolarité, tranches, reçus
- **La bibliothèque** : livres par spécialité
- **La messagerie** : communication interne
- **La discipline** : suivi des événements

**Technologies** : React + TypeScript (frontend), Node.js + Express (backend), MySQL (base de données)

### Profils utilisateur

| Rôle | Accès |
|---|---|
| **Administrateur** | Toutes les fonctionnalités |
| **Enseignant** | Dashboard, notes, emploi du temps, messages |
| **Parent** | Dashboard enfant, notes, paiements, messages |

### Identifiants de test

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@ecole.test` | `password` | Administrateur |

---

## 2. Connexion

1. Ouvrez l'application dans votre navigateur
2. Saisissez votre **email** et **mot de passe**
3. Cliquez sur **"Se connecter"**
4. Vous êtes redirigé vers votre tableau de bord selon votre rôle

> **Déconnexion** : cliquez sur votre nom dans l'en-tête, puis "Déconnexion"

---

## 3. Tableau de Bord

### Admin

Le tableau de bord affiche :

- **7 cartes statistiques** : Total élèves, enseignants, paiements, frais impayés, classes, garçons, filles
- **Graphique circulaire** : répartition Garçons / Filles
- **Graphique à barres** : effectifs par classe
- **Graphique à barres** : tendance des paiements par mois
- **Liste** : 5 derniers paiements enregistrés
- **Liste** : 5 derniers élèves inscrits

### Enseignant

- Mes classes
- Mon emploi du temps
- Notes récentes

### Parent

- Informations de l'enfant
- Notes de mon enfant
- Messages

---

## 4. Gestion des Élèves

### Liste des élèves

Accès : menu **"Élèves"**

- Recherche par nom, prénom ou matricule
- Filtre par classe
- Activation / désactivation d'un élève (bouton bascule)
- Suppression d'un élève (avec confirmation)

### Ajouter un élève

1. Cliquez sur **"Ajouter un Élève"**
2. Remplissez les champs :
   - Nom, Prénom
   - Date de naissance (calendrier)
   - Lieu de naissance
   - Sexe (Masculin / Féminin)
   - Langue (Francophone / Anglophone / Bilingue)
3. Cliquez sur **"Enregistrer"**
   - Le matricule est généré automatiquement

### Modifier un élève

Cliquez sur l'icône ✏️ dans la ligne de l'élève.

### Profil élève

Cliquez sur le matricule ou nom d'un élève pour voir :
- Ses informations personnelles
- Ses notes
- Ses paiements
- Sa discipline

### Inscription (enrollment)

1. Depuis la liste des élèves, cliquez sur le bouton d'inscription
2. Sélectionnez la **salle de classe**
3. Sélectionnez l'**année académique**
4. Cliquez sur **"Enregistrer"**

---

## 5. Gestion des Enseignants

### Liste des enseignants

Accès : menu **"Enseignants"**

- Colonnes : Nom, Prénom, Téléphone, Matières assignées, Classe titulaire, Statut
- Activation / désactivation

### Ajouter un enseignant

1. Cliquez sur **"Ajouter un Enseignant"**
2. Remplissez : Nom, Prénom, Téléphone
3. Cliquez sur **"Enregistrer"**

### Assigner des matières à un enseignant

1. Cliquez sur l'icône 📚 dans la ligne de l'enseignant
2. Cochez les matières à assigner (cases à cocher)
3. Cliquez sur **"Enregistrer"**

### Assigner une classe (titulaire)

1. Cliquez sur l'icône 👥 dans la ligne de l'enseignant
2. Sélectionnez une classe (bouton radio)
   - Option "Aucune classe assignée" pour retirer l'affectation
3. Cliquez sur **"Enregistrer"**

---

## 6. Gestion des Utilisateurs

Accès : menu **"Utilisateurs"** (Admin uniquement)

### Fonctionnalités

- **Liste** de tous les utilisateurs avec filtre par type (Admin / Enseignant / Parent)
- **Ajouter** : email, mot de passe, nom, prénom, téléphone, type
- **Modifier** : modifier les informations d'un utilisateur
- **Activer / Désactiver** : basculer le statut actif/inactif
  - Un utilisateur inactif ne peut pas se connecter
- **Supprimer** : suppression définitive (avec confirmation)

---

## 7. Classes & Salles

Accès : menu **"Classes & Salles"**

Hiérarchie : **Cycle → Classe → Salle**

### Cycles

Exemples : Cycle 1 (SIL-CP-CE1), Cycle 2 (CE2-CM1-CM2)
- Ajouter un cycle : libellé + description
- Liste des cycles

### Classes

Exemples : SIL, CP, CE1, CE2, CM1, CM2
- Ajouter une classe : libellé + cycle parent
- La colonne "Titulaire" montre l'enseignant responsable

### Salles (salles de classe physiques)

- Ajouter une salle : libellé, position, superficie, classe parente
- Chaque salle est liée à une classe

---

## 8. Année Académique & Trimestres

Accès : menu **"Année & Trimestres"**

### Années académiques

Exemple : "2025-2026"
- Ajouter une année : libellé + période
- Activer/désactiver une année

### Trimestres

- Ajouter un trimestre à une année
- Libellé + période

### Sessions (périodes d'examen)

- Ajouter une session à un trimestre
- Exemple : "Session 1", "Session 2"

---

## 9. Matières & Emploi du Temps

Accès : menu **"Matières & Emploi du Temps"**

### Matières (Cours)

- Ajouter une matière : libellé, coefficient, note maximale, classe
- Chaque matière peut être assignée à un enseignant

### Emploi du Temps

- Vue grille (Jours × Heures)
- Filtrer par classe
- Ajouter une séance : jour, heure, classe, matière
- Créneaux : Lundi à Samedi, 07:30 - 16:30

---

## 10. Examens & Notes

Accès : menu **"Examens & Notes"**

### Natures d'épreuves

Types d'examens : Devoir, Composition, Examen oral, etc.

### Épreuves

- Ajouter une épreuve : libellé + nature

### Saisie des notes

1. Sélectionnez la **session** et la **matière**
2. Deux modes :
   - **Saisie individuelle** : note /20 + appréciation par élève
   - **Saisie en masse** (recommandé) : entrez les notes de tous les élèves d'un coup
3. Les notes sont colorées : vert (≥ 10), rouge (< 10)
4. Cliquez sur "Calculer la Moyenne" pour voir la moyenne générale

---

## 11. Bulletins

Accès : menu **"Bulletins"**

### Génération d'un bulletin

1. Sélectionnez un **élève**
2. Sélectionnez un **trimestre**
3. Cliquez sur **"Générer le Bulletin"**
4. Le bulletin affiche :
   - En-tête officiel : "RÉPUBLIQUE DU CAMEROUN — Paix — Travail — Patrie"
   - Informations de l'école et de l'élève
   - Tableau des matières : note /20, coefficient, moyenne
   - Moyenne générale avec appréciation
   - Points de discipline
   - Appréciation du maître
   - Signatures (directeur, parent)

### Impression

- Cliquez sur **"Imprimer le Bulletin"** pour ouvrir la fenêtre d'impression

---

## 12. Paiements

Accès : menu **"Paiements"**

### Configuration des frais de scolarité

1. Allez dans l'onglet **"Frais de Scolarité"**
2. Ajoutez une configuration par cycle :
   - Frais d'inscription
   - Pension
   - Nombre de tranches

### Tranches de paiement

- Définissez les tranches : libellé, montant, délai (mois + jour)

### Modes de paiement

Disponibles : Orange Money, MTN Mobile Money, Express Union, Cash, Virement Bancaire

### Enregistrer un paiement

1. Sélectionnez l'élève (matricule)
2. Sélectionnez l'année académique
3. Saisissez le montant
4. Sélectionnez le mode de paiement
5. Cliquez sur **"Enregistrer"**

### Reçu de paiement

- Après enregistrement, cliquez sur **"Imprimer le Reçu"**
- Le reçu s'ouvre dans une nouvelle fenêtre avec les détails

---

## 13. Bibliothèque

Accès : menu **"Bibliothèque"**

### Spécialités

- Ajouter une spécialité/libellé de livre

### Livres

- Ajouter un livre : titre, auteurs, prix, édition, nombre d'exemplaires, spécialité
- Liste des livres disponibles

---

## 14. Messages

Accès : menu **"Messages"**

### Boîte de réception

- Liste des messages reçus : expéditeur, objet, date
- Cliquez sur un message pour lire son contenu

### Nouveau message

1. Remplissez : destinataire, objet, message
2. Cliquez sur **"Envoyer"**
3. Option : diffuser à une classe entière

---

## 15. Discipline

Accès : menu **"Discipline"**

- Ajouter un événement disciplinaire pour un élève
- Libellé de l'événement
- Points (positifs = bonus, négatifs = pénalité)
- Les points sont affichés sur le bulletin

---

## 16. Paramètres

Accès : menu **"Paramètres"**

### Informations de l'école

- Nom de l'école
- Adresse
- Région (10 régions du Cameroun)
- Téléphone
- Email
- Logo

### Modes de paiement

- Ajouter / modifier les modes de paiement disponibles

### Activation année académique

- Sélectionnez l'année académique active

---

## 17. Espace Parent

Accès : connexion avec un compte Parent

### Dashboard

- Informations de l'enfant (nom, matricule, classe, langue)
- Notes de l'enfant (liste avec appréciations)
- Paiements effectués
- Messages reçus

---

## 18. Espace Enseignant

Accès : connexion avec un compte Enseignant

### Dashboard

- Mes classes (classes dont l'enseignant est titulaire)
- Mon emploi du temps
- Notes récentes saisies

### Examens & Notes

- Saisir les notes pour les matières assignées

### Emploi du Temps

- Consultation de l'emploi du temps

---

## 19. Dépannage

### Problème : Impossible de se connecter

- Vérifiez que votre email et mot de passe sont corrects
- Vérifiez que votre compte est actif (contactez l'administrateur)
- Vérifiez que le serveur backend est en marche

### Problème : Page blanche ou erreur 500

- Actualisez la page (F5)
- Déconnectez-vous et reconnectez-vous
- Contactez l'administrateur système

### Problème : Les données ne s'affichent pas

- Vérifiez votre connexion internet
- Vérifiez que le backend est accessible (port 3001)
- Consultez la console navigateur (F12 → Console) pour les erreurs

### Raccourcis

| Action | Raccourci |
|---|---|
| Rechercher | `Ctrl + K` |
| Actualiser | `F5` |
| Console développeur | `F12` |

---

*Document généré le 03/07/2026 — Système de Gestion Scolaire v1.0*
