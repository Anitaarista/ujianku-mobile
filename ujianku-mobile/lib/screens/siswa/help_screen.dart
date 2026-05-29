import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Halaman Bantuan / FAQ — konten statis
class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Bantuan',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Icon(Icons.help_outline, color: Colors.white, size: 40),
                  const SizedBox(height: 12),
                  const Text(
                    'Pusat Bantuan UjianKu',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pertanyaan yang sering diajukan',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // FAQ Items
            _FaqItem(
              question: 'Bagaimana cara mendaftar di UjianKu?',
              answer:
                  'Akun UjianKu dibuat oleh administrator sekolah atau guru Anda. '
                  'Anda akan menerima kredensial login dari institusi pendidikan Anda. '
                  'Jika Anda belum memiliki akun, hubungi guru atau administrator sekolah.',
            ),
            _FaqItem(
              question: 'Bagaimana cara memulai ujian?',
              answer:
                  '1. Masuk ke akun Anda menggunakan email dan password.\n'
                  '2. Di halaman Beranda, lihat daftar ujian yang tersedia.\n'
                  '3. Ketuk ujian yang ingin Anda kerjakan.\n'
                  '4. Di halaman detail ujian, centang pernyataan persetujuan.\n'
                  '5. Ketuk tombol "Mulai Ujian" untuk memulai.',
            ),
            _FaqItem(
              question: 'Apa yang harus dilakukan jika ujian terputus?',
              answer:
                  'Jika koneksi terputus saat ujian, jangan panik. Jawaban Anda '
                  'otomatis tersimpan. Coba sambungkan kembali internet Anda dan '
                  'buka kembali aplikasi. Anda akan melanjutkan dari soal terakhir '
                  'yang Anda kerjakan. Jika masalah berlanjut, hubungi pengawas '
                  'atau guru Anda.',
            ),
            _FaqItem(
              question: 'Mengapa saya mendapatkan peringatan selama ujian?',
              answer:
                  'Peringatan diberikan ketika sistem mendeteksi aktivitas yang '
                  'mencurigakan, seperti:\n\n'
                  '• Berpindah ke aplikasi lain selama ujian\n'
                  '• Melakukan screenshot atau perekaman layar\n'
                  '• Tidak aktif dalam waktu lama\n\n'
                  'Hindari aktivitas-aktivitas tersebut untuk mencegah peringatan '
                  'dan potensi diskualifikasi.',
            ),
            _FaqItem(
              question: 'Bagaimana cara melihat hasil ujian?',
              answer:
                  'Setelah ujian selesai dan dinilai, hasil ujian akan muncul di:\n\n'
                  '• Halaman Beranda, di seksi "Hasil Terbaru"\n'
                  '• Tab "Hasil" di navigasi bawah\n\n'
                  'Ketuk pada hasil untuk melihat rincian skor dan pembahasan soal.',
            ),
            _FaqItem(
              question: 'Apakah jawaban saya tersimpan otomatis?',
              answer:
                  'Ya, setiap jawaban yang Anda pilih akan tersimpan secara otomatis '
                  'ke server. Anda dapat berpindah antar soal tanpa kehilangan jawaban '
                  'yang sudah dipilih. Pastikan Anda memiliki koneksi internet yang stabil '
                  'agar jawaban dapat tersinkronisasi.',
            ),
            _FaqItem(
              question: 'Bagaimana jika saya lupa password?',
              answer:
                  'Di halaman login, ketuk tautan "Lupa Password?". Masukkan email '
                  'yang terdaftar dan kami akan mengirimkan tautan untuk mengatur ulang '
                  'password Anda. Jika Anda tidak menerima email, periksa folder spam '
                  'atau hubungi administrator.',
            ),
            _FaqItem(
              question: 'Bagaimana cara mengedit profil saya?',
              answer:
                  '1. Buka halaman Profil dari navigasi bawah.\n'
                  '2. Ketuk ikon pensil di pojok kanan atas.\n'
                  '3. Ubah informasi yang Anda inginkan.\n'
                  '4. Ketuk "Simpan" untuk menyimpan perubahan.\n\n'
                  'Perhatikan bahwa email tidak dapat diubah karena merupakan '
                  'identitas utama akun Anda.',
            ),
            _FaqItem(
              question: 'Apa peran Pengawas dalam ujian?',
              answer:
                  'Pengawas bertanggung jawab untuk:\n\n'
                  '• Memantau siswa selama ujian berlangsung\n'
                  '• Mencatat dan menindak pelanggaran\n'
                  '• Memberikan peringatan kepada siswa yang melanggar\n'
                  '• Mendiskualifikasi siswa yang melanggar berulang kali\n'
                  '• Mengakhiri sesi ujian dan meninjau laporan',
            ),

            const SizedBox(height: 24),

            // Contact section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Masih butuh bantuan?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _ContactRow(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: 'support@ujianku.id',
                  ),
                  const SizedBox(height: 10),
                  _ContactRow(
                    icon: Icons.language,
                    label: 'Website',
                    value: 'www.ujianku.id',
                  ),
                  const SizedBox(height: 10),
                  _ContactRow(
                    icon: Icons.phone_outlined,
                    label: 'Telepon',
                    value: '(021) 1234-5678',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

/// Item FAQ dengan expand/collapse
class _FaqItem extends StatefulWidget {
  final String question;
  final String answer;

  const _FaqItem({
    required this.question,
    required this.answer,
  });

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _isExpanded
              ? AppTheme.primary.withValues(alpha: 0.3)
              : Colors.grey[200]!,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => setState(() => _isExpanded = !_isExpanded),
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.question,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: _isExpanded
                              ? AppTheme.primary
                              : const Color(0xFF1A1A2E),
                        ),
                      ),
                    ),
                    Icon(
                      _isExpanded
                          ? Icons.expand_less
                          : Icons.expand_more,
                      color: _isExpanded
                          ? AppTheme.primary
                          : Colors.grey[500],
                      size: 24,
                    ),
                  ],
                ),
                if (_isExpanded) ...[
                  const SizedBox(height: 12),
                  Text(
                    widget.answer,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 13,
                      height: 1.7,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Baris kontak
class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ContactRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 18),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
