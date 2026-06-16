using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;
using testback.Models;

namespace testback.Services.Pdf
{
    public class EvaluacionAlturasPdfService
    {
        // ── PALETA PICSO (igual que InformePdfService) ───────────────
        private static class PicsoColors
        {
            public const string Green   = "#B7CC12";
            public const string Basalt  = "#4F4E4D";
            public const string Alloy   = "#6D6D73";
            public const string Arena   = "#E9E0DB";
            public const string White   = "#FFFFFF";
            public const string LightBg = "#F7F6F3";
            public const string Dark    = "#2C2C2C";
            public const string Mid     = "#787878";
            public const string Red     = "#D94F3D";
        }

        private readonly IWebHostEnvironment _env;

        public EvaluacionAlturasPdfService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string LogoPath =>
            System.IO.Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        // ════════════════════════════════════════════════════════════
        //  MÉTODO PRINCIPAL
        // ════════════════════════════════════════════════════════════
        public byte[] Generar(
            PermisoTrabajoAlturas permiso,
            PersonalAutorizado persona,
            ComprobacionPrevia evaluacion)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(9).FontColor(PicsoColors.Dark));

                    BuildHeader(page, "Evaluación Trabajo en Alturas", "SST-FR-20", "5", "16/01/2024");
                    BuildFooter(page, "Evaluación Trabajo en Alturas");

                    page.Content().Column(col =>
                    {
                        col.Spacing(6);

                        // DATOS DEL PERMISO
                        SectionHeader(col, "DATOS DEL PERMISO");
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            FilaTabla(t, "Fecha inicio:", permiso.FechaInicio?.ToString("dd/MM/yyyy") ?? "N/A", "Fecha fin:", permiso.FechaFinalizacion?.ToString("dd/MM/yyyy") ?? "N/A");
                            FilaTabla(t, "Lugar:", permiso.LugarEjecucion ?? "N/A", "Altura aprox.:", $"{permiso.AlturaAproximada} m");
                            FilaTabla(t, "Tipo trabajo:", permiso.TipoTrabajoRealizar ?? "N/A", "Trabajo eléctrico:", permiso.TrabajoElectrico == true ? "Sí" : "No");
                        });

                        // RESPONSABLES
                        SectionHeader(col, "RESPONSABLES");
                        col.Item().Column(c =>
                        {
                            EmpleadoFila(c, "Responsable:", permiso.ResponsablePermisoEmpleado);
                            EmpleadoFila(c, "Ayudante de seguridad:", permiso.AyudanteSeguridadEmpleado);
                            EmpleadoFila(c, "Autoriza el trabajo:", permiso.PersonaAutorizaEmpleado);
                            EmpleadoFila(c, "Coordinador trabajo en alturas:", permiso.CoordinadorTrabajoAlturasEmpleado);
                        });

                        // PLAN DE EMERGENCIA
                        SectionHeader(col, "PLAN DE EMERGENCIA");
                        var r = permiso.ResponsablesPlanEmergencia?.FirstOrDefault();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            FilaTabla(t, "Responsable:", r?.Empleado?.NombreCompleto ?? "N/A", "Cédula:", r?.Empleado?.Cedula ?? "N/A");
                            FilaTabla(t, "Cargo:", r?.Empleado?.Cargo ?? "N/A", "", "");
                        });

                        // PERSONAL AUTORIZADO
                        SectionHeader(col, "PERSONAL AUTORIZADO");
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            FilaTabla(t, "Nombre:", persona.Nombres ?? "N/A", "Certificación:", persona.Certificacion ?? "N/A");
                            FilaTabla(t, "Seguridad Social:", persona.ActivoSeguridadSocial ? "Activo" : "No activo", "", "");
                        });

                        // DESCRIPCIÓN
                        SectionHeader(col, "DESCRIPCIÓN DE LA TAREA");
                        col.Item().Column(c =>
                        {
                            c.Item().Row(row => {
                                row.ConstantItem(80).Text("Descripción:").Bold();
                                row.RelativeItem().Text(permiso.DescripcionTarea ?? "N/A");
                            });
                            c.Item().Row(row => {
                                row.ConstantItem(80).Text("Herramientas:").Bold();
                                row.RelativeItem().Text(permiso.HerramientaUtilizar ?? "N/A");
                            });
                        });

                        // MEDIDAS DE PREVENCIÓN
                        var medidas = new List<string>();
                        try { medidas = JsonSerializer.Deserialize<List<string>>(permiso.MedidaPrevencionProteccion ?? "[]") ?? []; } catch { }

                        SectionHeader(col, "MEDIDAS DE PREVENCIÓN");
                        if (!medidas.Any())
                            col.Item().Text("No se registran medidas de prevención.").FontColor(PicsoColors.Mid);
                        else
                            for (int i = 0; i < medidas.Count; i++)
                                col.Item().Text($"{i + 1}. {medidas[i]}");

                        if (!string.IsNullOrEmpty(permiso.OtroAcceso))
                            col.Item().Row(row => { row.ConstantItem(120).Text("Otra medida / acceso:").Bold(); row.RelativeItem().Text(permiso.OtroAcceso); });

                        // EPP
                        var epp = new List<string>();
                        try { epp = JsonSerializer.Deserialize<List<string>>(permiso.ProteccionPersonal ?? "[]") ?? []; } catch { }

                        SectionHeader(col, "ELEMENTOS DE PROTECCIÓN PERSONAL");
                        if (!epp.Any())
                            col.Item().Text("No se registran elementos de protección personal.").FontColor(PicsoColors.Mid);
                        else
                            for (int i = 0; i < epp.Count; i++)
                                col.Item().Text($"{i + 1}. {epp[i]}");

                        if (!string.IsNullOrEmpty(permiso.OtrosElementos))
                            col.Item().Row(row => { row.ConstantItem(120).Text("Otros elementos:").Bold(); row.RelativeItem().Text(permiso.OtrosElementos); });

                        // OBSERVACIONES
                        SectionHeader(col, "OBSERVACIONES");
                        col.Item().Text(permiso.Observaciones ?? "No se registran observaciones.").FontColor(PicsoColors.Mid);

                        // EVALUACIÓN
                        SectionHeader(col, "RESULTADOS DE LA EVALUACIÓN");
                        Dictionary<string, object>? evalData = null;
                        try { evalData = JsonSerializer.Deserialize<Dictionary<string, object>>(evaluacion.EvaluacionJson ?? "{}"); } catch { }

                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(5); c.RelativeColumn(1); });

                            for (int i = 0; i < ItemsComprobacion.Count; i++)
                            {
                                var raw      = evalData != null && evalData.TryGetValue($"item{i + 1}", out var v) ? v?.ToString() : null;
                                var resultado = ObtenerResultado(raw);
                                var dia       = ObtenerDia(raw);
                                var bg        = i % 2 == 0 ? PicsoColors.LightBg : PicsoColors.White;

                                t.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4)
                                    .Text($"{i + 1}. {ItemsComprobacion[i]}").FontSize(8.5f);

                                var textoRes = resultado == "SI" ? $"Sí{(dia != null ? $" ({dia})" : "")}" : resultado ?? "N/A";
                                var colorRes = resultado == "SI" ? PicsoColors.Green
                                    : resultado == "NO" ? PicsoColors.Red : PicsoColors.Mid;

                                t.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).AlignRight()
                                    .Text(textoRes).FontSize(8.5f).Bold().FontColor(colorRes);
                            }
                        });

                        // FIRMAS
                        SectionHeader(col, "FIRMAS");
                        col.Item().Row(row =>
                        {
                            // Firma trabajador
                            row.RelativeItem().PaddingRight(10).Column(c =>
                            {
                                c.Item().Text("Firma del trabajador").Bold();
                                if (!string.IsNullOrEmpty(evaluacion.FirmaEmpleadoBase64))
                                {
                                    try
                                    {
                                        var raw = evaluacion.FirmaEmpleadoBase64.Contains(",")
                                            ? evaluacion.FirmaEmpleadoBase64.Split(',')[1]
                                            : evaluacion.FirmaEmpleadoBase64;
                                        c.Item().Height(50).Image(Convert.FromBase64String(raw)).FitArea();
                                    }
                                    catch { }
                                }
                                c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                                c.Item().Text($"Nombre: {persona.Nombres ?? "N/A"}").FontSize(8);
                                c.Item().Text($"Cédula: {persona.Empleado?.Cedula ?? "N/A"}").FontSize(8);
                                c.Item().Text($"Cargo: {persona.Empleado?.Cargo ?? "Trabajador"}").FontSize(8);
                            });

                            // Firma responsable
                            row.RelativeItem().PaddingLeft(10).Column(c =>
                            {
                                c.Item().Text("Firma responsable").Bold();
                                if (!string.IsNullOrEmpty(permiso.FirmaResponsableBase64))
                                {
                                    try
                                    {
                                        var raw = permiso.FirmaResponsableBase64.Contains(",")
                                            ? permiso.FirmaResponsableBase64.Split(',')[1]
                                            : permiso.FirmaResponsableBase64;
                                        c.Item().Height(50).Image(Convert.FromBase64String(raw)).FitArea();
                                    }
                                    catch { }
                                }
                                c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                                c.Item().Text($"Nombre: {permiso.ResponsablePermisoEmpleado?.NombreCompleto ?? "N/A"}").FontSize(8);
                                c.Item().Text($"Cédula: {permiso.ResponsablePermisoEmpleado?.Cedula ?? "N/A"}").FontSize(8);
                                c.Item().Text($"Cargo: {permiso.ResponsablePermisoEmpleado?.Cargo ?? "Responsable SST"}").FontSize(8);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        // ════════════════════════════════════════════════════════════
        //  HEADER — idéntico al Gantt
        // ════════════════════════════════════════════════════════════
        private void BuildHeader(PageDescriptor page, string titulo, string codigo, string version, string fecha)
        {
            page.Header()
                .Background(PicsoColors.Alloy)
                .PaddingHorizontal(20).PaddingVertical(5)
                .Row(row =>
                {
                    row.ConstantItem(36).AlignMiddle()
                        .Image(LogoPath).FitArea();
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
                    row.ConstantItem(90).AlignMiddle().AlignRight().Column(col =>
                    {
                        col.Item().AlignRight().Text($"Código: {codigo}").FontSize(7).FontColor(PicsoColors.Arena);
                        col.Item().AlignRight().Text($"Versión: {version}").FontSize(7).FontColor(PicsoColors.Arena);
                        col.Item().AlignRight().Text($"Fecha: {fecha}").FontSize(7).FontColor(PicsoColors.Arena);
                    });
                });
        }

        // ════════════════════════════════════════════════════════════
        //  FOOTER — idéntico al Gantt
        // ════════════════════════════════════════════════════════════
        private static void BuildFooter(PageDescriptor page, string docName)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text($"PICSO INGENIERÍA  ·  {docName}")
                        .FontSize(7).FontColor(PicsoColors.Green);
                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pág. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

        // ════════════════════════════════════════════════════════════
        //  HELPERS
        // ════════════════════════════════════════════════════════════
        private static void SectionHeader(ColumnDescriptor col, string titulo)
        {
            col.Item()
                .Background(PicsoColors.Basalt)
                .PaddingVertical(4).PaddingHorizontal(5)
                .Text(titulo)
                .FontSize(9).Bold().FontColor(PicsoColors.White);
        }

        private static void FilaTabla(TableDescriptor t, string l1, string v1, string l2, string v2)
        {
            t.Cell().PaddingVertical(2).PaddingHorizontal(4).Row(r => {
                r.ConstantItem(80).Text(l1).Bold().FontSize(8.5f);
                r.RelativeItem().Text(v1).FontSize(8.5f);
            });
            t.Cell().PaddingVertical(2).PaddingHorizontal(4).Row(r => {
                r.ConstantItem(80).Text(l2).Bold().FontSize(8.5f);
                r.RelativeItem().Text(v2).FontSize(8.5f);
            });
        }

        private static void EmpleadoFila(ColumnDescriptor c, string titulo, Empleado? emp)
        {
            c.Item().Table(t =>
            {
                t.ColumnsDefinition(cols => { cols.RelativeColumn(); cols.RelativeColumn(); });
                FilaTabla(t, titulo, emp?.NombreCompleto ?? "N/A", "CC:", emp?.Cedula ?? "N/A");
                FilaTabla(t, "Cargo:", emp?.Cargo ?? "N/A", "", "");
            });
        }

        private static readonly List<string> ItemsComprobacion = new()
        {
            "¿El trabajador cuenta con el equipo de protección contra caídas?",
            "¿El trabajador ha recibido capacitación en trabajo en alturas?",
            "¿Se verificó el estado del arnés y sus componentes?",
            "¿Se inspeccionaron los puntos de anclaje?",
            "¿El área de trabajo está debidamente señalizada?",
            "¿Se cuenta con el permiso de trabajo autorizado?",
            "¿El trabajador conoce el plan de rescate?",
            "¿Se verificaron las condiciones climáticas?",
            "¿El trabajador está en buen estado de salud?",
            "¿Se realizó la inspección preoperacional de equipos?"
        };

        private static string? ObtenerResultado(string? raw)
        {
            if (raw == null) return null;
            if (raw.Contains("SI", StringComparison.OrdinalIgnoreCase)) return "SI";
            if (raw.Contains("NO", StringComparison.OrdinalIgnoreCase)) return "NO";
            return raw;
        }

        private static string? ObtenerDia(string? raw)
        {
            if (raw == null) return null;
            var match = System.Text.RegularExpressions.Regex.Match(raw, @"\(([^)]+)\)");
            return match.Success ? match.Groups[1].Value : null;
        }
    }
}
