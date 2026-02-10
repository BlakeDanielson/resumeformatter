// Polyfills for PDF.js in serverless environments
// These are needed because pdfjs-dist expects browser DOM APIs

if (typeof globalThis.DOMMatrix === 'undefined') {
  // Simple DOMMatrix polyfill
  // @ts-ignore - Polyfill for serverless environment
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    
    constructor(init?: string | number[]) {
      if (init) {
        if (typeof init === 'string') {
          // Parse matrix string
          const values = init.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(Number) || [];
          if (values.length >= 6) {
            this.a = values[0];
            this.b = values[1];
            this.c = values[2];
            this.d = values[3];
            this.e = values[4];
            this.f = values[5];
          }
        } else if (Array.isArray(init)) {
          if (init.length >= 6) {
            this.a = init[0];
            this.b = init[1];
            this.c = init[2];
            this.d = init[3];
            this.e = init[4];
            this.f = init[5];
          }
        }
      }
    }
    
    multiply(other: DOMMatrix) {
      return new DOMMatrix([
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f,
      ]);
    }
    
    translate(x: number, y: number) {
      return this.multiply(new DOMMatrix([1, 0, 0, 1, x, y]));
    }
    
    scale(x: number, y?: number) {
      return this.multiply(new DOMMatrix([x, 0, 0, y ?? x, 0, 0]));
    }
    
    rotate(angle: number) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return this.multiply(new DOMMatrix([c, s, -s, c, 0, 0]));
    }
  } as any;
}

if (typeof globalThis.ImageData === 'undefined') {
  // Simple ImageData polyfill
  // @ts-ignore - Polyfill for serverless environment
  globalThis.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    
    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
      if (dataOrWidth instanceof Uint8ClampedArray) {
        this.data = dataOrWidth;
        this.width = widthOrHeight || 0;
        this.height = height || 0;
      } else {
        this.width = dataOrWidth;
        this.height = widthOrHeight || 0;
        this.data = new Uint8ClampedArray(dataOrWidth * (widthOrHeight || 0) * 4);
      }
    }
  } as any;
}

if (typeof globalThis.Path2D === 'undefined') {
  // Simple Path2D polyfill (minimal implementation)
  // @ts-ignore - Polyfill for serverless environment
  globalThis.Path2D = class Path2D {
    constructor() {
      // Minimal implementation - we don't actually need path rendering
    }
    moveTo() {}
    lineTo() {}
    closePath() {}
    arc() {}
    rect() {}
  } as any;
}

// Set environment variables to disable canvas in PDF.js
if (typeof process !== 'undefined') {
  process.env.CANVAS_PREBUILT = 'false';
  // Disable canvas rendering - we only need text extraction
  process.env.PDFJS_DISABLE_CANVAS = 'true';
}
