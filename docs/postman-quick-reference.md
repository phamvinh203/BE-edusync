# 🚀 EDUSYNC API - QUICK REFERENCE CARD

## 📥 IMPORT VÀO POSTMAN

### 1. **Import Collection:**

- File: `EduSync-Exercise-APIs.postman_collection.json`
- Hoặc copy-paste JSON content từ file

### 2. **Import Environment:**

- File: `EduSync-Development.postman_environment.json`
- Hoặc tạo manual với các biến:

```
BASE_URL: http://localhost:3000
TEACHER_TOKEN: (auto-set)
STUDENT_TOKEN: (auto-set)
CLASS_ID: your_class_id_here
EXERCISE_ID: (auto-set)
```

## 🎯 TESTING WORKFLOW

### **Step 1: Authentication**

```
POST /api/auth/login
Body: {"email": "teacher@example.com", "password": "password123"}
→ Auto saves TEACHER_TOKEN
```

### **Step 2: Create Exercise**

```
POST /api/exercises/{{CLASS_ID}}/create
Headers: Authorization: Bearer {{TEACHER_TOKEN}}
→ Auto saves EXERCISE_ID
```

### **Step 3: Student Login**

```
POST /api/auth/login
Body: {"email": "student@example.com", "password": "password123"}
→ Auto saves STUDENT_TOKEN
```

### **Step 4: Student Submit**

```
POST /api/exercises/{{CLASS_ID}}/{{EXERCISE_ID}}/student_Submit
Headers: Authorization: Bearer {{STUDENT_TOKEN}}
```

## 📋 ENDPOINT CHEAT SHEET

| Method   | Endpoint                                             | Role            | Description                      |
| -------- | ---------------------------------------------------- | --------------- | -------------------------------- |
| `POST`   | `/api/exercises/:classId/create`                     | Teacher         | Tạo bài tập mới                  |
| `PUT`    | `/api/exercises/:exerciseId/update`                  | Teacher         | Cập nhật bài tập                 |
| `DELETE` | `/api/exercises/:exerciseId/delete`                  | Teacher         | Xóa bài tập                      |
| `GET`    | `/api/exercises/:classId/classAssignments`           | Teacher/Student | Danh sách bài tập                |
| `GET`    | `/api/exercises/:classId/:exerciseId`                | Teacher/Student | Chi tiết bài tập                 |
| `GET`    | `/api/exercises/class/:classId`                      | Student         | Danh sách bài tập (student view) |
| `POST`   | `/api/exercises/:classId/:exerciseId/student_Submit` | Student         | Nộp bài tập                      |
| `GET`    | `/api/exercises/:exerciseId/my-submission`           | Student         | Xem bài làm của mình             |

## 🔑 BODY TEMPLATES

### **Multiple Choice Exercise:**

```json
{
  "title": "Bài tập trắc nghiệm",
  "description": "Kiểm tra kiến thức",
  "type": "multiple_choice",
  "dueDate": "2025-09-25T23:59:59.000Z",
  "maxScore": 10,
  "questions": [
    {
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswers": [1],
      "points": 2
    }
  ]
}
```

### **Student MC Submission:**

```json
{
  "answers": [1, 0, 2, 1, 3]
}
```

### **Essay Submission (form-data):**

```
content: "Bài làm của học sinh..."
files: [chọn file để upload]
```

## ⚠️ COMMON ERRORS

| Error              | Code | Cause                 | Solution                |
| ------------------ | ---- | --------------------- | ----------------------- |
| Token không hợp lệ | 401  | Missing/expired token | Re-login                |
| Không có quyền     | 403  | Wrong role/class      | Check user role         |
| Đã hết hạn nộp     | 400  | Past deadline         | Check dueDate           |
| Đã nộp rồi         | 400  | Duplicate submission  | Check submission status |
| File quá lớn       | 413  | File > 50MB           | Reduce file size        |

## 🛠️ DEBUG TIPS

1. **Check Environment Variables:**

   - BASE_URL is correct
   - Tokens are set after login
   - CLASS_ID exists in database

2. **Check Request Headers:**

   - Authorization header present
   - Content-Type correct for request type

3. **Check Body Format:**

   - JSON for most requests
   - form-data for file uploads

4. **Check Response Status:**
   - 200: Success
   - 400: Bad request (check body)
   - 401: Authentication issue
   - 403: Permission issue
   - 404: Resource not found

## 🎪 TEST SCENARIOS

### **Happy Path:**

1. Teacher login → Create exercise → Student login → Submit → View result

### **Error Cases:**

1. Submit without auth (401)
2. Submit duplicate (400)
3. Submit past deadline (400)
4. Wrong class access (403)
5. Invalid file type (400)

## 📊 RESPONSE FORMATS

### **Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### **Error Response:**

```json
{
  "success": false,
  "message": "Error description"
}
```

---

**🚀 Ready to test!** Import collection → Set environment → Start testing!
