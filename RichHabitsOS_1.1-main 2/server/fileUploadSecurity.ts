import { z } from "zod";

// File upload security configuration
export const FILE_UPLOAD_CONFIG = {
  // Maximum file size in bytes (10MB for images, 100MB for design files)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_DESIGN_FILE_SIZE: 100 * 1024 * 1024, // 100MB for large design files
  
  // Allowed MIME types for different file categories
  ALLOWED_MIME_TYPES: {
    images: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    documents: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    design_files: [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Adobe files
      'application/x-photoshop',
      'image/vnd.adobe.photoshop',
      'application/photoshop',
      'image/photoshop',
      'application/postscript',
      'application/illustrator',
      'application/pdf',
      // Other design files
      'application/octet-stream', // Generic binary (for .ai, .psd, .sketch without proper MIME)
      'application/zip', // For .sketch, .fig files
      'application/x-indesign',
      // Documents
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    manufacturing_attachments: [
      // All design file types
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      // ZIP archives for bundled files ONLY
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'multipart/x-zip',
      // Adobe files
      'application/x-photoshop',
      'image/vnd.adobe.photoshop',
      'application/photoshop',
      'image/photoshop',
      'application/postscript',
      'application/illustrator',
      'application/x-indesign',
      // Documents
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  
  // Allowed file extensions
  ALLOWED_EXTENSIONS: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    documents: ['.pdf', '.txt', '.doc', '.docx'],
    design_files: [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Adobe files
      '.psd', '.ai', '.eps', '.pdf', '.indd',
      // Other design files
      '.sketch', '.fig', '.xd',
      // Documents
      '.txt', '.doc', '.docx'
    ],
    manufacturing_attachments: [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Adobe files
      '.psd', '.ai', '.eps', '.pdf', '.indd',
      // ZIP archives
      '.zip', '.rar', '.7z',
      // Other design files
      '.sketch', '.fig', '.xd',
      // Documents
      '.txt', '.doc', '.docx'
    ]
  },
  
  // Malicious file patterns to detect
  MALICIOUS_PATTERNS: [
    // Script injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // PHP patterns
    /<\?php/gi,
    /<\?=/gi,
    
    // Server-side includes
    /<!--\s*#/gi,
    
    // Common malware signatures
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /shell_exec\s*\(/gi
  ]
};

// Zod schema for file upload validation
export const fileUploadValidationSchema = z.object({
  filename: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .refine(
      (filename) => !filename.includes('..'), 
      "Filename contains invalid path traversal"
    )
    .refine(
      (filename) => !/[<>:"|?*\x00-\x1F]/.test(filename),
      "Filename contains invalid characters"
    ),
  size: z.number()
    .positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileCategory: z.enum(['images', 'documents', 'design_files', 'manufacturing_attachments'], {
    errorMap: () => ({ message: "Invalid file category" })
  })
});

export interface FileUploadValidationRequest {
  filename: string;
  size: number;
  mimeType: string;
  fileCategory: 'images' | 'documents' | 'design_files' | 'manufacturing_attachments';
  content?: Buffer; // Optional for content scanning
}

export interface FileUploadValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedFilename: string;
  securityWarnings: string[];
}

export class FileUploadSecurityService {
  /**
   * Sanitize filename by removing dangerous characters and path traversal
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    
    // Remove or replace dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '_');
    
    // Remove leading/trailing spaces and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
    
    // Ensure filename isn't empty after sanitization
    if (!sanitized) {
      sanitized = `file_${Date.now()}`;
    }
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      const name = sanitized.substring(0, 255 - ext.length - 10);
      sanitized = `${name}_${Date.now()}${ext}`;
    }
    
    return sanitized;
  }

  /**
   * Validate file extension against allowed extensions
   */
  static validateFileExtension(filename: string, category: 'images' | 'documents' | 'design_files' | 'manufacturing_attachments'): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS[category].includes(extension);
  }

  /**
   * Validate MIME type against allowed types
   */
  static validateMimeType(mimeType: string, category: 'images' | 'documents' | 'design_files' | 'manufacturing_attachments'): boolean {
    return FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES[category].includes(mimeType.toLowerCase());
  }

  /**
   * Basic content scanning for malicious patterns
   */
  static scanFileContent(content: Buffer): string[] {
    const warnings: string[] = [];
    const contentString = content.toString('utf8', 0, Math.min(content.length, 8192)); // Check first 8KB
    
    for (const pattern of FILE_UPLOAD_CONFIG.MALICIOUS_PATTERNS) {
      if (pattern.test(contentString)) {
        warnings.push(`Potentially malicious content detected: ${pattern.source}`);
      }
    }
    
    return warnings;
  }

  /**
   * Comprehensive file upload validation
   */
  static async validateFileUpload(request: FileUploadValidationRequest): Promise<FileUploadValidationResult> {
    const errors: string[] = [];
    const securityWarnings: string[] = [];
    
    // Check file size limits based on category
    const maxSize = (request.fileCategory === 'design_files' || request.fileCategory === 'manufacturing_attachments')
      ? FILE_UPLOAD_CONFIG.MAX_DESIGN_FILE_SIZE 
      : FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
    
    if (request.size > maxSize) {
      errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB for ${request.fileCategory}`);
    }
    
    try {
      // Validate with Zod schema (excluding size check which we handle above)
      const schemaWithoutSize = fileUploadValidationSchema.omit({ size: true });
      schemaWithoutSize.parse(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      }
    }
    
    // Sanitize filename
    const sanitizedFilename = this.sanitizeFilename(request.filename);
    
    // Validate file extension
    if (!this.validateFileExtension(request.filename, request.fileCategory)) {
      errors.push(`File extension not allowed for ${request.fileCategory}`);
    }
    
    // Validate MIME type
    if (!this.validateMimeType(request.mimeType, request.fileCategory)) {
      errors.push(`MIME type '${request.mimeType}' not allowed for ${request.fileCategory}`);
    }
    
    // Check for MIME type spoofing (basic check)
    const expectedMimeTypes = FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES[request.fileCategory];
    const extension = request.filename.toLowerCase().substring(request.filename.lastIndexOf('.'));
    
    if (request.fileCategory === 'images') {
      if (extension === '.jpg' || extension === '.jpeg') {
        if (!request.mimeType.includes('jpeg')) {
          securityWarnings.push('MIME type mismatch: JPEG file with different MIME type');
        }
      } else if (extension === '.png' && !request.mimeType.includes('png')) {
        securityWarnings.push('MIME type mismatch: PNG file with different MIME type');
      }
    }
    
    // Content scanning if content is provided
    if (request.content) {
      const contentWarnings = this.scanFileContent(request.content);
      securityWarnings.push(...contentWarnings);
      
      // Reject files with malicious content
      if (contentWarnings.length > 0) {
        errors.push('File contains potentially malicious content');
      }
    }
    
    // Additional security checks
    if (sanitizedFilename !== request.filename) {
      securityWarnings.push('Filename was sanitized for security');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitizedFilename,
      securityWarnings
    };
  }
  
  /**
   * Generate secure upload metadata
   */
  static generateUploadMetadata(userId: string, category: 'images' | 'documents' | 'design_files') {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 12);
    
    const maxSize = category === 'design_files' 
      ? FILE_UPLOAD_CONFIG.MAX_DESIGN_FILE_SIZE 
      : FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
    
    return {
      uploadId: `${category}_${timestamp}_${randomId}`,
      userId,
      category,
      timestamp,
      maxSize,
      allowedMimeTypes: FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES[category],
      allowedExtensions: FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS[category]
    };
  }
}