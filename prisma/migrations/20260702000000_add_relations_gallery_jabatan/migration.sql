-- ============================================================
-- Migration: add_relations_gallery_jabatan
-- Dibuat: 2026-07-02
-- Tujuan:
--   1. Tambah kolom `jabatan` ke tabel User
--   2. Buat tabel GalleryAlbum (missing dari migrasi awal)
--   3. Tambah FOREIGN KEY: User.division_id → Division.id
--   4. Tambah FOREIGN KEY: Program.division_id → Division.id
-- ============================================================

-- -------------------------------------------------------------
-- 1. Tambah kolom jabatan ke User
-- -------------------------------------------------------------
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jabatan" TEXT;

-- -------------------------------------------------------------
-- 2. Buat tabel GalleryAlbum
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "GalleryAlbum" (
    "id"    TEXT         NOT NULL,
    "emoji" TEXT         NOT NULL DEFAULT '📁',
    "title" TEXT         NOT NULL,
    "link"  TEXT,
    "count" INTEGER      NOT NULL DEFAULT 0,
    "size"  TEXT         NOT NULL DEFAULT '0 MB',

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- -------------------------------------------------------------
-- 3. FK: User.division_id → Division.id
--    ON DELETE SET NULL  — jika divisi dihapus, user.division_id jadi NULL
--    ON UPDATE CASCADE   — jika id divisi berubah, ikut update otomatis
-- -------------------------------------------------------------
ALTER TABLE "User"
    ADD CONSTRAINT "User_division_id_fkey"
    FOREIGN KEY ("division_id")
    REFERENCES "Division"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- -------------------------------------------------------------
-- 4. FK: Program.division_id → Division.id
--    ON DELETE RESTRICT  — tidak boleh hapus divisi jika masih ada program
--    ON UPDATE CASCADE   — jika id divisi berubah, ikut update otomatis
-- -------------------------------------------------------------
ALTER TABLE "Program"
    ADD CONSTRAINT "Program_division_id_fkey"
    FOREIGN KEY ("division_id")
    REFERENCES "Division"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
