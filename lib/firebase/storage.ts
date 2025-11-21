import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadPhoto(uid: string, file: File, index: number): Promise<string> {
  if (!storage) throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  const storageRef = ref(storage, `profilePhotos/${uid}/${index}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadQRCode(eventId: string, uid: string, qrCodeBlob: Blob): Promise<string> {
  const storageRef = ref(storage, `qrcodes/${eventId}/${uid}.png`);
  await uploadBytes(storageRef, qrCodeBlob);
  return await getDownloadURL(storageRef);
}

export async function uploadProfileCard(eventId: string, uid: string, pdfBlob: Blob): Promise<string> {
  const storageRef = ref(storage, `profileCards/${eventId}/${uid}.pdf`);
  await uploadBytes(storageRef, pdfBlob);
  return await getDownloadURL(storageRef);
}

