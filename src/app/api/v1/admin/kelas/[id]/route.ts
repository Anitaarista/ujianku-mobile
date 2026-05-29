import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth-helper';

// GET: Class detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Token tidak valid atau kadaluarsa' } },
        { status: 401 }
      );
    }

    if (!hasRole(auth.user!, 'ADMIN', 'GURU', 'PENGAWAS')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        sekolah: { select: { id: true, nama: true, npsn: true } },
        waliKelas: { select: { id: true, name: true, nipNis: true } },
        _count: { select: { siswaKelas: true, examKelas: true } },
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: kelas });
  } catch (error) {
    console.error('Get kelas detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// PUT: Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Token tidak valid atau kadaluarsa' } },
        { status: 401 }
      );
    }

    if (!hasRole(auth.user!, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat mengubah kelas' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.kelas.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nama, tingkat, tahunAjaran, sekolahId, waliKelasId } = body;

    const kelas = await db.kelas.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(tingkat && { tingkat: parseInt(tingkat) }),
        ...(tahunAjaran && { tahunAjaran }),
        ...(sekolahId && { sekolahId }),
        ...(waliKelasId !== undefined && { waliKelasId: waliKelasId || null }),
      },
      include: {
        sekolah: { select: { id: true, nama: true } },
        waliKelas: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: kelas });
  } catch (error) {
    console.error('Update kelas error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// DELETE: Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Token tidak valid atau kadaluarsa' } },
        { status: 401 }
      );
    }

    if (!hasRole(auth.user!, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat menghapus kelas' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.kelas.findUnique({
      where: { id },
      include: { _count: { select: { siswaKelas: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (existing._count.siswaKelas > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'IN_USE', message: 'Kelas masih memiliki siswa dan tidak dapat dihapus' } },
        { status: 400 }
      );
    }

    await db.kelas.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: 'Kelas berhasil dihapus' },
    });
  } catch (error) {
    console.error('Delete kelas error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}
