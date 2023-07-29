export type Image = {
  blob: Blob,
  isSensitive: boolean
}

// if browser is Safari, image.base64 is used instead of image.blob
export type ImageData = {
  imageData: Blob | string,
  isSensitive: boolean
}

export type Scope = 'public' | 'home' | 'followers'

export type PostOptions = {
  cw: boolean,
  token: string,
  server: string,
  sensitive: boolean,
  scope: Scope
}

export type PostMessage = {
  type: 'post',
  text: string,
  images: ImageData[],
  options: PostOptions
}

export type PostResponse = {
  type: 'postResponse',
  success: boolean,
  errorMessage: string
}