using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using testback.Dtos;
using ScottPlot;

namespace testback.Services.Pdf
{
    public class InventarioElementoPdfService
    {
        private readonly IWebHostEnvironment _env;

        public InventarioElementoPdfService(IWebHostEnvironment env) { _env = env; }

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

        private byte[] GenerarGraficaInventario(List<InventarioElementoDetallePdfDto> detalle)
        {
            var tallas = detalle.Select(d => d.Talla).ToArray();
            double[] total      = detalle.Select(d => (double)d.CantidadTotal).ToArray();
            double[] disponible = detalle.Select(d => (double)d.CantidadDisponible).ToArray();
            double[] entregado  = detalle.Select(d => (double)d.CantidadEntregada).ToArray();
            int n = tallas.Length;
            double[] baseXs      = Enumerable.Range(0, n).Select(i => (double)i).ToArray();
            double[] xsTotal     = baseXs.Select(x => x - 0.25).ToArray();
            double[] xsDisponible = baseXs;
            double[] xsEntregado = baseXs.Select(x => x + 0.25).ToArray();

            var plt = new Plot();
            var barsTotal      = plt.Add.Bars(xsTotal,      total);      barsTotal.Label      = "Total";
            var barsDisponible = plt.Add.Bars(xsDisponible, disponible); barsDisponible.Label = "Disponible";
            var barsEntregado  = plt.Add.Bars(xsEntregado,  entregado);  barsEntregado.Label  = "Entregado";
            plt.Axes.Bottom.SetTicks(baseXs, tallas);
            plt.Title("Estado del inventario por talla");
            plt.Legend.IsVisible = true;
            return plt.GetImageBytes(600, 300);
        }

        public byte[] Generar(string nombreElemento, string tipoElemento, List<InventarioElementoDetallePdfDto> detalle)
        {
            var grafico = GenerarGraficaInventario(detalle);

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    BuildHeader(page, $"Inventario por Elemento — {nombreElemento}");
                    BuildFooter(page, "Reporte de inventario EPP");

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        col.Spacing(15);

                        // Ficha del elemento
                        col.Item().Background(PicsoColors.LightBg)
                            .Border(0.5f).BorderColor("#E0E0E0").Padding(10)
                            .Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("ELEMENTO").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                    c.Item().PaddingTop(4).Text(nombreElemento)
                                        .FontSize(12).Bold().FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Tipo: {tipoElemento}")
                                        .FontSize(9).FontColor(PicsoColors.Alloy);
                                });

                                // Totales rápidos
                                var totalUnidades   = detalle.Sum(d => d.CantidadTotal);
                                var totalDisponible = detalle.Sum(d => d.CantidadDisponible);
                                var totalEntregado  = detalle.Sum(d => d.CantidadEntregada);
                                row.ConstantItem(1).Background("#E0E0E0");
                                row.ConstantItem(10);
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("RESUMEN").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                    c.Item().PaddingTop(4).Text($"Total unidades:   {totalUnidades}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Disponibles:      {totalDisponible}").FontSize(9).FontColor(PicsoColors.Green);
                                    c.Item().Text($"Entregadas:       {totalEntregado}").FontSize(9).FontColor(PicsoColors.Alloy);
                                });
                            });

                        // Tabla detalle
                        col.Item().Element(c => TablaDetalle(c, detalle));

                        // Gráfica
                        if (grafico != null)
                            col.Item().PaddingTop(10).Height(280).AlignCenter().Image(grafico).FitWidth();
                    });
                });
            }).GeneratePdf();
        }

        void TablaDetalle(IContainer container, List<InventarioElementoDetallePdfDto> data)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(); cols.RelativeColumn();
                    cols.ConstantColumn(70); cols.ConstantColumn(90); cols.ConstantColumn(90);
                });

                foreach (var label in new[] { "Talla", "Tipo", "Total", "Disponible", "Entregado" })
                    table.Cell().Background(PicsoColors.Basalt)
                        .BorderBottom(2).BorderColor(PicsoColors.Green)
                        .PaddingVertical(5).PaddingHorizontal(5)
                        .Text(label).FontSize(8).Bold().FontColor(PicsoColors.White);

                bool alt = false;
                foreach (var d in data)
                {
                    var bg = alt ? PicsoColors.LightBg : PicsoColors.White; alt = !alt;
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(5).Text(d.Talla).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(5).Text(d.Tipo).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(d.CantidadTotal.ToString()).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(d.CantidadDisponible.ToString()).FontSize(8).FontColor(PicsoColors.Green);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(d.CantidadEntregada.ToString()).FontSize(8).FontColor(PicsoColors.Alloy);
                }
            });
        }
    }
}
