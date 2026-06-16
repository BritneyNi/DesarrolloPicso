using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;
using testback.Models;

namespace testback.Services.Pdf
{
    public class PermisoCalientePdfService
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
            public const string Red     = "#D94F3D";
        }

        private readonly IWebHostEnvironment _env;

        public PermisoCalientePdfService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string LogoPath =>
            System.IO.Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        public byte[] Generar(
            PermisoEnCaliente permiso,
            PermisoEnCalientePersonal personal,
            PermisoEnCalienteEvaluacion evaluacion)
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

                        // DATOS DEL PERMISO
                        SectionHeader(col, "DATOS DEL PERMISO");
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                            FilaTabla(t, "Empresa:", permiso.NombreEmpresa ?? "N/A", "NIT:", permiso.Nit ?? "N/A");
                            FilaTabla(t, "Proyecto:", permiso.Proyecto ?? "N/A", "N° Permiso:", permiso.NumeroPermiso ?? "N/A");
                            FilaTabla(t, "Fecha inicio:", permiso.FechaInicio?.ToString("dd/MM/yyyy") ?? "N/A", "Fecha cierre:", permiso.FechaCierre?.ToString("dd/MM/yyyy") ?? "N/A");
                            FilaTabla(t, "Tipo de trabajo:", permiso.TipoTrabajo ?? "N/A", "", "");
                        });
                        col.Item().Row(r => { r.ConstantItem(80).Text("Herramientas:").Bold().FontSize(8.5f); r.RelativeItem().Text(permiso.Herramientas ?? "N/A").FontSize(8.5f); });
                        col.Item().Row(r => { r.ConstantItem(80).Text("Descripción:").Bold().FontSize(8.5f); r.RelativeItem().Text(permiso.DescripcionTarea ?? "N/A").FontSize(8.5f); });

                        // EPP
                        SectionHeader(col, "ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)");
                        if (!permiso.ElementosProteccion.Any())
                            col.Item().Text("No se registran EPP.").FontColor(PicsoColors.Mid);
                        else
                            foreach (var epp in permiso.ElementosProteccion)
                                col.Item().Text($"•  {epp}");

                        // PELIGROS
                        SectionHeader(col, "PELIGROS IDENTIFICADOS");
                        if (!permiso.Peligros.Any())
                            col.Item().Text("No se registran peligros.").FontColor(PicsoColors.Mid);
                        else
                            foreach (var p in permiso.Peligros)
                                col.Item().Text($"•  {p}");

                        // EVALUACIÓN
                        SectionHeader(col, "EVALUACIÓN");
                        List<Dictionary<string, object>>? items = null;
                        try { items = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(evaluacion.EvaluacionJson ?? "[]"); } catch { }

                        if (items == null || !items.Any())
                        {
                            col.Item().Text("No se registran ítems de evaluación.").FontColor(PicsoColors.Mid);
                        }
                        else
                        {
                            col.Item().Table(t =>
                            {
                                t.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(1.5f); c.RelativeColumn(1.5f); });
                                t.Cell().Background(PicsoColors.Basalt).PaddingVertical(4).PaddingHorizontal(4).Text("Ítem").FontSize(8).Bold().FontColor(PicsoColors.White);
                                t.Cell().Background(PicsoColors.Basalt).PaddingVertical(4).PaddingHorizontal(4).AlignCenter().Text("Respuesta").FontSize(8).Bold().FontColor(PicsoColors.White);
                                t.Cell().Background(PicsoColors.Basalt).PaddingVertical(4).PaddingHorizontal(4).AlignCenter().Text("Días").FontSize(8).Bold().FontColor(PicsoColors.White);

                                for (int i = 0; i < items.Count; i++)
                                {
                                    var item      = items[i];
                                    var bg        = i % 2 == 0 ? PicsoColors.LightBg : PicsoColors.White;
                                    var itemText  = item.TryGetValue("item",      out var it) ? it?.ToString() ?? "" : "";
                                    var respuesta = item.TryGetValue("respuesta", out var rr) ? rr?.ToString() ?? "—" : "—";
                                    var diasTexto = "—";
                                    if (item.TryGetValue("dias", out var diasObj) && diasObj != null)
                                    {
                                        try
                                        {
                                            var diasDict = JsonSerializer.Deserialize<Dictionary<string, bool>>(diasObj.ToString()!);
                                            diasTexto = string.Join(", ", diasDict?.Where(d => d.Value).Select(d => d.Key) ?? []);
                                            if (string.IsNullOrEmpty(diasTexto)) diasTexto = "—";
                                        }
                                        catch { }
                                    }

                                    var colorRes = respuesta.Equals("SI", StringComparison.OrdinalIgnoreCase) ? PicsoColors.Green
                                        : respuesta.Equals("NO", StringComparison.OrdinalIgnoreCase) ? PicsoColors.Red : PicsoColors.Mid;

                                    t.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).Text($"{i + 1}. {itemText}").FontSize(8);
                                    t.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).AlignCenter().Text(respuesta).FontSize(8).Bold().FontColor(colorRes);
                                    t.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).AlignCenter().Text(diasTexto).FontSize(8).FontColor(PicsoColors.Mid);
                                }
                            });
                        }

                        // FIRMAS
                        SectionHeader(col, "FIRMAS");
                        var autorizantes = permiso.Autorizantes?.ToList() ?? [];
                        int totalCols = 1 + Math.Min(autorizantes.Count, 3);

                        col.Item().Row(row =>
                        {
                            // Trabajador
                            row.RelativeItem().PaddingRight(8).Column(c =>
                            {
                                c.Item().Text("Trabajador").Bold();
                                c.Item().Text(personal.Empleado?.NombreCompleto ?? "N/A").FontSize(8);
                                c.Item().Text($"Cédula: {personal.Empleado?.Cedula ?? "N/A"}").FontSize(8).FontColor(PicsoColors.Mid);
                                c.Item().Text($"Cargo: {personal.Empleado?.Cargo ?? "—"}").FontSize(8).FontColor(PicsoColors.Mid);
                                if (!string.IsNullOrEmpty(personal.FirmaBase64))
                                {
                                    try
                                    {
                                        var raw = personal.FirmaBase64.Contains(",") ? personal.FirmaBase64.Split(',')[1] : personal.FirmaBase64;
                                        c.Item().Height(40).Image(Convert.FromBase64String(raw)).FitArea();
                                    }
                                    catch { }
                                }
                                else c.Item().Text("Firma no registrada").FontSize(8).Italic().FontColor(PicsoColors.Mid);
                                c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                            });

                            // Autorizantes
                            foreach (var a in autorizantes.Take(3))
                            {
                                row.RelativeItem().PaddingLeft(8).Column(c =>
                                {
                                    c.Item().Text("Autoriza").Bold();
                                    c.Item().Text(a.Empleado?.NombreCompleto ?? "N/A").FontSize(8);
                                    c.Item().Text($"Cédula: {a.Empleado?.Cedula ?? "N/A"}").FontSize(8).FontColor(PicsoColors.Mid);
                                    if (!string.IsNullOrEmpty(a.FirmaBase64))
                                    {
                                        try
                                        {
                                            var raw = a.FirmaBase64.Contains(",") ? a.FirmaBase64.Split(',')[1] : a.FirmaBase64;
                                            c.Item().Height(40).Image(Convert.FromBase64String(raw)).FitArea();
                                        }
                                        catch { }
                                    }
                                    else c.Item().Text("Firma no registrada").FontSize(8).Italic().FontColor(PicsoColors.Mid);
                                    c.Item().BorderBottom(0.5f).BorderColor(PicsoColors.Basalt).PaddingBottom(2);
                                });
                            }
                        });
                    });
                });
            }).GeneratePdf();
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
                        col.Item().AlignCenter().Text("Permiso de Trabajo en Caliente").FontSize(13).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter().Text("Para Altas y Bajas Temperaturas").FontSize(9).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(7).FontColor(PicsoColors.Arena);
                    });
                    row.ConstantItem(90).AlignMiddle().AlignRight().Column(col =>
                    {
                        col.Item().AlignRight().Text("Código: SST-FR-09").FontSize(7).FontColor(PicsoColors.Arena);
                        col.Item().AlignRight().Text("Versión: 3").FontSize(7).FontColor(PicsoColors.Arena);
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
                        .Text("PICSO INGENIERÍA  ·  Permiso de Trabajo en Caliente")
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
