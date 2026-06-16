import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginResponse } from '../types/login-response.type';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private loginUrl = `${environment.apiUrl}/Usuarios/login`;

  constructor(private httpClient: HttpClient) { }

  login(name: string, password: string) {
    return this.httpClient.post<LoginResponse>(this.loginUrl, { Cedula: name, Contrasena: password }).pipe(
      tap((value) => {
        sessionStorage.setItem("auth-token", value.token);
        const decoded: any = jwtDecode(value.token);
        const role = decoded.rol || decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || null;
        if (role) {
          sessionStorage.setItem("user-role", role);
        }
        sessionStorage.setItem("user-name", decoded.nombreCompleto || value.name);
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem("auth-token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("user-name");
    sessionStorage.removeItem("user-role");
  }
}