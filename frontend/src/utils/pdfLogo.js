const PDFJS_VERSION = '3.11.174';
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

let loading;

export const isPdfFile = (file) =>
  Boolean(file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && window.pdfjsLib) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the PDF converter. Check your connection and try again.'));
    document.head.appendChild(script);
  });
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!loading) {
    loading = loadScript(PDFJS_SRC).then(() => {
      if (!window.pdfjsLib) {
        throw new Error('PDF converter did not load.');
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return window.pdfjsLib;
    });
  }
  return loading;
}

export async function fileToLogoImage(file) {
  if (!file) return null;
  if (!isPdfFile(file)) return file;

  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const maxSide = 1200;
  const scale = Math.min(2.4, maxSide / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Could not convert this PDF to an image.'))),
      'image/png'
    );
  });

  return new File([blob], file.name.replace(/\.pdf$/i, '') + '.png', { type: 'image/png' });
}
