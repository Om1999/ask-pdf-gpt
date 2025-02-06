import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateEmbeddings } from '@/actions/generateEmbeddings';
import { uploadFile } from '../vercel_blob';
import { db } from '@/firebase';

export enum StatusText {
  UPLOADING = 'Uploading file ...',
  UPLOADED = 'File uploaded successfully',
  SAVING = 'Saving file to database',
  GENERATING = 'Generating AI Embeddings, This will only take a few seconds',
}

export type Status = StatusText[keyof StatusText];

function useUpload() {
  const [progress, setProgress] = useState<number | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const handleUpload = async (file: File) => {
    if (!file || !user) return;

    const fileIdToUploadTo = uuidv4();

    setStatus(StatusText.UPLOADING);

    try {
      // Upload file to Vercel Blob
      const uploadResult = await uploadFile(file, `users/${user.id}/files/${fileIdToUploadTo}`, file.type);

      setStatus(StatusText.UPLOADED);

      const downloadUrl = uploadResult.url;

      setStatus(StatusText.SAVING);

      await setDoc(doc(db, 'users', user.id, 'files', fileIdToUploadTo), {
        name: file.name,
        size: file.size,
        type: file.type,
        downloadUrl: downloadUrl,
        ref: `users/${user.id}/files/${fileIdToUploadTo}`,
        createdAt: new Date(),
      });

      setStatus(StatusText.GENERATING);

      // Generate AI Embeddings....
      console.log('File ID set to:', fileIdToUploadTo);
      await generateEmbeddings(fileIdToUploadTo);
      console.log('AI Embeddings have been generated');

      setFileId(fileIdToUploadTo);
      console.log('File ID set to:', fileIdToUploadTo);
    } catch (error) {
      console.error('Error during upload process:', error);
    }
  };

  return { progress, status, fileId, handleUpload };
}

export default useUpload;
