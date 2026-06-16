import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { Obra } from './obras.service';

export interface User {
  id: number;
  cedula: string;
  nombreCompleto: string;
  cargo: string;
  obraId?: number;
  rol: string;
  obra?: Obra;
  contrasenaHash: string;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/Usuarios`;
  private http = inject(HttpClient);

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  createUser(usuario: any): Observable<any> {
    usuario.id = 0;
    return this.http.post<any>(this.apiUrl, usuario);
  }


  updateUser(userId: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, user);
  }

}
