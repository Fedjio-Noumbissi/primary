import { Student, Teacher, Cycle, Classe, Salle, AnneeAcademique, Trimestre, Session, Course, EmploiDuTemps, NatureEpreuve, Epreuve, Evaluation, Scolarite, Tranche, Mode, Paiement, Livre, Specialite, Message, User, Parent } from '../types'

export const mockUsers: User[] = [
  { idPers: 1, nom: 'Admin', prenom: 'System', email: 'admin@school.cm', password: '1234', typePersonne: 1, mobile: '677000001', token: 'mock-jwt-admin', actif: true },
  { idPers: 2, nom: 'Tchinda', prenom: 'Paul', email: 'paul.tchinda@school.cm', password: '1234', typePersonne: 2, mobile: '677000002', token: 'mock-jwt-teacher1', actif: true },
  { idPers: 3, nom: 'Nkwi', prenom: 'Marie', email: 'marie.nkwi@school.cm', password: '1234', typePersonne: 2, mobile: '677000003', token: 'mock-jwt-teacher2', actif: true },
  { idPers: 4, nom: 'Fotso', prenom: 'Jean', email: 'jean.fotso@school.cm', password: '1234', typePersonne: 3, mobile: '677000004', token: 'mock-jwt-parent1', actif: true },
  { idPers: 5, nom: 'Kamga', prenom: 'Esther', email: 'esther.kamga@school.cm', password: '1234', typePersonne: 3, mobile: '677000005', token: 'mock-jwt-parent2', actif: true },
  { idPers: 6, nom: 'Sado', prenom: 'Pierre', email: 'pierre.sado@school.cm', password: '1234', typePersonne: 2, mobile: '677000006', token: 'mock-jwt-teacher3', actif: true },
  { idPers: 7, nom: 'Biyo', prenom: 'Alice', email: 'alice.biyo@school.cm', password: '1234', typePersonne: 3, mobile: '677000007', token: 'mock-jwt-parent3', actif: true },
]

export const mockParents: Parent[] = [
  { idParent: 1, idPers: 4, nom: 'Fotso', prenom: 'Jean', email: 'jean.fotso@school.cm', mobile: '677000004', actif: true },
  { idParent: 2, idPers: 5, nom: 'Kamga', prenom: 'Esther', email: 'esther.kamga@school.cm', mobile: '677000005', actif: true },
  { idParent: 3, idPers: 7, nom: 'Biyo', prenom: 'Alice', email: 'alice.biyo@school.cm', mobile: '677000007', actif: true },
]

export const mockCycles: Cycle[] = [
  { idCycle: 1, libelle: 'Maternelle', description: 'Nursery School (3-5 ans)' },
  { idCycle: 2, libelle: 'Primaire', description: 'Primary School (6-12 ans)' },
]

export const mockClasses: Classe[] = [
  { idClasse: 1, libelle: 'SIL', idCycle: 2, cycle: 'Primaire' },
  { idClasse: 2, libelle: 'CP', idCycle: 2, cycle: 'Primaire' },
  { idClasse: 3, libelle: 'CE1', idCycle: 2, cycle: 'Primaire' },
  { idClasse: 4, libelle: 'CE2', idCycle: 2, cycle: 'Primaire' },
  { idClasse: 5, libelle: 'CM1', idCycle: 2, cycle: 'Primaire' },
  { idClasse: 6, libelle: 'CM2', idCycle: 2, cycle: 'Primaire' },
]

export const mockSalles: Salle[] = [
  { idSalle: 1, libelle: 'Salle A1', position: 'Bâtiment A, RDC', surface: '45m²', idClasse: 1, classe: 'SIL', actif: true },
  { idSalle: 2, libelle: 'Salle B1', position: 'Bâtiment B, 1er', surface: '50m²', idClasse: 2, classe: 'CP', actif: true },
  { idSalle: 3, libelle: 'Salle A2', position: 'Bâtiment A, 1er', surface: '45m²', idClasse: 3, classe: 'CE1', actif: true },
  { idSalle: 4, libelle: 'Salle B2', position: 'Bâtiment B, 1er', surface: '50m²', idClasse: 4, classe: 'CE2', actif: true },
  { idSalle: 5, libelle: 'Salle C1', position: 'Bâtiment C, RDC', surface: '55m²', idClasse: 5, classe: 'CM1', actif: true },
  { idSalle: 6, libelle: 'Salle C2', position: 'Bâtiment C, 1er', surface: '55m²', idClasse: 6, classe: 'CM2', actif: true },
]

export const mockAnnees: AnneeAcademique[] = [
  { idAnnee: 1, libelle: '2024-2025', periode: 'Septembre 2024 - Juin 2025' },
  { idAnnee: 2, libelle: '2025-2026', periode: 'Septembre 2025 - Juin 2026', actif: true },
  { idAnnee: 3, libelle: '2026-2027', periode: 'Septembre 2026 - Juin 2027' },
]

export const mockTrimestres: Trimestre[] = [
  { idTrimes: 1, libelle: '1er Trimestre', periode: 'Sept-Nov', idAca: 2, clos: true },
  { idTrimes: 2, libelle: '2e Trimestre', periode: 'Déc-Fév', idAca: 2 },
  { idTrimes: 3, libelle: '3e Trimestre', periode: 'Mar-Juin', idAca: 2 },
]

export const mockSessions: Session[] = [
  { idSession: 1, libelle: 'Session 1', idTrimestre: 1, sessTrim: '1er Trim - Session 1' },
  { idSession: 2, libelle: 'Session 2', idTrimestre: 1, sessTrim: '1er Trim - Session 2' },
  { idSession: 3, libelle: 'Session 1', idTrimestre: 2, sessTrim: '2e Trim - Session 1' },
]

export const mockStudents: Student[] = Array.from({ length: 48 }, (_, i) => ({
  matricule: 2000 + i + 1,
  nom: ['Ngo', 'Tata', 'Mbah', 'Fouda', 'Essomba', 'Bella', 'Eyanga', 'Minka', 'Nkwi', 'Bikai', 'Tchinda', 'Soh', 'Kengne', 'Tsala', 'Mvondo', 'Ndjomo', 'Biloa', 'Nyobe', 'Mballa', 'Meyo', 'Ekani', 'Nkili', 'Bekolo', 'Mengue', 'Ndzana', 'Biyo', 'Mongo', 'Efoua', 'Mpondo', 'Ndjock', 'Bomba', 'Kollo', 'Mpeck', 'Nkotto', 'Ebanga', 'Mbarga', 'Ngane', 'Bindzi', 'Mpessa', 'Ndongo', 'Mone', 'Nlembe', 'Ewane', 'Mbock', 'Ngono', 'Nkoa', 'Balla', 'Mfomo'][i],
  prenom: ['Alice', 'Bertrand', 'Claire', 'David', 'Esther', 'Franck', 'Grace', 'Henri', 'Irene', 'Jacques', 'Karine', 'Leon', 'Michele', 'Noel', 'Olive', 'Patrick', 'Quentin', 'Rachel', 'Samuel', 'Therese', 'Ulrich', 'Vanessa', 'William', 'Xavier', 'Yannick', 'Zoe', 'Armand', 'Beatrice', 'Christian', 'Danielle', 'Emile', 'Felix', 'Georgette', 'Herve', 'Ivan', 'Judith', 'Kevin', 'Laurence', 'Marcel', 'Nadine', 'Olivier', 'Paule', 'Raoul', 'Sylvie', 'Thomas', 'Ursule', 'Victor', 'Willy'][i],
  dateNaissance: `201${Math.min(5 + Math.floor(i/6), 9)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  lieuNaissance: ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua', 'Bamenda', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Buéa'][i % 10],
  sexe: (i % 3 === 0 ? 1 : 2) as 1 | 2,
  langue: (['FR', 'EN', 'Bilingue'] as const)[i % 3],
  photoURL: '',
  actif: true,
  classe: mockClasses[i % 6].libelle,
  cycle: i % 6 < 3 ? 'Primaire' : 'Primaire',
}))

export const mockTeachers: Teacher[] = [
  { idEnseignant: 1, idPers: 2, nom: 'Tchinda', prenom: 'Paul', mobile: '677000002', cours: [], actif: true },
  { idEnseignant: 2, idPers: 3, nom: 'Nkwi', prenom: 'Marie', mobile: '677000003', cours: [], actif: true },
  { idEnseignant: 3, idPers: 6, nom: 'Sado', prenom: 'Pierre', mobile: '677000006', cours: [], actif: true },
]

export const mockCourses: Course[] = [
  { idCours: 1, libelle: 'Français', note: 20, coefficient: 3, idClasse: 1, actif: true },
  { idCours: 2, libelle: 'Mathématiques', note: 20, coefficient: 3, idClasse: 1, actif: true },
  { idCours: 3, libelle: 'Anglais', note: 20, coefficient: 2, idClasse: 1, actif: true },
  { idCours: 4, libelle: 'Science et Technologie', note: 20, coefficient: 2, idClasse: 2, actif: true },
  { idCours: 5, libelle: 'Histoire-Géographie', note: 20, coefficient: 1, idClasse: 2, actif: true },
  { idCours: 6, libelle: 'Éducation Civique', note: 20, coefficient: 1, idClasse: 2, actif: true },
  { idCours: 7, libelle: 'Lecture', note: 20, coefficient: 2, idClasse: 1, actif: true },
  { idCours: 8, libelle: 'Écriture', note: 20, coefficient: 2, idClasse: 1, actif: true },
  { idCours: 9, libelle: 'Musique', note: 20, coefficient: 1, idClasse: 3, actif: true },
  { idCours: 10, libelle: 'Éducation Physique', note: 20, coefficient: 1, idClasse: 3, actif: true },
]

export const mockEmplois: EmploiDuTemps[] = [
  { idTemps: 1, jour: 'Lundi', heure: '07:30', idClasse: 1, idCours: 1, cours: 'Français' },
  { idTemps: 2, jour: 'Lundi', heure: '08:30', idClasse: 1, idCours: 2, cours: 'Mathématiques' },
  { idTemps: 3, jour: 'Mardi', heure: '07:30', idClasse: 1, idCours: 3, cours: 'Anglais' },
  { idTemps: 4, jour: 'Mercredi', heure: '09:30', idClasse: 2, idCours: 4, cours: 'Science et Technologie' },
]

export const mockNatures: NatureEpreuve[] = [
  { idNature: 1, libelle: 'Devoir' },
  { idNature: 2, libelle: 'Composition' },
  { idNature: 3, libelle: 'Examen Oral' },
]

export const mockEpreuves: Epreuve[] = [
  { idEpreuve: 1, libelle: 'Devoir de Français SIL', idNature: 1, nature: 'Devoir', idPers: 2 },
  { idEpreuve: 2, libelle: 'Composition Maths CP', idNature: 2, nature: 'Composition', idPers: 3 },
]

export const mockEvaluations: Evaluation[] = mockStudents.slice(0, 24).flatMap((s, idx) => [
  { idEval: idx * 2 + 1, note: Math.round((Math.random() * 16 + 4) * 10) / 10, appreciation: '', matricule: s.matricule, idEpreuve: 1, idCours: 1, idSession: 1, matiere: 'Français' },
  { idEval: idx * 2 + 2, note: Math.round((Math.random() * 16 + 4) * 10) / 10, appreciation: '', matricule: s.matricule, idEpreuve: 2, idCours: 2, idSession: 1, matiere: 'Mathématiques' },
])

export const mockScolarites: Scolarite[] = [
  { idScolarite: 1, inscription: 15000, pension: 75000, nbreTranche: 3, idCycle: 1 },
  { idScolarite: 2, inscription: 20000, pension: 85000, nbreTranche: 3, idCycle: 2 },
]

export const mockTranches: Tranche[] = [
  { idTranche: 1, libelle: '1ère Tranche', montant: 25000, delai_mois: '09', delai_jour: '15', idScolarite: 1, actif: true },
  { idTranche: 2, libelle: '2e Tranche', montant: 25000, delai_mois: '12', delai_jour: '15', idScolarite: 1, actif: true },
  { idTranche: 3, libelle: '3e Tranche', montant: 25000, delai_mois: '03', delai_jour: '15', idScolarite: 1, actif: true },
]

export const mockModes: Mode[] = [
  { idMode: 1, libelle: 'Orange Money', actif: true },
  { idMode: 2, libelle: 'MTN Mobile Money', actif: true },
  { idMode: 3, libelle: 'Express Union', actif: true },
  { idMode: 4, libelle: 'Cash', actif: true },
]

export const mockPaiements: Paiement[] = mockStudents.slice(0, 20).map((s, i) => ({
  idPaie: i + 1,
  matricule: s.matricule,
  idAca: 2,
  montant: 25000 + (i % 3) * 25000,
  datePaie: `2025-${String(9 + (i % 3)).padStart(2, '0')}-${String(10 + i).padStart(2, '0')}`,
  idMode: (i % 4) + 1,
  mode: mockModes[i % 4].libelle,
  nom: s.nom,
  prenom: s.prenom,
}))

export const mockSpecialites: Specialite[] = [
  { idSpecialite: 1, libelle: 'Français', idAdmin: 1 },
  { idSpecialite: 2, libelle: 'Mathématiques', idAdmin: 1 },
  { idSpecialite: 3, libelle: 'Anglais', idAdmin: 1 },
  { idSpecialite: 4, libelle: 'Science', idAdmin: 1 },
]

export const mockLivres: Livre[] = [
  { idLivre: 1, titre: 'Grammaire CE1', auteurs: 'J. Ngo', prix: 3500, idSpecialite: 1, edition: 'Éditions Clés', totalCopie: 30 },
  { idLivre: 2, titre: 'Maths CM1', auteurs: 'P. Tchinda', prix: 4200, idSpecialite: 2, edition: 'Presses Univ.', totalCopie: 25 },
  { idLivre: 3, titre: 'English Book CP', auteurs: 'M. Nkwi', prix: 3000, idSpecialite: 3, edition: 'Macmillan', totalCopie: 40 },
  { idLivre: 4, titre: 'Science CM2', auteurs: 'L. Eyanga', prix: 4500, idSpecialite: 4, edition: 'Hatier Cameroun', totalCopie: 20 },
]

export const mockMessages: Message[] = [
  { idMessages: 1, idExp_Pers: 1, idParent: 1, objet: 'Réunion parents', information: 'Réunion des parents le 15 novembre à 8h.', created_at: '2025-10-01T08:00:00Z', valider: true },
  { idMessages: 2, idExp_Pers: 2, idParent: 2, objet: 'Progrès élève', information: 'Votre enfant a fait des progrès en lecture.', created_at: '2025-10-05T10:00:00Z', valider: true },
]
