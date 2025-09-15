# Student Exercise API Examples

## 1. Lấy Danh Sách Bài Tập Trong Lớp

```bash
curl -X GET "http://localhost:3000/api/exercises/class/6703d4b2e45c2d3f4e567890" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Query Parameters (Optional):**

```bash
# Với pagination và filter
curl -X GET "http://localhost:3000/api/exercises/class/6703d4b2e45c2d3f4e567890?page=1&limit=10&status=open&type=multiple_choice&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer <token>"
```

## 2. Xem Chi Tiết Bài Tập

```bash
curl -X GET "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567890/6703d4b2e45c2d3f4e567891" \
  -H "Authorization: Bearer <token>"
```

## 3. Nộp Bài Tập

### 3.1 Nộp Bài Tự Luận (Essay)

```bash
# Chỉ có text
curl -X POST "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567890/6703d4b2e45c2d3f4e567891/student_Submit" \
  -H "Authorization: Bearer <token>" \
  -F "content=Đây là bài làm của tôi về chủ đề được giao..."

# Có file đính kèm
curl -X POST "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567890/6703d4b2e45c2d3f4e567891/student_Submit" \
  -H "Authorization: Bearer <token>" \
  -F "content=Bài làm trong file đính kèm" \
  -F "files=@/path/to/bai_lam.pdf" \
  -F "files=@/path/to/bai_lam.docx"
```

### 3.2 Nộp Bài Trắc Nghiệm (Multiple Choice)

```bash
curl -X POST "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567890/6703d4b2e45c2d3f4e567891/student_Submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [1, 0, 2, 1, 3]
  }'
```

### 3.3 Nộp Bài Upload File

```bash
curl -X POST "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567890/6703d4b2e45c2d3f4e567891/student_Submit" \
  -H "Authorization: Bearer <token>" \
  -F "content=Ghi chú bổ sung cho bài làm" \
  -F "files=@/path/to/project.zip"
```

## 4. Xem Bài Làm Của Mình

```bash
curl -X GET "http://localhost:3000/api/exercises/6703d4b2e45c2d3f4e567891/my-submission" \
  -H "Authorization: Bearer <token>"
```

## JavaScript/Frontend Examples

### 1. Fetch Exercises

```javascript
const getExercises = async (classId, token) => {
  try {
    const response = await fetch(`/api/exercises/class/${classId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (data.success) {
      return data.data.exercises;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};
```

### 2. Submit Essay with File

```javascript
const submitEssay = async (classId, exerciseId, content, files, token) => {
  const formData = new FormData();
  formData.append('content', content);

  // Add files if any
  if (files && files.length > 0) {
    for (let file of files) {
      formData.append('files', file);
    }
  }

  try {
    const response = await fetch(`/api/exercises/${classId}/${exerciseId}/student_Submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.submission;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error submitting essay:', error);
    throw error;
  }
};
```

### 3. Submit Multiple Choice

```javascript
const submitMultipleChoice = async (classId, exerciseId, answers, token) => {
  try {
    const response = await fetch(`/api/exercises/${classId}/${exerciseId}/student_Submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });

    const data = await response.json();
    if (data.success) {
      return data.data.submission;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error submitting multiple choice:', error);
    throw error;
  }
};
```

### 4. Get Exercise Detail

```javascript
const getExerciseDetail = async (classId, exerciseId, token) => {
  try {
    const response = await fetch(`/api/exercises/${classId}/${exerciseId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching exercise detail:', error);
    throw error;
  }
};
```

## React Component Examples

### Exercise List Component

```jsx
import React, { useState, useEffect } from 'react';

const ExerciseList = ({ classId, token }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const data = await getExercises(classId, token);
        setExercises(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [classId, token]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="exercise-list">
      <h2>Danh Sách Bài Tập</h2>
      {exercises.map((exercise) => (
        <div key={exercise._id} className="exercise-card">
          <h3>{exercise.title}</h3>
          <p>{exercise.description}</p>
          <p>Loại: {exercise.type}</p>
          <p>Điểm tối đa: {exercise.maxScore}</p>
          <p>Hạn nộp: {new Date(exercise.dueDate).toLocaleDateString()}</p>

          {exercise.mySubmission ? (
            <div className="submission-status">
              <span className="badge success">Đã nộp</span>
              {exercise.mySubmission.grade && <span>Điểm: {exercise.mySubmission.grade}</span>}
            </div>
          ) : (
            <button onClick={() => handleStartExercise(exercise._id)}>Làm bài</button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Multiple Choice Component

```jsx
import React, { useState } from 'react';

const MultipleChoiceExercise = ({ exercise, onSubmit }) => {
  const [answers, setAnswers] = useState(new Array(exercise.questions.length).fill(-1));

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Validate all questions answered
    if (answers.includes(-1)) {
      alert('Vui lòng trả lời tất cả câu hỏi');
      return;
    }

    onSubmit(answers);
  };

  return (
    <div className="multiple-choice-exercise">
      <h2>{exercise.title}</h2>
      <p>{exercise.description}</p>

      {exercise.questions.map((question, qIndex) => (
        <div key={qIndex} className="question">
          <h4>
            Câu {qIndex + 1}: {question.question}
          </h4>
          <div className="options">
            {question.options.map((option, oIndex) => (
              <label key={oIndex} className="option">
                <input
                  type="radio"
                  name={`question-${qIndex}`}
                  value={oIndex}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => handleAnswerChange(qIndex, oIndex)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} className="submit-btn">
        Nộp bài
      </button>
    </div>
  );
};
```

## Error Handling

```javascript
const handleApiError = (error) => {
  switch (error.message) {
    case 'Bạn không thuộc lớp học này, không thể nộp bài tập':
      // Redirect to class enrollment
      break;
    case 'Đã hết hạn nộp bài tập':
      // Show deadline passed message
      break;
    case 'Bạn đã nộp bài tập này rồi. Không thể nộp lại':
      // Redirect to submission view
      break;
    default:
      // Show generic error
      break;
  }
};
```
