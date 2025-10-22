# EduSync - Backend (BE-edusync)
## Tổng quan

Repository này là backend của ứng dụng EduSync (Node.js + TypeScript). Ứng dụng sử dụng MongoDB cho dữ liệu chính, Supabase Storage để lưu file (bài tập, bài nộp). API được expose dưới tiền tố `/api`.

## Yêu cầu trước khi chạy

- Node.js >= 18 (hoặc phiên bản tương thích với project)
- npm hoặc yarn
- Một MongoDB instance (local hoặc Atlas)
- Một project Supabase (để sử dụng Storage)

## Biến môi trường (ENV)

Tạo file `.env` ở gốc repository với các biến sau (ví dụ):

- PORT=3001
- MONGO_URL=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/edusync?retryWrites=true&w=majority
- JWT_SECRET=some_long_secret
- EMAIL_USER=your-email@example.com
- EMAIL_PASSWORD=your-email-password
- SUPABASE_URL=https://your-project.supabase.co
- SUPABASE_ANON_KEY=public-anon-key

## Cài đặt & chạy local

1. Cài dependencies:

```
npm install
```

2. Tạo `.env` như phần trên.

3. Chạy ứng dụng (dev):

```
npm run dev
```

## Các router / endpoint chính

Base path: `/api`

Dưới đây là tóm tắt các route theo file `routes/`:

- `/api/auth` (file: `routes/auth.route.ts`)

  - POST `/register` — đăng ký
  - POST `/login` — đăng nhập
  - POST `/refresh-token` — lấy token mới
  - POST `/logout` — đăng xuất
  - POST `/password/forgot` — quên mật khẩu (gửi email)
  - POST `/password/otp` — xác thực OTP
  - POST `/password/reset` — reset mật khẩu

- `/api/users` (file: `routes/user.route.ts`)

  - GET `/me` — lấy thông tin user hiện tại (auth)
  - PUT `/me/update` — cập nhật thông tin user (auth)
  - POST `/me/avatar` — upload avatar (auth + multipart)

- `/api/classes` (file: `routes/class.route.ts`)

  - POST `/createclass` — tạo lớp (teacher/admin)
  - GET `/getallclasses` — lấy tất cả lớp
  - GET `/getclass/:id` — lấy thông tin lớp theo id
  - PUT `/updateclass/:id` — cập nhật lớp (teacher/admin)
  - DELETE `/deleteclass/:id` — xóa lớp (teacher/admin)
  - POST `/joinclass/:id` — student request join lớp
  - GET `/getStudentsByClass/:classId` — lấy học sinh theo lớp
  - GET `/:classId/getPendingStudentsByClass` — danh sách chờ (teacher/admin)
  - POST `/:classId/approveStudent/:studentId` — duyệt học sinh
  - GET `/my-pending-classes` — lớp đang chờ (student)
  - GET `/my-registered-classes` — lớp đã đăng ký (student)
  - DELETE `/leave-class/:classId` — rời lớp (student)
  - GET `/schedules` — lấy lịch toàn bộ lớp (auth)
  - GET `/schedule/:classId` — lấy lịch một lớp
  - POST `/join-by-code` — join bằng mã lớp (student)

- `/api/exercises` (file: `routes/exercises.route.ts`)

  - POST `/:classId/create` — tạo bài tập (teacher) (hỗ trợ upload file)
  - PUT `/:exerciseId/update` — cập nhật bài tập (teacher)
  - DELETE `/:exerciseId/delete` — xóa bài tập (teacher)
  - GET `/:classId/:exerciseId/submissions` — danh sách nộp (teacher)
  - PUT `/:classId/:exerciseId/submissions/:submissionId/grade` — chấm điểm
  - GET `/teacher/overview` — tổng quan bài tập (teacher)
  - GET `/class/:classId` — lấy danh sách bài tập trong lớp (student)
  - GET `/:exerciseId/my-submission` — lấy bài nộp của chính mình (student)
  - GET `/my-submissions/all` — tất cả bài nộp của student
  - POST `/:classId/:exerciseId/student_Submit` — nộp bài (student) (upload files)
  - DELETE `/:classId/:exerciseId/submissions/:submissionId` — xóa bài nộp (student)
  - GET `/:classId/classAssignments` — lấy bài tập trong lớp (tất cả vai trò trong lớp)
  - GET `/:classId/:exerciseId` — chi tiết bài tập

- `/api/attendance` (file: `routes/attendance.route.ts`)

  - POST `/:classId/start` — teacher tạo buổi điểm danh
  - PUT `/:attendanceId/mark` — teacher cập nhật điểm danh
  - GET `/:classId/history` — lịch sử điểm danh (teacher/admin)
  - GET `/:classId/me` — học sinh xem điểm danh của mình (student)

- `/api/admin` (file: `routes/admin.route.ts`)
  - POST `/create-teacher` — tạo tài khoản teacher (admin)
  - GET `/getallClasses` — admin lấy tất cả lớp
  - GET `/classes-by-teacher/:teacherId` — lớp theo teacher
  - GET `/all-teacher` — lấy tất cả teacher
  - GET `/all-students` — lấy tất cả student
  - GET `/students/:studentId/classes` — lấy lớp của student
  - POST `/create-class/:teacherId` — admin tạo class cho teacher

Ghi chú: nhiều route yêu cầu middleware `authenticate` và `checkRole` để bảo vệ theo vai trò (teacher, student, admin).

## Supabase — cấu hình Storage (tóm tắt)

Project dùng Supabase Storage để lưu 2 loại file chính:

- Bucket `ExerciseFile` — file đính kèm do teacher upload cho bài tập
- Bucket `SubmissionFile` — file bài nộp của học sinh

Hướng dẫn nhanh:

1. Tạo project Supabase tại https://app.supabase.com
2. Vào mục Settings → API → copy `URL` (đặt vào `SUPABASE_URL`) và `anon key` (đặt vào `SUPABASE_ANON_KEY` trong `.env`).
3. Storage → Create new bucket: tạo `ExerciseFile` và `SubmissionFile`.
   - Quyết định public/private theo nhu cầu. Project hiện dùng `getPublicUrl()` để lấy URL public.
4. Thiết lập Policies / RLS nếu muốn: repo có file SQL mẫu `docs/supabase-storage-policies.sql` (chạy trong SQL Editor của Supabase) để tạo policies thích hợp.
5. Nếu cần upload từ server với quyền cao hơn (ví dụ xóa file private), cân nhắc dùng `service_role` key nhưng bắt buộc phải lưu an toàn (VD: secrets manager). Không expose trong client.

