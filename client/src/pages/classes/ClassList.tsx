import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { classAPI } from '../../services/api'
import { Cycle, Classe, Salle } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus, Circle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassList() {
  const { t } = useTranslation()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)
  const [cycleModal, setCycleModal] = useState(false)
  const [classModal, setClassModal] = useState(false)
  const [salleModal, setSalleModal] = useState(false)
  const [cycleForm, setCycleForm] = useState({ libelle: '', description: '' })
  const [classForm, setClassForm] = useState({ libelle: '', idCycle: 0 })
  const [salleForm, setSalleForm] = useState({ libelle: '', position: '', surface: '', idClasse: 0 })

  const load = () => {
    setLoading(true)
    Promise.all([
      classAPI.getCycles(),
      classAPI.getClasses(),
      classAPI.getSalles(),
    ]).then(([c, cl, s]) => {
      setCycles(c.data)
      setClasses(cl.data)
      setSalles(s.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const handleCycle = async (e: React.FormEvent) => {
    e.preventDefault()
    await classAPI.createCycle(cycleForm)
    toast.success(t('toast.saved'))
    setCycleModal(false)
    setCycleForm({ libelle: '', description: '' })
    load()
  }

  const handleClass = async (e: React.FormEvent) => {
    e.preventDefault()
    await classAPI.createClass(classForm)
    toast.success(t('toast.saved'))
    setClassModal(false)
    setClassForm({ libelle: '', idCycle: 0 })
    load()
  }

  const handleSalle = async (e: React.FormEvent) => {
    e.preventDefault()
    await classAPI.createSalle(salleForm)
    toast.success(t('toast.saved'))
    setSalleModal(false)
    setSalleForm({ libelle: '', position: '', surface: '', idClasse: 0 })
    load()
  }

  if (loading) return <LoadingSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('class.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('class.cycle')}</h3>
            <button onClick={() => setCycleModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-2">
            {cycles.map((c) => (
              <div key={c.idCycle} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <Circle size={8} className="fill-cameroon-green text-cameroon-green" />
                <span className="font-medium">{c.libelle}</span>
                <span className="text-gray-400 text-xs ml-auto">{c.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('class.addClass')}</h3>
            <button onClick={() => setClassModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.idClasse} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium">{c.libelle}</span>
                <span className="text-gray-400 text-xs">({c.cycle})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('class.room')}</h3>
            <button onClick={() => setSalleModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-2">
            {salles.map((s) => (
              <div key={s.idSalle} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.libelle}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {s.actif ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{s.position} • {s.surface} • {s.classe}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={cycleModal} onClose={() => setCycleModal(false)} title={t('class.addCycle')}>
        <form onSubmit={handleCycle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.libelle')}</label>
            <input type="text" value={cycleForm.libelle} onChange={(e) => setCycleForm({ ...cycleForm, libelle: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={cycleForm.description} onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={classModal} onClose={() => setClassModal(false)} title={t('class.addClass')}>
        <form onSubmit={handleClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.libelle')}</label>
            <input type="text" value={classForm.libelle} onChange={(e) => setClassForm({ ...classForm, libelle: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.cycle')}</label>
            <select value={classForm.idCycle} onChange={(e) => setClassForm({ ...classForm, idCycle: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {cycles.map((c) => <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={salleModal} onClose={() => setSalleModal(false)} title={t('class.roomAdd')}>
        <form onSubmit={handleSalle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.libelle')}</label>
            <input type="text" value={salleForm.libelle} onChange={(e) => setSalleForm({ ...salleForm, libelle: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.position')}</label>
            <input type="text" value={salleForm.position} onChange={(e) => setSalleForm({ ...salleForm, position: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('class.surface')}</label>
            <input type="text" value={salleForm.surface} onChange={(e) => setSalleForm({ ...salleForm, surface: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
            <select value={salleForm.idClasse} onChange={(e) => setSalleForm({ ...salleForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {classes.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
