import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth-helper';

// GET: School detail
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

    if (!hasRole(auth.user!, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat melihat detail sekolah' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const sekolah = await db.sekolah.findUnique({
      where: { id },
      include: {
        _count: { select: { kelas: true } },
        kelas: {
          include: {
            _count: { select: { siswaKelas: true } },
            waliKelas: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!sekolah) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sekolah tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sekolah });
  } catch (error) {
    console.error('Get sekolah detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// PUT: Update school
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat mengubah sekolah' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.sekolah.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sekolah tidak ditemukan' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nama, alamat, npsn, logo, isActive } = body;

    // Check NPSN uniqueness if changing
    if (npsn && npsn !== existing.npsn) {
      const npsnExists = await db.sekolah.findUnique({ where: { npsn } });
      if (npsnExists) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'NPSN sudah terdaftar' } },
          { status: 409 }
        );
      }
    }

    const sekolah = await db.sekolah.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(alamat !== undefined && { alamat }),
        ...(npsn !== undefined && { npsn }),
        ...(logo !== undefined && { logo }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { _count: { select: { kelas: true } } },
    });

    return NextResponse.json({ success: true, data: sekolah });
  } catch (error) {
    console.error('Update sekolah error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// DELETE: Delete school
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin yang dapat menghapus sekolah' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.sekolah.findUnique({
      where: { id },
      include: { _count: { select: { kelas: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sekolah tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (existing._count.kelas > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'IN_USE', message: 'Sekolah masih memiliki kelas dan tidak dapat dihapus' } },
        { status: 400 }
      );
    }

    await db.sekolah.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: 'Sekolah berhasil dihapus' },
    });
  } catch (error) {
    console.error('Delete sekolah error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}
