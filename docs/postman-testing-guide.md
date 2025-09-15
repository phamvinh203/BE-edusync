# 🚀 HƯỚNG DẪN TEST API BẰNG POSTMAN - EXERCISE SERVICE

## 📋 MỤC LỤC

1. [Chuẩn Bị](#chuẩn-bị)
2. [Authentication](#authentication)
3. [Teacher APIs](#teacher-apis)
4. [Student APIs](#student-apis)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 CHUẨN BỊ

### 1. **Environment Setup**

Tạo Environment trong Postman với các biến:

```
BASE_URL: http://localhost:3000
TEACHER_TOKEN: (sẽ lấy sau khi login)
STUDENT_TOKEN: (sẽ lấy sau khi login)
CLASS_ID: (ID của lớp học test)
EXERCISE_ID: (ID của bài tập test)
```

### 2. **Headers Mặc Định**

Tất cả request cần header:

```
Authorization: Bearer {{TEACHER_TOKEN}} hoặc {{STUDENT_TOKEN}}
Content-Type: application/json (cho JSON requests)
```

---

## 🔐 AUTHENTICATION

### 1. **Đăng Nhập Teacher**

```
POST {{BASE_URL}}/api/auth/login
```

**Body (JSON):**

```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "_id": "teacher_user_id",
      "email": "teacher@example.com",
      "role": "teacher"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**📝 Lưu token:** Sao chép `access_token` và set vào biến `TEACHER_TOKEN`

### 2. **Đăng Nhập Student**

```
POST {{BASE_URL}}/api/auth/login
```

**Body (JSON):**

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**📝 Lưu token:** Sao chép `access_token` và set vào biến `STUDENT_TOKEN`

---

## 👨‍🏫 TEACHER APIs

### 1. **Tạo Bài Tập Essay**

```
POST {{BASE_URL}}/api/exercises/:classId/create
```

**Headers:**

```
Authorization: Bearer {{TEACHER_TOKEN}}
Content-Type: multipart/form-data
```

**Body (form-data):**

```
title: Bài tập tự luận về Toán học
description: Viết bài luận về ứng dụng toán học trong đời sống
type: essay
dueDate: 2025-09-20T23:59:59.000Z
maxScore: 10
subject: Toán học
attachments: [chọn file PDF/Word để upload] (optional)
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo bài tập tự luận thành công",
  "data": {
    "_id": "exercise_id_here",
    "title": "Bài tập tự luận về Toán học",
    "type": "essay",
    "maxScore": 10,
    "dueDate": "2025-09-20T23:59:59.000Z",
    "classId": {
      "_id": "class_id",
      "nameClass": "Lớp 10A1"
    },
    "attachments": []
  }
}
```

### 2. **Tạo Bài Tập Trắc Nghiệm**

```
POST {{BASE_URL}}/api/exercises/:classId/create
```

**Body (JSON):**

```json
{
  "title": "Bài tập trắc nghiệm Toán học",
  "description": "Kiểm tra kiến thức cơ bản",
  "type": "multiple_choice",
  "dueDate": "2025-09-25T23:59:59.000Z",
  "maxScore": 10,
  "subject": "Toán học",
  "questions": [
    {
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswers": [1],
      "points": 2,
      "explanation": "2 + 2 = 4"
    },
    {
      "question": "Căn bậc hai của 16 là?",
      "options": ["2", "4", "8", "16"],
      "correctAnswers": [1],
      "points": 3
    }
  ]
}
```

### 3. **Tạo Bài Tập Upload File**

```
POST {{BASE_URL}}/api/exercises/:classId/create
```

**Body (JSON):**

```json
{
  "title": "Bài tập nộp file - Dự án cuối kỳ",
  "description": "Nộp file báo cáo dự án cuối kỳ",
  "type": "file_upload",
  "dueDate": "2025-09-30T23:59:59.000Z",
  "maxScore": 20,
  "subject": "Tin học"
}
```

### 4. **Cập Nhật Bài Tập**

```
PUT {{BASE_URL}}/api/exercises/:exerciseId/update
```

**Body (JSON):**

```json
{
  "title": "Bài tập đã cập nhật",
  "description": "Mô tả mới",
  "maxScore": 15,
  "dueDate": "2025-09-25T23:59:59.000Z"
}
```

### 5. **Xóa Bài Tập (Soft Delete)**

```
DELETE {{BASE_URL}}/api/exercises/:exerciseId/delete
```

### 6. **Xem Danh Sách Bài Tập (Teacher View)**

```
GET {{BASE_URL}}/api/exercises/:classId/classAssignments?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

**Response (Teacher sẽ thấy submission count):**

```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "_id": "exercise_id",
        "title": "Bài tập 1",
        "type": "essay",
        "maxScore": 10,
        "submissionCount": 5,
        "isOverdue": false,
        "daysToDueDate": 8
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5
    }
  }
}
```

### 7. **Xem Chi Tiết Bài Tập (Teacher View)**

```
GET {{BASE_URL}}/api/exercises/:classId/:exerciseId
```

**Response (Teacher sẽ thấy tất cả submissions):**

```json
{
  "success": true,
  "data": {
    "_id": "exercise_id",
    "title": "Bài tập trắc nghiệm",
    "questions": [...],
    "submissions": [
      {
        "_id": "submission_id",
        "student": {
          "_id": "student_id",
          "username": "Nguyễn Văn A"
        },
        "submittedAt": "2025-09-15T10:30:00.000Z",
        "answers": [1, 0, 2],
        "grade": 8.5,
        "content": "...",
        "fileUrl": "..."
      }
    ]
  }
}
```

---

## 👨‍🎓 STUDENT APIs

### 1. **Xem Danh Sách Bài Tập (Student View)**

```
GET {{BASE_URL}}/api/exercises/class/:classId?page=1&limit=10
```

**Headers:**

```
Authorization: Bearer {{STUDENT_TOKEN}}
```

**Response (Student chỉ thấy trạng thái bài làm của mình):**

```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "_id": "exercise_id",
        "title": "Bài tập 1",
        "type": "essay",
        "maxScore": 10,
        "dueDate": "2025-09-20T23:59:59.000Z",
        "isOverdue": false,
        "daysToDueDate": 5,
        "mySubmission": {
          "submittedAt": "2025-09-15T10:30:00.000Z",
          "grade": 8.5,
          "feedback": "Bài làm tốt"
        }
      },
      {
        "_id": "exercise_id_2",
        "title": "Bài tập 2",
        "mySubmission": null // Chưa nộp
      }
    ]
  }
}
```

### 2. **Xem Chi Tiết Bài Tập (Student View)**

```
GET {{BASE_URL}}/api/exercises/:classId/:exerciseId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "exercise_id",
    "title": "Bài tập trắc nghiệm",
    "description": "Làm bài tập...",
    "type": "multiple_choice",
    "maxScore": 10,
    "dueDate": "2025-09-25T23:59:59.000Z",
    "questions": [
      {
        "question": "2 + 2 = ?",
        "options": ["3", "4", "5", "6"],
        "points": 2
      }
    ],
    "attachments": [],
    "isOverdue": false,
    "daysToDueDate": 10
  }
}
```

### 3. **Nộp Bài Tập Essay**

```
POST {{BASE_URL}}/api/exercises/:classId/:exerciseId/student_Submit
```

**Headers:**

```
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data
```

**Body (form-data):**

```
content: Đây là bài làm của tôi về chủ đề được giao. Tôi đã nghiên cứu kỹ và viết bài này với nhiều tham khảo từ các nguồn uy tín...
files: [chọn file PDF/Word để upload] (optional)
```

### 4. **Nộp Bài Tập Trắc Nghiệm**

```
POST {{BASE_URL}}/api/exercises/:classId/:exerciseId/student_Submit
```

**Headers:**

```
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "answers": [1, 1, 0, 2, 1]
}
```

**Response (Auto-graded):**

```json
{
  "success": true,
  "message": "Nộp bài tập thành công",
  "data": {
    "_id": "submission_id",
    "student": {
      "_id": "student_id",
      "username": "Nguyễn Văn A"
    },
    "exercise": {
      "_id": "exercise_id",
      "title": "Bài tập trắc nghiệm",
      "maxScore": 10
    },
    "submittedAt": "2025-09-15T10:30:00.000Z",
    "answers": [1, 1, 0, 2, 1],
    "grade": 8.0,
    "content": null,
    "fileUrl": null
  }
}
```

### 5. **Nộp Bài Tập Upload File**

```
POST {{BASE_URL}}/api/exercises/:classId/:exerciseId/student_Submit
```

**Headers:**

```
Authorization: Bearer {{STUDENT_TOKEN}}
Content-Type: multipart/form-data
```

**Body (form-data):**

```
content: Đây là báo cáo dự án cuối kỳ của nhóm tôi (optional)
files: [chọn file ZIP/PDF] (required)
```

### 6. **Xem Bài Làm Của Mình**

```
GET {{BASE_URL}}/api/exercises/:exerciseId/my-submission
```

**Response:**

```json
{
  "success": true,
  "message": "Lấy bài làm thành công",
  "data": {
    "_id": "submission_id",
    "exercise": {
      "_id": "exercise_id",
      "title": "Bài tập trắc nghiệm",
      "type": "multiple_choice",
      "maxScore": 10,
      "questions": [...]
    },
    "submittedAt": "2025-09-15T10:30:00.000Z",
    "content": "Bài làm...",
    "fileUrl": "https://storage.url/file.pdf",
    "answers": [1, 0, 2, 1, 3],
    "grade": 8.0,
    "feedback": "Bài làm tốt, cần cải thiện phần cuối",
    "isLate": false
  }
}
```

---

## 🔍 TESTING SCENARIOS

### **Scenario 1: Flow Hoàn Chỉnh Teacher**

1. **Login Teacher** → Lấy token
2. **Tạo bài tập essay** → Lấy exerciseId
3. **Xem danh sách bài tập** → Verify bài tập đã tạo
4. **Cập nhật bài tập** → Sửa deadline
5. **Xem chi tiết bài tập** → Check thông tin đã cập nhật

### **Scenario 2: Flow Hoàn Chỉnh Student**

1. **Login Student** → Lấy token
2. **Xem danh sách bài tập trong lớp** → Chọn bài tập chưa nộp
3. **Xem chi tiết bài tập** → Đọc yêu cầu
4. **Nộp bài tập** → Submit theo type
5. **Xem bài làm của mình** → Check kết quả

### **Scenario 3: Test Error Cases**

1. **Nộp bài quá hạn** → Sửa dueDate về quá khứ và test
2. **Nộp bài lại** → Nộp 2 lần để test duplicate prevention
3. **Student không trong lớp** → Test với student khác lớp
4. **Missing data** → Test với body thiếu thông tin

---

## 🛠️ TROUBLESHOOTING

### **Lỗi 401 - Unauthorized**

```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

**Giải pháp:** Check token trong header, refresh token nếu hết hạn

### **Lỗi 403 - Forbidden**

```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập"
}
```

**Giải pháp:** Check role (teacher/student) và quyền truy cập lớp

### **Lỗi 400 - Bad Request**

```json
{
  "success": false,
  "message": "Đã hết hạn nộp bài tập"
}
```

**Giải pháp:** Check business rules (deadline, duplicate submission, etc.)

### **Lỗi 404 - Not Found**

```json
{
  "success": false,
  "message": "Không tìm thấy bài tập"
}
```

**Giải pháp:** Check exerciseId, classId có đúng không

### **Lỗi 413 - File Too Large**

```json
{
  "success": false,
  "message": "File quá lớn! Kích thước tối đa 50MB"
}
```

**Giải pháp:** Giảm kích thước file hoặc check file type

---

## 📊 POSTMAN COLLECTION

### **Tạo Collection Mới:**

1. Tạo folder "EDUSYNC-EXERCISES"
2. Tạo subfolder: "Auth", "Teacher", "Student"
3. Import các request theo hướng dẫn trên
4. Set up Environment variables
5. Sử dụng Tests để auto-extract token và IDs

### **Example Tests Script (đặt trong Auth Login):**

```javascript
// Trong tab Tests của request Login
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.success && response.data.tokens) {
    // Lưu token vào environment
    pm.environment.set('TEACHER_TOKEN', response.data.tokens.access_token);
    console.log('Token saved:', response.data.tokens.access_token);
  }
}
```

### **Pre-request Script (cho các request cần auth):**

```javascript
// Trong tab Pre-request Script
const token = pm.environment.get('TEACHER_TOKEN');
if (!token) {
  throw new Error('Please login first to get token');
}
```

---

## 🎯 QUICK START CHECKLIST

- [ ] Tạo Postman Environment với base URL
- [ ] Login Teacher và lưu token
- [ ] Login Student và lưu token
- [ ] Tạo bài tập đầu tiên
- [ ] Test student submission
- [ ] Verify error cases
- [ ] Check file upload functionality

**🎉 Happy Testing!** 🚀
