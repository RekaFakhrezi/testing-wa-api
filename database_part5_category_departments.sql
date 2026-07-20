-- ==========================================
-- MIGRATION PART 5: CATEGORY TO DEPARTMENT MAPPING
-- ==========================================

-- 1. Tambah kolom department_id di tabel categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Update mapping untuk root categories (Level 1)
DO $$
DECLARE
    id_dept_software UUID;
    id_dept_jaringan UUID;
    id_dept_cyber UUID;
BEGIN
    -- Ambil ID Departemen
    SELECT id INTO id_dept_software FROM departments WHERE name = 'Unit Software & Aplikasi' LIMIT 1;
    SELECT id INTO id_dept_jaringan FROM departments WHERE name = 'Unit Infrastruktur & Jaringan' LIMIT 1;
    SELECT id INTO id_dept_cyber FROM departments WHERE name = 'Unit Keamanan Siber' LIMIT 1;

    -- Mapping Level 1
    UPDATE categories SET department_id = id_dept_software WHERE name IN ('Aplikasi', 'Website dan Email');
    UPDATE categories SET department_id = id_dept_jaringan WHERE name = 'Jaringan dan Internet';
    UPDATE categories SET department_id = id_dept_cyber WHERE name = 'Cyber Security';
END $$;

-- 3. Update secara rekursif (Cascade) ke semua sub-kategori
-- (Setiap sub-kategori akan menuruni department_id dari parent-nya)
WITH RECURSIVE category_tree AS (
    -- Base case: Root categories yang punya department_id
    SELECT id, parent_id, department_id 
    FROM categories 
    WHERE parent_id IS NULL AND department_id IS NOT NULL
    
    UNION ALL
    
    -- Recursive step: Child categories
    SELECT c.id, c.parent_id, ct.department_id
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
UPDATE categories c
SET department_id = ct.department_id
FROM category_tree ct
WHERE c.id = ct.id;
