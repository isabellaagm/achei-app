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

/** URL assinada de DOWNLOAD (GET) — usada pra mostrar/baixar fotos sem tornar o bucket público. */
export async function getDownloadUrl(key: string, expiresIn = 3600, downloadFilename?: string) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    // Com o arquivo vindo de outro domínio (R2), o atributo `download` do <a> é ignorado pelo
    // navegador — só forçando o download aqui no header é que ele não abre a imagem numa aba nova.
    ...(downloadFilename ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` } : {}),
  });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await r2().send(cmd);
}
