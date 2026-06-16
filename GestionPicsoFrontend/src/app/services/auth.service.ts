import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly apiUrl = `${environment.apiUrl}/Usuarios/login`;
  private http = inject(HttpClient);

  login(credentials: { cedula: string; contrasena: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.apiUrl, credentials).pipe(
      tap(response => {
        const token = response.token;
        this.saveToken(token);
        const decoded: any = jwtDecode(token);
        const nombre =
          decoded.name ||
          decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const rol =
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const cedula = decoded.sub;
        const obraId = decoded.obraId || null;
        const usuarioId = decoded.id || null;
        const verColumnasSensibles =
          decoded.verColumnasSensibles === true ||
          decoded.verColumnasSensibles === 'True';
        const userInfo = {
          nombreCompleto: nombre,
          rol,
          cedula,
          obraId,
          usuarioId,
          verColumnasSensibles
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
        if (obraId) {
          localStorage.setItem('obra-id', obraId.toString());
        }
        if (usuarioId) {
          localStorage.setItem('usuario-id', usuarioId.toString());
        }
      })
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserData(): any {
    const usuario = localStorage.getItem(this.USER_KEY);
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('obra-id');
    localStorage.removeItem('usuario-id');
  }
}