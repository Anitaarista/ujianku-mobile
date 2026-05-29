'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, School, BookMarked, BarChart3, Settings,
  Bell, Search, LogOut, ChevronRight, Plus, Download,
  TrendingUp, TrendingDown, UserPlus, MoreVertical, Edit, Trash2,
  CheckCircle, XCircle, GraduationCap, FileText, Activity,
  Shield, Eye, Calendar, Building2, Loader2, AlertCircle, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  examActivityData, gradeDistributionData, subjectScoreData, participantTrendData,
  getStatusColor, getDifficultyColor
} from './mock-data'
import { exportToCSV } from '@/lib/csv-export'

type AdminTab = 'dashboard' | 'users' | 'sekolah' | 'mapel' | 'analytics' | 'settings'

interface AdminDashboardProps {
  onBack: () => void
  user?: { id: string; name: string; email: string; role: string; avatar?: string }
  token?: string | null
}

// API Types
interface ApiUser {
  id: string; email: string; name: string; role: string; nipNis: string | null; phone: string | null; isActive: boolean; avatar: string | null; createdAt: string; updatedAt: string
}

interface ApiSekolah {
  id: string; nama: string; alamat: string | null; npsn: string | null; logo: string | null; isActive: boolean; createdAt: string; _count: { kelas: number }
}

interface ApiKelas {
  id: string; nama: string; tingkat: number; tahunAjaran: string; sekolahId: string;
  sekolah: { id: string; nama: string; npsn: string | null }
  waliKelas: { id: string; name: string; nipNis: string | null } | null
  _count: { siswaKelas: number; examKelas: number; subjectTeachers: number }
}

interface ApiMapel {
  id: string; kode: string; nama: string; kkm: number; kelompok: string | null; createdAt: string;
  _count: { bankSoal: number; exams: number; guruSubjects: number }
}

interface ApiExam {
  id: string; judul: string; deskripsi: string | null; mataPelajaranId: string; guruId: string;
  durasi: number; tipeExam: string; token: string | null; status: string;
  mataPelajaran: { id: string; nama: string; kode: string }
  guru: { id: string; name: string }
  examKelas: { kelas: { id: string; nama: string; tingkat: number } }[]
  _count: { participants: number; examSoal: number }
}

interface AnalyticsData {
  users: { total: number; admin: number; guru: number; pengawas: number; siswa: number; active: number }
  academic: { sekolah: number; kelas: number; mataPelajaran: number }
  exams: { total: number; draft: number; published: number; ongoing: number; completed: number; participants: number }
  bankSoal: { total: number; byType: { type: string; count: number }[]; byDifficulty: { difficulty: string; count: number }[] }
}

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Manajemen User', icon: Users },
  { id: 'sekolah', label: 'Sekolah & Kelas', icon: School },
  { id: 'mapel', label: 'Mata Pelajaran', icon: BookMarked },
  { id: 'analytics', label: 'Laporan & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

export function AdminDashboard({ onBack, user, token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserPresetRole, setAddUserPresetRole] = useState('GURU')
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleQuickAction = (action: string) => {
    if (action === 'Tambah Guru Baru') {
      setAddUserPresetRole('GURU')
      setActiveTab('users')
      setTimeout(() => setShowAddUserModal(true), 100)
    } else if (action === 'Buat Ujian Baru') {
      alert('Fitur Buat Ujian tersedia di panel Guru')
    } else if (action === 'Lihat Laporan') {
      setActiveTab('analytics')
    } else if (action === 'Kelola Sekolah') {
      setActiveTab('sekolah')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">UjianKu</span>
              <span className="text-[10px] text-gray-400 block -mt-0.5 uppercase tracking-wider">Admin Panel</span>
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
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto text-violet-200" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'AF'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'Admin'}</p>
            </div>
            <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-900">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Cari..." className="pl-9 w-64 h-9 bg-gray-50 border-gray-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {/* FIX #5: Bell icon with dropdown */}
            <div className="relative" ref={notifRef}>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
                  </div>
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Belum ada notifikasi</p>
                    <p className="text-xs text-gray-400 mt-1">Notifikasi baru akan muncul di sini</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardOverview token={token ?? null} onQuickAction={handleQuickAction} />}
          {activeTab === 'users' && <UserManagement token={token ?? null} searchQuery={searchQuery} userFilter={userFilter} setUserFilter={setUserFilter} showAddModal={showAddUserModal} setShowAddModal={setShowAddUserModal} presetRole={addUserPresetRole} />}
          {activeTab === 'sekolah' && <SekolahKelas token={token ?? null} />}
          {activeTab === 'mapel' && <MataPelajaran token={token ?? null} />}
          {activeTab === 'analytics' && <Analytics token={token ?? null} />}
          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  )
}

// ==================== API HELPER ====================
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
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm text-gray-500 font-medium">Memuat data...</p>
      </div>
    </div>
  )
}

// ==================== ERROR STATE ====================
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-700 font-medium mb-1">Gagal Memuat Data</p>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="border-gray-300 text-gray-700">
            Coba Lagi
          </Button>
        )}
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

// ==================== MODAL OVERLAY (reusable) ====================
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ==================== DASHBOARD OVERVIEW ====================
function DashboardOverview({ token, onQuickAction }: { token: string | null; onQuickAction: (action: string) => void }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [exams, setExams] = useState<ApiExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [analyticsRes, examsRes] = await Promise.all([
        apiFetch('/api/v1/admin/analytics', token),
        apiFetch('/api/v1/exams?limit=5', token),
      ])
      if (analyticsRes.success) setAnalytics(analyticsRes.data)
      if (examsRes.success) setExams(examsRes.data?.data || [])
    } catch {
      setError('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  const stats = [
    { label: 'Total Siswa', value: analytics?.users.siswa ?? 0, trend: 'up' as const, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Total Guru', value: analytics?.users.guru ?? 0, trend: 'up' as const, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Total Ujian', value: analytics?.exams.total ?? 0, trend: 'up' as const, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Total Soal', value: analytics?.bankSoal.total ?? 0, trend: 'up' as const, icon: BookMarked, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`border ${stat.border} shadow-sm`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {stat.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
                      <span className="text-xs font-medium text-gray-500">Data real-time</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Aktivitas Ujian Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={examActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="ujian" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} name="Ujian" />
                <Line type="monotone" dataKey="peserta" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Peserta" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* FIX #1-4: Quick Actions with real functionality */}
            {[
              { label: 'Tambah Guru Baru', icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Buat Ujian Baru', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Lihat Laporan', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Kelola Sekolah', icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map((action) => (
              <button key={action.label} onClick={() => onQuickAction(action.label)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Status Ujian</p>
              <div className="space-y-2">
                {[
                  { label: 'Berlangsung', value: analytics?.exams.ongoing ?? 0, color: 'text-emerald-600' },
                  { label: 'Terbit', value: analytics?.exams.published ?? 0, color: 'text-blue-600' },
                  { label: 'Draft', value: analytics?.exams.draft ?? 0, color: 'text-amber-600' },
                  { label: 'Selesai', value: analytics?.exams.completed ?? 0, color: 'text-gray-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exams Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Ujian Terbaru</CardTitle>
            <Button variant="outline" size="sm" className="text-gray-600 border-gray-200">Lihat Semua</Button>
          </div>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <EmptyState message="Belum ada ujian" icon={FileText} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Judul Ujian</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Mata Pelajaran</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Guru</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Peserta</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, i) => (
                    <tr key={exam.id} className={`border-b border-gray-50 hover:bg-violet-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{exam.judul}</td>
                      <td className="py-3 px-4 text-gray-700">{exam.mataPelajaran?.nama || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{exam.guru?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{exam._count?.participants ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(exam.status)}`}>
                          {exam.status === 'ONGOING' ? 'Berlangsung' : exam.status === 'PUBLISHED' ? 'Terbit' : exam.status === 'SELESAI' ? 'Selesai' : exam.status === 'DRAFT' ? 'Draft' : exam.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== USER MANAGEMENT ====================
function UserManagement({ token, searchQuery, userFilter, setUserFilter, showAddModal, setShowAddModal, presetRole }: { token: string | null; searchQuery: string; userFilter: string; setUserFilter: (v: string) => void; showAddModal: boolean; setShowAddModal: (v: boolean) => void; presetRole: string }) {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: presetRole, nipNis: '', phone: '' })
  // FIX #7-8: Edit/View user state
  const [editUser, setEditUser] = useState<ApiUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', nipNis: '', phone: '', isActive: true })
  const [viewUser, setViewUser] = useState<ApiUser | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // Sync preset role when modal opens
  useEffect(() => {
    if (showAddModal) {
      setNewUser(prev => ({ ...prev, role: presetRole }))
    }
  }, [showAddModal, presetRole])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (userFilter !== 'all') params.set('role', userFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await apiFetch(`/api/v1/admin/users?${params}`, token)
      if (res.success) {
        setUsers(res.data?.data || [])
        setTotalUsers(res.data?.pagination?.total || 0)
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [token, page, userFilter, searchQuery])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) return
    try {
      setSaving(true)
      const res = await apiFetch('/api/v1/admin/users', token, {
        method: 'POST',
        body: JSON.stringify(newUser),
      })
      if (res.success) {
        setShowAddModal(false)
        setNewUser({ name: '', email: '', password: '', role: 'GURU', nipNis: '', phone: '' })
        fetchUsers()
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false)
    }
  }

  // FIX #7: Edit user handler
  const handleEditUser = (u: ApiUser) => {
    setEditUser(u)
    setEditForm({ name: u.name, email: u.email, role: u.role, nipNis: u.nipNis || '', phone: u.phone || '', isActive: u.isActive })
  }

  const handleSaveEditUser = async () => {
    if (!editUser) return
    try {
      setEditSaving(true)
      const res = await apiFetch(`/api/v1/admin/users/${editUser.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      if (res.success) {
        setEditUser(null)
        fetchUsers()
      }
    } catch {
      // silently handle
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return
    try {
      await apiFetch(`/api/v1/admin/users/${id}`, token, { method: 'DELETE' })
      fetchUsers()
    } catch {
      // silently handle
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/api/v1/admin/users/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      })
      fetchUsers()
    } catch {
      // silently handle
    }
  }

  // FIX #6: Export users to CSV
  const handleExportUsers = () => {
    const data = users.map(u => ({
      Nama: u.name,
      Email: u.email,
      'NIP/NIS': u.nipNis || '',
      Peran: u.role,
      Telepon: u.phone || '',
      Status: u.isActive ? 'Aktif' : 'Nonaktif',
      'Tanggal Daftar': new Date(u.createdAt).toLocaleDateString('id-ID'),
    }))
    exportToCSV(data, 'daftar-pengguna')
  }

  const totalPages = Math.ceil(totalUsers / 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'ADMIN', 'GURU', 'PENGAWAS', 'SISWA'].map((role) => (
            <button
              key={role}
              onClick={() => { setUserFilter(role); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                userFilter === role
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {role === 'all' ? 'Semua' : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* FIX #6: Export CSV */}
          <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={handleExportUsers}><Download className="w-4 h-4 mr-2" />Ekspor</Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200" onClick={() => { setNewUser({ name: '', email: '', password: '', role: 'GURU', nipNis: '', phone: '' }); setShowAddModal(true) }}>
            <Plus className="w-4 h-4 mr-2" />Tambah User
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nama</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">NIP/NIS</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Peran</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState message="Tidak ada data user" icon={Users} /></td></tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={u.id} className={`border-b border-gray-50 hover:bg-violet-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-semibold text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{u.email}</td>
                        <td className="py-3 px-4 text-gray-700 font-mono text-xs">{u.nipNis || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'GURU' ? 'bg-emerald-100 text-emerald-700' :
                            u.role === 'PENGAWAS' ? 'bg-amber-100 text-amber-700' :
                            'bg-sky-100 text-sky-700'
                          }`}>
                            {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleToggleActive(u.id, u.isActive)}>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {u.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {/* FIX #7: Edit button */}
                            <button onClick={() => handleEditUser(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit user"><Edit className="w-4 h-4 text-gray-500" /></button>
                            {/* FIX #8: View button */}
                            <button onClick={() => setViewUser(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Lihat detail"><Eye className="w-4 h-4 text-gray-500" /></button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">Menampilkan <span className="font-semibold text-gray-900">{users.length}</span> dari <span className="font-semibold text-gray-900">{totalUsers}</span> pengguna</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <span className="px-3 text-sm font-medium text-gray-900">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tambah User Baru</h2>
            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Nama Lengkap', value: newUser.name, key: 'name' as const, type: 'text', placeholder: 'Nama lengkap' },
              { label: 'Email', value: newUser.email, key: 'email' as const, type: 'email', placeholder: 'email@sekolah.id' },
              { label: 'Password', value: newUser.password, key: 'password' as const, type: 'password', placeholder: 'Password' },
              { label: 'NIP/NIS', value: newUser.nipNis, key: 'nipNis' as const, type: 'text', placeholder: 'NIP atau NIS' },
              { label: 'No. Telepon', value: newUser.phone, key: 'phone' as const, type: 'text', placeholder: '08xxxxxxxxxx' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                <Input type={field.type} value={field.value} onChange={(e) => setNewUser({ ...newUser, [field.key]: e.target.value })} placeholder={field.placeholder} className="h-10" />
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Peran</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="GURU">Guru</option>
                <option value="PENGAWAS">Pengawas</option>
                <option value="SISWA">Siswa</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAddUser} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #7: Edit User Modal */}
      {editUser && (
        <ModalOverlay onClose={() => setEditUser(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Lengkap</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">NIP/NIS</label>
              <Input value={editForm.nipNis} onChange={(e) => setEditForm({ ...editForm, nipNis: e.target.value })} placeholder="NIP atau NIS" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">No. Telepon</label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Peran</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="GURU">Guru</option>
                <option value="PENGAWAS">Pengawas</option>
                <option value="SISWA">Siswa</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Status:</label>
              <button onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${editForm.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {editForm.isActive ? <><CheckCircle className="w-3 h-3" />Aktif</> : <><XCircle className="w-3 h-3" />Nonaktif</>}
              </button>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSaveEditUser} disabled={editSaving}>
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #8: View User Detail Dialog */}
      {viewUser && (
        <ModalOverlay onClose={() => setViewUser(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Detail User</h2>
            <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {viewUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewUser.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  viewUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  viewUser.role === 'GURU' ? 'bg-emerald-100 text-emerald-700' :
                  viewUser.role === 'PENGAWAS' ? 'bg-amber-100 text-amber-700' :
                  'bg-sky-100 text-sky-700'
                }`}>{viewUser.role.charAt(0) + viewUser.role.slice(1).toLowerCase()}</span>
              </div>
            </div>
            {[
              { label: 'Email', value: viewUser.email },
              { label: 'NIP/NIS', value: viewUser.nipNis || '-' },
              { label: 'Telepon', value: viewUser.phone || '-' },
              { label: 'Status', value: viewUser.isActive ? 'Aktif' : 'Nonaktif' },
              { label: 'Terdaftar', value: new Date(viewUser.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Diperbarui', value: new Date(viewUser.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setViewUser(null)} className="text-gray-700 border-gray-200">Tutup</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== SEKOLAH & KELAS ====================
function SekolahKelas({ token }: { token: string | null }) {
  const [sekolahList, setSekolahList] = useState<ApiSekolah[]>([])
  const [kelasList, setKelasList] = useState<ApiKelas[]>([])
  const [loading, setLoading] = useState(true)

  // FIX #9: Add Sekolah modal state
  const [showAddSekolah, setShowAddSekolah] = useState(false)
  const [newSekolah, setNewSekolah] = useState({ nama: '', alamat: '', npsn: '' })
  const [savingSekolah, setSavingSekolah] = useState(false)

  // FIX #10: Detail sekolah dialog
  const [detailSekolah, setDetailSekolah] = useState<ApiSekolah | null>(null)

  // FIX #11: Edit sekolah modal
  const [editSekolah, setEditSekolah] = useState<ApiSekolah | null>(null)
  const [editSekolahForm, setEditSekolahForm] = useState({ nama: '', alamat: '', npsn: '' })
  const [editSekolahSaving, setEditSekolahSaving] = useState(false)

  // FIX #12: Add Kelas modal state
  const [showAddKelas, setShowAddKelas] = useState(false)
  const [newKelas, setNewKelas] = useState({ nama: '', tingkat: '10', tahunAjaran: '2025/2026', sekolahId: '', waliKelasId: '' })
  const [savingKelas, setSavingKelas] = useState(false)

  // FIX #13: Edit kelas modal
  const [editKelas, setEditKelas] = useState<ApiKelas | null>(null)
  const [editKelasForm, setEditKelasForm] = useState({ nama: '', tingkat: '10', tahunAjaran: '', sekolahId: '' })
  const [editKelasSaving, setEditKelasSaving] = useState(false)

  // FIX #14: MoreVertical dropdown per kelas
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [sekolahRes, kelasRes] = await Promise.all([
        apiFetch('/api/v1/admin/sekolah?limit=50', token),
        apiFetch('/api/v1/admin/kelas?limit=50', token),
      ])
      if (sekolahRes.success) setSekolahList(sekolahRes.data?.data || [])
      if (kelasRes.success) setKelasList(kelasRes.data?.data || [])
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // FIX #9: Add sekolah handler
  const handleAddSekolah = async () => {
    if (!newSekolah.nama) return
    try {
      setSavingSekolah(true)
      const res = await apiFetch('/api/v1/admin/sekolah', token, {
        method: 'POST',
        body: JSON.stringify(newSekolah),
      })
      if (res.success) {
        setShowAddSekolah(false)
        setNewSekolah({ nama: '', alamat: '', npsn: '' })
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setSavingSekolah(false)
    }
  }

  // FIX #11: Edit sekolah handlers
  const handleOpenEditSekolah = (s: ApiSekolah) => {
    setEditSekolah(s)
    setEditSekolahForm({ nama: s.nama, alamat: s.alamat || '', npsn: s.npsn || '' })
  }

  const handleSaveEditSekolah = async () => {
    if (!editSekolah) return
    try {
      setEditSekolahSaving(true)
      const res = await apiFetch(`/api/v1/admin/sekolah/${editSekolah.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editSekolahForm),
      })
      if (res.success) {
        setEditSekolah(null)
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setEditSekolahSaving(false)
    }
  }

  // FIX #12: Add kelas handler
  const handleAddKelas = async () => {
    if (!newKelas.nama || !newKelas.sekolahId) return
    try {
      setSavingKelas(true)
      const res = await apiFetch('/api/v1/admin/kelas', token, {
        method: 'POST',
        body: JSON.stringify({ ...newKelas, tingkat: parseInt(newKelas.tingkat) }),
      })
      if (res.success) {
        setShowAddKelas(false)
        setNewKelas({ nama: '', tingkat: '10', tahunAjaran: '2025/2026', sekolahId: '', waliKelasId: '' })
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setSavingKelas(false)
    }
  }

  // FIX #13: Edit kelas handlers
  const handleOpenEditKelas = (k: ApiKelas) => {
    setEditKelas(k)
    setEditKelasForm({ nama: k.nama, tingkat: String(k.tingkat), tahunAjaran: k.tahunAjaran, sekolahId: k.sekolahId })
  }

  const handleSaveEditKelas = async () => {
    if (!editKelas) return
    try {
      setEditKelasSaving(true)
      const res = await apiFetch(`/api/v1/admin/kelas/${editKelas.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ ...editKelasForm, tingkat: parseInt(editKelasForm.tingkat) }),
      })
      if (res.success) {
        setEditKelas(null)
        fetchData()
      }
    } catch {
      // silently handle
    } finally {
      setEditKelasSaving(false)
    }
  }

  // FIX #14: Delete kelas
  const handleDeleteKelas = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kelas ini?')) return
    try {
      await apiFetch(`/api/v1/admin/kelas/${id}`, token, { method: 'DELETE' })
      setOpenDropdownId(null)
      fetchData()
    } catch {
      // silently handle
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Daftar Sekolah</h2>
        {/* FIX #9: Tambah Sekolah button */}
        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200" onClick={() => setShowAddSekolah(true)}><Plus className="w-4 h-4 mr-2" />Tambah Sekolah</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sekolahList.length === 0 ? (
          <div className="col-span-3"><EmptyState message="Belum ada data sekolah" icon={School} /></div>
        ) : (
          sekolahList.map((sekolah) => (
            <Card key={sekolah.id} className="hover:shadow-lg transition-shadow shadow-sm border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-200">
                    {sekolah.nama.split(' ').slice(-1)[0][0]}
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-semibold border-0">
                    Aktif
                  </Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{sekolah.nama}</h3>
                <p className="text-sm text-gray-500 mb-3">{sekolah.alamat || '-'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <School className="w-4 h-4 text-gray-400" />
                    <span>{sekolah._count?.kelas ?? 0} Kelas</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {/* FIX #10: Detail button */}
                  <Button variant="outline" size="sm" className="flex-1 text-gray-700 border-gray-200" onClick={() => setDetailSekolah(sekolah)}>Detail</Button>
                  {/* FIX #11: Edit button */}
                  <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={() => handleOpenEditSekolah(sekolah)}><Edit className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Daftar Kelas</h2>
        {/* FIX #12: Tambah Kelas button */}
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={() => setShowAddKelas(true)}><Plus className="w-4 h-4 mr-2" />Tambah Kelas</Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nama Kelas</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Sekolah</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Tingkat</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Tahun Ajaran</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Wali Kelas</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Jumlah Siswa</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelasList.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState message="Belum ada data kelas" icon={School} /></td></tr>
                ) : (
                  kelasList.map((kelas, i) => (
                    <tr key={kelas.id} className={`border-b border-gray-50 hover:bg-violet-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{kelas.nama}</td>
                      <td className="py-3 px-4 text-gray-700">{kelas.sekolah?.nama || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">Kelas {kelas.tingkat}</td>
                      <td className="py-3 px-4 text-gray-700">{kelas.tahunAjaran}</td>
                      <td className="py-3 px-4 text-gray-700">{kelas.waliKelas?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={(kelas._count?.siswaKelas / 40) * 100} className="w-16 h-1.5" />
                          <span className="text-gray-700 font-medium">{kelas._count?.siswaKelas ?? 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {/* FIX #13: Edit kelas button */}
                          <button onClick={() => handleOpenEditKelas(kelas)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit kelas"><Edit className="w-4 h-4 text-gray-500" /></button>
                          {/* FIX #14: MoreVertical dropdown */}
                          <div className="relative">
                            <button onClick={() => setOpenDropdownId(openDropdownId === kelas.id ? null : kelas.id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                            {openDropdownId === kelas.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-10">
                                <button onClick={() => { handleOpenEditKelas(kelas); setOpenDropdownId(null) }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Edit className="w-3.5 h-3.5" />Edit</button>
                                <button onClick={() => handleDeleteKelas(kelas.id)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FIX #9: Add Sekolah Modal */}
      {showAddSekolah && (
        <ModalOverlay onClose={() => setShowAddSekolah(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tambah Sekolah Baru</h2>
            <button onClick={() => setShowAddSekolah(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Sekolah *</label>
              <Input value={newSekolah.nama} onChange={(e) => setNewSekolah({ ...newSekolah, nama: e.target.value })} placeholder="Nama sekolah" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">NPSN</label>
              <Input value={newSekolah.npsn} onChange={(e) => setNewSekolah({ ...newSekolah, npsn: e.target.value })} placeholder="Nomor Pokok Sekolah Nasional" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Alamat</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px] focus:border-violet-400" placeholder="Alamat lengkap" value={newSekolah.alamat} onChange={(e) => setNewSekolah({ ...newSekolah, alamat: e.target.value })} />
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddSekolah(false)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAddSekolah} disabled={savingSekolah}>
              {savingSekolah ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #10: Detail Sekolah Dialog */}
      {detailSekolah && (
        <ModalOverlay onClose={() => setDetailSekolah(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Detail Sekolah</h2>
            <button onClick={() => setDetailSekolah(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                {detailSekolah.nama.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailSekolah.nama}</h3>
                <Badge className="bg-emerald-50 text-emerald-700 border-0 font-semibold">Aktif</Badge>
              </div>
            </div>
            {[
              { label: 'NPSN', value: detailSekolah.npsn || '-' },
              { label: 'Alamat', value: detailSekolah.alamat || '-' },
              { label: 'Jumlah Kelas', value: String(detailSekolah._count?.kelas ?? 0) },
              { label: 'Terdaftar', value: new Date(detailSekolah.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setDetailSekolah(null)} className="text-gray-700 border-gray-200">Tutup</Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #11: Edit Sekolah Modal */}
      {editSekolah && (
        <ModalOverlay onClose={() => setEditSekolah(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edit Sekolah</h2>
            <button onClick={() => setEditSekolah(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Sekolah *</label>
              <Input value={editSekolahForm.nama} onChange={(e) => setEditSekolahForm({ ...editSekolahForm, nama: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">NPSN</label>
              <Input value={editSekolahForm.npsn} onChange={(e) => setEditSekolahForm({ ...editSekolahForm, npsn: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Alamat</label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]" value={editSekolahForm.alamat} onChange={(e) => setEditSekolahForm({ ...editSekolahForm, alamat: e.target.value })} />
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditSekolah(null)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSaveEditSekolah} disabled={editSekolahSaving}>
              {editSekolahSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #12: Add Kelas Modal */}
      {showAddKelas && (
        <ModalOverlay onClose={() => setShowAddKelas(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tambah Kelas Baru</h2>
            <button onClick={() => setShowAddKelas(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Kelas *</label>
              <Input value={newKelas.nama} onChange={(e) => setNewKelas({ ...newKelas, nama: e.target.value })} placeholder="Contoh: X IPA 1" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tingkat *</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newKelas.tingkat} onChange={(e) => setNewKelas({ ...newKelas, tingkat: e.target.value })}>
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tahun Ajaran *</label>
                <Input value={newKelas.tahunAjaran} onChange={(e) => setNewKelas({ ...newKelas, tahunAjaran: e.target.value })} placeholder="2025/2026" className="h-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sekolah *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newKelas.sekolahId} onChange={(e) => setNewKelas({ ...newKelas, sekolahId: e.target.value })}>
                <option value="">Pilih Sekolah</option>
                {sekolahList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddKelas(false)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAddKelas} disabled={savingKelas}>
              {savingKelas ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #13: Edit Kelas Modal */}
      {editKelas && (
        <ModalOverlay onClose={() => setEditKelas(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edit Kelas</h2>
            <button onClick={() => setEditKelas(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Kelas *</label>
              <Input value={editKelasForm.nama} onChange={(e) => setEditKelasForm({ ...editKelasForm, nama: e.target.value })} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tingkat *</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editKelasForm.tingkat} onChange={(e) => setEditKelasForm({ ...editKelasForm, tingkat: e.target.value })}>
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tahun Ajaran *</label>
                <Input value={editKelasForm.tahunAjaran} onChange={(e) => setEditKelasForm({ ...editKelasForm, tahunAjaran: e.target.value })} className="h-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sekolah *</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editKelasForm.sekolahId} onChange={(e) => setEditKelasForm({ ...editKelasForm, sekolahId: e.target.value })}>
                <option value="">Pilih Sekolah</option>
                {sekolahList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditKelas(null)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSaveEditKelas} disabled={editKelasSaving}>
              {editKelasSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== MATA PELAJARAN ====================
function MataPelajaran({ token }: { token: string | null }) {
  const [mapelList, setMapelList] = useState<ApiMapel[]>([])
  const [loading, setLoading] = useState(true)

  // FIX #16: Add Mapel modal state
  const [showAddMapel, setShowAddMapel] = useState(false)
  const [newMapel, setNewMapel] = useState({ kode: '', nama: '', kkm: 75, kelompok: 'Wajib' })
  const [savingMapel, setSavingMapel] = useState(false)

  // FIX #17: Detail mapel dialog
  const [detailMapel, setDetailMapel] = useState<ApiMapel | null>(null)

  // FIX #18: Edit mapel modal
  const [editMapel, setEditMapel] = useState<ApiMapel | null>(null)
  const [editMapelForm, setEditMapelForm] = useState({ kode: '', nama: '', kkm: 75, kelompok: 'Wajib' })
  const [editMapelSaving, setEditMapelSaving] = useState(false)

  const fetchMapel = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/admin/mata-pelajaran?limit=50', token)
      if (res.success) setMapelList(res.data?.data || [])
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchMapel() }, [fetchMapel])

  // FIX #16: Add mapel handler
  const handleAddMapel = async () => {
    if (!newMapel.kode || !newMapel.nama) return
    try {
      setSavingMapel(true)
      const res = await apiFetch('/api/v1/admin/mata-pelajaran', token, {
        method: 'POST',
        body: JSON.stringify(newMapel),
      })
      if (res.success) {
        setShowAddMapel(false)
        setNewMapel({ kode: '', nama: '', kkm: 75, kelompok: 'Wajib' })
        fetchMapel()
      }
    } catch {
      // silently handle
    } finally {
      setSavingMapel(false)
    }
  }

  // FIX #18: Edit mapel handlers
  const handleOpenEditMapel = (m: ApiMapel) => {
    setEditMapel(m)
    setEditMapelForm({ kode: m.kode, nama: m.nama, kkm: m.kkm, kelompok: m.kelompok || 'Wajib' })
  }

  const handleSaveEditMapel = async () => {
    if (!editMapel) return
    try {
      setEditMapelSaving(true)
      const res = await apiFetch(`/api/v1/admin/mata-pelajaran/${editMapel.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(editMapelForm),
      })
      if (res.success) {
        setEditMapel(null)
        fetchMapel()
      }
    } catch {
      // silently handle
    } finally {
      setEditMapelSaving(false)
    }
  }

  // FIX #15: Export mapel to CSV
  const handleExportMapel = () => {
    const data = mapelList.map(m => ({
      Kode: m.kode,
      'Mata Pelajaran': m.nama,
      KKM: m.kkm,
      Kelompok: m.kelompok || '-',
      'Jumlah Soal': m._count?.bankSoal ?? 0,
      'Jumlah Ujian': m._count?.exams ?? 0,
      'Jumlah Guru': m._count?.guruSubjects ?? 0,
    }))
    exportToCSV(data, 'daftar-mata-pelajaran')
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Daftar Mata Pelajaran</h2>
        <div className="flex items-center gap-2">
          {/* FIX #15: Export CSV */}
          <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={handleExportMapel}><Download className="w-4 h-4 mr-2" />Ekspor</Button>
          {/* FIX #16: Tambah Mapel button */}
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200" onClick={() => setShowAddMapel(true)}><Plus className="w-4 h-4 mr-2" />Tambah Mapel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mapelList.length === 0 ? (
          <div className="col-span-2"><EmptyState message="Belum ada data mata pelajaran" icon={BookMarked} /></div>
        ) : (
          mapelList.map((mapel) => (
            <Card key={mapel.id} className="hover:shadow-md transition-shadow shadow-sm border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md ${
                      mapel.kelompok === 'Wajib' ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-200' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200'
                    }`}>
                      {mapel.kode.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{mapel.nama}</h3>
                      <p className="text-xs text-gray-500 font-medium">Kode: {mapel.kode}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-semibold ${mapel.kelompok === 'Wajib' ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                    {mapel.kelompok || 'Umum'}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                  {[
                    { label: 'KKM', value: mapel.kkm, bold: true },
                    { label: 'Jumlah Soal', value: mapel._count?.bankSoal ?? 0, bold: false },
                    { label: 'Jumlah Ujian', value: mapel._count?.exams ?? 0, bold: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className={`text-gray-900 ${item.bold ? 'font-bold' : 'font-semibold'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {/* FIX #17: Detail button */}
                  <Button variant="outline" size="sm" className="flex-1 text-gray-700 border-gray-200" onClick={() => setDetailMapel(mapel)}>Detail</Button>
                  {/* FIX #18: Edit button */}
                  <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={() => handleOpenEditMapel(mapel)}><Edit className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* FIX #16: Add Mapel Modal */}
      {showAddMapel && (
        <ModalOverlay onClose={() => setShowAddMapel(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tambah Mata Pelajaran Baru</h2>
            <button onClick={() => setShowAddMapel(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kode *</label>
                <Input value={newMapel.kode} onChange={(e) => setNewMapel({ ...newMapel, kode: e.target.value })} placeholder="MTK" className="h-10" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">KKM</label>
                <Input type="number" value={newMapel.kkm} onChange={(e) => setNewMapel({ ...newMapel, kkm: parseInt(e.target.value) || 75 })} className="h-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Mata Pelajaran *</label>
              <Input value={newMapel.nama} onChange={(e) => setNewMapel({ ...newMapel, nama: e.target.value })} placeholder="Matematika" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kelompok</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={newMapel.kelompok} onChange={(e) => setNewMapel({ ...newMapel, kelompok: e.target.value })}>
                <option value="Wajib">Wajib</option>
                <option value="Peminatan">Peminatan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddMapel(false)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAddMapel} disabled={savingMapel}>
              {savingMapel ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #17: Detail Mapel Dialog */}
      {detailMapel && (
        <ModalOverlay onClose={() => setDetailMapel(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Detail Mata Pelajaran</h2>
            <button onClick={() => setDetailMapel(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md ${detailMapel.kelompok === 'Wajib' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                {detailMapel.kode.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailMapel.nama}</h3>
                <Badge variant="outline" className={`font-semibold ${detailMapel.kelompok === 'Wajib' ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>{detailMapel.kelompok || 'Umum'}</Badge>
              </div>
            </div>
            {[
              { label: 'Kode', value: detailMapel.kode },
              { label: 'KKM', value: String(detailMapel.kkm) },
              { label: 'Jumlah Soal', value: String(detailMapel._count?.bankSoal ?? 0) },
              { label: 'Jumlah Ujian', value: String(detailMapel._count?.exams ?? 0) },
              { label: 'Jumlah Guru Pengampu', value: String(detailMapel._count?.guruSubjects ?? 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setDetailMapel(null)} className="text-gray-700 border-gray-200">Tutup</Button>
          </div>
        </ModalOverlay>
      )}

      {/* FIX #18: Edit Mapel Modal */}
      {editMapel && (
        <ModalOverlay onClose={() => setEditMapel(null)}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Edit Mata Pelajaran</h2>
            <button onClick={() => setEditMapel(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kode *</label>
                <Input value={editMapelForm.kode} onChange={(e) => setEditMapelForm({ ...editMapelForm, kode: e.target.value })} className="h-10" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">KKM</label>
                <Input type="number" value={editMapelForm.kkm} onChange={(e) => setEditMapelForm({ ...editMapelForm, kkm: parseInt(e.target.value) || 75 })} className="h-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Mata Pelajaran *</label>
              <Input value={editMapelForm.nama} onChange={(e) => setEditMapelForm({ ...editMapelForm, nama: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kelompok</label>
              <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900" value={editMapelForm.kelompok} onChange={(e) => setEditMapelForm({ ...editMapelForm, kelompok: e.target.value })}>
                <option value="Wajib">Wajib</option>
                <option value="Peminatan">Peminatan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditMapel(null)} className="text-gray-700 border-gray-200">Batal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSaveEditMapel} disabled={editMapelSaving}>
              {editMapelSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ==================== ANALYTICS ====================
function Analytics({ token }: { token: string | null }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await apiFetch('/api/v1/admin/analytics', token)
        if (res.success) setAnalytics(res.data)
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // FIX #19: Export analytics to CSV
  const handleExportAnalytics = () => {
    if (!analytics) return
    const data = [
      { Metrik: 'Total Siswa', Nilai: analytics.users.siswa },
      { Metrik: 'Total Guru', Nilai: analytics.users.guru },
      { Metrik: 'Total Pengawas', Nilai: analytics.users.pengawas },
      { Metrik: 'Total Admin', Nilai: analytics.users.admin },
      { Metrik: 'User Aktif', Nilai: analytics.users.active },
      { Metrik: 'Total Sekolah', Nilai: analytics.academic.sekolah },
      { Metrik: 'Total Kelas', Nilai: analytics.academic.kelas },
      { Metrik: 'Total Mata Pelajaran', Nilai: analytics.academic.mataPelajaran },
      { Metrik: 'Ujian Draft', Nilai: analytics.exams.draft },
      { Metrik: 'Ujian Terbit', Nilai: analytics.exams.published },
      { Metrik: 'Ujian Berlangsung', Nilai: analytics.exams.ongoing },
      { Metrik: 'Ujian Selesai', Nilai: analytics.exams.completed },
      { Metrik: 'Total Soal', Nilai: analytics.bankSoal.total },
    ]
    exportToCSV(data, 'laporan-analytics')
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Siswa', value: analytics?.users.siswa ?? 0, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Guru', value: analytics?.users.guru ?? 0, icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Ujian Selesai', value: analytics?.exams.completed ?? 0, icon: CheckCircle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Soal', value: analytics?.bankSoal.total ?? 0, icon: BookMarked, color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Distribusi Nilai</CardTitle>
              {/* FIX #19: Export button */}
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200" onClick={handleExportAnalytics}><Download className="w-4 h-4 mr-2" />Ekspor</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
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
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Rata-rata Nilai per Mata Pelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mapel" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="rataRata" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Rata-rata" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Tren Partisipasi Mingguan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={participantTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="minggu" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#e2e8f0" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="hadir" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Hadir" />
              <Bar dataKey="absen" stackId="a" fill="#f59e0b" name="Absen" />
              <Bar dataKey="diskualifikasi" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} name="Diskualifikasi" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Analisis per Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Kelas</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Rata-rata</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Lulus</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Tidak Lulus</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Passing Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kelas: 'X IPA 1', rata: 78.5, lulus: 30, tidak: 6, rate: 83 },
                  { kelas: 'X IPA 2', rata: 75.2, lulus: 28, tidak: 8, rate: 78 },
                  { kelas: 'XI IPA 1', rata: 80.1, lulus: 32, tidak: 2, rate: 94 },
                  { kelas: 'XI IPA 2', rata: 74.8, lulus: 27, tidak: 8, rate: 77 },
                  { kelas: 'XII IPA 1', rata: 82.3, lulus: 30, tidak: 2, rate: 94 },
                  { kelas: 'XII IPS 1', rata: 71.6, lulus: 24, tidak: 10, rate: 71 },
                ].map((row, i) => (
                  <tr key={row.kelas} className={`border-b border-gray-50 hover:bg-violet-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{row.kelas}</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{row.rata}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{row.lulus}</td>
                    <td className="py-3 px-4 text-red-600 font-bold">{row.tidak}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={row.rate} className="w-20 h-1.5" />
                        <span className="text-gray-700 text-xs font-semibold">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== SYSTEM SETTINGS ====================
function SystemSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Pengaturan Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'Nama Platform', value: 'UjianKu', desc: 'Konfigurasi nama platform' },
            { label: 'Logo', value: '', desc: 'Unggah logo platform' },
            { label: 'Bahasa Default', value: 'Indonesia', desc: 'Konfigurasi bahasa default' },
            { label: 'Zona Waktu', value: 'Asia/Jakarta (WIB)', desc: 'Konfigurasi zona waktu' },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{setting.label}</p>
                <p className="text-xs text-gray-500">{setting.desc}</p>
              </div>
              <Input className="w-64" defaultValue={setting.value} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Pengaturan Ujian Default</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'Durasi Default (menit)', value: '90' },
            { label: 'Maksimum Percobaan', value: '1' },
            { label: 'Passing Grade Default (%)', value: '75' },
            { label: 'Anti-Cheat Default', value: 'Aktif' },
            { label: 'Acak Soal Default', value: 'Aktif' },
            { label: 'Acak Opsi Default', value: 'Aktif' },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <p className="text-sm font-semibold text-gray-900">{setting.label}</p>
              <Input className="w-40" defaultValue={setting.value} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Template Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'Ujian Dibuat', template: 'Ujian "{judul}" telah dibuat dan dijadwalkan pada {tanggal}' },
            { label: 'Ujian Dimulai', template: 'Ujian "{judul}" telah dimulai. Token: {token}' },
            { label: 'Nilai Dipublikasikan', template: 'Nilai ujian "{judul}" telah dipublikasikan. Nilai Anda: {nilai}' },
            { label: 'Pelanggaran', template: 'Pelanggaran terdeteksi: {deskripsi} pada ujian "{judul}"' },
          ].map((notif) => (
            <div key={notif.label} className="py-3 border-b border-gray-100 last:border-0">
              <p className="text-sm font-semibold text-gray-900 mb-2">{notif.label}</p>
              <Input className="w-full" defaultValue={notif.template} />
            </div>
          ))}
          <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200">Simpan Pengaturan</Button>
        </CardContent>
      </Card>
    </div>
  )
}
