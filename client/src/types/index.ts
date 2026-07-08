export interface User {
  idPers: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  typePersonne: 1 | 2 | 3 | 4;
  mobile: string;
  token: string;
  actif: boolean;
}

export interface Parent {
  idParent: number;
  idPers: number;
  nom: string;
  prenom: string;
  email: string;
  mobile: string;
  actif: boolean;
}

export interface Student {
  matricule: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: 1 | 2;
  langue: 'FR' | 'EN' | 'Bilingue';
  photoURL: string;
  actif: boolean;
  classe?: string;
  cycle?: string;
  idCycle?: number;
  salle?: string;
  idScolarite?: number;
  inscription?: number | null;
  pension?: number | null;
  nbreTranche?: number | null;
}

export interface Teacher {
  idEnseignant: number;
  idPers: number;
  nom: string;
  prenom: string;
  mobile: string;
  email?: string;
  password?: string;
  cours: Course[];
  actif: boolean;
  idClasse?: number;
  classeLibelle?: string;
}

export interface Cycle {
  idCycle: number;
  libelle: string;
  description: string;
}

export interface Classe {
  idClasse: number;
  libelle: string;
  idCycle: number;
  cycle?: string;
  titulaire?: number;
  titulaireNom?: string;
  isDelete?: number;
}

export interface Salle {
  idSalle: number;
  libelle: string;
  position: string;
  surface: string;
  idClasse: number;
  classe?: string;
  actif: boolean;
  capacite?: number;
  occupancy?: number;
}

export interface AnneeAcademique {
  idAnnee: number;
  libelle: string;
  periode: string;
  actif?: boolean;
}

export interface Trimestre {
  idTrimes: number;
  libelle: string;
  periode: string;
  idAca: number;
  clos?: boolean;
  dateDebut?: string;
  dateFin?: string;
}

export interface Session {
  idSession: number;
  libelle: string;
  idTrimestre: number;
  sessTrim: string;
}

export interface Course {
  idCours: number;
  libelle: string;
  note: number;
  coefficient: number;
  idClasse: number;
  actif: boolean;
  idEnseignant?: number;
  description?: string;
  couleur?: string;
}

export interface EmploiDuTemps {
  idTemps: number;
  jour: string;
  heure: string;
  idClasse: number;
  idCours: number;
  cours?: string;
  idEnseignant?: number;
  enseignant?: string;
  idSalle?: number;
  salle?: string;
}

export interface NatureEpreuve {
  idNature: number;
  libelle: string;
}

export interface Epreuve {
  idEpreuve: number;
  libelle: string;
  idNature: number;
  nature?: string;
  idPers: number;
}

export interface Evaluation {
  idEval: number;
  note: number;
  appreciation: string;
  matricule: number;
  idEpreuve: number;
  idCours: number;
  idSession: number;
  matiere: string;
}

export interface Rapport {
  idRap: number;
  libelle: string;
  points: number;
  matricule: number;
  idAca: number;
  commentaire: string;
}

export interface Scolarite {
  idScolarite: number;
  inscription: number;
  pension: number;
  nbreTranche: number;
  idCycle: number;
  cycle?: string;
}

export interface Tranche {
  idTranche: number;
  libelle: string;
  montant: number;
  delai_mois: string;
  delai_jour: string;
  date_limite?: string;
  idScolarite: number;
  actif: boolean;
}

export interface Mode {
  idMode: number;
  libelle: string;
  actif: boolean;
}

export interface Paiement {
  idPaie: number;
  matricule: number;
  idAca: number;
  montant: number;
  datePaie: string;
  idMode: number;
  mode?: string;
  nom?: string;
  prenom?: string;
}

export interface Livre {
  idLivre: number;
  titre: string;
  auteurs: string;
  prix: number;
  idSpecialite: number;
  edition: string;
  totalCopie: number;
}

export interface Specialite {
  idSpecialite: number;
  libelle: string;
  idAdmin?: number;
}

export interface Discipline {
  ID: number;
  libelle: string;
  points: number;
}

export interface Message {
  idMessages: number;
  idExp_Pers: number;
  idParent: number;
  objet: string;
  information: string;
  created_at: string;
  valider: boolean;
}

export interface SearchResult {
  students: { matricule: number; nom: string; prenom: string; classe: string | null; salle: string | null }[]
  teachers: { idEnseignant: number; nom: string; prenom: string; classeLibelle: string | null }[]
  pages: { label: string; labelEn: string; path: string; icon: string; roles: number[] }[]
}

export interface AuditLog {
  id: number;
  idAdmin: number | null;
  adminName: string;
  action: string;
  entity: string;
  entityId: number | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalPayments: number;
  pendingFees: number;
  classesCount: number;
  boysCount: number;
  girlsCount: number;
}
