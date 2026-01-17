
const API_BASE_URL = "http://localhost:8081";


export function formatMediaUrl(url?: string): string {
  if (!url) return '';
  
  console.log('formatMediaUrl input:', url); 
  
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  
  let normalizedUrl = url.replace(/\\/g, '/');
  

  normalizedUrl = normalizedUrl.replace(/\/+/g, '/');
  
  console.log('normalizedUrl:', normalizedUrl);
  if (normalizedUrl.startsWith('uploads/')) {
    return `${API_BASE_URL}/${normalizedUrl}`;
  }
  
  if (normalizedUrl.startsWith('/uploads/')) {
    normalizedUrl = normalizedUrl.substring(1);
    return `${API_BASE_URL}/${normalizedUrl}`;
  }
  
  if (normalizedUrl.includes('uploads/')) {
    const uploadsIndex = normalizedUrl.indexOf('uploads/');
    normalizedUrl = normalizedUrl.substring(uploadsIndex);
    return `${API_BASE_URL}/${normalizedUrl}`;
  }
  

  return `${API_BASE_URL}/uploads/${normalizedUrl}`;
}


export function getFileExtension(url: string): string {
  const fileName = url.split(/[\\/]/).pop() || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension;
}

export function getMediaType(url: string): 'image' | 'video' | 'document' | 'other' {
  const extension = getFileExtension(url);
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];
  
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else if (documentExtensions.includes(extension)) {
    return 'document';
  }
  
  return 'other';
}

export function getFileName(url: string): string {
  const parts = url.split(/[\\/]/);
  return parts[parts.length - 1] || 'file';
}

/**
 * Debug function to log URL transformations
 */
export function debugMediaUrl(url?: string): void {
  if (!url) {
    console.log('debugMediaUrl: No URL provided');
    return;
  }
  
  console.log('=== Media URL Debug ===');
  console.log('Original URL:', url);
  console.log('Formatted URL:', formatMediaUrl(url));
  console.log('Media Type:', getMediaType(url));
  console.log('File Extension:', getFileExtension(url));
  console.log('File Name:', getFileName(url));

}