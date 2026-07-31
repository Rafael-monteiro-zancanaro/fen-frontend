import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapActivity,
  bootstrapCalendarCheck,
  bootstrapCheckCircle,
  bootstrapClock,
  bootstrapExclamationTriangle,
} from '@ng-icons/bootstrap-icons';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-inicio-page',
  imports: [BaseChartDirective, NgIcon],
  providers: [
    provideIcons({
      bootstrapActivity,
      bootstrapCalendarCheck,
      bootstrapCheckCircle,
      bootstrapClock,
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './inicio-page.html',
})
export class InicioPage {
  protected readonly summaryCards = [
    { label: 'Atendimentos hoje', value: '18', detail: '6 em andamento', icon: 'bootstrapActivity' },
    { label: 'Pendentes', value: '7', detail: '2 aguardando retorno', icon: 'bootstrapExclamationTriangle' },
    { label: 'Finalizados no mes', value: '265', detail: 'Alta de 12%', icon: 'bootstrapCheckCircle' },
    { label: 'Tempo medio', value: '32 min', detail: 'Triagem ate conclusao', icon: 'bootstrapClock' },
  ];

  protected readonly typeSegments = [
    { label: 'Consulta farmaceutica', value: 42, color: '#5d74f7' },
    { label: 'Acompanhamento', value: 28, color: '#3f7657' },
    { label: 'Orientacao', value: 18, color: '#d6c100' },
    { label: 'Retorno', value: 12, color: '#aa5d75' },
  ];

  protected readonly monthlyBars = [42, 55, 61, 74, 68, 83, 91, 88, 96, 102, 117, 124];

  protected readonly chartLabels = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];

  protected readonly attendanceByMonthData = {
    labels: this.chartLabels,
    datasets: [
      {
        label: 'Atendimentos',
        data: this.monthlyBars,
        borderColor: '#7f384a',
        backgroundColor: 'rgba(127, 56, 74, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#7f384a',
      },
    ],
  };

  protected readonly attendanceTypeData = {
    labels: this.typeSegments.map((segment) => segment.label),
    datasets: [
      {
        data: this.typeSegments.map((segment) => segment.value),
        backgroundColor: this.typeSegments.map((segment) => segment.color),
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  protected readonly statusData = {
    labels: this.chartLabels,
    datasets: [
      {
        label: 'Finalizados',
        data: [34, 45, 51, 63, 70, 78, 84, 91, 96, 104, 113, 121],
        borderColor: '#3f7657',
        backgroundColor: 'rgba(63, 118, 87, 0.12)',
        tension: 0.35,
      },
      {
        label: 'Pendentes',
        data: [12, 14, 11, 16, 18, 15, 17, 19, 21, 20, 18, 16],
        borderColor: '#b4233b',
        backgroundColor: 'rgba(180, 35, 59, 0.12)',
        tension: 0.35,
      },
    ],
  };

  protected readonly lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 12,
          color: '#27272a',
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#f0f0f1',
        },
        ticks: {
          color: '#71717a',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e4e4e7',
        },
        ticks: {
          color: '#71717a',
        },
      },
    },
  };

  protected readonly doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          color: '#27272a',
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
    },
  };
}
