import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';


export interface ResumenBalanceDto {
  clases: ItemBalance[];
  grupos: ItemBalance[];
  cuentas: CuentaBalance[];
}

export interface ItemBalance {
  nombre: string;
  saldo: number;
}

export interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContabilidadService {

  private baseUrl = `${environment.apiUrl}/Contabilidad`;

  constructor(private http: HttpClient) {}

  procesarExcel(formData: FormData): Observable<Blob> {
  return this.http.post(
    `${this.baseUrl}/procesar-excel`,
    formData,
    { responseType: 'blob' }
  );
}


   // 2️⃣ Obtener datos para KPIs y gráficas
  obtenerResumenBalance(): Observable<ResumenBalanceDto> {
    return this.http.get<ResumenBalanceDto>(
      `${this.baseUrl}/resumen-balance`
    );
  }

  procesarBalance(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('archivo', file);

  return this.http.post(
    `${this.baseUrl}/procesar-balance`,
    formData
  );
}

previsualizarExcel(file: File) {
  const formData = new FormData();
  formData.append('archivo', file);
  return this.http.post<any>(`${this.baseUrl}/previsualizar-excel`, formData);
}

// ===============================
// CARTERA CLIENTES
// ===============================

// 🔹 Previsualizar Excel Clientes
previsualizarExcelClientes(file: File, resaltados: any) {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('resaltados', JSON.stringify(resaltados));

  return this.http.post<any>(
    `${this.baseUrl}/previsualizar-excel-clientes`,
    formData
  );
}

// 🔹 Procesar Excel Clientes (descarga)
procesarExcelClientes(file: File, resaltados: any): Observable<Blob> {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('resaltados', JSON.stringify(resaltados));

  return this.http.post(
    `${this.baseUrl}/procesar-excel-clientes`,
    formData,
    { responseType: 'blob' }
  );
}

}
