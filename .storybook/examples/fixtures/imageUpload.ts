export const uploadThumbnail = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#cfe6ef"/><circle cx="175" cy="60" r="24" fill="#ffe3a0"/><path d="M0 170 80 90 190 240H0Z" fill="#8cab8c"/><path d="M80 240 190 120 240 190V240Z" fill="#587d77"/></svg>',
)}`;

export const uploadSamples = [
  { id: 'sample-1', fileName: 'sample-1.heic' },
  { id: 'sample-2', fileName: 'sample-2.jpg' },
  { id: 'sample-3', fileName: 'sample-3.png' },
];

export const existingUploadPhotos = [
  { id: 101, thumbnailUrl: uploadThumbnail },
  { id: 102, thumbnailUrl: uploadThumbnail },
];
