import browser from 'webextension-polyfill';
import { showNotification, Notification } from '../UI/Notification';
import { Attachment, PostOptions, PostMessage } from "../../common/CommonType"

const blobToBase64 = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      if (base64) {
        resolve(base64.toString());
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.readAsDataURL(blob);
  });
};

const makeAttachmentData = async (image: Attachment) => {
  const base64 = await blobToBase64(image.blob);
  return { data: base64, isSensitive: image.isSensitive }
}

export const postToMisskey = async (text: string, images: Attachment[], videos: Attachment[], options: PostOptions) => {
  const imageData = await Promise.all(images.map(async (image) => {
    return await makeAttachmentData(image)
  }))
  const videoData = await Promise.all(videos.map(async (video) => {
    return await makeAttachmentData(video)
  }))

  let uploadNotifications: Notification[] = []
  if (imageData.length != 0) {
    uploadNotifications.push(showNotification('画像をアップロードしています...', 'success', 1000_0000))
  }

  if (videoData.length != 0) {
    uploadNotifications.push(showNotification('動画をアップロードしています...', 'success', 1000_0000))
  }

  const attachments = [...imageData, ...videoData]

  const postMessage: PostMessage = {
    type: 'post', text: text, options: options, attachments
  }
 
  try {
    uploadNotifications.forEach(notification => notification.close())
    const noteId = await browser.runtime.sendMessage(postMessage)
    showNotification('Misskeyへの投稿に成功しました', 'success')
    return noteId as string;
  } catch (error: any) {
    uploadNotifications.forEach(notification => notification.close())
    showNotification(error.message, 'error')
  }
}