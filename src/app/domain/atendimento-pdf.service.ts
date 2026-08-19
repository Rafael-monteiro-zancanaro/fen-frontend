import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';
import { AtendimentoPrint } from '../components/atendimento-print/atendimento-print';
import { AtendimentoPrintData, buildAtendimentoPrintData } from './atendimento-print-data';
import { PharmaceuticalServiceAttendance } from './clinical-records';

interface AtendimentoPdfOptions {
  margin: number;
  filename: string;
  image: {
    type: 'jpeg';
    quality: number;
  };
  html2canvas: {
    scale: number;
    backgroundColor: string;
    useCORS: boolean;
    logging: boolean;
  };
  jsPDF: {
    unit: 'mm';
    format: 'a4';
    orientation: 'portrait';
  };
  pagebreak: {
    mode: string[];
    avoid: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AtendimentoPdfService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);

  async generate(attendance: PharmaceuticalServiceAttendance): Promise<void> {
    const data = buildAtendimentoPrintData(attendance);
    const container = this.createHiddenContainer();
    const componentRef = createComponent(AtendimentoPrint, {
      environmentInjector: this.environmentInjector,
    });

    try {
      componentRef.setInput('data', data);
      this.appRef.attachView(componentRef.hostView);
      container.appendChild(componentRef.location.nativeElement);
      document.body.appendChild(container);
      await this.waitForRender(container);
      await this.generatePdf(container, data);
    } finally {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      container.remove();
    }
  }

  private createHiddenContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.background = '#ffffff';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';

    return container;
  }

  private async waitForRender(container: HTMLElement): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      Array.from(container.querySelectorAll('img')).map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }),
    );
  }

  private async generatePdf(container: HTMLElement, data: AtendimentoPrintData): Promise<void> {
    const page = container.querySelector('.print-page');

    if (!(page instanceof HTMLElement)) {
      throw new Error('Template de impressão do atendimento não foi renderizado.');
    }

    const options: AtendimentoPdfOptions = {
      margin: 0,
      filename: data.fileName,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['tr', '.avoid-break'],
      },
    };

    const { default: html2pdf } = await import('html2pdf.js');

    await html2pdf().set(options).from(page).save(data.fileName);
  }
}
