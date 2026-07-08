import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { studentAPI, classAPI, academicAPI, paymentAPI, uploadAPI, parentAPI } from '../../services/api'
import { LANGUAGES, SEXE_OPTIONS } from '../../utils/constants'
import { Cycle, Salle, AnneeAcademique, Scolarite, Student } from '../../types'
import toast from 'react-hot-toast'
import ReactCrop, { type Crop, makeAspectCrop, centerCrop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Check, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, User, Users, School, Camera, Loader2, Link as LinkIcon, UserPlus } from 'lucide-react'
import Combobox from '../../components/Combobox'

const STEPS = [
  { id: 1, label: 'Informations', labelEn: 'Information', icon: User },
  { id: 2, label: 'Parent', labelEn: 'Parent', icon: Users },
  { id: 3, label: 'Classe', labelEn: 'Class', icon: School },
  { id: 4, label: 'Photo', labelEn: 'Photo', icon: Camera },
]

function StepIndicator({ current, step, icon: Icon, label }: { current: number; step: number; icon: any; label: string }) {
  const done = current > step
  const active = current === step
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          done
            ? 'bg-cameroon-green text-white'
            : active
            ? 'bg-cameroon-green/10 text-cameroon-green border-2 border-cameroon-green'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400'
        }`}
      >
        {done ? <Check size={18} /> : <Icon size={18} />}
      </div>
      <span
        className={`hidden sm:inline text-sm font-medium ${
          active ? 'text-cameroon-green dark:text-cameroon-green' : done ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9))
}

export default function StudentForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const lang = i18n.language as 'fr' | 'en'

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    nom: '', prenom: '', dateNaissance: '', lieuNaissance: '',
    sexe: 1 as number, langue: 'FR', idCycle: 0 as number,
    photoURL: '',
  })

  const [parent, setParent] = useState({ nom: '', prenom: '', email: '', password: 'password', mobile: '' })
  const [parentMode, setParentMode] = useState<'create' | 'link'>('create')
  const [selectedParent, setSelectedParent] = useState<{ idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string } | null>(null)

  const [enrollment, setEnrollment] = useState({ idSalle: 0, idAcademi: 0, idScolarite: 0 })

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [scolarites, setScolarites] = useState<Scolarite[]>([])

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    Promise.all([
      classAPI.getCycles(),
      classAPI.getSalles(),
      academicAPI.getAnnees(),
      paymentAPI.getScolarites(),
    ]).then(([c, s, a, sc]) => {
      setCycles(c.data)
      setSalles(s.data)
      setAnnees(a.data)
      setScolarites(sc.data)
    })
  }, [])

  useEffect(() => {
    if (!id) return
    studentAPI.getById(parseInt(id)).then(res => {
      const s = res.data
      setForm(f => ({
        ...f, nom: s.nom || '', prenom: s.prenom || '',
        dateNaissance: s.dateNaissance ? s.dateNaissance.slice(0, 10) : '',
        lieuNaissance: s.lieuNaissance || '', sexe: s.sexe,
        langue: s.langue || 'FR', idCycle: s.idCycle || 0,
        photoURL: s.photoURL || '',
      }))
    }).catch(() => toast.error(t('toast.error')))
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newForm = { ...form, [name]: ['sexe', 'idCycle'].includes(name) ? Number(value) : value }
    if (name === 'langue') {
      const target = value === 'FR' ? 'francophone' : value === 'EN' ? 'anglophone' : ''
      const matched = cycles.find(c => c.libelle.toLowerCase().includes(target))
      if (matched) newForm.idCycle = matched.idCycle
    }
    setForm(newForm)
  }

  const filteredSalles = form.idCycle
    ? salles.filter(s => {
        const cls = cycles.find(c => c.idCycle === form.idCycle)
        if (!cls) return true
        return true
      })
    : salles

  const filteredScolarites = form.idCycle
    ? scolarites.filter(sc => sc.idCycle === form.idCycle)
    : scolarites

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return }
    const reader = new FileReader()
    reader.addEventListener('load', () => setImageSrc(reader.result as string))
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width, height
    )
    setCrop(crop)
  }

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) return
    setUploading(true)
    try {
      const canvas = document.createElement('canvas')
      const image = imgRef.current
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      canvas.width = completedCrop.width
      canvas.height = completedCrop.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        image,
        completedCrop.x * scaleX, completedCrop.y * scaleY,
        completedCrop.width * scaleX, completedCrop.height * scaleY,
        0, 0, completedCrop.width, completedCrop.height
      )
      const blob = await canvasToBlob(canvas)
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const res = await uploadAPI.photo(file)
      setForm(f => ({ ...f, photoURL: res.data.url }))
      setImageSrc(null)
      toast.success('Photo téléchargée')
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setForm(f => ({ ...f, photoURL: '' }))
    setImageSrc(null)
    setCrop(undefined)
    setCompletedCrop(null)
  }

  const canNext = () => {
    if (step === 1) return form.nom && form.prenom && form.dateNaissance && form.lieuNaissance
    if (step === 2) {
      if (parentMode === 'link') return !!selectedParent
      return parent.nom && parent.email
    }
    if (step === 3) return enrollment.idSalle && enrollment.idAcademi
    return true
  }

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 4)) }
  const prev = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload: Partial<Student> = {
        ...form, sexe: form.sexe as 1 | 2, langue: form.langue as 'FR' | 'EN' | 'Bilingue',
      }
      let result: { data: Student }
      if (isEdit) {
        result = await studentAPI.update(parseInt(id!), payload)
      } else {
        result = await studentAPI.create(payload)
      }
      const newMatricule = result.data.matricule

      const parentPayload = parentMode === 'link' && selectedParent
        ? { nom: selectedParent.nom, prenom: selectedParent.prenom, email: selectedParent.email || '', password: '', mobile: selectedParent.mobile || '' }
        : parentMode === 'create' && parent.email
        ? parent
        : undefined

      if (enrollment.idSalle && enrollment.idAcademi) {
        await studentAPI.enroll({
          matricule: newMatricule,
          idSalle: enrollment.idSalle,
          idAcademi: enrollment.idAcademi,
          parent: parentPayload,
        })
      } else if (parentPayload) {
        await studentAPI.enroll({
          matricule: newMatricule,
          idSalle: 0,
          idAcademi: 0,
          parent: parentPayload,
        })
      }
      toast.success(t('toast.saved'))
      navigate('/admin/students')
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const isFr = lang === 'fr'

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? t('student.edit') : t('student.add')}
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <StepIndicator current={step} step={s.id} icon={s.icon} label={isFr ? s.label : s.labelEn} />
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block w-12 lg:w-20 h-0.5 mx-2 transition-colors ${step > s.id ? 'bg-cameroon-green' : 'bg-gray-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{isFr ? 'Renseignez les informations personnelles de l\'élève' : 'Fill in the student\'s personal information'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.nom')} *</label>
                  <input type="text" name="nom" value={form.nom} onChange={handleChange} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.prenom')} *</label>
                  <input type="text" name="prenom" value={form.prenom} onChange={handleChange} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.dateNaissance')} *</label>
                  <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.sexe')} *</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                    {SEXE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{isFr ? opt.labelFr : opt.labelEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.lieuNaissance')} *</label>
                <input type="text" name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} required placeholder="Yaoundé, Douala..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.langue')}</label>
                  <select name="langue" value={form.langue} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{isFr ? l.labelFr : l.labelEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cycle</label>
                  <select name="idCycle" value={form.idCycle || ''} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                    <option value="">{t('common.select')}</option>
                    {cycles.map(c => <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{isFr ? 'Liez un parent à l\'élève' : 'Link a parent to the student'}</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParentMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition ${
                    parentMode === 'link'
                      ? 'bg-cameroon-green text-white border-cameroon-green'
                      : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-cameroon-green'
                  }`}
                >
                  <LinkIcon size={16} />
                  {isFr ? 'Lier existant' : 'Link existing'}
                </button>
                <button
                  type="button"
                  onClick={() => setParentMode('create')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition ${
                    parentMode === 'create'
                      ? 'bg-cameroon-green text-white border-cameroon-green'
                      : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-cameroon-green'
                  }`}
                >
                  <UserPlus size={16} />
                  {isFr ? 'Nouveau parent' : 'New parent'}
                </button>
              </div>

              {parentMode === 'link' && (
                <Combobox
                  label={isFr ? 'Rechercher un parent' : 'Search parent'}
                  placeholder={isFr ? 'Nom, prénom ou téléphone...' : 'Name or phone...'}
                  fetchFn={parentAPI.search}
                  onSelect={setSelectedParent}
                  selectedLabel={selectedParent ? `${selectedParent.nom} ${selectedParent.prenom}${selectedParent.email ? ` (${selectedParent.email})` : ''}` : null}
                  required
                />
              )}

              {parentMode === 'create' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.nom')} *</label>
                      <input type="text" value={parent.nom} onChange={e => setParent(p => ({ ...p, nom: e.target.value }))} required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.prenom')}</label>
                      <input type="text" value={parent.prenom} onChange={e => setParent(p => ({ ...p, prenom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
                    <input type="email" value={parent.email} onChange={e => setParent(p => ({ ...p, email: e.target.value }))} required placeholder="parent@email.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Mot de passe' : 'Password'} *</label>
                      <input type="password" value={parent.password} onChange={e => setParent(p => ({ ...p, password: e.target.value }))} required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Téléphone' : 'Phone'}</label>
                      <input type="text" value={parent.mobile} onChange={e => setParent(p => ({ ...p, mobile: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{isFr ? 'Affectez l\'élève à une classe et définissez les détails de scolarité' : 'Assign the student to a class and set tuition details'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Salle / Classe' : 'Room / Class'} *</label>
                  <select value={enrollment.idSalle} onChange={ev => setEnrollment(prev => ({ ...prev, idSalle: parseInt(ev.target.value) }))} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                    <option value="">{t('common.select')}</option>
                    {filteredSalles.filter(s => s.actif).map(s => (
                      <option key={s.idSalle} value={s.idSalle}>{s.libelle} — {s.classe}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.selectYear')} *</label>
                  <select value={enrollment.idAcademi} onChange={ev => setEnrollment(prev => ({ ...prev, idAcademi: parseInt(ev.target.value) }))} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                    <option value="">{t('common.select')}</option>
                    {annees.map(a => <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Frais de scolarité' : 'Tuition plan'}</label>
                <select value={enrollment.idScolarite} onChange={ev => setEnrollment(prev => ({ ...prev, idScolarite: parseInt(ev.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                  <option value="">{t('common.select')}</option>
                  {filteredScolarites.map(sc => (
                    <option key={sc.idScolante} value={sc.idScolante}>
                      {isFr ? 'Inscription' : 'Registration'}: {sc.inscription} FCFA — {isFr ? 'Pension' : 'Tuition'}: {sc.pension} FCFA
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                {isFr ? 'Téléchargez et recadrez la photo de l\'élève (format carré)' : 'Upload and crop the student\'s photo (square format)'}
              </p>

              {!imageSrc && !form.photoURL && (
                <div
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
                    dragOver
                      ? 'border-cameroon-green bg-cameroon-green/5'
                      : 'border-gray-300 dark:border-slate-600 hover:border-cameroon-green dark:hover:border-cameroon-green'
                  }`}
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {isFr ? 'Glissez-déposez une photo ici ou cliquez pour sélectionner' : 'Drag & drop a photo here or click to select'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — 5 Mo max</p>
                  <input id="photo-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              )}

              {imageSrc && (
                <div className="space-y-4">
                  <div className="max-w-md mx-auto">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} minWidth={100}>
                      <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-80 w-full object-contain" />
                    </ReactCrop>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setImageSrc(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                      {isFr ? 'Annuler' : 'Cancel'}
                    </button>
                    <button onClick={applyCrop} disabled={uploading || !completedCrop}
                      className="px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition disabled:opacity-50 flex items-center gap-2">
                      {uploading && <Loader2 size={16} className="animate-spin" />}
                      {uploading ? (isFr ? 'Téléchargement...' : 'Uploading...') : (isFr ? 'Appliquer le recadrage' : 'Apply crop')}
                    </button>
                  </div>
                </div>
              )}

              {form.photoURL && !imageSrc && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cameroon-green/20 shadow-lg">
                    <img src={form.photoURL} alt="Student" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => document.getElementById('photo-input')?.click()}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-2">
                      <ImageIcon size={16} />
                      {isFr ? 'Changer' : 'Change'}
                    </button>
                    <button onClick={removePhoto}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">
                      {isFr ? 'Supprimer' : 'Remove'}
                    </button>
                  </div>
                  <input id="photo-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              )}

              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{isFr ? 'Récapitulatif' : 'Summary'}</p>
                <div className="text-sm text-gray-500 dark:text-slate-400 space-y-1">
                  <p>{t('student.nom')}: <span className="font-medium text-gray-900 dark:text-white">{form.nom} {form.prenom}</span></p>
                  <p>{t('student.dateNaissance')}: <span className="font-medium text-gray-900 dark:text-white">{form.dateNaissance}</span></p>
                  <p>{t('student.langue')}: <span className="font-medium text-gray-900 dark:text-white">{form.langue}</span></p>
                  {enrollment.idSalle > 0 && (
                    <p>{isFr ? 'Classe' : 'Class'}: <span className="font-medium text-gray-900 dark:text-white">
                      {salles.find(s => s.idSalle === enrollment.idSalle)?.libelle}
                    </span></p>
                  )}
                  {parentMode === 'link' && selectedParent && (
                    <p>{isFr ? 'Parent lié' : 'Linked parent'}: <span className="font-medium text-gray-900 dark:text-white">{selectedParent.nom} {selectedParent.prenom}</span></p>
                  )}
                  {parentMode === 'create' && parent.email && (
                    <p>{isFr ? 'Parent' : 'Parent'}: <span className="font-medium text-gray-900 dark:text-white">{parent.nom} ({parent.email})</span></p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button onClick={step > 1 ? prev : () => navigate('/admin/students')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <ChevronLeft size={16} />
            {step === 1 ? t('common.cancel') : (isFr ? 'Précédent' : 'Back')}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {step} / 4
            </span>
            {step < 4 ? (
              <button onClick={next} disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition disabled:opacity-50">
                {isFr ? 'Suivant' : 'Next'}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition disabled:opacity-50">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t('app.loading') : t('common.save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
