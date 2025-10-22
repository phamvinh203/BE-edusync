-- ================================================================
-- BUCKET: ExerciseFile (Files đính kèm bài tập do giáo viên tạo)
-- ================================================================

-- 1. Tạo bucket ExerciseFile (nếu chưa có)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ExerciseFile', 'ExerciseFile', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy cho INSERT - Anyone can upload exercise file
CREATE POLICY "Anyone can upload exercise file" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'ExerciseFile');

-- 3. Policy cho SELECT (view/download) - Anyone can view
CREATE POLICY "Anyone can view exercise file"
ON storage.objects FOR SELECT
USING (bucket_id = 'ExerciseFile');

-- 4. Policy cho DELETE (remove file) - Anyone can delete
CREATE POLICY "Anyone can delete exercise file"
ON storage.objects FOR DELETE
USING (bucket_id = 'ExerciseFile');

-- 5. Policy cho UPDATE (update file) - Anyone can update
CREATE POLICY "Anyone can update exercise file"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ExerciseFile');

-- ================================================================
-- BUCKET: SubmissionFile (Files bài nộp của học sinh)
-- ================================================================

-- 1. Tạo bucket SubmissionFile (nếu chưa có)
INSERT INTO storage.buckets (id, name, public)
VALUES ('SubmissionFile', 'SubmissionFile', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy cho INSERT - Anyone can upload submission file
CREATE POLICY "Anyone can upload submission file" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'SubmissionFile');

-- 3. Policy cho SELECT - Anyone can view submission file
CREATE POLICY "Anyone can view submission file"
ON storage.objects FOR SELECT
USING (bucket_id = 'SubmissionFile');

-- 4. Policy cho DELETE - Anyone can delete submission file
CREATE POLICY "Anyone can delete submission file"
ON storage.objects FOR DELETE
USING (bucket_id = 'SubmissionFile');

-- 5. Policy cho UPDATE - Anyone can update submission file
CREATE POLICY "Anyone can update submission file"
ON storage.objects FOR UPDATE
USING (bucket_id = 'SubmissionFile');

