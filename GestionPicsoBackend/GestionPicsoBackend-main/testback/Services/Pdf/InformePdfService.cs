using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace testback.Services.Pdf
{
    // ═══════════════════════════════════════════════════════════════
    //  COLORES PICSO BRAND GUIDELINES v01 2026
    // ═══════════════════════════════════════════════════════════════
    internal static class PicsoColors
    {
        public const string Green   = "#B7CC12"; // Picso Green  – Pantone 389 U
        public const string Basalt  = "#4F4E4D"; // Basalt       – Pantone 445 U
        public const string Alloy   = "#6D6D73"; // Alloy Gray   – Pantone 430 U
        public const string Arena   = "#E9E0DB"; // Soft Arena   – Pantone 7527 U
        public const string White   = "#FFFFFF";
        public const string LightBg = "#F7F6F3"; // fondo filas alternas
        public const string Red     = "#D94F3D"; // alertas / déficit
    }

    public class InformePdfService
    {
        // ─────────────────────────────────────────────────────────────
        //  ENTRY POINT
        // ─────────────────────────────────────────────────────────────
        public byte[] GenerarInforme(
            List<ActividadGantt>  actividades,
            string?               curvaSImage,
            List<EvidenciaGantt>  evidencias)
        {
            using var stream = new MemoryStream();

            var nombreObra = actividades
                .Select(a => a.Proyecto?.Obra?.NombreObra)
                .FirstOrDefault(n => !string.IsNullOrWhiteSpace(n))
                ?? "Sin nombre";

            var totalGlobal          = (double)actividades.Sum(a => a.CantidadTotal);
            var totalEjecutadoGlobal = actividades.Sum(a => (double)a.Avances.Sum(av => av.CantidadEjecutada));
            var avancePct            = totalGlobal == 0 ? 0 : totalEjecutadoGlobal / totalGlobal * 100;
            var deficitPct           = 100 - avancePct;

            Document.Create(container =>
            {
                // ══════════════════════════════════════════════════════
                //  PÁGINA 1 – TABLA DE ACTIVIDADES
                // ══════════════════════════════════════════════════════
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(0);

                    BuildHeader(page, $"Avance de la Obra — {nombreObra}");
                    BuildFooter(page);

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        // ── KPI cards ──────────────────────────────────
                        col.Item().PaddingBottom(14).Row(kpiRow =>
                        {
                            BuildKpiCard(kpiRow, "AVANCE PLANEADO",  "100%",              PicsoColors.Alloy);
                            kpiRow.ConstantItem(8);
                            BuildKpiCard(kpiRow, "AVANCE EJECUTADO", $"{avancePct:F1}%",  PicsoColors.Green);
                            kpiRow.ConstantItem(8);
                            BuildKpiCard(kpiRow, "DÉFICIT",          $"{deficitPct:F1}%", PicsoColors.Red);
                            kpiRow.ConstantItem(8);
                            BuildKpiCard(kpiRow, "ESTADO",
                                avancePct >= 95 ? "AL DÍA" : "RETRASADO",
                                avancePct >= 95 ? PicsoColors.Green : PicsoColors.Red);
                        });

                        // ── Tabla ──────────────────────────────────────
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(4);
                                cols.RelativeColumn(1.5f);
                                cols.RelativeColumn(1.5f);
                                cols.RelativeColumn(3);
                            });

                            // ── Encabezado ──
                            table.Cell()
                                .Background(PicsoColors.Basalt)
                                .BorderBottom(2).BorderColor(PicsoColors.Alloy)
                                .PaddingVertical(6).PaddingHorizontal(5)
                                .Text("Actividad")
                                .FontColor(PicsoColors.White).FontSize(8).Bold();

                            table.Cell()
                                .Background(PicsoColors.Basalt)
                                .BorderBottom(2).BorderColor(PicsoColors.Alloy)
                                .PaddingVertical(6).PaddingHorizontal(5)
                                .AlignCenter()
                                .Text("Planeado")
                                .FontColor(PicsoColors.White).FontSize(8).Bold();

                            table.Cell()
                                .Background(PicsoColors.Basalt)
                                .BorderBottom(2).BorderColor(PicsoColors.Alloy)
                                .PaddingVertical(6).PaddingHorizontal(5)
                                .AlignCenter()
                                .Text("Ejecutado")
                                .FontColor(PicsoColors.White).FontSize(8).Bold();

                            table.Cell()
                                .Background(PicsoColors.Basalt)
                                .BorderBottom(2).BorderColor(PicsoColors.Alloy)
                                .PaddingVertical(6).PaddingHorizontal(5)
                                .AlignCenter()
                                .Text("Progreso")
                                .FontColor(PicsoColors.White).FontSize(8).Bold();

                            var proyectos    = actividades.GroupBy(a => a.ProyectoGanttId);
                            int globalRowIdx = 0;

                            foreach (var proyecto in proyectos)
                            {
                                // Fila categoría
                                table.Cell().ColumnSpan(4)
                                    .Background(PicsoColors.Basalt)
                                    .PaddingVertical(5).PaddingHorizontal(6)
                                    .Text(proyecto.First().Proyecto.Nombre)
                                    .FontColor(PicsoColors.White).FontSize(9).Bold();

                                double totalPlaneadoProyecto  = 0;
                                double totalEjecutadoProyecto = 0;

                                foreach (var act in proyecto)
                                {
                                    var hoy           = DateTime.Now;
                                    var duracionTotal  = (act.FechaFin - act.FechaInicio).TotalDays;
                                    var transcurrido   = Math.Clamp((hoy - act.FechaInicio).TotalDays, 0, duracionTotal);
                                    var pctPlaneado    = duracionTotal == 0 ? 0 : transcurrido / duracionTotal * 100;
                                    var ejecutado      = act.Avances.Sum(a => a.CantidadEjecutada);
                                    var pctEjecutado   = act.CantidadTotal == 0 ? 0
                                        : (double)ejecutado / (double)act.CantidadTotal * 100;
                                    var pesoGlobal     = totalGlobal == 0 ? 0
                                        : (double)act.CantidadTotal / totalGlobal * 100;
                                    var planeadoLocal  = pctPlaneado  * pesoGlobal / 100;
                                    var ejecutadoLocal = pctEjecutado * pesoGlobal / 100;

                                    totalPlaneadoProyecto  += planeadoLocal;
                                    totalEjecutadoProyecto += ejecutadoLocal;

                                    var rowBg = (globalRowIdx % 2 == 0) ? PicsoColors.White : PicsoColors.LightBg;

                                    table.Cell()
                                        .Background(rowBg)
                                        .BorderBottom(0.3f).BorderColor("#E0E0E0")
                                        .PaddingVertical(4).PaddingHorizontal(5)
                                        .Text(act.Nombre)
                                        .FontSize(8).FontColor(PicsoColors.Basalt);

                                    table.Cell()
                                        .Background(rowBg)
                                        .BorderBottom(0.3f).BorderColor("#E0E0E0")
                                        .PaddingVertical(4).AlignCenter()
                                        .Text($"{planeadoLocal:F1}%")
                                        .FontSize(8).FontColor(PicsoColors.Alloy);

                                    table.Cell()
                                        .Background(rowBg)
                                        .BorderBottom(0.3f).BorderColor("#E0E0E0")
                                        .PaddingVertical(4).AlignCenter()
                                        .Text(t =>
                                        {
                                            t.Span($"{pctEjecutado:F1}%")
                                                .FontSize(8)
                                                .FontColor(pctEjecutado > 0 ? PicsoColors.Green : PicsoColors.Alloy)
                                                .Bold();
                                            t.Span($" ({ejecutadoLocal:F1}%)")
                                                .FontSize(7)
                                                .FontColor(PicsoColors.Alloy);
                                        });

                                    table.Cell()
                                        .Background(rowBg)
                                        .BorderBottom(0.3f).BorderColor("#E0E0E0")
                                        .PaddingVertical(7).PaddingHorizontal(6)
                                        .Element(e => BuildProgressBar(e, pctEjecutado));

                                    globalRowIdx++;
                                }

                                // Fila TOTAL
                                table.Cell()
                                    .Background(PicsoColors.Arena)
                                    .BorderTop(0.5f).BorderColor(PicsoColors.Alloy)
                                    .BorderBottom(0.5f).BorderColor(PicsoColors.Alloy)
                                    .PaddingVertical(5).PaddingHorizontal(5)
                                    .Text("TOTAL")
                                    .FontSize(8).Bold().FontColor(PicsoColors.Basalt);

                                table.Cell()
                                    .Background(PicsoColors.Arena)
                                    .BorderTop(0.5f).BorderColor(PicsoColors.Alloy)
                                    .BorderBottom(0.5f).BorderColor(PicsoColors.Alloy)
                                    .PaddingVertical(5).AlignCenter()
                                    .Text($"{totalPlaneadoProyecto:F1}%")
                                    .FontSize(8).Bold().FontColor(PicsoColors.Basalt);

                                table.Cell()
                                    .Background(PicsoColors.Arena)
                                    .BorderTop(0.5f).BorderColor(PicsoColors.Alloy)
                                    .BorderBottom(0.5f).BorderColor(PicsoColors.Alloy)
                                    .PaddingVertical(5).AlignCenter()
                                    .Text($"{totalEjecutadoProyecto:F1}%")
                                    .FontSize(8).Bold()
                                    .FontColor(totalEjecutadoProyecto > 0 ? PicsoColors.Green : PicsoColors.Basalt);

                                table.Cell()
                                    .Background(PicsoColors.Arena)
                                    .BorderTop(0.5f).BorderColor(PicsoColors.Alloy)
                                    .BorderBottom(0.5f).BorderColor(PicsoColors.Alloy);
                            }
                        });
                    });
                });

                // ══════════════════════════════════════════════════════
                //  PÁGINA 2 – CURVA S
                // ══════════════════════════════════════════════════════
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(0);

                    BuildHeader(page, $"Curva S — {nombreObra}");
                    BuildFooter(page);

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        col.Item().PaddingBottom(4)
                            .Text("Evolución del proyecto")
                            .FontSize(12).Bold().FontColor(PicsoColors.Basalt);

                        col.Item().PaddingBottom(10)
                            .LineHorizontal(1.5f).LineColor(PicsoColors.Green);

                        if (!string.IsNullOrEmpty(curvaSImage))
                        {
                            byte[]? imageBytes = null;
                            if (curvaSImage.Contains(","))
                            {
                                var base64 = curvaSImage.Split(',')[1];
                                imageBytes = Convert.FromBase64String(base64);
                            }

                            if (imageBytes != null)
                                col.Item().PaddingBottom(16).Height(300).Image(imageBytes).FitArea();

                            var curvaSemanal = CalcularCurvaSemanal(actividades);

                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.ConstantColumn(72);
                                    foreach (var _ in curvaSemanal)
                                        cols.RelativeColumn();
                                });

                                table.Cell()
                                    .Background(PicsoColors.Basalt)
                                    .BorderBottom(1.5f).BorderColor(PicsoColors.Alloy)
                                    .PaddingVertical(5).PaddingHorizontal(4)
                                    .Text("Semana")
                                    .FontSize(7).Bold().FontColor(PicsoColors.White);

                                foreach (var item in curvaSemanal)
                                    table.Cell()
                                        .Background(PicsoColors.Basalt)
                                        .BorderBottom(1.5f).BorderColor(PicsoColors.Alloy)
                                        .PaddingVertical(5).AlignCenter()
                                        .Text(item.Fecha)
                                        .FontSize(7).FontColor(PicsoColors.White);

                                table.Cell()
                                    .Background(PicsoColors.LightBg)
                                    .PaddingVertical(4).PaddingHorizontal(4)
                                    .Text("Planeado")
                                    .FontSize(8).Bold().FontColor(PicsoColors.Basalt);

                                foreach (var item in curvaSemanal)
                                    table.Cell()
                                        .Background(PicsoColors.LightBg)
                                        .PaddingVertical(4).AlignCenter()
                                        .Text($"{Math.Round(item.Planeado, 0):F0}%")
                                        .FontSize(7.5f).FontColor(PicsoColors.Alloy);

                                table.Cell()
                                    .Background(PicsoColors.White)
                                    .PaddingVertical(4).PaddingHorizontal(4)
                                    .Text("Ejecutado")
                                    .FontSize(8).Bold().FontColor(PicsoColors.Basalt);

                                for (int i = 0; i < curvaSemanal.Count; i++)
                                {
                                    var item  = curvaSemanal[i];
                                    var texto = (i == 0 || item.HuboAvance)
                                        ? $"{Math.Round(item.Ejecutado, 0):F0}%"
                                        : "—";
                                    var color = (i == 0 || item.HuboAvance)
                                        ? PicsoColors.Green
                                        : PicsoColors.Alloy;

                                    table.Cell()
                                        .Background(PicsoColors.White)
                                        .PaddingVertical(4).AlignCenter()
                                        .Text(texto)
                                        .FontSize(7.5f).FontColor(color).Bold();
                                }
                            });
                        }
                        else
                        {
                            col.Item().PaddingTop(20).AlignCenter()
                                .Text("No hay datos de curva S disponibles.")
                                .FontSize(10).FontColor(PicsoColors.Alloy);
                        }
                    });
                });

                // ══════════════════════════════════════════════════════
                //  PÁGINA 3 – REGISTRO FOTOGRÁFICO
                // ══════════════════════════════════════════════════════
                if (evidencias.Any())
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(0);

                        BuildHeader(page, $"Registro Fotográfico — {nombreObra}");
                        BuildFooter(page);

                        page.Content().PaddingHorizontal(20).PaddingTop(10)
                            .Grid(grid =>
                            {
                                grid.Columns(2);
                                grid.Spacing(12);

                                using var httpClient = new HttpClient();

                                foreach (var evidencia in evidencias.Take(4))
                                {
                                    grid.Item()
                                        .Border(0.5f).BorderColor("#E0E0E0")
                                        .Padding(10)
                                        .Column(card =>
                                        {
                                            try
                                            {
                                                var imageBytes = httpClient
                                                    .GetByteArrayAsync(evidencia.Url).Result;

                                                card.Item()
                                                    .Text(evidencia.Actividad?.Nombre ?? "Actividad")
                                                    .FontSize(9).Bold().FontColor(PicsoColors.Basalt);

                                                card.Item()
                                                    .Text($"Semana {evidencia.NumeroSemana ?? 0}")
                                                    .FontSize(7.5f).FontColor(PicsoColors.Alloy);

                                                card.Item().PaddingVertical(6)
                                                    .Height(130)
                                                    .Image(imageBytes).FitArea();

                                                card.Item()
                                                    .Text($"Subida: {evidencia.FechaSubida:dd/MM/yyyy}")
                                                    .FontSize(7.5f).FontColor(PicsoColors.Alloy);
                                            }
                                            catch
                                            {
                                                card.Item()
                                                    .Text("No se pudo cargar la evidencia.")
                                                    .FontSize(8.5f).FontColor(PicsoColors.Red);
                                            }
                                        });
                                }
                            });
                    });
                }
            })
            .GeneratePdf(stream);

            return stream.ToArray();
        }

        // ─────────────────────────────────────────────────────────────
        //  HEADER
        // ─────────────────────────────────────────────────────────────
        private void BuildHeader(PageDescriptor page, string titulo)
        {
            var logoPath = Path.Combine(
                Directory.GetCurrentDirectory(), "Assets", "Logo", "Logopicso.png");

            page.Header()
                .Background(PicsoColors.Alloy)
                .PaddingHorizontal(20).PaddingVertical(5)
                .Row(row =>
                {
                    row.ConstantItem(36).AlignMiddle()
                        .Image(logoPath).FitArea();
                    row.ConstantItem(10);
                    row.RelativeItem().AlignMiddle().AlignCenter().Column(col =>
                    {
                        col.Item().AlignCenter()
                            .Text(titulo)
                            .FontSize(13).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter()
                            .Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}")
                            .FontSize(7).FontColor(PicsoColors.Arena);
                    });
                    row.ConstantItem(46);
                });
        }

        // ─────────────────────────────────────────────────────────────
        //  FOOTER
        // ─────────────────────────────────────────────────────────────
        private void BuildFooter(PageDescriptor page)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text("PICSO INGENIERÍA  ·  Informe de avance de obra")
                        .FontSize(7).FontColor(PicsoColors.Green);

                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pág. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

        // ─────────────────────────────────────────────────────────────
        //  KPI CARD
        // ─────────────────────────────────────────────────────────────
        private void BuildKpiCard(RowDescriptor row, string label, string value, string accentColor)
        {
            row.RelativeItem()
                .Background(PicsoColors.LightBg)
                .Border(0.5f).BorderColor("#E0E0E0")
                .PaddingVertical(10).PaddingHorizontal(8)
                .Column(col =>
                {
                    col.Item()
                        .Text(label)
                        .FontSize(6.5f).FontColor(PicsoColors.Alloy);
                    col.Item()
                        .Text(value)
                        .FontSize(15).Bold().FontColor(accentColor);
                });
        }

        // ─────────────────────────────────────────────────────────────
        //  BARRA DE PROGRESO
        // ─────────────────────────────────────────────────────────────
        private void BuildProgressBar(IContainer container, double porcentaje)
        {
            var pct = Math.Clamp(porcentaje / 100.0, 0, 1);

            container.Column(col =>
            {
                col.Item()
                    .Background("#E8E8E8")
                    .Height(7)
                    .Row(row =>
                    {
                        if (pct > 0)
                            row.RelativeItem((float)pct).Background(PicsoColors.Green);
                        if (pct < 1)
                            row.RelativeItem((float)(1 - pct));
                    });
            });
        }

        // ─────────────────────────────────────────────────────────────
        //  CURVA S – lógica original preservada
        // ─────────────────────────────────────────────────────────────
        private int GetSlotProyecto(DateTime fecha, List<DateTime> timeline)
        {
            for (int i = 0; i < timeline.Count; i++)
            {
                if (fecha >= timeline[i] && fecha < timeline[i].AddDays(7))
                    return i;
            }
            return -1;
        }

        private List<CurvaSSemanaDto> CalcularCurvaSemanal(List<ActividadGantt> actividades)
        {
            var resultado = new List<CurvaSSemanaDto>();

            if (actividades == null || !actividades.Any())
                return resultado;

            var fechaMin = actividades.Min(a => a.FechaInicio);
            var fechaMax = actividades.Max(a => a.FechaFin);

            var inicioTimeline = fechaMin;
            var dia  = (int)inicioTimeline.DayOfWeek;
            var diff = dia == 0 ? -6 : 1 - dia;
            inicioTimeline = inicioTimeline.AddDays(diff).Date;

            var totalSemanas = (int)Math.Ceiling(
                ((fechaMax.Date - inicioTimeline.Date).TotalDays + 1) / 7.0);

            var timeline = Enumerable.Range(0, totalSemanas)
                .Select(i => inicioTimeline.AddDays(i * 7))
                .ToList();

            var totalProyecto      = actividades.Sum(a => a.CantidadTotal);
            var planAcumulado      = new List<double>();
            double ejecutadoGlobal = 0;

            for (int i = 0; i < timeline.Count; i++)
            {
                double planTotal           = 0;
                double ejecutadoEnEsteSlot = 0;
                bool   huboAvance          = false;

                foreach (var act in actividades)
                {
                    var slotInicio = GetSlotProyecto(act.FechaInicio, timeline);
                    var slotFin    = GetSlotProyecto(act.FechaFin,    timeline);

                    if (slotInicio < 0 || slotFin < 0) continue;

                    var duracion = slotFin - slotInicio + 1;

                    if (i >= slotInicio && i <= slotFin)
                        planTotal += (double)act.CantidadTotal * (double)(i - slotInicio + 1) / duracion;
                    else if (i > slotFin)
                        planTotal += (double)act.CantidadTotal;

                    var ejecutadoSemana = act.Avances
                        .Where(a => a.NumeroSemana == i + 1)
                        .Sum(a => a.CantidadEjecutada);

                    if (ejecutadoSemana > 0) huboAvance = true;
                    ejecutadoEnEsteSlot += (double)ejecutadoSemana;
                }

                ejecutadoGlobal += ejecutadoEnEsteSlot;

                var pctPlan = totalProyecto == 0 ? 0 : planTotal / (double)totalProyecto * 100;
                var pctReal = totalProyecto == 0 ? 0 : ejecutadoGlobal / (double)totalProyecto * 100;

                if (i > 0 && pctPlan < planAcumulado[i - 1])
                    pctPlan = planAcumulado[i - 1];

                planAcumulado.Add(pctPlan);

                resultado.Add(new CurvaSSemanaDto
                {
                    Fecha      = timeline[i].ToString("dd/MM/yyyy"),
                    Planeado   = Math.Round(pctPlan, 1),
                    Ejecutado  = Math.Round(pctReal, 1),
                    HuboAvance = huboAvance
                });
            }

            return resultado;
        }
    }
}