import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Halaman Kebijakan Privasi — konten statis
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Kebijakan Privasi',
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
                  Icon(Icons.privacy_tip, color: Colors.white, size: 40),
                  const SizedBox(height: 12),
                  const Text(
                    'Kebijakan Privasi UjianKu',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Terakhir diperbarui: Maret 2026',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _SectionTitle('1. Pendahuluan'),
            _SectionBody(
              'UjianKu ("kami") berkomitmen untuk melindungi privasi Anda. '
              'Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, '
              'menggunakan, menyimpan, dan melindungi informasi pribadi Anda '
              'saat menggunakan aplikasi UjianKu.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('2. Informasi yang Kami Kumpulkan'),
            _SectionBody(
              'Kami dapat mengumpulkan informasi berikut:\n\n'
              '• Data Identitas: Nama lengkap, alamat email, NISN, dan nama sekolah.\n'
              '• Data Ujian: Jawaban ujian, skor, dan hasil yang Anda peroleh.\n'
              '• Data Perangkat: Informasi perangkat seperti model, sistem operasi, dan pengidentifikasi unik.\n'
              '• Data Penggunaan: Informasi tentang bagaimana Anda menggunakan aplikasi, termasuk log aktivitas.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('3. Penggunaan Informasi'),
            _SectionBody(
              'Informasi yang kami kumpulkan digunakan untuk:\n\n'
              '• Menyediakan dan mengelola layanan ujian online.\n'
              '• Memantau dan mencegah kecurangan selama ujian berlangsung.\n'
              '• Menampilkan hasil dan statistik ujian.\n'
              '• Mengirimkan notifikasi terkait ujian mendatang.\n'
              '• Meningkatkan kualitas dan keamanan layanan kami.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('4. Perlindungan Data'),
            _SectionBody(
              'Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang '
              'sesuai untuk melindungi data pribadi Anda dari akses tidak sah, '
              'perubahan, pengungkapan, atau penghancuran. Langkah-langkah ini '
              'termasuk enkripsi data, kontrol akses, dan pemantauan keamanan.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('5. Pengawasan Ujian'),
            _SectionBody(
              'Selama ujian berlangsung, aplikasi dapat memantau aktivitas perangkat '
              'untuk mencegah kecurangan. Hal ini mencakup:\n\n'
              '• Deteksi perpindahan aplikasi atau tab.\n'
              '• Deteksi screenshot dan perekaman layar.\n'
              '• Pemantauan waktu tidak aktif.\n\n'
              'Data pengawasan ini hanya digunakan untuk tujuan kejujuran ujian '
              'dan tidak akan dibagikan kepada pihak ketiga selain institusi '
              'pendidikan yang berwenang.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('6. Berbagi Informasi'),
            _SectionBody(
              'Kami tidak menjual, memperdagangkan, atau menyewakan informasi '
              'pribadi Anda kepada pihak ketiga. Kami dapat membagikan informasi:\n\n'
              '• Kepada guru dan administrator sekolah yang bertanggung jawab atas ujian.\n'
              '• Jika diwajibkan oleh hukum atau proses hukum yang berlaku.\n'
              '• Untuk melindungi hak, properti, atau keamanan UjianKu dan pengguna lainnya.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('7. Hak Anda'),
            _SectionBody(
              'Anda memiliki hak untuk:\n\n'
              '• Mengakses data pribadi yang kami simpan tentang Anda.\n'
              '• Meminta koreksi atas data yang tidak akurat.\n'
              '• Meminta penghapusan data pribadi Anda (dengan batasan tertentu).\n'
              '• Menolak pemrosesan data untuk tujuan pemasaran.\n\n'
              'Untuk menggunakan hak-hak ini, silakan hubungi administrator sekolah '
              'atau tim dukungan UjianKu.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('8. Perubahan Kebijakan'),
            _SectionBody(
              'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. '
              'Perubahan akan diumumkan melalui aplikasi atau email. Penggunaan '
              'berkelanjutan atas aplikasi setelah perubahan berarti Anda menyetujui '
              'kebijakan yang diperbarui.',
            ),
            const SizedBox(height: 20),

            _SectionTitle('9. Kontak'),
            _SectionBody(
              'Jika Anda memiliki pertanyaan atau kekhawatiran tentang Kebijakan '
              'Privasi ini, silakan hubungi:\n\n'
              'Email: support@ujianku.id\n'
              'Website: www.ujianku.id',
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

/// Judul seksi
class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1A1A2E),
      ),
    );
  }
}

/// Isi seksi
class _SectionBody extends StatelessWidget {
  final String text;
  const _SectionBody(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.grey[700],
          fontSize: 14,
          height: 1.7,
        ),
      ),
    );
  }
}
