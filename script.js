const pdfInput = document.getElementById('pdfInput');
const exportPpt = document.getElementById('exportPpt');
const runOcr = document.getElementById('runOcr');
const toggleOverlay = document.getElementById('toggleOverlay');
const preview = document.getElementById('preview');
const pageList = document.getElementById('pageList');
const editor = document.getElementById('editor');
const statusBox = document.getElementById('statusBox');

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';

let pdfDoc = null;
let pages = [];
let activeIndex = 0;
let overlayVisible = true;
let tesseractWorker = null;

const PPT_WIDTH = 13.333;
const PPT_HEIGHT = 7.5;

const setStatus = (title, message, active = false) => {
    statusBox.classList.toggle('active', active);
    statusBox.querySelector('strong').textContent = title;
    statusBox.querySelector('p').textContent = message;
};

const clearUi = () => {
    preview.innerHTML = '';
    pageList.innerHTML = '';
    editor.innerHTML = '';
};

const buildPageList = () => {
    pageList.innerHTML = '';
    pages.forEach((page, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `page-item${index === activeIndex ? ' active' : ''}`;
        item.textContent = `페이지 ${index + 1}`;
        item.addEventListener('click', () => {
            activeIndex = index;
            renderActivePage();
        });
        pageList.appendChild(item);
    });
};

const createOverlaySvg = (page) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${page.width} ${page.height}`);
    svg.setAttribute('width', page.width);
    svg.setAttribute('height', page.height);
    svg.setAttribute('class', 'overlay');

    page.ocrItems.forEach((item, index) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const fontSize = Math.max(12, item.bbox.y1 - item.bbox.y0);
        text.setAttribute('x', item.bbox.x0);
        text.setAttribute('y', item.bbox.y1 - 2);
        text.setAttribute('font-size', fontSize);
        text.setAttribute('fill', '#1f2937');
        text.textContent = item.text;
        text.dataset.index = index;
        svg.appendChild(text);
    });

    return svg;
};

const renderEditor = (page) => {
    editor.innerHTML = '';
    if (!page.ocrItems.length) {
        const empty = document.createElement('p');
        empty.textContent = 'OCR 결과가 아직 없습니다. OCR을 실행하세요.';
        empty.className = 'help';
        editor.appendChild(empty);
        return;
    }

    page.ocrItems.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'editor-item';
        const label = document.createElement('label');
        label.textContent = `텍스트 ${index + 1}`;
        const input = document.createElement('input');
        input.value = item.text;
        input.addEventListener('input', (event) => {
            item.text = event.target.value;
            const svgText = preview.querySelector(`svg text[data-index="${index}"]`);
            if (svgText) {
                svgText.textContent = item.text;
            }
        });
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        editor.appendChild(wrapper);
    });
};

const renderActivePage = () => {
    if (!pages.length) return;
    const page = pages[activeIndex];
    preview.innerHTML = '';

    const canvas = page.canvas;
    canvas.className = 'page-canvas';
    preview.appendChild(canvas);

    if (page.ocrItems.length) {
        page.overlay = createOverlaySvg(page);
        if (overlayVisible) {
            preview.appendChild(page.overlay);
        }
    }

    renderEditor(page);
    buildPageList();
};

const initWorker = async () => {
    if (tesseractWorker) return tesseractWorker;
    tesseractWorker = await Tesseract.createWorker('kor+eng');
    return tesseractWorker;
};

const runOcrOnPage = async (page) => {
    setStatus('OCR 실행 중', '텍스트 요소를 추출하고 있습니다.', true);
    const worker = await initWorker();
    const result = await worker.recognize(page.canvas);
    const lines = result.data.lines || [];

    page.ocrItems = lines
        .filter((line) => line.text && line.text.trim())
        .map((line) => ({
            text: line.text.trim(),
            bbox: line.bbox,
        }));

    page.overlay = null;
    setStatus('OCR 완료', `페이지 ${page.index + 1} 텍스트 추출 완료`, false);
};

const handlePdfUpload = async (file) => {
    clearUi();
    setStatus('PDF 처리 중', 'PDF를 로딩하고 있습니다.', true);

    const data = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    pages = [];

    for (let i = 1; i <= pdfDoc.numPages; i += 1) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const imageDataUrl = canvas.toDataURL('image/png');

        pages.push({
            index: i - 1,
            canvas,
            width: viewport.width,
            height: viewport.height,
            viewport,
            imageDataUrl,
            ocrItems: [],
            overlay: null,
        });
    }

    activeIndex = 0;
    setStatus('PDF 로딩 완료', `${pdfDoc.numPages}페이지 준비 완료`, false);
    runOcr.disabled = false;
    toggleOverlay.disabled = false;
    exportPpt.disabled = false;
    toggleOverlay.textContent = overlayVisible ? 'SVG 오버레이 숨기기' : 'SVG 오버레이 보기';
    renderActivePage();
};

pdfInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (!file) return;
    handlePdfUpload(file);
});

runOcr.addEventListener('click', async () => {
    if (!pages.length) return;
    const page = pages[activeIndex];
    await runOcrOnPage(page);
    renderActivePage();
});

toggleOverlay.addEventListener('click', () => {
    overlayVisible = !overlayVisible;
    toggleOverlay.textContent = overlayVisible ? 'SVG 오버레이 숨기기' : 'SVG 오버레이 보기';
    renderActivePage();
});

exportPpt.addEventListener('click', async () => {
    if (!pages.length) return;
    setStatus('PPT 생성 중', '슬라이드를 구성하고 있습니다.', true);

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    pages.forEach((page) => {
        const slide = pptx.addSlide();
        slide.addImage({ data: page.imageDataUrl, x: 0, y: 0, w: PPT_WIDTH, h: PPT_HEIGHT });

        if (page.ocrItems.length) {
            const scaleX = PPT_WIDTH / page.width;
            const scaleY = PPT_HEIGHT / page.height;

            page.ocrItems.forEach((item) => {
                const x = item.bbox.x0 * scaleX;
                const y = item.bbox.y0 * scaleY;
                const w = (item.bbox.x1 - item.bbox.x0) * scaleX;
                const h = (item.bbox.y1 - item.bbox.y0) * scaleY;
                const fontSize = Math.max(8, h * 72 * 0.9);

                slide.addText(item.text, {
                    x,
                    y,
                    w,
                    h,
                    fontSize,
                    color: '1f2937',
                });
            });
        }
    });

    await pptx.writeFile({ fileName: 'pdf-to-pptx.pptx' });
    setStatus('PPT 완료', 'PPT 파일이 다운로드되었습니다.', false);
});
