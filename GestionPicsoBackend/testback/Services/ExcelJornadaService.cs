using ClosedXML.Excel;
using testback.Models;

namespace testback.Services
{
    public class ExcelJornadaService
    {
        public byte[] GenerarExcelJornada(List<RegistroJornada> registros,
            List<DocumentoPermiso> ausentismos)
        {
            var workbook = new XLWorkbook();

            // Agrupar por empleado
            var grupos = registros.GroupBy(r => r.NombreCompleto);

            foreach (var grupo in grupos)
            {
                Console.WriteLine($"Empleado Excel: {grupo.Key}");

                var ausEmpleado = ausentismos
                    .Where(a => a.NombreEmpleado == grupo.Key)
                    .ToList();

                var nombre = grupo.Key ?? "Sin nombre";
                var sheetName = nombre.Length > 31
                    ? nombre.Substring(0, 31)
                    : nombre;
                sheetName = sheetName.Replace("/", "-").Replace("\\", "-")
                    .Replace("*", "").Replace("?", "").Replace("[", "").Replace("]", "");

                var ws = workbook.Worksheets.Add(sheetName);

                // Encabezados
                var headers = new[]
                {
                    "FECHA ENTRADA", "FECHA SALIDA", "DIA",
                    "HORA ENTRA", "HORA SALE", "TOTAL",
                    "EXTRA (+25%)", "NOCT (+35%)", "EX. NOCT",
                    "REC. NOCT. DOM.", "DOM (+80%)", "EXT. DOM", "EXT. NOCT. DOM"
                };

                for (int i = 0; i < headers.Length; i++)
                {
                    ws.Cell(1, i + 1).Value = headers[i];
                    ws.Cell(1, i + 1).Style.Font.Bold = true;
                    ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.DarkGray;
                    ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
                }

                int row = 2;

                var eventos = new List<EventoExcel>();

                foreach (var reg in grupo)
                {
                    eventos.Add(new EventoExcel
                    {
                        Fecha = reg.Fecha.Date,
                        EsAusentismo = false,
                        Registro = reg
                    });
                }

                foreach (var aus in ausEmpleado)
                {
                    eventos.Add(new EventoExcel
                    {
                        Fecha = aus.FechaInicio.Date,
                        EsAusentismo = true,
                        Ausentismo = aus
                    });
                }

                Console.WriteLine($"Eventos: {eventos.Count}");
                
                foreach (var evento in eventos.OrderBy(e => e.Fecha))
                {
                    if (!evento.EsAusentismo)
                    {
                        var reg = evento.Registro;

                        var entrada = reg.HoraEntrada;
                        var salida = reg.HoraSalida;

                        if (salida < entrada)
                            salida = salida.AddDays(1);

                        string ObtenerNombreDia(DayOfWeek dia)
                    {
                        return dia switch
                        {
                            DayOfWeek.Monday => "LUNES",
                            DayOfWeek.Tuesday => "MARTES",
                            DayOfWeek.Wednesday => "MIERCOLES",
                            DayOfWeek.Thursday => "JUEVES",
                            DayOfWeek.Friday => "VIERNES",
                            DayOfWeek.Saturday => "SABADO",
                            DayOfWeek.Sunday => "DOMINGO",
                            _ => ""
                        };
                    }

                    string diaTexto;

                    if (entrada.Date == salida.Date)
                    {
                        diaTexto = ObtenerNombreDia(entrada.DayOfWeek);
                    }
                    else
                    {
                        diaTexto =
                            $"{ObtenerNombreDia(entrada.DayOfWeek)}/{ObtenerNombreDia(salida.DayOfWeek)}";
                    }

                        var resultado = CalcularHoras(entrada, salida);

                        ws.Cell(row, 1).Value = entrada.ToString("yyyy-MM-dd");
                        ws.Cell(row, 2).Value = salida.ToString("yyyy-MM-dd");
                        ws.Cell(row, 3).Value = diaTexto;
                        ws.Cell(row, 4).Value = entrada.ToString("hh:mm tt");
                        ws.Cell(row, 5).Value = salida.ToString("hh:mm tt");
                        ws.Cell(row, 6).Value = resultado.Total;
                    }
                    else
                    {
                        var aus = evento.Ausentismo;

                        // FIX: usar campo Tipo directamente, con fallback a comentarios
                        string tipo = "AUSENTISMO";

                        if (!string.IsNullOrEmpty(aus.Tipo))
                        {
                            tipo = aus.Tipo.ToLower() switch
                            {
                                "incapacidad"        => "INCAPACIDAD",
                                "enfermedad_general" => "ENFERMEDAD GENERAL",
                                "calamidad_familiar" => "CALAMIDAD FAMILIAR",
                                "sin_justificacion"  => "AUSENTISMO",
                                "descanso"           => "DESCANSO",
                                "permiso"            => "PERMISO",
                                "suspension"         => "SUSPENSION",
                                _                    => "AUSENTISMO"
                            };
                        }
                        else
                        {
                            // Fallback para registros antiguos sin campo Tipo
                            var comentario = (aus.Comentarios ?? "").ToLower();
                            if (comentario.Contains("incapacidad"))        tipo = "INCAPACIDAD";
                            else if (comentario.Contains("permiso"))        tipo = "PERMISO";
                            else if (comentario.Contains("descanso"))       tipo = "DESCANSO";
                            else if (comentario.Contains("suspension"))     tipo = "SUSPENSION";
                            else if (comentario.Contains("enfermedad") ||
                                     comentario.Contains("enfermo"))        tipo = "ENFERMEDAD GENERAL";
                            else if (comentario.Contains("calamidad"))      tipo = "CALAMIDAD FAMILIAR";
                        }

                        ws.Cell(row, 1).Value = aus.FechaInicio.ToString("yyyy-MM-dd");
                        ws.Cell(row, 2).Value = aus.FechaFin.ToString("yyyy-MM-dd");
                        ws.Cell(row, 3).Value = tipo;
                        ws.Cell(row, 4).Value = aus.Comentarios;
                    }

                    row++;
                }

                ws.Columns().AdjustToContents();
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private HorasResultado CalcularHoras(DateTime entrada, DateTime salida)
        {
            if (salida < entrada) salida = salida.AddDays(1);

            double totalHoras = (salida - entrada).TotalHours;
            int hEntrada = entrada.Hour;
            bool esTurnoNocturno = hEntrada >= 20 || hEntrada < 6;

            if (esTurnoNocturno)
                totalHoras -= 1;
            else if (totalHoras >= 6)
            {
                bool empiezaAntesMediodia = entrada.Hour < 12;
                bool terminaDespuesTarde = salida.Hour > 14 || (salida.Hour == 14 && salida.Minute > 0);
                if (empiezaAntesMediodia && terminaDespuesTarde) totalHoras -= 1.5;
                else totalHoras -= 1.0;
            }

            totalHoras = Math.Max(0, totalHoras);
            double horasExtrasTotales = Math.Max(0, totalHoras - 8);

            double noct = 0, extrasNocturnas = 0, recNoctDom = 0, extNoctDom = 0;
            double dom = 0, extraDom = 0, acumuladoNormal = 0, extrasDiurnas = 0;

            var cursor = entrada;
            while (cursor < salida)
            {
                var next = cursor.AddMinutes(10);
                if (next > salida) next = salida;
                double horas = (next - cursor).TotalHours;
                double hDecimal = cursor.Hour + cursor.Minute / 60.0;
                bool esNoct = hDecimal >= 21 || hDecimal < 6;
                bool esDom = cursor.DayOfWeek == DayOfWeek.Sunday;

                double faltan = Math.Max(0, 8 - acumuladoNormal);
                double normales = Math.Min(horas, faltan);
                double extras = horas - normales;

                if (normales > 0)
                {
                    if (esDom) { if (esNoct) recNoctDom += normales; else dom += normales; }
                    else { if (esNoct) noct += normales; else acumuladoNormal += normales; }
                }

                if (extras > 0)
                {
                    if (esDom) { if (esNoct) extNoctDom += extras; else extraDom += extras; }
                    else { if (esNoct) extrasNocturnas += extras; else extrasDiurnas += extras; }
                }

                cursor = next;
            }

            extrasDiurnas = Math.Max(0, horasExtrasTotales - extrasNocturnas - extNoctDom - extraDom);

            return new HorasResultado
            {
                Total = Math.Round(totalHoras, 2),
                Extra = Math.Round(extrasDiurnas, 2),
                Noct = Math.Round(noct, 2),
                ExNoct = Math.Round(extrasNocturnas, 2),
                RecNoctDom = Math.Round(recNoctDom, 2),
                Dom = Math.Round(dom, 2),
                ExtDom = Math.Round(extraDom, 2),
                ExtNoctDom = Math.Round(extNoctDom, 2)
            };
        }

        private class EventoExcel
        {
            public DateTime Fecha { get; set; }
            public bool EsAusentismo { get; set; }
            public RegistroJornada? Registro { get; set; }
            public DocumentoPermiso? Ausentismo { get; set; }
        }

        private class HorasResultado
        {
            public double Total { get; set; }
            public double Extra { get; set; }
            public double Noct { get; set; }
            public double ExNoct { get; set; }
            public double RecNoctDom { get; set; }
            public double Dom { get; set; }
            public double ExtDom { get; set; }
            public double ExtNoctDom { get; set; }
        }
    }
}