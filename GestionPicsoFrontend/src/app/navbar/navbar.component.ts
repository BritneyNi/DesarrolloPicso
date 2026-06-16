import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from '../services/notificaciones.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule]
})
export class NavbarComponent implements OnInit {
  isAdminFlag: boolean = false;
  isResponsableFlag: boolean = false;
  notificacionesCount: number = 0;
  private sub: any;

  constructor(private authService: AuthService, private router: Router, private notiService: NotificacionesService) {}

  ngOnInit() {
    const userData = this.authService.getUserData();
    const rol = userData?.rol?.toLowerCase();
    this.isAdminFlag = rol === 'admin';
    this.isResponsableFlag = rol === 'sst';

    if (this.isAdminFlag || this.isResponsableFlag) {
      this.notiService.getNoLeidas().subscribe(data => {
        this.notiService.ultimoCount = data.length;
        this.notificacionesCount = data.length;
      });
      this.sub = interval(15000).subscribe(() => {
        this.cargarNotificaciones();
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cargarNotificaciones() {
    this.notiService.getNoLeidas().subscribe(data => {
      if (data.length > this.notiService.ultimoCount) {
        this.playSound();
      }
      this.notiService.ultimoCount = data.length;
      this.notificacionesCount = data.length;
    });
  }

  playSound() {
    const audio = new Audio();
    audio.src = 'assets/sounds/notificacion.mp3';
    audio.load();
    audio.play().catch(() => {});
  }

  home(): void { this.router.navigate(['/home']); }
  panel(): void { this.router.navigate(['/panel-control']); }
  profile(): void { this.router.navigate(['/profile']); }
  isResponsable(): boolean { return this.isResponsableFlag; }
  isAdmin(): boolean { return this.isAdminFlag; }
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  irNotificaciones(): void {
    this.notificacionesCount = 0;
    this.notiService.ultimoCount = 0;
    this.router.navigate(['/notificaciones']);
  }
}