using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using testback.Dtos;

namespace testback.Services.Pdf
{
    public class ActaEntregaEppPdfService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IHttpClientFactory _httpFactory;

        public ActaEntregaEppPdfService(IWebHostEnvironment env, IHttpClientFactory httpFactory)
        {
            _env = env;
            _httpFactory = httpFactory;
        }

        private async Task<byte[]?> DescargarImagen(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            try { return await _httpFactory.CreateClient().GetByteArrayAsync(url); }
            catch (Exception ex) { Console.WriteLine($"Error imagen {url}: {ex.Message}"); return null; }
        }

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

        public async Task<byte[]> Generar(ActaEntregaEppPdfDto dto)
        {
            var firmaEmpleado    = await DescargarImagen(dto.FirmaEmpleadoUrl);
            var firmaResponsable = await DescargarImagen(dto.FirmaResponsableUrl);

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    BuildHeader(page, $"Acta de Entrega de Dotación — #{dto.ActaId}");
                    BuildFooter(page, "Acta de entrega EPP");

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        col.Spacing(12);

                        // Ficha de entrega
                        col.Item().Background(PicsoColors.LightBg)
                            .Border(0.5f).BorderColor("#E0E0E0").Padding(10)
                            .Column(c =>
                            {
                                c.Item().Text("DATOS DE LA ENTREGA")
                                    .Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                c.Item().PaddingTop(4)
                                    .Text($"Fecha: {dto.FechaEntrega:dd/MM/yyyy hh:mm tt}")
                                    .FontSize(9).FontColor(PicsoColors.Basalt);
                                c.Item().Text($"Lugar: {dto.LugarEntrega}")
                                    .FontSize(9).FontColor(PicsoColors.Basalt);
                                c.Item().Text($"Quien recibe: {dto.QuienRecibe}")
                                    .FontSize(9).FontColor(PicsoColors.Basalt);
                            });

                        // Empleado / Responsable
                        col.Item().Background(PicsoColors.LightBg)
                            .Border(0.5f).BorderColor("#E0E0E0").Padding(10)
                            .Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("EMPLEADO").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                    c.Item().PaddingTop(4).Text($"Nombre: {dto.Empleado}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Cédula: {dto.EmpleadoCedula}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Cargo: {dto.EmpleadoCargo}").FontSize(9).FontColor(PicsoColors.Basalt);
                                });
                                row.ConstantItem(1).Background("#E0E0E0");
                                row.ConstantItem(10);
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text("RESPONSABLE").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                    c.Item().PaddingTop(4).Text($"Nombre: {dto.Responsable}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Cédula: {dto.ResponsableCedula}").FontSize(9).FontColor(PicsoColors.Basalt);
                                    c.Item().Text($"Cargo: {dto.ResponsableCargo}").FontSize(9).FontColor(PicsoColors.Basalt);
                                });
                            });

                        // Observaciones
                        if (!string.IsNullOrWhiteSpace(dto.Observaciones))
                            col.Item().Border(0.5f).BorderColor("#E0E0E0").Padding(10).Column(c =>
                            {
                                c.Item().Text("OBSERVACIONES").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                                c.Item().PaddingTop(4).Text(dto.Observaciones).FontSize(9).FontColor(PicsoColors.Basalt);
                            });

                        // Tabla elementos
                        col.Item().Element(c => TablaElementos(c, dto.Elementos));

                        // Firmas
                        col.Item().PaddingTop(20).Row(row =>
                        {
                            Firma(row.RelativeItem(), "Firma empleado",    firmaEmpleado);
                            Firma(row.RelativeItem(), "Firma responsable", firmaResponsable);
                        });
                    });
                });
            }).GeneratePdf();
        }

        void TablaElementos(IContainer container, List<ActaEntregaElementoPdfDto> data)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(); cols.RelativeColumn(); cols.RelativeColumn();
                    cols.ConstantColumn(70); cols.ConstantColumn(70);
                });
                foreach (var label in new[] { "Elemento", "Tipo", "Talla", "Cantidad", "Estado" })
                    table.Cell().Background(PicsoColors.Basalt)
                        .BorderBottom(2).BorderColor(PicsoColors.Green)
                        .PaddingVertical(5).PaddingHorizontal(5)
                        .Text(label).FontSize(8).Bold().FontColor(PicsoColors.White);

                bool alt = false;
                foreach (var e in data)
                {
                    var bg = alt ? PicsoColors.LightBg : PicsoColors.White; alt = !alt;
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(5).Text(e.Elemento).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(5).Text(e.Tipo).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(5).Text(e.Talla).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(e.Cantidad.ToString()).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(e.Estado).FontSize(8).FontColor(PicsoColors.Basalt);
                }
            });
        }

        void Firma(IContainer container, string titulo, byte[]? imagen)
        {
            container.Column(col =>
            {
                col.Item().Text(titulo).FontSize(8).SemiBold().FontColor(PicsoColors.Alloy);
                if (imagen != null)
                    col.Item().Height(80).AlignCenter().Image(imagen).FitArea();
                else
                    col.Item().Height(80).AlignCenter().Border(0.5f).BorderColor("#E0E0E0")
                        .AlignMiddle().Text("Pendiente de firma").FontSize(8).Italic().FontColor(PicsoColors.Alloy);
            });
        }
    }
}
