# Flow Học Sinh - Vào Lớp, Chọn Bài Tập và Nộp Bài

## Tổng Quan Flow

```
1. Học sinh đăng nhập
2. Xem danh sách lớp học mình tham gia
3. Chọn một lớp học
4. Xem danh sách bài tập trong lớp
5. Chọn một bài tập để làm
6. Xem chi tiết bài tập
7. Làm bài và nộp bài tập
8. Xem kết quả bài làm (nếu có)
```

## Chi Tiết API Endpoints

### 1. Lấy Danh Sách Bài Tập Trong Lớp

**Endpoint:** `GET /api/exercises/class/:classId`

**Headers:**

```json
{
  "Authorization": "Bearer <student_token>"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách bài tập thành công",
  "data": {
    "exercises": [
      {
        "_id": "exercise_id",
        "title": "Bài tập số 1",
        "description": "Mô tả bài tập",
        "type": "essay|multiple_choice|file_upload",
        "maxScore": 10,
        "dueDate": "2025-09-20T00:00:00.000Z",
        "status": "open|closed",
        "hasAttachments": true,
        "questionCount": 5,
        "isOverdue": false,
        "daysToDueDate": 8,
        "mySubmission": {
          "submittedAt": "2025-09-15T10:30:00.000Z",
          "grade": 8.5,
          "feedback": "Bài làm tốt"
        } // null nếu chưa nộp
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Xem Chi Tiết Bài Tập

**Endpoint:** `GET /api/exercises/:classId/:exerciseId`

**Response:**

```json
{
  "success": true,
  "message": "Lấy chi tiết bài tập thành công",
  "data": {
    "_id": "exercise_id",
    "title": "Bài tập trắc nghiệm",
    "description": "Làm bài tập trắc nghiệm về môn Toán",
    "type": "multiple_choice",
    "maxScore": 10,
    "dueDate": "2025-09-20T00:00:00.000Z",
    "questions": [
      {
        "question": "2 + 2 = ?",
        "options": ["3", "4", "5", "6"],
        "points": 2
      }
    ],
    "attachments": [
      {
        "_id": "attachment_id",
        "fileName": "huong_dan.pdf",
        "fileUrl": "https://storage.url/file.pdf"
      }
    ],
    "isOverdue": false,
    "daysToDueDate": 8
  }
}
```

### 3. Nộp Bài Tập

**Endpoint:** `POST /api/exercises/:classId/:exerciseId/student_Submit`

**Headers:**

```json
{
  "Authorization": "Bearer <student_token>",
  "Content-Type": "multipart/form-data"
}
```

#### 3.1 Nộp Bài Tự Luận (Essay)

**Body (form-data):**

```
content: "Nội dung bài làm của học sinh..."
files: [file1.pdf, file2.docx] // Tùy chọn
```

#### 3.2 Nộp Bài Trắc Nghiệm (Multiple Choice)

**Body (JSON):**

```json
{
  "answers": [1, 0, 2, 1, 3] // Index đáp án đã chọn cho từng câu
}
```

#### 3.3 Nộp Bài Upload File

**Body (form-data):**

```
content: "Ghi chú thêm..." // Tùy chọn
files: [bai_lam.pdf] // Bắt buộc
```

**Response:**

```json
{
  "success": true,
  "message": "Nộp bài tập thành công",
  "data": {
    "_id": "submission_id",
    "student": {
      "_id": "student_id",
      "username": "student_name"
    },
    "exercise": {
      "_id": "exercise_id",
      "title": "Bài tập số 1",
      "type": "multiple_choice",
      "maxScore": 10
    },
    "submittedAt": "2025-09-15T10:30:00.000Z",
    "answers": [1, 0, 2, 1, 3],
    "grade": 8.0, // Tự động tính cho trắc nghiệm
    "content": "Nội dung bài làm...",
    "fileUrl": "https://storage.url/submission.pdf"
  }
}
```

### 4. Xem Bài Làm Của Mình

**Endpoint:** `GET /api/exercises/:exerciseId/my-submission`

**Response:**

```json
{
  "success": true,
  "message": "Lấy bài làm thành công",
  "data": {
    "_id": "submission_id",
    "exercise": {
      "_id": "exercise_id",
      "title": "Bài tập số 1",
      "type": "multiple_choice",
      "maxScore": 10,
      "questions": [...] // Chỉ hiển thị với trắc nghiệm
    },
    "submittedAt": "2025-09-15T10:30:00.000Z",
    "content": "Nội dung bài làm...",
    "fileUrl": "https://storage.url/submission.pdf",
    "answers": [1, 0, 2, 1, 3],
    "grade": 8.0,
    "feedback": "Bài làm tốt, cần cải thiện phần cuối",
    "isLate": false
  }
}
```

## Các Trường Hợp Lỗi Thường Gặp

### 1. Không Thuộc Lớp Học

```json
{
  "success": false,
  "message": "Bạn không thuộc lớp học này, không thể nộp bài tập"
}
```

### 2. Hết Hạn Nộp Bài

```json
{
  "success": false,
  "message": "Đã hết hạn nộp bài tập"
}
```

### 3. Đã Nộp Bài Rồi

```json
{
  "success": false,
  "message": "Bạn đã nộp bài tập này rồi. Không thể nộp lại"
}
```

### 4. Thiếu Dữ Liệu Yêu Cầu

```json
{
  "success": false,
  "message": "Bài tập trắc nghiệm cần có đáp án được chọn"
}
```

## Luồng Frontend Recommend

### 1. Page Danh Sách Lớp Học

- Hiển thị các lớp học mà học sinh đã tham gia
- Click vào lớp → chuyển đến trang bài tập của lớp

### 2. Page Danh Sách Bài Tập

- URL: `/class/:classId/exercises`
- Hiển thị grid/list các bài tập
- Badge trạng thái: "Chưa nộp", "Đã nộp", "Quá hạn"
- Filter: Loại bài tập, trạng thái
- Sort: Ngày tạo, deadline

### 3. Page Chi Tiết Bài Tập

- URL: `/class/:classId/exercises/:exerciseId`
- Hiển thị đầy đủ thông tin bài tập
- Download attachments nếu có
- Button "Làm bài" nếu chưa nộp

### 4. Page Làm Bài

- URL: `/class/:classId/exercises/:exerciseId/submit`
- Form submission theo type:
  - **Essay**: Rich text editor + file upload
  - **Multiple Choice**: Radio buttons cho từng câu
  - **File Upload**: File picker + optional text area

### 5. Page Kết Quả

- URL: `/class/:classId/exercises/:exerciseId/result`
- Hiển thị bài làm đã nộp
- Điểm số (nếu có)
- Feedback từ giáo viên

## Security & Validation

### 1. Authentication

- Tất cả endpoints yêu cầu JWT token
- Middleware `authenticate` verify token

### 2. Authorization

- Middleware `checkRole(['student'])` chỉ cho phép student
- Validate học sinh thuộc lớp học

### 3. Validation

- File upload: Loại file, kích thước (max 50MB)
- Multiple choice: Validate index đáp án
- Rate limiting để tránh spam

### 4. Business Rules

- Không được nộp sau deadline
- Không được nộp lại bài đã nộp
- Auto-grade cho multiple choice
- Manual grade cho essay/file_upload

## Database Schema

### Exercise Model

```typescript
{
  title: String,
  description: String,
  type: 'essay' | 'multiple_choice' | 'file_upload',
  questions: [QuestionSchema], // Chỉ cho multiple_choice
  attachments: [AttachmentSchema],
  maxScore: Number,
  classId: ObjectId,
  createdBy: ObjectId,
  dueDate: Date,
  submissions: [SubmissionSchema],
  status: 'open' | 'closed' | 'graded'
}
```

### Submission Schema

```typescript
{
  studentId: ObjectId,
  submittedAt: Date,
  content: String, // Cho essay
  fileUrl: String, // Cho file upload
  answers: [Number], // Cho multiple choice
  grade: Number,
  feedback: String
}
```
