import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Search, Send, Sparkles, Trophy, Users } from 'lucide-react'

const tabs = ['Submit', 'History', 'Ranking']
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const cardMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.35 },
  }),
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Submit')
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contributor, setContributor] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    if (activeTab !== 'History' && activeTab !== 'Ranking') return

    let cancelled = false
    const fetchHistory = async () => {
      setLoading(true)
      setHistoryError('')

      try {
        const response = await fetch(`${API_BASE}/api/intelligence`)
        if (!response.ok) throw new Error('Unable to load intelligence history')
        const data = await response.json()
        if (!cancelled) setHistory(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!cancelled) {
          setHistoryError(error.message)
          setHistory([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return history

    const query = search.toLowerCase()
    return history.filter((item) =>
      [item.title, item.category, item.priority, item.summary, item.contributor, (item.entities || []).join(' ')].some((field) =>
        (field || '').toString().toLowerCase().includes(query),
      ),
    )
  }, [history, search])

  const ranking = useMemo(() => {
    const pointsByContributor = history.reduce((acc, item) => {
      const name = item.contributor || 'Anonymous'
      const priorityBoost = item.priority === 'High' ? 3 : item.priority === 'Medium' ? 2 : 1
      acc[name] = (acc[name] || 0) + priorityBoost
      return acc
    }, {})

    const leaders = Object.entries(pointsByContributor)
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points)

    return {
      totalIntelligence: history.length,
      activeMembers: Object.keys(pointsByContributor).length,
      star: leaders[0] || { name: 'No champion yet', points: 0 },
      leaders,
    }
  }, [history])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setImageFile(file ?? null)
    setImagePreview(file ? URL.createObjectURL(file) : '')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitStatus({ type: '', message: '' })

    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('contributor', contributor)
    if (imageFile) formData.append('image', imageFile)

    try {
      const response = await fetch(`${API_BASE}/api/intelligence`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Submit failed. Please check backend API.')

      setSubmitStatus({ type: 'success', message: 'Intelligence submitted successfully.' })
      setTitle('')
      setContent('')
      setContributor('')
      setImageFile(null)
      setImagePreview('')
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 p-6 text-slate-800 sm:p-10">
      <div className="mx-auto max-w-6xl rounded-[40px] border border-white/50 bg-white/45 p-4 shadow-glow backdrop-blur-xl sm:p-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-3xl text-indigo-700">Intelligence Hub</p>
            <p className="text-slate-600">Collect, review, and reward meaningful intelligence.</p>
          </div>
          <nav className="inline-flex rounded-full border border-white/70 bg-white/70 p-1 shadow-lg backdrop-blur">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition ${activeTab === tab ? 'text-white' : 'text-slate-600'}`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {activeTab === tab ? (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-indigo-600"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                ) : null}
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'Submit' && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  className="w-full rounded-3xl border border-white/60 bg-white/70 px-5 py-3 text-lg outline-none ring-indigo-300 placeholder:text-slate-400 focus:ring"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Intelligence title"
                  required
                  value={title}
                />
                <textarea
                  className="min-h-72 w-full rounded-[40px] border border-white/60 bg-white/75 p-6 text-lg leading-relaxed outline-none ring-indigo-300 placeholder:text-slate-400 focus:ring"
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Paste your intelligence signal here. Keep it clear, specific, and actionable..."
                  required
                  value={content}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-dashed border-indigo-300 bg-white/70 px-4 py-3 text-slate-600">
                    <ImagePlus size={20} />
                    <span>{imageFile ? imageFile.name : 'Upload supporting image'}</span>
                    <input accept="image/*" className="hidden" onChange={handleImageChange} type="file" />
                  </label>
                  <input
                    className="rounded-3xl border border-white/60 bg-white/70 px-4 py-3 outline-none ring-indigo-300 placeholder:text-slate-400 focus:ring"
                    onChange={(event) => setContributor(event.target.value)}
                    placeholder="Contributor name (optional)"
                    value={contributor}
                  />
                </div>

                {imagePreview ? (
                  <img alt="Preview" className="h-56 w-full rounded-3xl object-cover shadow-md" src={imagePreview} />
                ) : null}

                <button
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-indigo-500"
                  type="submit"
                >
                  <Send size={16} /> Submit intelligence
                </button>

                {submitStatus.message ? (
                  <p className={submitStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}>{submitStatus.message}</p>
                ) : null}
              </form>
            )}

            {activeTab === 'History' && (
              <div className="space-y-5">
                <label className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 px-4 py-3">
                  <Search size={18} className="text-slate-500" />
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, category, priority, entities, summary, contributor..."
                    value={search}
                  />
                </label>

                {loading && <p className="text-slate-500">Loading intelligence history...</p>}
                {historyError && <p className="text-rose-600">{historyError}</p>}
                {!loading && !historyError && filteredHistory.length === 0 && (
                  <p className="rounded-3xl bg-white/80 p-6 text-slate-500 shadow">No intelligence found.</p>
                )}

                <div className="grid gap-4">
                  <AnimatePresence>
                    {filteredHistory.map((item, index) => (
                      <motion.article
                        key={item.id ?? `${item.title}-${index}`}
                        animate="visible"
                        className="rounded-[40px] border border-white/60 bg-white/70 p-6 shadow"
                        custom={index}
                        exit={{ opacity: 0, y: -8 }}
                        initial="hidden"
                        variants={cardMotion}
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-xl text-slate-800">{item.title || 'Untitled intelligence'}</h3>
                            <p className="text-sm text-slate-500">{item.category || 'General'} • {item.priority || 'Low'} priority</p>
                          </div>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">{item.contributor || 'Anonymous'}</span>
                        </div>
                        <p className="mb-3 text-slate-600">{item.summary || item.content || 'No summary provided.'}</p>
                        <p className="text-sm text-slate-500">Entities: {(item.entities || []).join(', ') || 'None'}</p>
                        {item.imageUrl ? (
                          <img alt={item.title} className="mt-4 h-56 w-full rounded-3xl object-cover" src={item.imageUrl} />
                        ) : null}
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === 'Ranking' && (
              <div className="grid auto-rows-[minmax(160px,_auto)] gap-4 md:grid-cols-6">
                <motion.article className="rounded-[40px] border border-white/60 bg-gradient-to-br from-indigo-600 to-indigo-500 p-6 text-white shadow-glow md:col-span-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mb-2 inline-flex rounded-full bg-white/20 p-2"><Trophy size={18} /></div>
                  <p className="text-sm opacity-85">Star of the Month</p>
                  <h3 className="font-display text-3xl">{ranking.star.name}</h3>
                  <p className="text-sm">{ranking.star.points} contribution points</p>
                </motion.article>
                <motion.article className="rounded-[40px] border border-white/60 bg-white/70 p-6 shadow md:col-span-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                  <div className="mb-2 inline-flex rounded-full bg-indigo-100 p-2 text-indigo-700"><Sparkles size={18} /></div>
                  <p className="text-sm text-slate-500">Total intelligence</p>
                  <h3 className="font-display text-4xl text-slate-800">{ranking.totalIntelligence}</h3>
                </motion.article>
                <motion.article className="rounded-[40px] border border-white/60 bg-white/70 p-6 shadow md:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                  <div className="mb-2 inline-flex rounded-full bg-indigo-100 p-2 text-indigo-700"><Users size={18} /></div>
                  <p className="text-sm text-slate-500">Active members</p>
                  <h3 className="font-display text-4xl text-slate-800">{ranking.activeMembers}</h3>
                </motion.article>
                <motion.article className="rounded-[40px] border border-white/60 bg-white/70 p-6 shadow md:col-span-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                  <p className="mb-4 font-display text-xl text-slate-800">Leaderboard</p>
                  <div className="space-y-3">
                    {ranking.leaders.length === 0 && <p className="text-slate-500">No leaderboard data yet.</p>}
                    {ranking.leaders.map((member, index) => (
                      <div className="flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3" key={member.name}>
                        <p className="font-medium text-slate-700">#{index + 1} {member.name}</p>
                        <p className="text-indigo-600">{member.points} pts</p>
                      </div>
                    ))}
                  </div>
                </motion.article>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  )
}
