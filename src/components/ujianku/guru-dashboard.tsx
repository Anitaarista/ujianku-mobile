'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, FileText, ClipboardCheck, Award,
  Bell, Search, LogOut, ChevronRight, Plus, Download,
  TrendingUp, Clock, Users, CheckCircle, XCircle, Edit,
  Trash2, Eye, ArrowLeft, ArrowRight,
  GraduationCap, BarChart3, Settings, AlertTriangle, Star,
  Copy, Shuffle, Lock, Unlock, Timer,
  BookMarked, Layers, Loader2, AlertCircle, X, MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  gradeDistributionData, mockNotifications, getStatusColor, getDifficultyColor, formatDuration
} from './mock-data'
import type { MockNotification } from './mock-data'
import { exportToCSV } from '@/lib/csv-export'
import { toast } from '@/hooks/use-toast'

type GuruTab = 'dashboard' | 'bank-soal' | 'buat-ujian' | 'hasil-ujian' | 'nilai' | 'profil'

interface GuruDashboardProps {
  onBack: () => void
  user?: { id: string; name: string; email: string; role: string; avatar?: string }
  token?: string | null
}

// API Types
interface ApiBankSoal {
  id: string; mataPelajaranId: string; guruId: string; tipeSoal: string; tingkatKesulitan: string
  pertanyaan: string; opsiA: string | null; opsiB: string | null; opsiC: string | null; opsiD: string | null; opsiE: string | null
  jawabanBenar: string | null; pembahasan: string | null; poin: number; isPublic: boolean
  mataPelajaran: { id: string; nama: string; kode: string }
  guru: { id: string; name: string }
}

interface ApiExam {
  id: string; judul: string; deskripsi: string | null; mataPelajaranId: string; guruId: string
  durasi: number; tipeExam: string; token: string | null; status: string
  acakSoal: boolean; acakOpsi: boolean; showResult: boolean; antiCheat: boolean
  mataPelajaran: { id: string; nama: string; kode: string }
  guru: { id: string; name: string }
  examKelas: { kelas: { id: string; nama: string; tingkat: number } }[]
  _count: { participants: number; examSoal: number }
  stats?: { completedParticipants: number; averageScore: number | null }
}

interface ApiResult {
  id: string; examId: string; siswaId: string; status: string
  mulaiPada: string | null; selesaiPada: string | null; durasi: number | null
  nilai: number | null; nilaiEssay: number | null; totalNilai: number | null; attempt: number
  exam: { id: string; judul: string; tipeExam: string; status: string; mataPelajaran: { nama: string; kode: string } }
  siswa: { id: string; name: string; email: string; nipNis: string | null }
}

interface ApiMapel {
  id: string; kode: string; nama: string; kkm: number; kelompok: string | null
}

interface ApiKelas {
  id: string; nama: string; tingkat: number; tahunAjaran: string
  waliKelas: { id: string; name: string } | null
  _count: { siswaKelas: number }
}

const sidebarItems: { id: GuruTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bank-soal', label: 'Bank Soal', icon: BookOpen },
  { id: 'buat-ujian', label: 'Buat Ujian', icon: FileText },
  { id: 'hasil-ujian', label: 'Hasil Ujian', icon: ClipboardCheck },
  { id: 'nilai', label: 'Nilai & Rapor', icon: Award },
  { id: 'profil', label: 'Profil & Pengaturan', icon: Settings },
]

// API helper
async function apiFetch(url: string, token: string | null, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers })
  return res.json()
}

// ==================== LOADING SKELETON ====================
function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium">Memuat data...</p>
      </div>
    </div>
  )
}

// ==================== EMPTY STATE ====================
function EmptyState({ message, icon: Icon }: { message: string; icon?: React.ElementType }) {
  const IconComp = Icon || FileText
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <IconComp className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  )
}

// ==================== MODAL OVERLAY ====================
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function GuruDashboard({ onBack, user, token }: GuruDashboardProps) {
  const [activeTab, setActiveTab] = useState<GuruTab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  // Notification bell dropdown with mock data
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifications, setNotifications] = useState<MockNotification[]>(mockNotifications)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    toast({ title: 'Berhasil', description: 'Semua notifikasi ditandai sudah dibaca' })
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Dark Sidebar - Emerald Theme */}
      <aside className="w-64 bg-gray-900 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">UjianKu</span>
              <span className="text-[10px] text-gray-400 block -mt-0.5 uppercase tracking-wider">Guru Panel</span>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto text-emerald-200" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => setActiveTab('profil')} className="w-full flex items-center gap-3 hover:bg-white/5 rounded-xl p-2 -m-2 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SN'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Guru'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          <div className="mt-3">
            <button onClick={onBack} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">
            {sidebarItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Cari..." className="pl-9 w-64 h-9 bg-gray-50 border-gray-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {/* Bell icon with dropdown - connected to mock notifications */}
            <div className="relative" ref={notifRef}>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Tandai semua dibaca</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">Belum ada notifikasi</p>
                      <p className="text-xs text-gray-400 mt-1">Notifikasi baru akan muncul di sini</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-emerald-50/30' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.tipe === 'violation' ? 'bg-red-100 text-red-600' :
                              notif.tipe === 'exam' ? 'bg-emerald-100 text-emerald-600' :
                              notif.tipe === 'result' ? 'bg-violet-100 text-violet-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {notif.tipe === 'violation' ? <AlertTriangle className="w-4 h-4" /> :
                               notif.tipe === 'exam' ? <FileText className="w-4 h-4" /> :
                               notif.tipe === 'result' ? <ClipboardCheck className="w-4 h-4" /> :
                               <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{notif.judul}</p>
                                {!notif.isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.pesan}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{notif.waktu}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.isRead && (
                                <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id) }} className="p-1 hover:bg-emerald-100 rounded transition-colors" title="Tandai dibaca">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id) }} className="p-1 hover:bg-red-50 rounded transition-colors" title="Hapus notifikasi">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <GuruOverview token={token ?? null} />}
          {activeTab === 'bank-soal' && <BankSoal token={token ?? null} searchQuery={searchQuery} />}
          {activeTab === 'buat-ujian' && <BuatUjian token={token ?? null} />}
          {activeTab === 'hasil-ujian' && <HasilUjian token={token ?? null} />}
          {activeTab === 'nilai' && <NilaiRapor token={token ?? null} />}
          {activeTab === 'profil' && <ProfilPengaturan user={user ?? null} token={token ?? null} />}
        </div>
      </main>
    </div>
  )
}

// ==================== GURU OVERVIEW ====================
function GuruOverview({ token }: { token: string | null }) {
  const [exams, setExams] = useState<ApiExam[]>([])
  const [results, setResults] = useState<ApiResult[]>([])
  const [summary, setSummary] = useState<{ totalQuestions: number; byType: { type: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [examsRes, bankSoalRes, resultsRes] = await Promise.all([
          apiFetch('/api/v1/guru/exams?limit=10', token),
          apiFetch('/api/v1/guru/bank-soal?limit=1', token),
          apiFetch('/api/v1/guru/results?limit=5', token),
        ])
        if (examsRes.success) setExams(examsRes.data?.data || [])
        if (bankSoalRes.success) setSummary(bankSoalRes.data?.summary || null)
        if (resultsRes.success) setResults(resultsRes.data?.data || [])
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  if (loading) return <LoadingSkeleton />

  const totalSoal = summary?.totalQuestions ?? 0
  const ujianAktif = exams.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length
  const avgScore = results.filter(r => r.totalNilai !== null).reduce((sum, r) => sum + (r.totalNilai ?? 0), 0) / (results.filter(r => r.totalNilai !== null).length || 1)

  const stats = [
    { label: 'Total Soal', value: totalSoal, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Ujian Aktif', value: ujianAktif, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Total Ujian', value: exams.length, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Rata-rata Nilai', value: avgScore.toFixed(1), icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`border ${stat.border} shadow-sm`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">Data real-time</p>
                  </div>
                  <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4"><CardTitle className="text-base font-semibold text-gray-900">Ujian Mendatang</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {exams.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length === 0 ? (
              <EmptyState message="Tidak ada ujian mendatang" icon={Timer} />
            ) : (
              exams.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50/50 transition-colors border border-gray-100">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    exam.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {exam.status === 'ONGOING' ? <Timer className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{exam.judul}</p>
                    <p className="text-xs text-gray-500 font-medium">{exam.mataPelajaran?.nama || '-'} · {exam.durasi} menit · {exam._count?.examSoal ?? 0} soal</p>
                  </div>
                  <Badge className={`${getStatusColor(exam.status)} font-semibold border-0`}>
                    {exam.status === 'ONGOING' ? 'Berlangsung' : 'Terbit'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4"><CardTitle className="text-base font-semibold text-gray-900">Hasil Terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 ? (
              <EmptyState message="Belum ada hasil ujian" icon={ClipboardCheck} />
            ) : (
              results.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50/50 transition-colors border border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    (result.totalNilai ?? 0) >= 75 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-orange-500'
                  }`}>
                    {result.totalNilai?.toFixed(0) ?? '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{result.siswa?.name || '-'}</p>
                    <p className="text-xs text-gray-500 font-medium">{result.exam?.judul || '-'}</p>
                  </div>
                  <span className={`text-xs font-bold ${(result.totalNilai ?? 0) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(result.totalNilai ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== BANK SOAL ====================
function BankSoal({ token, searchQuery }: { token: string | null; searchQuery: string }) {
  const [soalList, setSoalList] = useState<ApiBankSoal[]>([])
  const [mapelList, setMapelList] = useState<ApiMapel[]>([])
  const [summary, setSummary] = useState<{ totalQuestions: number; byType: { type: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSoal, setNewSoal] = useState({
    mataPelajaranId: '', tipeSoal: 'PILIHAN_GANDA', tingkatKesulitan: 'SEDANG',
    pertanyaan: '', opsiA: '', opsiB: '', opsiC: '', opsiD: '', opsiE: '',
    jawabanBenar: 'A', pembahasan: '', poin: 2, isPublic: false
  })

  // FIX #22: Edit soal state
  const [editSoal, setEditSoal] = useState<ApiBankSoal | null>(null)
  const [editSoalForm, setEditSoalForm] = useState({
    mataPelajaranId: '', tipeSoal: 'PILIHAN_GANDA', tingkatKesulitan: 'SEDANG',
    pertanyaan: '', opsiA: '', opsiB: '', opsiC: '', opsiD: '', opsiE: '',
    jawabanBenar: 'A', pembahasan: '', poin: 2, isPublic: false
  })
  const [editSaving, setEditSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '50' })
      if (searchQuery) params.set('search', searchQuery)
      if (filterDifficulty !== 'all') params.set('difficulty', filterDifficulty)
      if (filterType !== 'all') params.set('type', filterType)
      const [soalRes, mapelRes] = await Promise.all([
        apiFetch(`/api/v1/guru/bank-soal?${params}`, token),
        apiFetch('/api/v1/admin/mata-pelajaran?limit=50', token),
      ])
      if (soalRes.success) {
        setSoalList(soalRes.data?.data || [])
        setSummary(soalRes.data?.summary || null)
      }
      if (mapelRes.success) setMapelList(mapelRes.data?.data || [])
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [token, searchQuery, filterDifficulty, filterType])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddSoal = async () => {
    if (!newSoal.mataPelajaranId || !newSoal.pertanyaan) return
    try {
      setSaving(true)
      const res = await apiFetch('/api/v1/bank-soal', token, {
        method: 'POST',
        body: JSON.stringify(newSoal),
      })
      if (res.success) {
        setShowAddModal(false)
        setNewSoal({
          mataPelajaranId: '', tipeSoal: 'PILIHAN_GANDA', tingkatKesulitan: 'SEDANG',
          pertanyaan: '', opsiA: '', opsiB: '', opsiC: '', opsiD: '', opsiE: '',
          jawabanBenar: 'A', pembahasan: '', poin: 2, isPublic: false
        })
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSoal = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return
    try {
      await apiFetch(`/api/v1/bank-soal/${id}`, token, { method: 'DELETE' })
      fetchData()
    } catch {
      // silently handle
    }
  }

  // FIX #21: Copy soal handler
  const handleCopySoal = async (soal: ApiBankSoal) => {
    try {
      const res = await apiFetch('/api/v1/bank-soal', token, {
        method: 'POST',
        body: JSON.stringify({
          mataPelajaranId: soal.mataPelajaranId,
          tipeSoal: soal.tipeSoal,
          tingkatKesulitan: soal.tingkatKesulitan,
          pertanyaan: soal.pertanyaan + ' (salinan)',
          opsiA: soal.opsiA,
          opsiB: soal.opsiB,
          opsiC: soal.opsiC,
          opsiD: soal.opsiD,
          opsiE: soal.opsiE,
          jawabanBenar: soal.jawabanBenar,
          pembahasan: soal.pembahasan,
          poin: soal.poin,
          isPublic: soal.isPublic,
        }),
      })
      if (res.success) fetchData()
    } catch {
      // silently handle
    }
  }

  // FIX #22: Edit soal handlers
  const handleOpenEditSoal = (soal: ApiBankSoal) => {
    setEditSoal(soal)
    setEditSoalForm({
      mataPelajaranId: soal.mataPelajaranId, tipeSoal: soal.tipeSoal, tingkatKesulitan: soal.tingkatKesulitan,
      pertanyaan: soal.pertanyaan, opsiA: soal.opsiA || '', opsiB: soal.opsiB || '', opsiC: soal.opsiC || '',
      opsiD: soal.opsiD || '', opsiE: soal.opsiE || '', jawabanBenar: soal.jawabanBenar || 'A',
      pembahasan: soal.pembahasan || '', poin: soal.poin, isPublic: soal.isPublic,
    })
  }

  const handleSaveEditSoal = async () => {
    if (!editSoal) return
    try {
      setEditSaving(true)
      const res = await apiFetch(`/api/v1/bank-soal/${editSoal.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editSoalForm),
      })
      if (res.success) {
        setEditSoal(null)
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setEditSaving(false)
    }
  }

  // FIX #20: Export soal to CSV
  const handleExportSoal = () => {
    const data = soalList.map(s => ({
      Pertanyaan: s.pertanyaan,
      'Mata Pelajaran': s.mataPelajaran?.nama || '-',
      'Tipe Soal': s.tipeSoal,
      'Tingkat Kesulitan': s.tingkatKesulitan,
      Poin: s.poin,
      'Jawaban Benar': s.jawabanBenar || '-',
      Publik: s.isPublic ? 'Ya' : 'Tidak',
      'Dibuat Oleh': s.guru?.name || '-',
    }))
    exportToCSV(data, 'bank-soal')
  }

  if (loading) return <LoadingSkeleton />

  const totalSoal = summary?.totalQuestions ?? soalList.length
  const pgCount = summary?.byType?.find(b => b.type === 'PILIHAN_GANDA')?.count ?? 0
  const essayCount = summary?.byType?.find(b => b.type === 'ESSAY')?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
            <option value="all">Semua Tingkat</option>
            <option value="MUDAH">Mudah</option>
            <option value="SEDANG">Sedang</option>
            <option value="SULIT">Sulit</option>
          </select>
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Semua Tipe</option>
            <option value="PILIHAN_GANDA">Pilihan Ganda</option>
            <option value="ESSAY">Essay</option>
            <option value="BENAR_SALAH">Benar/Salah</option>
            <option value="JAWABAN_SINGKAT">Jawaban Singkat</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {/* FIX #20: Export CSV */}
          <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={handleExportSoal}><Download className="w-4 h-4 mr-2" />Ekspor</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />Tambah Soal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Soal', value: totalSoal, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pilihan Ganda', value: pgCount, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Essay', value: essayCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.border} shadow-sm`}>
            <CardContent className="p-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {soalList.length === 0 ? (
          <div className="col-span-2"><EmptyState message="Belum ada soal" icon={BookOpen} /></div>
        ) : (
          soalList.map((soal, i) => (
            <motion.div key={soal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow h-full shadow-sm border-gray-100">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-semibold text-gray-700 border-gray-200">{soal.mataPelajaran?.nama || '-'}</Badge>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(soal.tingkatKesulitan)}`}>
                        {soal.tingkatKesulitan}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {soal.tipeSoal === 'PILIHAN_GANDA' ? 'PG' : soal.tipeSoal === 'ESSAY' ? 'Essay' : soal.tipeSoal === 'BENAR_SALAH' ? 'B/S' : 'Singkat'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">Poin: {soal.poin}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-3 line-clamp-3 font-medium">{soal.pertanyaan}</p>
                  {soal.opsiA && (
                    <div className="space-y-1 mb-3">
                      {[soal.opsiA, soal.opsiB, soal.opsiC, soal.opsiD].filter(Boolean).map((opsi, idx) => (
                        <div key={idx} className={`text-xs p-1.5 rounded ${String.fromCharCode(65 + idx) === soal.jawabanBenar ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600'}`}>
                          {String.fromCharCode(65 + idx)}. {opsi}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Oleh: {soal.guru?.name || '-'}</span>
                    <div className="flex items-center gap-1">
                      {/* FIX #21: Copy button */}
                      <button onClick={() => handleCopySoal(soal)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Duplikat soal"><Copy className="w-3.5 h-3.5 text-gray-500" /></button>
                      {/* FIX #22: Edit button */}
                      <button onClick={() => handleOpenEditSoal(soal)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit soal"><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button onClick={() => handleDeleteSoal(soal.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Soal Modal */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tambah Soal Baru</h2>
            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mata Pelajaran</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newSoal.mataPelajaranId} onChange={(e) => setNewSoal({ ...newSoal, mataPelajaranId: e.target.value })}>
                  <option value="">Pilih Mapel</option>
                  {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipe Soal</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newSoal.tipeSoal} onChange={(e) => setNewSoal({ ...newSoal, tipeSoal: e.target.value })}>
                  <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                  <option value="ESSAY">Essay</option>
                  <option value="BENAR_SALAH">Benar/Salah</option>
                  <option value="JAWABAN_SINGKAT">Jawaban Singkat</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tingkat Kesulitan</label>
              <div className="flex gap-2">
                {(['MUDAH', 'SEDANG', 'SULIT'] as const).map((d) => (
                  <button key={d} onClick={() => setNewSoal({ ...newSoal, tingkatKesulitan: d })} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    newSoal.tingkatKesulitan === d ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>{d === 'MUDAH' ? 'Mudah' : d === 'SEDANG' ? 'Sedang' : 'Sulit'}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pertanyaan</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[100px] focus:border-emerald-400 focus:ring-emerald-400/20" placeholder="Tulis pertanyaan..." value={newSoal.pertanyaan} onChange={(e) => setNewSoal({ ...newSoal, pertanyaan: e.target.value })} />
            </div>
            {newSoal.tipeSoal === 'PILIHAN_GANDA' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Opsi Jawaban</label>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <input type="radio" name="correct-add" checked={newSoal.jawabanBenar === opt} onChange={() => setNewSoal({ ...newSoal, jawabanBenar: opt })} className="accent-emerald-600" />
                    <span className="text-sm font-semibold text-gray-700 w-6">Opsi {opt}:</span>
                    <Input className="flex-1 h-9" placeholder={`Masukkan opsi ${opt}...`} value={newSoal[`opsi${opt}` as keyof typeof newSoal] as string} onChange={(e) => setNewSoal({ ...newSoal, [`opsi${opt}`]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pembahasan</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px] focus:border-emerald-400 focus:ring-emerald-400/20" placeholder="Tulis pembahasan..." value={newSoal.pembahasan} onChange={(e) => setNewSoal({ ...newSoal, pembahasan: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Poin</label>
                <Input type="number" value={newSoal.poin} onChange={(e) => setNewSoal({ ...newSoal, poin: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={newSoal.isPublic} onChange={(e) => setNewSoal({ ...newSoal, isPublic: e.target.checked })} className="rounded accent-emerald-600" />
                  Publikasikan soal
                </label>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={handleAddSoal} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Soal
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #22: Edit Soal Modal */}
      {editSoal && (
        <ModalOverlay onClose={() => setEditSoal(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edit Soal</h2>
            <button onClick={() => setEditSoal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mata Pelajaran</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editSoalForm.mataPelajaranId} onChange={(e) => setEditSoalForm({ ...editSoalForm, mataPelajaranId: e.target.value })}>
                  {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipe Soal</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editSoalForm.tipeSoal} onChange={(e) => setEditSoalForm({ ...editSoalForm, tipeSoal: e.target.value })}>
                  <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                  <option value="ESSAY">Essay</option>
                  <option value="BENAR_SALAH">Benar/Salah</option>
                  <option value="JAWABAN_SINGKAT">Jawaban Singkat</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tingkat Kesulitan</label>
              <div className="flex gap-2">
                {(['MUDAH', 'SEDANG', 'SULIT'] as const).map((d) => (
                  <button key={d} onClick={() => setEditSoalForm({ ...editSoalForm, tingkatKesulitan: d })} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    editSoalForm.tingkatKesulitan === d ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>{d === 'MUDAH' ? 'Mudah' : d === 'SEDANG' ? 'Sedang' : 'Sulit'}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pertanyaan</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[100px]" value={editSoalForm.pertanyaan} onChange={(e) => setEditSoalForm({ ...editSoalForm, pertanyaan: e.target.value })} />
            </div>
            {editSoalForm.tipeSoal === 'PILIHAN_GANDA' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Opsi Jawaban</label>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <input type="radio" name="correct-edit" checked={editSoalForm.jawabanBenar === opt} onChange={() => setEditSoalForm({ ...editSoalForm, jawabanBenar: opt })} className="accent-emerald-600" />
                    <span className="text-sm font-semibold text-gray-700 w-6">Opsi {opt}:</span>
                    <Input className="flex-1 h-9" value={editSoalForm[`opsi${opt}` as keyof typeof editSoalForm] as string} onChange={(e) => setEditSoalForm({ ...editSoalForm, [`opsi${opt}`]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pembahasan</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]" value={editSoalForm.pembahasan} onChange={(e) => setEditSoalForm({ ...editSoalForm, pembahasan: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Poin</label>
                <Input type="number" value={editSoalForm.poin} onChange={(e) => setEditSoalForm({ ...editSoalForm, poin: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={editSoalForm.isPublic} onChange={(e) => setEditSoalForm({ ...editSoalForm, isPublic: e.target.checked })} className="rounded accent-emerald-600" />
                  Publikasikan soal
                </label>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditSoal(null)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={handleSaveEditSoal} disabled={editSaving}>
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== BUAT UJIAN (FULLY FUNCTIONAL 5-STEP WIZARD) ====================
function BuatUjian({ token }: { token: string | null }) {
  const [exams, setExams] = useState<ApiExam[]>([])
  const [mapelList, setMapelList] = useState<ApiMapel[]>([])
  const [kelasList, setKelasList] = useState<ApiKelas[]>([])
  const [soalList, setSoalList] = useState<ApiBankSoal[]>([])
  const [loading, setLoading] = useState(true)
  const [examList, setExamList] = useState(true)
  const [step, setStep] = useState(1)

  // FIX #23: Full wizard state management
  const [wizardData, setWizardData] = useState({
    judul: '', deskripsi: '', mataPelajaranId: '', tipeExam: 'UTS',
    durasi: 90, token: '', tanggalMulai: '', tanggalSelesai: '',
    acakSoal: true, acakOpsi: true, showResult: false, antiCheat: true,
    passingGrade: 75, maxAttempt: 1,
    selectedSoalIds: [] as string[],
    selectedKelasIds: [] as string[],
  })
  const [publishing, setPublishing] = useState(false)

  // FIX #24-25: Edit/View exam state
  const [viewExam, setViewExam] = useState<ApiExam | null>(null)
  const [editExamId, setEditExamId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [examsRes, mapelRes, kelasRes, soalRes] = await Promise.all([
          apiFetch('/api/v1/guru/exams?limit=50', token),
          apiFetch('/api/v1/admin/mata-pelajaran?limit=50', token),
          apiFetch('/api/v1/admin/kelas?limit=50', token),
          apiFetch('/api/v1/guru/bank-soal?limit=50', token),
        ])
        if (examsRes.success) setExams(examsRes.data?.data || [])
        if (mapelRes.success) setMapelList(mapelRes.data?.data || [])
        if (kelasRes.success) setKelasList(kelasRes.data?.data || [])
        if (soalRes.success) setSoalList(soalRes.data?.data || [])
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const fetchExams = async () => {
    try {
      const res = await apiFetch('/api/v1/guru/exams?limit=50', token)
      if (res.success) setExams(res.data?.data || [])
    } catch { /* */ }
  }

  if (loading) return <LoadingSkeleton />

  // FIX #24: Edit exam - open wizard pre-filled
  const handleEditExam = (exam: ApiExam) => {
    setEditExamId(exam.id)
    setWizardData({
      judul: exam.judul, deskripsi: exam.deskripsi || '', mataPelajaranId: exam.mataPelajaranId,
      tipeExam: exam.tipeExam, durasi: exam.durasi, token: exam.token || '',
      tanggalMulai: '', tanggalSelesai: '',
      acakSoal: exam.acakSoal, acakOpsi: exam.acakOpsi, showResult: exam.showResult, antiCheat: exam.antiCheat,
      passingGrade: 75, maxAttempt: 1,
      selectedSoalIds: [], selectedKelasIds: exam.examKelas?.map(ek => ek.kelas.id) || [],
    })
    setExamList(false)
    setStep(1)
  }

  // FIX #23: Publish exam handler
  const handlePublishExam = async () => {
    if (!wizardData.judul || !wizardData.mataPelajaranId || !wizardData.durasi || !wizardData.tanggalMulai || !wizardData.tanggalSelesai) {
      toast({ title: 'Data Belum Lengkap', description: 'Mohon lengkapi semua field wajib (Judul, Mata Pelajaran, Durasi, Tanggal Mulai & Selesai)', variant: 'destructive' })
      return
    }
    try {
      setPublishing(true)
      const res = await apiFetch('/api/v1/exams', token, {
        method: 'POST',
        body: JSON.stringify({
          judul: wizardData.judul,
          deskripsi: wizardData.deskripsi,
          mataPelajaranId: wizardData.mataPelajaranId,
          tipeExam: wizardData.tipeExam,
          durasi: wizardData.durasi,
          token: wizardData.token || undefined,
          tanggalMulai: wizardData.tanggalMulai,
          tanggalSelesai: wizardData.tanggalSelesai,
          acakSoal: wizardData.acakSoal,
          acakOpsi: wizardData.acakOpsi,
          showResult: wizardData.showResult,
          antiCheat: wizardData.antiCheat,
          maxAttempt: wizardData.maxAttempt,
          passingGrade: wizardData.passingGrade,
          kelasIds: wizardData.selectedKelasIds,
          bankSoalIds: wizardData.selectedSoalIds,
        }),
      })
      if (res.success) {
        setExamList(true)
        setStep(1)
        setEditExamId(null)
        setWizardData({
          judul: '', deskripsi: '', mataPelajaranId: '', tipeExam: 'UTS',
          durasi: 90, token: '', tanggalMulai: '', tanggalSelesai: '',
          acakSoal: true, acakOpsi: true, showResult: false, antiCheat: true,
          passingGrade: 75, maxAttempt: 1, selectedSoalIds: [], selectedKelasIds: [],
        })
        fetchExams()
        toast({ title: 'Berhasil!', description: 'Ujian berhasil dibuat!' })
      } else {
        toast({ title: 'Gagal', description: res.error?.message || 'Gagal membuat ujian', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Gagal', description: 'Gagal membuat ujian', variant: 'destructive' })
    } finally {
      setPublishing(false)
    }
  }

  const toggleSoalSelection = (id: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedSoalIds: prev.selectedSoalIds.includes(id)
        ? prev.selectedSoalIds.filter(sid => sid !== id)
        : [...prev.selectedSoalIds, id]
    }))
  }

  const toggleKelasSelection = (id: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedKelasIds: prev.selectedKelasIds.includes(id)
        ? prev.selectedKelasIds.filter(kid => kid !== id)
        : [...prev.selectedKelasIds, id]
    }))
  }

  if (examList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Daftar Ujian</h2>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={() => {
            setEditExamId(null)
            setWizardData({
              judul: '', deskripsi: '', mataPelajaranId: '', tipeExam: 'UTS',
              durasi: 90, token: '', tanggalMulai: '', tanggalSelesai: '',
              acakSoal: true, acakOpsi: true, showResult: false, antiCheat: true,
              passingGrade: 75, maxAttempt: 1, selectedSoalIds: [], selectedKelasIds: [],
            })
            setExamList(false)
          }}>
            <Plus className="w-4 h-4 mr-2" />Buat Ujian Baru
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {exams.length === 0 ? (
            <EmptyState message="Belum ada ujian" icon={FileText} />
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow shadow-sm border-gray-100">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{exam.judul}</h3>
                        <Badge className={`${getStatusColor(exam.status)} font-semibold border-0`}>
                          {exam.status === 'ONGOING' ? 'Berlangsung' : exam.status === 'PUBLISHED' ? 'Terbit' : exam.status === 'SELESAI' ? 'Selesai' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{exam.deskripsi || '-'}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gray-400" />{exam.mataPelajaran?.nama || '-'}</span>
                        <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5 text-gray-400" />{exam.durasi} menit</span>
                        <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-gray-400" />{exam._count?.examSoal ?? 0} soal</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" />{exam._count?.participants ?? 0} peserta</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {exam.acakSoal && <span className="flex items-center gap-1 text-xs text-gray-500 font-medium"><Shuffle className="w-3 h-3" />Acak Soal</span>}
                        {exam.acakOpsi && <span className="flex items-center gap-1 text-xs text-gray-500 font-medium"><Shuffle className="w-3 h-3" />Acak Opsi</span>}
                        {exam.antiCheat && <span className="flex items-center gap-1 text-xs text-gray-500 font-medium"><Lock className="w-3 h-3" />Anti-Cheat</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {/* FIX #24: Edit button */}
                      <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={() => handleEditExam(exam)}><Edit className="w-4 h-4" /></Button>
                      {/* FIX #25: View button */}
                      <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={() => setViewExam(exam)}><Eye className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* FIX #25: View Exam Detail Dialog */}
        {viewExam && (
          <ModalOverlay onClose={() => setViewExam(null)}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Detail Ujian</h2>
              <button onClick={() => setViewExam(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{viewExam.judul}</h3>
                <Badge className={`${getStatusColor(viewExam.status)} font-semibold border-0`}>
                  {viewExam.status === 'ONGOING' ? 'Berlangsung' : viewExam.status === 'PUBLISHED' ? 'Terbit' : viewExam.status === 'SELESAI' ? 'Selesai' : 'Draft'}
                </Badge>
              </div>
              {viewExam.deskripsi && <p className="text-sm text-gray-600">{viewExam.deskripsi}</p>}
              {[
                { label: 'Mata Pelajaran', value: viewExam.mataPelajaran?.nama || '-' },
                { label: 'Tipe Ujian', value: viewExam.tipeExam },
                { label: 'Durasi', value: `${viewExam.durasi} menit` },
                { label: 'Jumlah Soal', value: String(viewExam._count?.examSoal ?? 0) },
                { label: 'Jumlah Peserta', value: String(viewExam._count?.participants ?? 0) },
                { label: 'Token', value: viewExam.token || '-' },
                { label: 'Acak Soal', value: viewExam.acakSoal ? 'Ya' : 'Tidak' },
                { label: 'Acak Opsi', value: viewExam.acakOpsi ? 'Ya' : 'Tidak' },
                { label: 'Tampilkan Hasil', value: viewExam.showResult ? 'Ya' : 'Tidak' },
                { label: 'Anti-Cheat', value: viewExam.antiCheat ? 'Ya' : 'Tidak' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
              {viewExam.examKelas && viewExam.examKelas.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Kelas:</p>
                  <div className="flex flex-wrap gap-2">
                    {viewExam.examKelas.map(ek => (
                      <Badge key={ek.kelas.id} variant="outline" className="font-semibold">{ek.kelas.nama}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <Button variant="outline" onClick={() => setViewExam(null)} className="text-gray-700 border-gray-200">Tutup</Button>
            </div>
          </ModalOverlay>
        )}
      </div>
    )
  }

  const steps = [
    { num: 1, label: 'Info Dasar', icon: FileText },
    { num: 2, label: 'Pilih Soal', icon: BookOpen },
    { num: 3, label: 'Pengaturan', icon: Settings },
    { num: 4, label: 'Assign Kelas', icon: Users },
    { num: 5, label: 'Review', icon: CheckCircle },
  ]

  const selectedMapel = mapelList.find(m => m.id === wizardData.mataPelajaranId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <button onClick={() => setStep(s.num)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${step === s.num ? 'bg-emerald-50 text-emerald-700 shadow-sm' : step > s.num ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s.num ? 'bg-emerald-600 text-white' : step > s.num ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {/* FIX #23: Step 1 - Info Dasar (fully controlled) */}
          {step === 1 && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editExamId ? 'Edit' : ''} Informasi Dasar Ujian</h2>
              <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Judul Ujian *</label><Input placeholder="Contoh: UTS Matematika Kelas XI IPA" className="h-10" value={wizardData.judul} onChange={(e) => setWizardData({ ...wizardData, judul: e.target.value })} /></div>
              <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Deskripsi</label><textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px] focus:border-emerald-400 focus:ring-emerald-400/20" placeholder="Deskripsi ujian..." value={wizardData.deskripsi} onChange={(e) => setWizardData({ ...wizardData, deskripsi: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mata Pelajaran *</label>
                  <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={wizardData.mataPelajaranId} onChange={(e) => setWizardData({ ...wizardData, mataPelajaranId: e.target.value })}>
                    <option value="">Pilih Mapel</option>
                    {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipe Ujian</label>
                  <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={wizardData.tipeExam} onChange={(e) => setWizardData({ ...wizardData, tipeExam: e.target.value })}>
                    <option value="UTS">UTS</option><option value="UAS">UAS</option><option value="QUIZ">QUIZ</option><option value="TUGAS">TUGAS</option><option value="TRYOUT">TRYOUT</option><option value="PRAKTIKUM">PRAKTIKUM</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Durasi (menit) *</label><Input type="number" className="h-10" value={wizardData.durasi} onChange={(e) => setWizardData({ ...wizardData, durasi: parseInt(e.target.value) || 90 })} /></div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Token Ujian</label><Input placeholder="Opsional" className="h-10" value={wizardData.token} onChange={(e) => setWizardData({ ...wizardData, token: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tanggal Mulai *</label><Input type="datetime-local" className="h-10" value={wizardData.tanggalMulai} onChange={(e) => setWizardData({ ...wizardData, tanggalMulai: e.target.value })} /></div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tanggal Selesai *</label><Input type="datetime-local" className="h-10" value={wizardData.tanggalSelesai} onChange={(e) => setWizardData({ ...wizardData, tanggalSelesai: e.target.value })} /></div>
              </div>
            </div>
          )}

          {/* FIX #23: Step 2 - Pilih Soal (with checkboxes tracking) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pilih Soal dari Bank Soal</h2>
                <Badge variant="outline" className="font-semibold">{wizardData.selectedSoalIds.length} soal dipilih</Badge>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {soalList.length === 0 ? (
                  <EmptyState message="Belum ada soal di bank soal" icon={BookOpen} />
                ) : (
                  soalList.map((soal) => (
                    <div key={soal.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${wizardData.selectedSoalIds.includes(soal.id) ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 hover:bg-emerald-50/30'}`} onClick={() => toggleSoalSelection(soal.id)}>
                      <input type="checkbox" className="mt-1 accent-emerald-600 w-4 h-4" checked={wizardData.selectedSoalIds.includes(soal.id)} onChange={() => toggleSoalSelection(soal.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium line-clamp-2">{soal.pertanyaan}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-xs font-semibold text-gray-700 border-gray-200">{soal.mataPelajaran?.nama || '-'}</Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getDifficultyColor(soal.tingkatKesulitan)}`}>{soal.tingkatKesulitan}</span>
                          <span className="text-xs font-semibold text-gray-500">Poin: {soal.poin}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FIX #23: Step 3 - Pengaturan (controlled toggles) */}
          {step === 3 && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pengaturan Ujian</h2>
              {[
                { key: 'acakSoal' as const, label: 'Acak Urutan Soal', desc: 'Soal akan ditampilkan dalam urutan acak untuk setiap siswa', icon: Shuffle },
                { key: 'acakOpsi' as const, label: 'Acak Opsi Jawaban', desc: 'Opsi jawaban pilihan ganda akan diacak', icon: Shuffle },
                { key: 'antiCheat' as const, label: 'Anti-Cheat', desc: 'Aktifkan deteksi tab switch, copy-paste, dan face detection', icon: Lock },
                { key: 'showResult' as const, label: 'Tampilkan Hasil Langsung', desc: 'Siswa dapat melihat nilai setelah selesai', icon: Eye },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center"><setting.icon className="w-5 h-5 text-gray-600" /></div>
                    <div><p className="text-sm font-semibold text-gray-900">{setting.label}</p><p className="text-xs text-gray-500">{setting.desc}</p></div>
                  </div>
                  <input type="checkbox" checked={wizardData[setting.key]} onChange={(e) => setWizardData({ ...wizardData, [setting.key]: e.target.checked })} className="accent-emerald-600 w-5 h-5" />
                </div>
              ))}
              <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Passing Grade (%)</label><Input type="number" className="w-32 h-10" value={wizardData.passingGrade} onChange={(e) => setWizardData({ ...wizardData, passingGrade: parseInt(e.target.value) || 75 })} /></div>
              <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Maksimum Percobaan</label><Input type="number" className="w-32 h-10" value={wizardData.maxAttempt} onChange={(e) => setWizardData({ ...wizardData, maxAttempt: parseInt(e.target.value) || 1 })} /></div>
            </div>
          )}

          {/* FIX #23: Step 4 - Assign Kelas (with checkboxes tracking) */}
          {step === 4 && (
            <div className="space-y-5 max-w-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Assign ke Kelas</h2>
                <Badge variant="outline" className="font-semibold">{wizardData.selectedKelasIds.length} kelas dipilih</Badge>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-4">Pilih kelas yang akan mengerjakan ujian ini</p>
              {kelasList.length === 0 ? (
                <EmptyState message="Belum ada data kelas" icon={Users} />
              ) : (
                kelasList.map((kelas) => (
                  <label key={kelas.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${wizardData.selectedKelasIds.includes(kelas.id) ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 hover:bg-emerald-50/30'}`}>
                    <input type="checkbox" className="accent-emerald-600 w-5 h-5" checked={wizardData.selectedKelasIds.includes(kelas.id)} onChange={() => toggleKelasSelection(kelas.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{kelas.nama}</p>
                      <p className="text-xs text-gray-500">Wali Kelas: {kelas.waliKelas?.name || '-'} · {kelas._count?.siswaKelas ?? 0} siswa</p>
                    </div>
                    <Badge variant="outline" className="font-semibold text-gray-700">{kelas._count?.siswaKelas ?? 0} siswa</Badge>
                  </label>
                ))
              )}
            </div>
          )}

          {/* FIX #23: Step 5 - Review & Publish */}
          {step === 5 && (
            <div className="space-y-5 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Review & Publikasi</h2>
              <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="font-bold text-emerald-800">Ujian siap dipublikasikan</span></div>
                  <p className="text-sm text-emerald-700 font-medium">Pastikan semua pengaturan sudah benar sebelum mempublikasikan ujian.</p>
                </CardContent>
              </Card>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Informasi Ujian</h3>
                {[
                  { label: 'Judul', value: wizardData.judul || '-' },
                  { label: 'Deskripsi', value: wizardData.deskripsi || '-' },
                  { label: 'Mata Pelajaran', value: selectedMapel?.nama || '-' },
                  { label: 'Tipe', value: wizardData.tipeExam },
                  { label: 'Durasi', value: `${wizardData.durasi} menit` },
                  { label: 'Token', value: wizardData.token || '-' },
                  { label: 'Tanggal Mulai', value: wizardData.tanggalMulai ? new Date(wizardData.tanggalMulai).toLocaleString('id-ID') : '-' },
                  { label: 'Tanggal Selesai', value: wizardData.tanggalSelesai ? new Date(wizardData.tanggalSelesai).toLocaleString('id-ID') : '-' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 mt-3">
                  {wizardData.acakSoal && <Badge variant="outline" className="font-semibold"><Shuffle className="w-3 h-3 mr-1" />Acak Soal</Badge>}
                  {wizardData.acakOpsi && <Badge variant="outline" className="font-semibold"><Shuffle className="w-3 h-3 mr-1" />Acak Opsi</Badge>}
                  {wizardData.antiCheat && <Badge variant="outline" className="font-semibold"><Lock className="w-3 h-3 mr-1" />Anti-Cheat</Badge>}
                  {wizardData.showResult && <Badge variant="outline" className="font-semibold"><Eye className="w-3 h-3 mr-1" />Tampilkan Hasil</Badge>}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Soal: {wizardData.selectedSoalIds.length} dipilih</p>
                  <p className="text-sm font-semibold text-gray-700">Kelas: {wizardData.selectedKelasIds.length} dipilih ({kelasList.filter(k => wizardData.selectedKelasIds.includes(k.id)).map(k => k.nama).join(', ') || '-'})</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setExamList(true)} className="text-gray-700 border-gray-200">
              <ArrowLeft className="w-4 h-4 mr-2" />{step > 1 ? 'Sebelumnya' : 'Kembali'}
            </Button>
            {step < 5 ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={() => setStep(step + 1)}>Selanjutnya <ArrowRight className="w-4 h-4 ml-2" /></Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={handlePublishExam} disabled={publishing}>
                {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Publikasikan Ujian
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== HASIL UJIAN ====================
function HasilUjian({ token }: { token: string | null }) {
  const [results, setResults] = useState<ApiResult[]>([])
  const [exams, setExams] = useState<ApiExam[]>([])
  const [loading, setLoading] = useState(true)
  const [filterExam, setFilterExam] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailResult, setDetailResult] = useState<ApiResult | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [resultsRes, examsRes] = await Promise.all([
          apiFetch('/api/v1/guru/results?limit=50', token),
          apiFetch('/api/v1/guru/exams?limit=50', token),
        ])
        if (resultsRes.success) setResults(resultsRes.data?.data || [])
        if (examsRes.success) setExams(examsRes.data?.data || [])
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // Apply filters
  const filteredResults = results.filter(r => {
    if (filterExam !== 'all' && r.examId !== filterExam) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  const handleExportResults = () => {
    const data = filteredResults.map(r => ({
      Siswa: r.siswa?.name || '-',
      'NIP/NIS': r.siswa?.nipNis || '-',
      Ujian: r.exam?.judul || '-',
      'Nilai PG': r.nilai !== null ? r.nilai.toFixed(1) : '-',
      'Nilai Essay': r.nilaiEssay !== null ? r.nilaiEssay.toFixed(1) : '-',
      'Total Nilai': r.totalNilai !== null ? r.totalNilai.toFixed(1) : '-',
      Durasi: r.durasi ? formatDuration(r.durasi) : '-',
      Status: r.status,
    }))
    if (data.length === 0) {
      toast({ title: 'Tidak Ada Data', description: 'Tidak ada data hasil ujian untuk diekspor', variant: 'destructive' })
      return
    }
    exportToCSV(data, 'hasil-ujian')
    toast({ title: 'Berhasil', description: 'Data hasil ujian berhasil diekspor ke CSV' })
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>
          <option value="all">Semua Ujian</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.judul}</option>)}
        </select>
        <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="SELESAI">Selesai</option>
          <option value="TIMEOUT">Waktu Habis</option>
          <option value="DISKUALIFIKASI">Diskualifikasi</option>
        </select>
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-200 ml-auto" onClick={handleExportResults}>
          <Download className="w-4 h-4 mr-2" />Ekspor ke CSV
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base font-semibold text-gray-900">Distribusi Nilai</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gradeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                {gradeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Siswa</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Ujian</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nilai PG</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nilai Essay</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Total Nilai</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Durasi</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState message="Belum ada hasil ujian" icon={ClipboardCheck} /></td></tr>
                ) : (
                  filteredResults.map((result, i) => (
                    <tr key={result.id} className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {result.siswa?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                          </div>
                          <span className="font-semibold text-gray-900">{result.siswa?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{result.exam?.judul || '-'}</td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{result.nilai !== null ? result.nilai.toFixed(1) : '-'}</td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{result.nilaiEssay !== null ? result.nilaiEssay.toFixed(1) : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${(result.totalNilai ?? 0) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {result.totalNilai !== null ? result.totalNilai.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{result.durasi ? formatDuration(result.durasi) : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(result.status)}`}>
                          {result.status === 'SELESAI' ? 'Selesai' : result.status === 'TIMEOUT' ? 'Waktu Habis' : result.status === 'DISKUALIFIKASI' ? 'Diskualifikasi' : result.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setDetailResult(result)}>
                          <Eye className="w-4 h-4 mr-1" />Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Hasil Ujian Modal */}
      {detailResult && (
        <ModalOverlay onClose={() => setDetailResult(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Detail Hasil Ujian</h2>
            <button onClick={() => setDetailResult(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {detailResult.siswa?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailResult.siswa?.name || '-'}</h3>
                <p className="text-sm text-gray-500">{detailResult.siswa?.email || '-'} · NIP/NIS: {detailResult.siswa?.nipNis || '-'}</p>
              </div>
            </div>
            <div className={`p-4 rounded-xl border-2 ${(detailResult.totalNilai ?? 0) >= 75 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl ${(detailResult.totalNilai ?? 0) >= 75 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  {detailResult.totalNilai !== null ? detailResult.totalNilai.toFixed(0) : '-'}
                </div>
                <div>
                  <p className={`text-lg font-bold ${(detailResult.totalNilai ?? 0) >= 75 ? 'text-emerald-800' : 'text-red-800'}`}>
                    {(detailResult.totalNilai ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus'}
                  </p>
                  <p className="text-sm text-gray-600">Total Nilai</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold text-violet-700">{detailResult.nilai !== null ? detailResult.nilai.toFixed(1) : '-'}</p>
                  <p className="text-xs font-semibold text-gray-500">Nilai Pilihan Ganda</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold text-amber-700">{detailResult.nilaiEssay !== null ? detailResult.nilaiEssay.toFixed(1) : '-'}</p>
                  <p className="text-xs font-semibold text-gray-500">Nilai Essay</p>
                </CardContent>
              </Card>
            </div>
            {[
              { label: 'Ujian', value: detailResult.exam?.judul || '-' },
              { label: 'Mata Pelajaran', value: detailResult.exam?.mataPelajaran?.nama || '-' },
              { label: 'Tipe Ujian', value: detailResult.exam?.tipeExam || '-' },
              { label: 'Durasi Pengerjaan', value: detailResult.durasi ? formatDuration(detailResult.durasi) : '-' },
              { label: 'Percobaan ke-', value: String(detailResult.attempt) },
              { label: 'Status Pengerjaan', value: detailResult.status === 'SELESAI' ? 'Selesai' : detailResult.status === 'TIMEOUT' ? 'Waktu Habis' : detailResult.status === 'DISKUALIFIKASI' ? 'Diskualifikasi' : detailResult.status },
              { label: 'Mulai Pada', value: detailResult.mulaiPada ? new Date(detailResult.mulaiPada).toLocaleString('id-ID') : '-' },
              { label: 'Selesai Pada', value: detailResult.selesaiPada ? new Date(detailResult.selesaiPada).toLocaleString('id-ID') : '-' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setDetailResult(null)} className="text-gray-700 border-gray-200">Tutup</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== NILAI & RAPOR ====================
function NilaiRapor({ token }: { token: string | null }) {
  const [results, setResults] = useState<ApiResult[]>([])
  const [exams, setExams] = useState<ApiExam[]>([])
  const [loading, setLoading] = useState(true)
  const [filterExam, setFilterExam] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailResult, setDetailResult] = useState<ApiResult | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [resultsRes, examsRes] = await Promise.all([
          apiFetch('/api/v1/guru/results?limit=100', token),
          apiFetch('/api/v1/guru/exams?limit=50', token),
        ])
        if (resultsRes.success) setResults(resultsRes.data?.data || [])
        if (examsRes.success) setExams(examsRes.data?.data || [])
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const handleExportNilai = () => {
    const data = filteredResults.map(r => ({
      Siswa: r.siswa?.name || '-',
      'NIP/NIS': r.siswa?.nipNis || '-',
      Ujian: r.exam?.judul || '-',
      'Mata Pelajaran': r.exam?.mataPelajaran?.nama || '-',
      'Nilai PG': r.nilai !== null ? r.nilai.toFixed(1) : '-',
      'Nilai Essay': r.nilaiEssay !== null ? r.nilaiEssay.toFixed(1) : '-',
      'Total Nilai': r.totalNilai !== null ? r.totalNilai.toFixed(1) : '-',
      Durasi: r.durasi ? formatDuration(r.durasi) : '-',
      Status: (r.totalNilai ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus',
    }))
    if (data.length === 0) {
      toast({ title: 'Tidak Ada Data', description: 'Tidak ada data nilai untuk diekspor', variant: 'destructive' })
      return
    }
    exportToCSV(data, 'rekap-nilai')
    toast({ title: 'Berhasil', description: 'Data nilai berhasil diekspor ke CSV' })
  }

  if (loading) return <LoadingSkeleton />

  // Apply filters
  const filteredResults = results.filter(r => {
    if (filterExam !== 'all' && r.examId !== filterExam) return false
    if (filterStatus === 'lulus' && (r.totalNilai ?? 0) < 75) return false
    if (filterStatus === 'tidak_lulus' && (r.totalNilai ?? 0) >= 75) return false
    return true
  })

  const totalResults = filteredResults.filter(r => r.totalNilai !== null)
  const avgScore = totalResults.length > 0 ? totalResults.reduce((sum, r) => sum + (r.totalNilai ?? 0), 0) / totalResults.length : 0
  const passingRate = totalResults.length > 0 ? (totalResults.filter(r => (r.totalNilai ?? 0) >= 75).length / totalResults.length) * 100 : 0
  const highestScore = totalResults.length > 0 ? Math.max(...totalResults.map(r => r.totalNilai ?? 0)) : 0
  const lowestScore = totalResults.length > 0 ? Math.min(...totalResults.map(r => r.totalNilai ?? 0)) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rata-rata Nilai', value: avgScore.toFixed(1), icon: BarChart3, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Passing Rate', value: `${passingRate.toFixed(0)}%`, icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
          { label: 'Nilai Tertinggi', value: highestScore.toFixed(1), icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Nilai Terendah', value: lowestScore.toFixed(1), icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>
          <option value="all">Semua Ujian</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.judul}</option>)}
        </select>
        <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="lulus">Lulus</option>
          <option value="tidak_lulus">Tidak Lulus</option>
        </select>
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-200 ml-auto" onClick={handleExportNilai}>
          <Download className="w-4 h-4 mr-2" />Ekspor Nilai
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base font-semibold text-gray-900">Rekap Nilai Siswa</CardTitle></CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <EmptyState message="Belum ada data nilai" icon={Award} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Siswa</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Ujian</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nilai</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, i) => (
                    <tr key={result.id} className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{result.siswa?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{result.exam?.judul || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${(result.totalNilai ?? 0) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {result.totalNilai !== null ? result.totalNilai.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${(result.totalNilai ?? 0) >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {(result.totalNilai ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setDetailResult(result)}>
                          <Eye className="w-4 h-4 mr-1" />Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Nilai Modal */}
      {detailResult && (
        <ModalOverlay onClose={() => setDetailResult(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Detail Nilai Siswa</h2>
            <button onClick={() => setDetailResult(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {detailResult.siswa?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailResult.siswa?.name || '-'}</h3>
                <p className="text-sm text-gray-500">NIP/NIS: {detailResult.siswa?.nipNis || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{detailResult.totalNilai !== null ? detailResult.totalNilai.toFixed(1) : '-'}</p>
                  <p className="text-xs font-semibold text-emerald-600">Total Nilai</p>
                </CardContent>
              </Card>
              <Card className="bg-violet-50 border-violet-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-violet-700">{detailResult.nilai !== null ? detailResult.nilai.toFixed(1) : '-'}</p>
                  <p className="text-xs font-semibold text-violet-600">Nilai PG</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{detailResult.nilaiEssay !== null ? detailResult.nilaiEssay.toFixed(1) : '-'}</p>
                  <p className="text-xs font-semibold text-amber-600">Nilai Essay</p>
                </CardContent>
              </Card>
            </div>
            {[
              { label: 'Ujian', value: detailResult.exam?.judul || '-' },
              { label: 'Mata Pelajaran', value: detailResult.exam?.mataPelajaran?.nama || '-' },
              { label: 'Tipe Ujian', value: detailResult.exam?.tipeExam || '-' },
              { label: 'Durasi Pengerjaan', value: detailResult.durasi ? formatDuration(detailResult.durasi) : '-' },
              { label: 'Percobaan ke-', value: String(detailResult.attempt) },
              { label: 'Status', value: detailResult.status === 'SELESAI' ? 'Selesai' : detailResult.status === 'TIMEOUT' ? 'Waktu Habis' : detailResult.status },
              { label: 'Kelulusan', value: (detailResult.totalNilai ?? 0) >= 75 ? 'Lulus' : 'Tidak Lulus' },
              { label: 'Mulai Pada', value: detailResult.mulaiPada ? new Date(detailResult.mulaiPada).toLocaleString('id-ID') : '-' },
              { label: 'Selesai Pada', value: detailResult.selesaiPada ? new Date(detailResult.selesaiPada).toLocaleString('id-ID') : '-' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setDetailResult(null)} className="text-gray-700 border-gray-200">Tutup</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== PROFIL & PENGATURAN ====================
function ProfilPengaturan({ user, token }: { user: { id: string; name: string; email: string; role: string; avatar?: string } | null; token: string | null }) {
  const [activeSection, setActiveSection] = useState<'profil' | 'pengaturan'>('profil')
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [settings, setSettings] = useState({
    emailNotif: true,
    examReminder: true,
    violationAlert: true,
    resultPublished: true,
    darkMode: false,
    language: 'id',
  })

  const handleSaveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast({ title: 'Gagal', description: 'Kata sandi baru tidak cocok', variant: 'destructive' })
      return
    }
    try {
      setSaving(true)
      const res = await apiFetch('/api/v1/user/profile', token, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined,
        }),
      })
      if (res.success) {
        toast({ title: 'Berhasil', description: 'Profil berhasil diperbarui' })
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      } else {
        toast({ title: 'Gagal', description: res.error?.message || 'Gagal memperbarui profil', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan saat menyimpan profil', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = () => {
    toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Header */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SN'}
            </div>
          </div>
        </div>
        <CardContent className="pt-14 pb-5 px-6">
          <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Guru'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email || ''}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge className="bg-emerald-100 text-emerald-700 font-semibold border-0">Guru</Badge>
            <span className="text-xs text-gray-500">Bergabung sejak 2024</span>
          </div>
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveSection('profil')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === 'profil' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Profil Saya
        </button>
        <button onClick={() => setActiveSection('pengaturan')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === 'pengaturan' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Pengaturan
        </button>
      </div>

      {activeSection === 'profil' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Informasi Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Lengkap</label>
              <Input className="h-10" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
              <Input className="h-10" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nomor Telepon</label>
              <Input className="h-10" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Ubah Kata Sandi</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kata Sandi Saat Ini</label>
                  <Input className="h-10" type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })} placeholder="Masukkan kata sandi saat ini" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kata Sandi Baru</label>
                    <Input className="h-10" type="password" value={profileForm.newPassword} onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })} placeholder="Kata sandi baru" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Konfirmasi Kata Sandi</label>
                    <Input className="h-10" type="password" value={profileForm.confirmPassword} onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} placeholder="Ulangi kata sandi baru" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'pengaturan' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Pengaturan Notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'emailNotif' as const, label: 'Notifikasi Email', desc: 'Terima pemberitahuan melalui email untuk aktivitas penting' },
              { key: 'examReminder' as const, label: 'Pengingat Ujian', desc: 'Dapatkan pengingat sebelum ujian dimulai' },
              { key: 'violationAlert' as const, label: 'Peringatan Pelanggaran', desc: 'Notifikasi langsung saat terdeteksi pelanggaran ujian' },
              { key: 'resultPublished' as const, label: 'Hasil Ujian Dipublikasikan', desc: 'Notifikasi saat nilai ujian dipublikasikan' },
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{setting.label}</p>
                  <p className="text-xs text-gray-500">{setting.desc}</p>
                </div>
                <input type="checkbox" checked={settings[setting.key]} onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })} className="accent-emerald-600 w-5 h-5" />
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Pengaturan Tampilan</h3>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bahasa</p>
                  <p className="text-xs text-gray-500">Pilih bahasa tampilan aplikasi</p>
                </div>
                <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 font-medium" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200" onClick={handleSaveSettings}>
                <CheckCircle className="w-4 h-4 mr-2" />Simpan Pengaturan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
