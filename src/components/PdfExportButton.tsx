'use client';

import { useState } from 'react';

export default function PdfExportButton({ fileName }: { fileName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById('invoice-print-area');
      if (!element) return;

      const elementRect = element.getBoundingClientRect();

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      // 表の行や金額ボックスの途中で改ページされないよう、それらの要素の位置(mm換算)を集めておく
      const mmPerPx = pageWidth / elementRect.width;
      const noBreakEls = element.querySelectorAll('tr, [data-avoid-break]');
      const noBreakRanges = Array.from(noBreakEls).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: (r.top - elementRect.top) * mmPerPx,
          bottom: (r.bottom - elementRect.top) * mmPerPx,
        };
      });

      function nextBreak(from: number): number {
        const ideal = from + pageHeight;
        if (ideal >= imgHeight) return imgHeight;
        const splitting = noBreakRanges.find((r) => ideal > r.top + 0.5 && ideal < r.bottom - 0.5);
        // 要素1つがページより大きい等で進めなくなる場合はそのまま切る
        if (splitting && splitting.top > from + 5) return splitting.top;
        return ideal;
      }

      const breaks = [0];
      while (breaks[breaks.length - 1] < imgHeight - 1) {
        breaks.push(nextBreak(breaks[breaks.length - 1]));
      }

      // ページごとに元画像から該当range分だけを切り出す（1枚の画像をずらして使い回すと
      // 各ページが常にA4の固定高さで表示されるためページ間で内容が重複してしまう）
      const canvasPxPerMm = canvas.width / pageWidth;
      for (let i = 0; i < breaks.length - 1; i++) {
        const startMm = breaks[i];
        const endMm = breaks[i + 1];
        const srcY = Math.round(startMm * canvasPxPerMm);
        const srcHeight = Math.max(1, Math.round((endMm - startMm) * canvasPxPerMm));

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcHeight;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
        // PNGは文字のアンチエイリアスにより圧縮効率が悪く容量が大きくなるため、JPEGで書き出す
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);

        if (i > 0) pdf.addPage();
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pageWidth, endMm - startMm);
      }

      pdf.save(fileName);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm"
    >
      {loading ? 'PDF作成中...' : 'PDFダウンロード'}
    </button>
  );
}
