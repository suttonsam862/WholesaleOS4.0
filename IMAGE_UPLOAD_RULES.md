# Image Upload Implementation Rules

This document establishes mandatory patterns for implementing image uploads in the application. Following these rules prevents the "URL disconnection" bug where images appear to save but don't display.

## The Problem

When using ObjectUploader or similar upload components, the upload process returns two different URLs:

1. **`uploadURL`** (WRONG for persistence): A signed URL with expiration for uploading the file to cloud storage. This URL expires and should NEVER be stored in the database.

2. **`uploadId`** (CORRECT for persistence): A path identifier that can be used to construct the permanent public URL.

## Mandatory Rules

### Rule 1: Always Store uploadId, Never uploadURL

In the `onGetUploadParameters` callback:

```typescript
onGetUploadParameters={async (file) => {
  const response = await apiRequest("POST", "/api/upload/image", {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  }) as any;
  
  // MANDATORY: Store uploadId in the file object
  (file as any).__uploadId = response.uploadId;
  
  return {
    method: "PUT" as const,
    url: response.uploadURL,  // Only used for the upload request itself
    headers: { "Content-Type": file.type },
  };
}}
```

### Rule 2: Construct Public URL from uploadId in onComplete

In the `onComplete` callback:

```typescript
onComplete={(result) => {
  if (result.successful?.[0]) {
    // CORRECT: Get uploadId from file object
    const uploadId = (result.successful[0] as any).__uploadId;
    
    if (uploadId) {
      // CORRECT: Construct permanent public URL
      const publicUrl = `/public-objects/${uploadId}`;
      
      setUploadedImageUrl(publicUrl);
      form.setValue("imageUrl", publicUrl);
    }
  }
}}
```

### Rule 3: Sync Upload State with Form Submission

Forms must explicitly include uploaded URLs in submission:

```typescript
const onSubmit = (data: FormData) => {
  const submissionData = {
    ...data,
    imageUrl: uploadedImageUrl || data.imageUrl || "",
  };
  mutation.mutate(submissionData);
};
```

### Rule 4: Initialize Upload State from Existing Data

When editing existing records:

```typescript
useEffect(() => {
  if (existingData) {
    setUploadedImageUrl(existingData.imageUrl || "");
  }
}, [existingData]);
```

### Rule 5: Use Flexible URL Validation

URL fields must accept relative paths:

```typescript
// CORRECT
imageUrl: z.string().optional().or(z.literal(""))

// WRONG - rejects /public-objects/... paths
imageUrl: z.string().url().optional()
```

## Helper Functions

Use the shared helpers from `client/src/hooks/use-image-upload.ts`:

```typescript
import { 
  getImageUploadParams, 
  getPublicUrlFromUploadResult,
  getPublicUrlsFromUploadResult 
} from "@/hooks/use-image-upload";

// In onGetUploadParameters:
onGetUploadParameters={(file) => getImageUploadParams(file)}

// In onComplete:
onComplete={(result) => {
  const publicUrl = getPublicUrlFromUploadResult(result);
  if (publicUrl) {
    setImageUrl(publicUrl);
  }
}}
```

## Code Review Checklist

Before approving any PR with image upload functionality:

- [ ] `onGetUploadParameters` stores `__uploadId` in file object
- [ ] `onComplete` extracts `__uploadId` (NOT `uploadURL`)
- [ ] Public URL is constructed as `/public-objects/${uploadId}`
- [ ] Form submission includes uploaded URL from state
- [ ] Existing data initializes upload state
- [ ] URL validation accepts relative paths

## Common Mistakes

### WRONG

```typescript
// Using uploadURL directly - THIS IS A BUG
const url = (result.successful[0] as any).uploadURL;
setImageUrl(url);

// Using uploadURL from file - THIS IS A BUG
const url = file.uploadURL;
form.setValue("imageUrl", url);
```

### CORRECT

```typescript
// Using uploadId to construct public URL
const uploadId = (result.successful[0] as any).__uploadId;
const publicUrl = `/public-objects/${uploadId}`;
setImageUrl(publicUrl);
```

## Testing Requirements

Every image upload feature must be tested with:

1. Upload an image
2. Save the record
3. Close the modal/page
4. Reopen and verify image displays
5. Wait 15+ minutes and verify image still displays (signed URLs expire)

## Files Fixed in Audit (January 2026)

The following files were audited and fixed:
- design-lab-admin.tsx
- sales-resources.tsx
- manufacturer-management.tsx
- organizations.tsx
- edit-category-modal.tsx
- create-category-modal.tsx
- create-contact-modal.tsx
- edit-contact-modal.tsx
- edit-variant-modal.tsx
- create-variant-modal.tsx
- FirstPieceApprovalPanel.tsx
- DesignAttachmentManager.tsx
- manufacturing-detail-modal.tsx
