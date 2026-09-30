import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/shared/navbar.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="app-shell">
      <app-navbar *ngIf="!isDisplayRoute"></app-navbar>
      
      <main class="main-outlet">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-main);
      color: var(--text-main);
    }
    .main-outlet {
      flex: 1;
    }
  `]
})
export class AppComponent {
  private router = inject(Router);
  isDisplayRoute = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isDisplayRoute = (event.urlAfterRedirects || event.url || '').includes('/display');
    });
  }
}
