import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth-helper';

// GET: Subject detail
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

    if (!hasRole(auth.user!, 'ADMIN', 'GURU')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const subject = await db.mataPelajaran.findUnique({
      where: { id },
      include: {
        _count: { select: { bankSoal: true, exams: true, guruSubjects: true } },
        guruSubjects: {
          include: {
            guru: { select: { id: true, name: true, nipNis: true } },
            kelas: { select: { id: true, nama: true, tingkat: true } },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Mata pelajaran tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Get mata pelajaran detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// PUT: Update subject
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat mengubah mata pelajaran' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.mataPelajaran.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Mata pelajaran tidak ditemukan' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { kode, nama, kkm, kelompok } = body;

    // Check kode uniqueness if changing
    if (kode && kode !== existing.kode) {
      const kodeExists = await db.mataPelajaran.findUnique({ where: { kode } });
      if (kodeExists) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Kode mata pelajaran sudah terdaftar' } },
          { status: 409 }
        );
      }
    }

    const subject = await db.mataPelajaran.update({
      where: { id },
      data: {
        ...(kode && { kode }),
        ...(nama && { nama }),
        ...(kkm !== undefined && { kkm }),
        ...(kelompok !== undefined && { kelompok }),
      },
    });

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Update mata pelajaran error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// DELETE: Delete subject
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat menghapus mata pelajaran' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.mataPelajaran.findUnique({
      where: { id },
      include: { _count: { select: { exams: true, bankSoal: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Mata pelajaran tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (existing._count.exams > 0 || existing._count.bankSoal > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'IN_USE', message: 'Mata pelajaran masih memiliki ujian atau soal dan tidak dapat dihapus' } },
        { status: 400 }
      );
    }

    await db.mataPelajaran.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: 'Mata pelajaran berhasil dihapus' },
    });
  } catch (error) {
    console.error('Delete mata pelajaran error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}
