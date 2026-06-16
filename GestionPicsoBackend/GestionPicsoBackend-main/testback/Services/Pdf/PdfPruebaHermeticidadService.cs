using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using testback.Models;

namespace testback.Services.Pdf
{
    public class PdfPruebaHermeticidadService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IHttpClientFactory _httpFactory;

        public PdfPruebaHermeticidadService(IWebHostEnvironment env, IHttpClientFactory httpFactory)
        {
            _env = env;
            _httpFactory = httpFactory;

        }

        private string LogoPath => Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        private byte[]? CargarImagenDesdeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            try
            {
                using var http = _httpFactory.CreateClient();
                return http.GetByteArrayAsync(url).GetAwaiter().GetResult();
            }
            catch { return null; }
        }

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
                    row.ConstantItem(10);
                    row.ConstantItem(100).AlignMiddle().Column(c =>
                    {
                        c.Item().AlignRight().Text("Codigo: GT-FR-01").FontSize(7).FontColor(PicsoColors.Arena);
                        c.Item().AlignRight().Text("Version: 1").FontSize(7).FontColor(PicsoColors.Arena);
                        c.Item().AlignRight().Text($"Fecha: {DateTime.Now:MM/yyyy}").FontSize(7).FontColor(PicsoColors.Arena);
                    });
                });
        }

        private void BuildFooter(PageDescriptor page)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text("PICSO INGENIERIA  -  Formato prueba de hermeticidad")
                        .FontSize(7).FontColor(PicsoColors.Green);
                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pag. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

        public byte[] GenerarPdf(PruebaHermeticidad prueba)
        {
            var firmaContratista = CargarImagenDesdeUrl(prueba.FirmaContratista);
            var firmaConstructor = CargarImagenDesdeUrl(prueba.FirmaConstructor);
            var imgInicio        = CargarImagenDesdeUrl(prueba.ImagenInicioUrl);
            var imgFinal         = CargarImagenDesdeUrl(prueba.ImagenFinalUrl);

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    BuildHeader(page, "Formato Prueba de Hermeticidad");
                    BuildFooter(page);

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        col.Spacing(12);

                        // Datos generales
                        col.Item()
                            .Background(PicsoColors.LightBg)
                            .Border(0.5f).BorderColor("#E0E0E0").Padding(10)
                            .Column(c =>
                            {
                                c.Item().Text("DATOS GENERALES")
                                    .Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                c.Item().PaddingTop(6).Row(r =>
                                {
                                    r.RelativeItem().Column(inner =>
                                    {
                                        inner.Item().Text($"Proyecto: {prueba.Proyecto ?? "-"}").FontSize(9).FontColor(PicsoColors.Basalt);
                                        inner.Item().Text($"Cliente: {prueba.Cliente}").FontSize(9).FontColor(PicsoColors.Basalt);
                                        inner.Item().PaddingTop(4)
                                            .Text($"Descripcion de la prueba: {prueba.DescripcionPrueba ?? "-"}")
                                            .FontSize(9).FontColor(PicsoColors.Basalt);
                                    });
                                    r.RelativeItem().Column(inner =>
                                    {
                                        inner.Item().Text($"Tipo de prueba: {prueba.TipoPrueba}").FontSize(9).FontColor(PicsoColors.Basalt);
                                        inner.Item().Text($"Estado: {prueba.Estado}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    });
                                });
                            });

                        // Resultados
                        col.Item().Column(c =>
                        {
                            c.Item()
                                .Background(PicsoColors.Basalt)
                                .BorderBottom(2).BorderColor(PicsoColors.Green)
                                .PaddingVertical(5).PaddingHorizontal(8)
                                .Text("RESULTADOS DE PRUEBA")
                                .Bold().FontSize(9).FontColor(PicsoColors.White);

                            c.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.RelativeColumn(2); cols.RelativeColumn(3);
                                    cols.RelativeColumn(2); cols.RelativeColumn(3);
                                });

                                void Celda(string label, string valor)
                                {
                                    table.Cell().Background(PicsoColors.LightBg)
                                        .PaddingVertical(5).PaddingHorizontal(6)
                                        .Text(label).FontSize(8).Bold().FontColor(PicsoColors.Alloy);
                                    table.Cell().Background(PicsoColors.White)
                                        .PaddingVertical(5).PaddingHorizontal(6)
                                        .Text(valor).FontSize(9).FontColor(PicsoColors.Basalt);
                                }

                                Celda("Inicio",          prueba.InicioPrueba.ToString("dd/MM/yyyy HH:mm"));
                                Celda("Fin",             prueba.FinPrueba?.ToString("dd/MM/yyyy HH:mm") ?? "-");
                                Celda("Presion inicial", prueba.PresionInicial?.ToString() ?? "-");
                                Celda("Presion final",   prueba.PresionFinal?.ToString()   ?? "-");
                                Celda("Cumple",          prueba.Cumple ?? "-");
                                Celda("",                "");
                            });
                        });

                        // Observaciones - SIN Nota
                        col.Item().Border(0.5f).BorderColor("#E0E0E0").Padding(10).Column(c =>
                        {
                            c.Item().Text("OBSERVACIONES").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                            c.Item().PaddingTop(4).Text(prueba.Descripcion ?? "—").FontSize(9).FontColor(PicsoColors.Basalt);
                        });

                        // Firmas
                        col.Item().PaddingTop(10).Row(row =>
                        {
                            Firma(row.RelativeItem(), "Contratista",                  firmaContratista);
                            Firma(row.RelativeItem(), "Constructor",                  firmaConstructor);
                        });

                        // Evidencia fotografica con fecha y hora
                        if (imgInicio != null || imgFinal != null)
                        {
                            col.Item().PaddingTop(10).Column(c =>
                            {
                                c.Item()
                                    .Background(PicsoColors.Basalt)
                                    .BorderBottom(2).BorderColor(PicsoColors.Green)
                                    .PaddingVertical(5).PaddingHorizontal(8)
                                    .Text("EVIDENCIA FOTOGRAFICA")
                                    .Bold().FontSize(9).FontColor(PicsoColors.White);

                                c.Item().PaddingTop(8).Row(r =>
                                {
                                    if (imgInicio != null)
                                        r.RelativeItem().Column(inner =>
                                        {
                                            inner.Item()
                                                .Text($"Inicio de prueba  {prueba.InicioPrueba:dd/MM/yyyy HH:mm}")
                                                .FontSize(8).FontColor(PicsoColors.Alloy);
                                            inner.Item().PaddingTop(4).Height(160).Image(imgInicio).FitArea();
                                        });
                                    if (imgFinal != null)
                                    {
                                        r.ConstantItem(10);
                                        r.RelativeItem().Column(inner =>
                                        {
                                            inner.Item()
                                                .Text($"Fin de prueba  {prueba.FinPrueba?.ToString("dd/MM/yyyy HH:mm") ?? "-"}")
                                                .FontSize(8).FontColor(PicsoColors.Alloy);
                                            inner.Item().PaddingTop(4).Height(160).Image(imgFinal).FitArea();
                                        });
                                    }
                                });
                            });
                        }
                    });
                });
            }).GeneratePdf();
        }

        void Firma(IContainer container, string titulo, byte[]? imagen)
        {
            container.PaddingHorizontal(20).Column(col =>
            {
                if (imagen != null)
                    col.Item().Height(70).AlignCenter().Image(imagen).FitArea();
                else
                    col.Item().Height(70);
                col.Item().PaddingTop(4).LineHorizontal(0.5f).LineColor(PicsoColors.Alloy);
                col.Item().PaddingTop(2).AlignCenter().Text(titulo).FontSize(7).FontColor(PicsoColors.Alloy);
            });
        }
    }
}

