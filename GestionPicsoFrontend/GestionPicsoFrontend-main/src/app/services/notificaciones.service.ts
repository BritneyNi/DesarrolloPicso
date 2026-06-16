import { Injectable } from "@angular/core";
import { environment } from "../../environments/environments";
import { HttpClient } from "@angular/common/http";
@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  ultimoCount = 0;

  private apiUrl = `${environment.apiUrl}/notificaciones`;

  constructor(private http: HttpClient) {}

marcarComoLeidas() {
  return this.http.put(`${this.apiUrl}/marcar-leidas`, {});
}
getNoLeidas() {
  return this.http.get<any[]>(`${this.apiUrl}/no-leidas`);
}


getActivas() {
  return this.http.get<any[]>(`${this.apiUrl}/activas`);
}

verificarTodas() {
  return this.http.post(`${this.apiUrl}/verificar-todas`, {});
}

triggerVerificacion() {
  this.verificarTodas().subscribe();
}

}
