import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(private readonly router: Router) {}

  protected isInternalNavigation(): boolean {
    return this.router.url.startsWith('/inicio') || this.router.url.startsWith('/atendimentos');
  }
}
