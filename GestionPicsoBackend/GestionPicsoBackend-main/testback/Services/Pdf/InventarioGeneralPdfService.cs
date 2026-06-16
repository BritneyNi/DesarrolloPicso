using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using testback.Dtos;

namespace testback.Services.Pdf
{
    public class InventarioGeneralPdfService
    {
        private readonly IWebHostEnvironment _env;

        public InventarioGeneralPdfService(IWebHostEnvironment env) { _env = env; }

        private string LogoPath => Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        private void BuildHeader(PageDescriptor page, string titulo)
        {
            page.Header()
                .Background(PicsoColors.Alloy)
                .PaddingHorizontal(20).PaddingVertical(8)
                .Row(row =>
                {
                    row.ConstantItem(46).AlignMiddle().Element(c =>
                    {
                        if (File.Exists(LogoPath)) c.Image(LogoPath).FitArea();
                    });
                    row.ConstantItem(10);
                    row.RelativeItem().AlignMiddle().AlignCenter().Column(col =>
                    {
                        col.Item().AlignCenter()
                            .Text(titulo).FontSize(13).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter()
                            .Text($"Generado: {DateTime.Now:dd/MM/yyyy  HH:mm}")
                            .FontSize(8).FontColor(PicsoColors.Arena);
                    });
                    row.ConstantItem(56);
                });
        }

        private void BuildFooter(PageDescriptor page, string subtitulo)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text($"PICSO INGENIERÍA  ·  {subtitulo}")
                        .FontSize(7).FontColor(PicsoColors.Green);
                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pág. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

        public byte[] Generar(
            List<InventarioGeneralPdfDto> data,
            Dictionary<int, List<InventarioElementoDetallePdfDto>> detallePorElemento,
            int totalOk,
            int totalBajo,
            int totalAgotado,
            string? graficoBase64)
        {
            byte[]? grafico = null;
            if (!string.IsNullOrWhiteSpace(graficoBase64))
            {
                var base64 = graficoBase64.Replace("data:image/png;base64,", "");
                grafico = Convert.FromBase64String(base64);
            }

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    BuildHeader(page, "Reporte General de Inventario EPP");
                    BuildFooter(page, "Inventario general EPP");

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(column =>
                    {
                        column.Spacing(15);

                        // KPI Cards
                        column.Item().Row(r =>
                        {
                            r.Spacing(10);
                            Card(r.RelativeItem(), "Stock OK",           totalOk,      PicsoColors.Green);
                            Card(r.RelativeItem(), "Stock Bajo",         totalBajo,    PicsoColors.Red);
                            Card(r.RelativeItem(), "Sin disponibilidad", totalAgotado, "#E67E22");
                        });

                        // Gráfico
                        if (grafico != null)
                            column.Item().Height(180).AlignCenter().Image(grafico).FitArea();

                        column.Item().LineHorizontal(1).LineColor(PicsoColors.Alloy);

                        // Elementos
                        foreach (var item in data)
                        {
                            column.Item()
                                .Padding(8).Border(0.5f).BorderColor("#E0E0E0")
                                .Background(PicsoColors.White)
                                .Column(col =>
                                {
                                    col.Spacing(6);

                                    col.Item().Text(item.ElementoNombre)
                                        .Bold().FontSize(12).FontColor(PicsoColors.Basalt);
                                    col.Item().LineHorizontal(0.5f).LineColor(PicsoColors.Alloy);

                                    col.Item().ShowEntire().Element(c => TablaElemento(c, item));

                                    if (detallePorElemento.TryGetValue(item.ElementoEppId, out var detalle) && detalle.Any())
                                    {
                                        col.Item().PaddingTop(4)
                                            .Text("Detalle por talla y tipo")
                                            .Italic().FontSize(9).FontColor(PicsoColors.Alloy);
                                        col.Item().Element(c => TablaDetalle(c, detalle));
                                    }
                                });

                            column.Item().PaddingBottom(8);
                        }
                    });
                });
            }).GeneratePdf();
        }

        void Card(IContainer container, string titulo, int valor, string color)
        {
            container.Border(0.5f).BorderColor(color)
                .Background(PicsoColors.LightBg).Padding(12)
                .Column(c =>
                {
                    c.Spacing(4);
                    c.Item().Text(titulo).FontSize(9).FontColor(PicsoColors.Alloy);
                    c.Item().Text(valor.ToString()).Bold().FontSize(22).FontColor(color);
                });
        }

        void TablaElemento(IContainer container, InventarioGeneralPdfDto i)
        {
            int entregado = i.TotalCantidad - i.TotalDisponible;
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(90); cols.ConstantColumn(90);
                    cols.ConstantColumn(90); cols.RelativeColumn();
                });
                foreach (var label in new[] { "Total recibido", "Entregado", "Disponible", "Estado" })
                    table.Cell().Background(PicsoColors.Basalt)
                        .BorderBottom(2).BorderColor(PicsoColors.Green)
                        .PaddingVertical(5).PaddingHorizontal(5)
                        .Text(label).FontSize(8).Bold().FontColor(PicsoColors.White);

                table.Cell().PaddingVertical(4).AlignCenter().Text(i.TotalCantidad.ToString()).FontSize(9).FontColor(PicsoColors.Basalt);
                table.Cell().PaddingVertical(4).AlignCenter().Text(entregado.ToString()).FontSize(9).FontColor(PicsoColors.Alloy);
                table.Cell().PaddingVertical(4).AlignCenter().Text(i.TotalDisponible.ToString()).FontSize(9).FontColor(PicsoColors.Green);
                table.Cell().PaddingVertical(4).PaddingHorizontal(5).Text(i.Estado).FontSize(9).FontColor(PicsoColors.Basalt);
            });
        }

        void TablaDetalle(IContainer container, List<InventarioElementoDetallePdfDto> data)
        {
            container.PaddingTop(4).BorderLeft(2).BorderColor(PicsoColors.Alloy).PaddingLeft(8)
                .Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(); cols.RelativeColumn();
                        cols.ConstantColumn(80); cols.ConstantColumn(80);
                    });
                    foreach (var label in new[] { "Talla", "Tipo", "Total", "Disponible" })
                        table.Cell().Background(PicsoColors.LightBg)
                            .PaddingVertical(4).PaddingHorizontal(4)
                            .Text(label).FontSize(7.5f).Bold().FontColor(PicsoColors.Basalt);

                    bool alt = false;
                    foreach (var d in data)
                    {
                        var bg = alt ? PicsoColors.LightBg : PicsoColors.White; alt = !alt;
                        table.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).Text(d.Talla).FontSize(8).FontColor(PicsoColors.Basalt);
                        table.Cell().Background(bg).PaddingVertical(3).PaddingHorizontal(4).Text(d.Tipo).FontSize(8).FontColor(PicsoColors.Basalt);
                        table.Cell().Background(bg).PaddingVertical(3).AlignCenter().Text(d.CantidadTotal.ToString()).FontSize(8).FontColor(PicsoColors.Basalt);
                        table.Cell().Background(bg).PaddingVertical(3).AlignCenter().Text(d.CantidadDisponible.ToString()).FontSize(8).FontColor(PicsoColors.Green);
                    }
                });
        }
    }
}
