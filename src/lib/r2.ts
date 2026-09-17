import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 fala o protocolo S3, então usamos o SDK da AWS apontando
// pro endpoint da Cloudflare. Nenhuma chamada sai pra AWS de verdade.
let client: S3Client | null = null;

function r2() {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Faltam variáveis de ambiente do R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). ' +
      'Veja o README para criar o token de API no painel da Cloudflare.'
    );
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

const BUCKET = process.env.R2_BUCKET_NAME || 'achei';

/** URL assinada de UPLOAD (PUT) — o navegador do organizador manda o arquivo direto pro R2. */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

/**
 * URL assinada de DOWNLOAD (GET) — usada pra mostrar/baixar fotos sem tornar
 * o bucket público. Passe forceDownloadFilename quando o link precisa
 * baixar de verdade (não só abrir a imagem) — o atributo HTML `download`
 * sozinho não funciona pra arquivos de outro domínio (o R2), então quem
 * força o download é o próprio R2 respondendo com o cabeçalho
 * Content-Disposition: attachment.
 */
export async function getDownloadUrl(key: string, expiresIn = 3600, forceDownloadFilename?: string) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(forceDownloadFilename
      ? { ResponseContentDisposition: `attachment; filename="${forceDownloadFilename}"` }
      : {}),
  });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await r2().send(cmd);
}
