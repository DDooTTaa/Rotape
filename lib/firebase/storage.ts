import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadPhoto(uid: string, file: File, index: number): Promise<string> {
  if (!storage) throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  
  try {
    // 파일 이름에서 특수문자 제거 (Firebase Storage 경로 문제 방지)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `profilePhotos/${uid}/${index}_${sanitizedFileName}`);
    
    console.log(`사진 업로드 시작: ${storageRef.fullPath}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`사진 업로드 완료: ${downloadURL}`);
    
    return downloadURL;
  } catch (error: any) {
    console.error("uploadPhoto 오류:", error);
    console.error("오류 코드:", error?.code);
    console.error("오류 메시지:", error?.message);
    throw error;
  }
}

export async function uploadQRCode(eventId: string, uid: string, qrCodeBlob: Blob): Promise<string> {
  const storageRef = ref(storage!, `qrcodes/${eventId}/${uid}.png`);
  await uploadBytes(storageRef, qrCodeBlob);
  return await getDownloadURL(storageRef);
}

export async function uploadProfileCard(eventId: string, uid: string, pdfBlob: Blob): Promise<string> {
  const storageRef = ref(storage!, `profileCards/${eventId}/${uid}.pdf`);
  await uploadBytes(storageRef, pdfBlob);
  return await getDownloadURL(storageRef);
}

