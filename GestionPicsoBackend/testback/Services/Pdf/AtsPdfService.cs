using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using testback.Models;

namespace testback.Services.Pdf
{
    public class AtsPdfService
    {
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
        }

        private readonly IWebHostEnvironment _env;

        public AtsPdfService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string LogoPath =>
            System.IO.Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        public byte[] GenerarIndividual(Ats ats, Actividad actividad)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(9).FontColor(PicsoColors.Dark));
                    BuildHeader(page);
                    BuildFooter(page);
                    page.Content().Column(col =>
                    {
                        col.Spacing(6);
                        AgregarContenido(col, ats, actividad);
                    });
                });
            }).GeneratePdf();
        }

        public byte[] GenerarMasivo(Ats ats)
        {
            var actividades = ats.Actividades?.ToList() ?? [];

            return Document.Create(container =>
            {
                for (int i = 0; i < actividades.Count; i++)
                {
                    var act = actividades[i];
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(20);
                        page.DefaultTextStyle(x => x.FontSize(9).FontColor(PicsoColors.Dark));
                        BuildHeader(page);
                        BuildFooter(page);
                        page.Content().Column(col =>
                        {
                            col.Spacing(6);
                            AgregarContenido(col, ats, act);
                        });
                    });
                }
            }).GeneratePdf();
        }

        private void AgregarContenido(ColumnDescriptor col, Ats ats, Actividad act)
        {
            // DATOS GENERALES
            SectionHeader(col, "DATOS GENERALES");
            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                var fechaInicio = act.Fecha.HasValue ? act.Fecha.Value.ToLocalTime().ToString("dd/MM/yyyy") : "N/A";
                var fechaFin    = act.FechaFin.HasValue ? act.FechaFin.Value.ToLocalTime().ToString("dd/MM/yyyy") : "N/A";
                FilaTabla(t, "Fecha inicio:", fechaInicio, "Fecha fin:", fechaFin);
                FilaTabla(t, "Proyecto:", act.EmpresaContratista, "Tipo permiso:", act.TipoPermiso ?? "N/A");
                FilaTabla(t, "Realizado por:", ats.ResponsableAts, "Responsable SST:", ats.Responsable);
            });
            col.Item().Row(r => { r.ConstantItem(100).Text("Trabajo a realizar:").Bold().FontSize(8.5f); r.RelativeItem().Text(act.TrabajoARealizar).FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("Equipos a utilizar:").Bold().FontSize(8.5f); r.RelativeItem().Text(act.EquiposAUtilizar).FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("Equipo emergencia:").Bold().FontSize(8.5f); r.RelativeItem().Text(act.EquiposEmergencia ?? "N/A").FontSize(8.5f); });

            // ANÁLISIS DE RIESGOS
            SectionHeader(col, "ANÁLISIS DE RIESGOS");
            col.Item().Row(r => { r.ConstantItem(100).Text("Descripción:").Bold().FontSize(8.5f); r.RelativeItem().Text(ats.Descripcion ?? "N/A").FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("Peligros:").Bold().FontSize(8.5f); r.RelativeItem().Text(ats.Peligros ?? "N/A").FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("Riesgos:").Bold().FontSize(8.5f); r.RelativeItem().Text(ats.Riesgo ?? "N/A").FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("¿Qué puede suceder?:").Bold().FontSize(8.5f); r.RelativeItem().Text(ats.QueSucede ?? "N/A").FontSize(8.5f); });
            col.Item().Row(r => { r.ConstantItem(100).Text("¿Qué debo hacer?:").Bold().FontSize(8.5f); r.RelativeItem().Text(ats.QueHacer ?? "N/A").FontSize(8.5f); });

            // OBSERVACIONES
            if (!string.IsNullOrEmpty(act.Observacion))
            {
                SectionHeader(col, "OBSERVACIONES");
                col.Item().Text(act.Observacion).FontColor(PicsoColors.Mid);
            }

            // FIRMAS
            SectionHeader(col, "FIRMAS");
            col.Item().Row(row =>
            {
                // Firma empleado
                row.RelativeItem().PaddingRight(10).Column(c =>
                {
                    c.Item().Text("Empleado").Bold();
                    c.Item().Text(act.Empleado?.NombreCompleto ?? "N/A").FontSize(8);
                    c.Item().Text($"Cédula: {act.Empleado?.Cedula ?? "N/A"}").FontSize(8).FontColor(PicsoColors.Mid);
                    c.Item().Text($"Cargo: {act.Empleado?.Cargo ?? "—"}").FontSize(8).FontColor(PicsoColors.Mid);
                    if (!string.IsNullOrEmpty(act.FirmaEmpleado))
                    {
                        try
                        {
                            var raw = act.FirmaEmpleado.Contains(",") ? act.FirmaEmpleado.Split(',')[1] : act.FirmaEmpleado;
                            c.Item().Height(40).Image(Convert.FromBase64String(raw)).FitArea();
                        }
                        catch { }
                    }
                    else c.Item().Text("Firma no registrada").FontSize(8).Italic().FontColor(PicsoColors.Mid);
                    c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                });

                // Firma responsable SST
                row.RelativeItem().PaddingLeft(10).Column(c =>
                {
                    c.Item().Text("Responsable SST").Bold();
                    c.Item().Text(ats.Responsable ?? "N/A").FontSize(8);
                    if (!string.IsNullOrEmpty(ats.FirmaSst))
                    {
                        try
                        {
                            var raw = ats.FirmaSst.Contains(",") ? ats.FirmaSst.Split(',')[1] : ats.FirmaSst;
                            c.Item().Height(40).Image(Convert.FromBase64String(raw)).FitArea();
                        }
                        catch { }
                    }
                    else c.Item().Text("Firma no registrada").FontSize(8).Italic().FontColor(PicsoColors.Mid);
                    c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                });
            });
        }

        private void BuildHeader(PageDescriptor page)
        {
            page.Header()
                .Background(PicsoColors.Alloy)
                .PaddingHorizontal(20).PaddingVertical(5)
                .Row(row =>
                {
                    row.ConstantItem(36).AlignMiddle().Image(LogoPath).FitArea();
                    row.ConstantItem(10);
                    row.RelativeItem().AlignMiddle().AlignCenter().Column(col =>
                    {
                        col.Item().AlignCenter().Text("Análisis de Trabajo Seguro (ATS)").FontSize(13).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(7).FontColor(PicsoColors.Arena);
                    });
                    row.ConstantItem(90).AlignMiddle().AlignRight().Column(col =>
                    {
                        col.Item().AlignRight().Text("Código: PS-SST-04").FontSize(7).FontColor(PicsoColors.Arena);
                        col.Item().AlignRight().Text("Versión: 2").FontSize(7).FontColor(PicsoColors.Arena);
                        col.Item().AlignRight().Text("Fecha: 11/08/2025").FontSize(7).FontColor(PicsoColors.Arena);
                    });
                });
        }

        private static void BuildFooter(PageDescriptor page)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text("PICSO INGENIERÍA  ·  Análisis de Trabajo Seguro")
                        .FontSize(7).FontColor(PicsoColors.Green);
                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pág. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

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
    }
}
