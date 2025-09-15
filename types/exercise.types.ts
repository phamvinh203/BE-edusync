export interface CreateExerciseRequest {
  title: string;
  description: string;
  dueDate: Date;
  maxScore?: number;
  subject?: string;
  type: 'multiple_choice' | 'essay' | 'file_upload';
  questions?: Question[];
}

export interface UpdateExerciseRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  maxScore?: number;
  subject?: string;
  type?: 'multiple_choice' | 'essay' | 'file_upload';
  questions?: Question[];
  removeFileIds?: string[];
}

export interface Question {
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points?: number;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
}

export interface AttachmentData {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ExerciseData {
  title: string;
  description: string;
  type: string;
  classId: string;
  createdBy: string;
  dueDate: Date;
  maxScore: number;
  subject: string;
  status: string;
  submissions: any[];
  attachments: AttachmentData[];
  questions?: Question[];
}

export interface FileUploadParams {
  file: Express.Multer.File;
  teacherName: string;
  className: string;
  exerciseTitle: string;
}

export interface FileUploadResult {
  success: boolean;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}
